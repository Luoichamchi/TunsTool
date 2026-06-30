"""Helper cho migration multi-tenant (catalog vs DB tenant)."""


def is_tenant_migration_context() -> bool:
    """True khi đang migrate DB tenant (không phải catalog)."""
    from alembic import context

    return bool(context.config.attributes.get("tenant_mode", False))


def skip_on_tenant_db() -> bool:
    """Trả về True nếu migration catalog-only nên bỏ qua trên DB tenant."""
    return is_tenant_migration_context()
