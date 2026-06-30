from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from config.tenant_database import (
    build_tenant_database_url,
    build_tenant_db_name,
    get_admin_database_url,
    get_catalog_db_host_port,
    validate_db_name,
    validate_tenant_code,
)
from services.tenant_migration import migrate_tenant_schema
from database.models.tenant import Tenant
from database.seeds.auto_seed_data import seed_tenant_defaults
from schemas.tenant import TenantCreate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_db_url_by_tenant_code(self, tenant_code: str) -> str:
        tenant = await self._get_tenant_by_code(tenant_code)
        return build_tenant_database_url(tenant.db_name)

    async def _get_tenant_by_code(self, tenant_code: str) -> Tenant:
        result = await self.db.execute(
            select(Tenant).where(Tenant.tenant_code == tenant_code)
        )
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise ValueError(f"Tenant không tồn tại: {tenant_code}")
        return tenant

    async def _database_exists(self, db_name: str) -> bool:
        admin_url = get_admin_database_url()
        engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
        try:
            async with engine.connect() as conn:
                result = await conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname = :name"),
                    {"name": db_name},
                )
                return result.scalar() is not None
        finally:
            await engine.dispose()

    async def create_physical_database(self, db_name: str) -> None:
        if await self._database_exists(db_name):
            raise ValueError(f"Database '{db_name}' đã tồn tại")

        admin_url = get_admin_database_url()
        engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
        try:
            async with engine.connect() as conn:
                # db_name đã được sanitize — identifier an toàn
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
        finally:
            await engine.dispose()

    async def init_tenant_schema(self, db_name: str) -> None:
        """Tạo / nâng cấp schema DB tenant bằng Alembic."""
        await migrate_tenant_schema(db_name)

    async def seed_tenant_database(self, db_name: str, tenant_code: str) -> None:
        from sqlalchemy.ext.asyncio import async_sessionmaker
        from config.tenant_database import DEFAULT_TENANT_CODE

        url = build_tenant_database_url(db_name)
        engine = create_async_engine(url, echo=False)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        include_tenant = tenant_code.lower() == DEFAULT_TENANT_CODE
        try:
            async with session_factory() as tenant_db:
                await seed_tenant_defaults(tenant_db, include_tenant=include_tenant)
        finally:
            await engine.dispose()

    async def provision_tenant_database(self, tenant_code: str, db_name: str) -> None:
        """Tạo PostgreSQL DB + schema + seed cho một tenant."""
        await self.create_physical_database(db_name)
        try:
            await self.init_tenant_schema(db_name)
            await self.seed_tenant_database(db_name, tenant_code)
        except Exception:
            await self.drop_physical_database(db_name)
            raise

    async def drop_physical_database(self, db_name: str) -> None:
        if not await self._database_exists(db_name):
            return

        admin_url = get_admin_database_url()
        engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
        try:
            async with engine.connect() as conn:
                await conn.execute(
                    text(
                        """
                        SELECT pg_terminate_backend(pid)
                        FROM pg_stat_activity
                        WHERE datname = :name AND pid <> pg_backend_pid()
                        """
                    ),
                    {"name": db_name},
                )
                await conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}"'))
        finally:
            await engine.dispose()

    async def create_tenant_with_database(self, data: TenantCreate) -> Tenant:
        validate_tenant_code(data.tenant_code)

        existing = await self.db.execute(
            select(Tenant).where(Tenant.tenant_code == data.tenant_code)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Tenant code already exists")

        subdomain = (data.subdomain or "").strip().lower()
        if not subdomain:
            raise ValueError("Subdomain là bắt buộc")

        existing = await self.db.execute(
            select(Tenant).where(Tenant.subdomain == subdomain)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Subdomain already exists")

        db_name = (data.db_name or "").strip() or build_tenant_db_name(
            data.tenant_code
        )
        db_host = get_catalog_db_host_port()
        validate_db_name(db_name)

        if await self._database_exists(db_name):
            raise ValueError(f"Database '{db_name}' đã tồn tại trên server")

        tenant = Tenant(
            name=data.name,
            tenant_code=data.tenant_code.lower(),
            subdomain=subdomain,
            expiration_date=data.expiration_date,
            is_active=data.is_active if data.is_active is not None else True,
            db_host=db_host,
            db_name=db_name,
        )
        self.db.add(tenant)

        try:
            await self.provision_tenant_database(tenant.tenant_code, db_name)
            await self.db.commit()
            await self.db.refresh(tenant)
        except Exception:
            await self.db.rollback()
            raise

        from config.database_engine import clear_engine_cache

        clear_engine_cache(tenant.tenant_code)
        return tenant
