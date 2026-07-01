from typing import AsyncGenerator

from fastapi import HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.session_tenant import get_session_factory
from database.context import current_tenant_code
from database.database import AsyncSessionLocal
from database.models.tenant import Tenant


async def get_public_db(
    tenant: str = Path(..., min_length=1),
) -> AsyncGenerator[AsyncSession, None]:
    tenant_code = tenant.strip().lower()
    if not tenant_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant không hợp lệ",
        )

    async with AsyncSessionLocal() as catalog_db:
        result = await catalog_db.execute(
            select(Tenant).where(
                Tenant.tenant_code == tenant_code,
                Tenant.is_active == True,
            )
        )
        tenant_obj = result.scalar_one_or_none()
        if not tenant_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant không tồn tại",
            )
        session_factory = await get_session_factory(catalog_db, tenant_code)

    token = current_tenant_code.set(tenant_code)
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
            current_tenant_code.reset(token)
