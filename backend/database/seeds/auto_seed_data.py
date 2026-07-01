from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.tenant_database import is_catalog_database
from database.models.tenant import Tenant
from database.seeds.role_seed import seed_default_roles
from database.seeds.user_seed import seed_default_accounts
from database.seeds.demo_seed import seed_default_demos
from database.seeds.restaurant_menu_seed import seed_restaurant_menu
from database.seeds.global_role_seed import seed_global_roles
from database.seeds.global_permission_seed import seed_global_modules_and_permissions
from database.seeds.root_user_seed import seed_root_user
from database.seeds.global_role_permission_seed import (
    seed_global_role_permissions,
    seed_admin_role_permissions,
)
from database.context import without_audit_logging
from database.seeds.default_tenant_bootstrap import ensure_default_tenant


async def seed_tenant_defaults(
    db: AsyncSession, *, include_tenant: bool = False
) -> None:
    with without_audit_logging():
        print("Seeding tenant database...")
        await seed_global_roles(db)
        await seed_global_modules_and_permissions(db, include_tenant=include_tenant)
        await seed_global_role_permissions(db)
        await seed_admin_role_permissions(db)
        await seed_root_user(db)
        await seed_default_roles(db)
        await seed_default_accounts(db)
        await seed_default_demos(db)
        await seed_restaurant_menu(db)
        print("Tenant database seed completed")


async def auto_seed_all(db: AsyncSession) -> None:
    try:
        print("Starting seeding process...")

        await seed_global_roles(db)
        await seed_global_modules_and_permissions(db, include_tenant=True)
        await seed_global_role_permissions(db)
        await seed_admin_role_permissions(db)
        await ensure_default_tenant(db)
        await seed_tenant_defaults(db, include_tenant=True)

        result = await db.execute(select(Tenant).where(Tenant.is_active.is_(True)))
        from services.tenant import TenantService

        tenant_service = TenantService(db)
        for tenant in result.scalars().all():
            if is_catalog_database(tenant.db_name):
                continue
            print(
                f"Seeding tenant DB '{tenant.db_name}' "
                f"(tenant: {tenant.tenant_code})..."
            )
            await tenant_service.seed_tenant_database(
                tenant.db_name, tenant.tenant_code
            )

        print("Seeding completed successfully!")

    except Exception as e:
        print(f"Critical error during seeding: {str(e)}")
        raise
