from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from config.session_tenant import get_session_factory
from config.tenant_database import DEFAULT_TENANT_CODE
from database.context import current_tenant_code
from database.database import AsyncSessionLocal, get_async_db
from database.models.tenant import Tenant

security = HTTPBearer()

__all__ = [
    "get_db",
    "get_catalog_db",
    "get_global_db",
    "get_tenant_code_from_token",
    "resolve_db_tenant_code",
]


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


async def get_tenant_code_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Lấy tenant_code từ JWT access token."""
    try:
        payload = decode_access_token(credentials.credentials)
        tenant_code = payload.get("tenant_code")
        if not tenant_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token thiếu tenant_code",
            )
        return str(tenant_code).lower()
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_catalog_db() -> AsyncGenerator[AsyncSession, None]:
    """Session catalog DB — registry tenants."""
    async for session in get_async_db():
        yield session


async def get_global_db() -> AsyncGenerator[AsyncSession, None]:
    """Alias catalog DB."""
    async for session in get_catalog_db():
        yield session


async def resolve_db_tenant_code(
    jwt_tenant_code: str = Depends(get_tenant_code_from_token),
    target_tenant_code: str | None = Query(None, alias="tenant_code"),
) -> str:
    """
    Tenant DB thực tế cho request.
    JWT default + ?tenant_code=xxx → mở DB tenant xxx (chỉ default được override).
    """
    jwt_tenant_code = jwt_tenant_code.lower()
    if not target_tenant_code:
        return jwt_tenant_code

    target = target_tenant_code.strip().lower()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_code không hợp lệ",
        )
    if target == jwt_tenant_code:
        return jwt_tenant_code

    if jwt_tenant_code != DEFAULT_TENANT_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ tenant default mới được truy cập tenant khác",
        )
    return target


def is_default_tenant_cross_access(jwt_tenant_code: str, db_tenant_code: str) -> bool:
    """User đăng nhập tenant default + ?tenant_code= → truy cập DB tenant khác."""
    jwt = jwt_tenant_code.lower()
    db_code = db_tenant_code.lower()
    return jwt == DEFAULT_TENANT_CODE and db_code != jwt


async def get_db(
    tenant_code: str = Depends(resolve_db_tenant_code),
    jwt_tenant_code: str = Depends(get_tenant_code_from_token),
) -> AsyncGenerator[AsyncSession, None]:
    """Session DB của tenant (JWT hoặc ?tenant_code= khi login default)."""
    jwt_tenant_code = jwt_tenant_code.lower()
    tenant_code = tenant_code.lower()
    async with AsyncSessionLocal() as catalog_db:
        result = await catalog_db.execute(
            select(Tenant).where(Tenant.tenant_code == tenant_code)
        )
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant không tồn tại: {tenant_code}",
            )
        if not is_default_tenant_cross_access(jwt_tenant_code, tenant_code):
            if not tenant.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tenant không hoạt động",
                )
        session_factory = await get_session_factory(catalog_db, tenant_code)

    token = current_tenant_code.set(tenant_code)
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
            current_tenant_code.reset(token)
