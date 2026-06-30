"""Database connection helpers for catalog vs per-tenant databases."""
from __future__ import annotations

import re
from urllib.parse import urlparse

from config.settings import settings
import database.models  # noqa: F401 — register metadata
from database.models.base import Base

_TENANT_CODE_PATTERN = re.compile(r"^[a-z0-9_]+$")
DEFAULT_TENANT_CODE = "default"


def normalize_async_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def parse_database_url(url: str) -> dict:
    normalized = url.replace("postgresql+psycopg://", "postgresql://")
    parsed = urlparse(normalized)
    return {
        "user": parsed.username or "",
        "password": parsed.password or "",
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": (parsed.path or "").lstrip("/"),
    }


def build_host_port(host: str, port: int) -> str:
    return f"{host}:{port}"


def get_catalog_db_host_port() -> str:
    parts = parse_database_url(settings.DATABASE_URL)
    return build_host_port(parts["host"], parts["port"])


def get_catalog_db_name() -> str:
    parts = parse_database_url(settings.DATABASE_URL)
    return parts["database"]


def is_catalog_database(db_name: str) -> bool:
    return db_name == get_catalog_db_name()


def build_tenant_db_name(tenant_code: str, prefix: str | None = None) -> str:
    prefix = prefix or settings.TENANT_DB_PREFIX
    safe = "".join(c if c.isalnum() else "_" for c in tenant_code.lower())
    safe = re.sub(r"_+", "_", safe).strip("_")
    if not safe:
        raise ValueError("tenant_code is invalid for database name")
    name = f"{prefix}{safe}"
    return name[:63]


_DB_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


def validate_db_name(db_name: str) -> None:
    if not _DB_NAME_PATTERN.match(db_name):
        raise ValueError("db_name must start with lowercase letter and contain only a-z, 0-9, _")


def validate_tenant_code(tenant_code: str) -> None:
    code = tenant_code.lower()
    if not _TENANT_CODE_PATTERN.match(code):
        raise ValueError("tenant_code may only contain lowercase letters, digits, and underscore")


def build_database_url(db_host: str, db_name: str, user: str, password: str) -> str:
    return normalize_async_database_url(
        f"postgresql://{user}:{password}@{db_host}/{db_name}"
    )


def build_tenant_database_url(db_name: str) -> str:
    parts = parse_database_url(settings.DATABASE_URL)
    db_host = get_catalog_db_host_port()
    return build_database_url(db_host, db_name, parts["user"], parts["password"])


def get_admin_database_url() -> str:
    parts = parse_database_url(settings.DATABASE_URL)
    return build_database_url(
        build_host_port(parts["host"], parts["port"]),
        "postgres",
        parts["user"],
        parts["password"],
    )


def get_tenant_app_tables():
    return [t for name, t in Base.metadata.tables.items() if name != "tenants"]
