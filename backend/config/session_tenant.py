from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from config.database_engine import get_engine
from database.context import current_tenant_code
from database.database import AsyncSessionLocal
from database.models.tenant import Tenant

_session_factory_cache: dict[str, async_sessionmaker[AsyncSession]] = {}

__all__ = [
    "get_session_factory",
    "tenant_db_session",
    "switch_tenant",
]


async def get_session_factory(
    db: AsyncSession, tenant_code: str
) -> async_sessionmaker[AsyncSession]:
    if tenant_code not in _session_factory_cache:
        engine = await get_engine(db, tenant_code)
        _session_factory_cache[tenant_code] = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    return _session_factory_cache[tenant_code]


@asynccontextmanager
async def tenant_db_session(catalog_db: AsyncSession, tenant_code: str):
    """Mở session DB tenant (dùng khi login / refresh chưa có JWT)."""
    session_factory = await get_session_factory(catalog_db, tenant_code)
    async with session_factory() as session:
        yield session


@asynccontextmanager
async def switch_tenant(tenant_code: str) -> AsyncIterator[AsyncSession]:
    """
    Chủ động chuyển sang DB của tenant — chỉ cần tenant_code.

    Tự mở catalog DB, kiểm tra tenant tồn tại/active, set current_tenant_code context.
    """
    tenant_code = tenant_code.strip().lower()
    if not tenant_code:
        raise ValueError("tenant_code không hợp lệ")

    async with AsyncSessionLocal() as catalog_db:
        result = await catalog_db.execute(
            select(Tenant).where(Tenant.tenant_code == tenant_code)
        )
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise ValueError(f"Tenant không tồn tại: {tenant_code}")
        if not tenant.is_active:
            raise ValueError("Tenant không hoạt động")
        session_factory = await get_session_factory(catalog_db, tenant_code)

    ctx_token = current_tenant_code.set(tenant_code)
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
            current_tenant_code.reset(ctx_token)
