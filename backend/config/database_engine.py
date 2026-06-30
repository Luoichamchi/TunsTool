from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import AsyncSession

_engine_cache: dict[str, object] = {}


def clear_engine_cache(tenant_code: str | None = None) -> None:
    if tenant_code:
        _engine_cache.pop(tenant_code, None)
    else:
        _engine_cache.clear()


async def get_engine(db: AsyncSession, tenant_code: str):
    if tenant_code not in _engine_cache:
        from services.tenant import TenantService

        tenant_service = TenantService(db)
        db_url = await tenant_service.get_db_url_by_tenant_code(tenant_code)

        _engine_cache[tenant_code] = create_async_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            echo=False,
            pool_pre_ping=True,
        )

    return _engine_cache[tenant_code]
