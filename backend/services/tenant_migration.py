"""Migration schema cho catalog và toàn bộ DB tenant."""
from __future__ import annotations

import asyncio

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from config.migration_runner import (
    get_catalog_database_url,
    get_head_revision,
    stamp_database,
    upgrade_database,
)
from config.tenant_database import (
    build_tenant_database_url,
    get_catalog_db_host_port,
    get_catalog_db_name,
    get_tenant_app_tables,
    is_catalog_database,
)
from database.models.base import Base
from database.models.tenant import Tenant


async def _get_db_revision(database_url: str) -> str | None:
    """Lấy revision hiện tại trong DB (None nếu chưa có alembic_version)."""
    engine = create_async_engine(database_url, echo=False)
    try:
        async with engine.connect() as conn:
            has_table = await conn.execute(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'alembic_version'
                    )
                    """
                )
            )
            if not has_table.scalar():
                return None
            result = await conn.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            )
            return result.scalar_one_or_none()
    finally:
        await engine.dispose()


async def _has_alembic_version(database_url: str) -> bool:
    engine = create_async_engine(database_url, echo=False)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'alembic_version'
                    )
                    """
                )
            )
            return bool(result.scalar())
    finally:
        await engine.dispose()


async def bootstrap_tenant_schema(db_name: str) -> None:
    """DB tenant mới: create_all theo model hiện tại rồi stamp head."""
    async_url = build_tenant_database_url(db_name)
    sync_url = async_url
    tables = get_tenant_app_tables()

    engine = create_async_engine(async_url, echo=False)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: Base.metadata.create_all(
                    sync_conn, tables=tables
                )
            )
    finally:
        await engine.dispose()

    await asyncio.to_thread(
        stamp_database, sync_url, "head", tenant_mode=True
    )
    revision = await _get_db_revision(async_url)
    if revision is None:
        raise RuntimeError(
            f"Không thể stamp migration cho DB tenant '{db_name}'"
        )


def _is_missing_revision_error(exc: Exception) -> bool:
    return "Can't locate revision identified by" in str(exc)


async def migrate_tenant_schema(db_name: str) -> None:
    """Áp dụng migration mới nhất cho một DB tenant."""
    async_url = build_tenant_database_url(db_name)
    sync_url = async_url

    if not await _has_alembic_version(async_url):
        await bootstrap_tenant_schema(db_name)
        return

    try:
        await asyncio.to_thread(
            upgrade_database, sync_url, "head", tenant_mode=True
        )
    except Exception as e:
        if not _is_missing_revision_error(e):
            raise
        # DB còn revision cũ đã xóa — đồng bộ lại head nếu schema đã tồn tại
        print(
            f"⚠️ Revision cũ không còn trong code ({db_name}), "
            "đang stamp head..."
        )
        await asyncio.to_thread(
            stamp_database, sync_url, "head", tenant_mode=True
        )

    revision = await _get_db_revision(async_url)
    if revision is None:
        raise RuntimeError(
            f"Migration xong nhưng DB tenant '{db_name}' chưa có alembic_version"
        )


async def migrate_catalog_schema() -> None:
    """Áp dụng migration cho catalog DB (vimon_db)."""
    sync_url = get_catalog_database_url()
    async_url = sync_url

    if not await _has_alembic_version(async_url):
        from database.database import engine

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await asyncio.to_thread(stamp_database, sync_url, "head", tenant_mode=False)
        return

    try:
        await asyncio.to_thread(
            upgrade_database, sync_url, "head", tenant_mode=False
        )
    except Exception as e:
        if not _is_missing_revision_error(e):
            raise
        print(
            "⚠️ Catalog DB còn revision cũ, đang stamp head..."
        )
        await asyncio.to_thread(
            stamp_database, sync_url, "head", tenant_mode=False
        )


async def sync_tenant_db_hosts(catalog_db: AsyncSession) -> None:
    """Đồng bộ db_host trong catalog theo DATABASE_URL (host dùng chung)."""
    host = get_catalog_db_host_port()
    await catalog_db.execute(update(Tenant).values(db_host=host))
    await catalog_db.commit()


async def migrate_all_tenant_databases(
    catalog_db: AsyncSession,
    *,
    target_revision: str | None = None,
) -> None:
    """Đồng bộ schema mọi DB tenant active về cùng revision với catalog."""
    await sync_tenant_db_hosts(catalog_db)
    result = await catalog_db.execute(
        select(Tenant).where(Tenant.is_active == True)
    )
    tenants = result.scalars().all()

    catalog_db_name = get_catalog_db_name()
    catalog_url = get_catalog_database_url()
    target = target_revision or await _get_db_revision(catalog_url) or get_head_revision()

    print(f"📌 Target revision (đồng bộ tenant): {target}")

    out_of_sync: list[str] = []

    for tenant in tenants:
        if is_catalog_database(tenant.db_name):
            print(
                f"ℹ️ Tenant default '{tenant.tenant_code}' dùng catalog DB "
                f"({catalog_db_name}) — đã migrate qua catalog"
            )
            continue
        try:
            tenant_url = build_tenant_database_url(tenant.db_name)
            before = await _get_db_revision(tenant_url)
            print(
                f"🔄 Migrating tenant DB: {tenant.tenant_code} "
                f"({tenant.db_name}) [{before or 'new'} → {target}]"
            )
            await migrate_tenant_schema(tenant.db_name)
            after = await _get_db_revision(tenant_url)
            if after != target:
                out_of_sync.append(
                    f"{tenant.tenant_code} ({tenant.db_name}): {after}"
                )
                print(
                    f"⚠️ Tenant {tenant.tenant_code} chưa khớp revision "
                    f"(hiện: {after}, cần: {target})"
                )
            else:
                print(f"✅ Migrated tenant DB: {tenant.tenant_code}")
        except Exception as e:
            out_of_sync.append(f"{tenant.tenant_code}: {e}")
            print(f"❌ Migration failed ({tenant.tenant_code}): {e}")

    if out_of_sync:
        print("⚠️ Một số tenant DB chưa đồng bộ:")
        for item in out_of_sync:
            print(f"   - {item}")
    else:
        print("✅ Tất cả tenant DB đã đồng bộ revision với catalog")


async def run_startup_migrations(catalog_db: AsyncSession) -> None:
    """Migrate catalog (vimon_db) rồi đồng bộ toàn bộ DB tenant."""
    print("🔄 Migrating catalog database...")
    await migrate_catalog_schema()

    catalog_url = get_catalog_database_url()
    catalog_rev = await _get_db_revision(catalog_url) or get_head_revision()
    print(f"✅ Catalog database migrated (revision: {catalog_rev})")

    await migrate_all_tenant_databases(catalog_db, target_revision=catalog_rev)
