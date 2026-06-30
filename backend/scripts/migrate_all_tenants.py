"""
Chạy migration cho catalog + tất cả DB tenant.

Usage (từ thư mục backend):
    python scripts/migrate_all_tenants.py
"""
import asyncio

from database.database import AsyncSessionLocal
from services.tenant_migration import migrate_all_tenant_databases, migrate_catalog_schema


async def main() -> None:
    print("🔄 Migrating catalog database...")
    await migrate_catalog_schema()
    print("✅ Catalog done")

    async with AsyncSessionLocal() as db:
        await migrate_all_tenant_databases(db)

    print("✅ All tenant databases migrated")


if __name__ == "__main__":
    asyncio.run(main())
