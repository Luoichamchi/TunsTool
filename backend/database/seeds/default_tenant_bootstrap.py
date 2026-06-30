"""Đăng ký tenant default vào catalog — dùng chung vimon_db, không tạo DB riêng."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.tenant_database import (
    DEFAULT_TENANT_CODE,
    get_catalog_db_host_port,
    get_catalog_db_name,
)
from database.models.tenant import Tenant

DEFAULT_TENANT_SUBDOMAIN = "app"


async def ensure_default_tenant(catalog_db: AsyncSession) -> None:
    """Đảm bảo bản ghi tenant default tồn tại và trỏ tới catalog DB (vimon_db)."""
    catalog_db_name = get_catalog_db_name()

    result = await catalog_db.execute(
        select(Tenant).where(Tenant.tenant_code == DEFAULT_TENANT_CODE)
    )
    tenant = result.scalar_one_or_none()

    if tenant:
        updated = False
        if tenant.db_name != catalog_db_name:
            tenant.db_name = catalog_db_name
            tenant.db_host = get_catalog_db_host_port()
            updated = True
        if (tenant.subdomain or "").lower() != DEFAULT_TENANT_SUBDOMAIN:
            tenant.subdomain = DEFAULT_TENANT_SUBDOMAIN
            updated = True
        if updated:
            await catalog_db.commit()
            print(
                f"🔄 Đã cập nhật tenant default "
                f"(db: {catalog_db_name}, subdomain: {DEFAULT_TENANT_SUBDOMAIN})"
            )
        else:
            print(f"ℹ️ Tenant default '{DEFAULT_TENANT_CODE}' đã tồn tại")
        return

    print(f"🌱 Đăng ký tenant default '{DEFAULT_TENANT_CODE}' vào catalog...")
    tenant = Tenant(
        name="Default",
        tenant_code=DEFAULT_TENANT_CODE,
        subdomain=DEFAULT_TENANT_SUBDOMAIN,
        db_host=get_catalog_db_host_port(),
        db_name=catalog_db_name,
        is_active=True,
    )
    catalog_db.add(tenant)
    await catalog_db.commit()
    await catalog_db.refresh(tenant)
    print(f"✅ Đã đăng ký tenant default (db: {catalog_db_name})")
