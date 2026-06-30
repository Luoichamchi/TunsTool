"""Chạy Alembic upgrade/stamp với URL database tùy chọn."""
from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config

from config.settings import settings
from config.tenant_database import normalize_async_database_url

BACKEND_DIR = Path(__file__).resolve().parent.parent


def normalize_sync_database_url(url: str) -> str:
    return normalize_async_database_url(url)


def get_catalog_database_url() -> str:
    return normalize_sync_database_url(settings.DATABASE_URL)


def get_alembic_config(database_url: str, *, tenant_mode: bool = False) -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", database_url)
    cfg.attributes["tenant_mode"] = tenant_mode
    return cfg


def upgrade_database(
    database_url: str,
    revision: str = "head",
    *,
    tenant_mode: bool = False,
) -> None:
    cfg = get_alembic_config(database_url, tenant_mode=tenant_mode)
    command.upgrade(cfg, revision)


def stamp_database(
    database_url: str,
    revision: str = "head",
    *,
    tenant_mode: bool = False,
) -> None:
    cfg = get_alembic_config(database_url, tenant_mode=tenant_mode)
    command.stamp(cfg, revision)


def get_head_revision() -> str:
    """Revision mới nhất trong thư mục migrations."""
    from alembic.script import ScriptDirectory

    cfg = get_alembic_config(get_catalog_database_url())
    script = ScriptDirectory.from_config(cfg)
    head = script.get_current_head()
    if not head:
        raise RuntimeError("Không tìm thấy migration head")
    return head
