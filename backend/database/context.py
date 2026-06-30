import contextvars
from contextlib import contextmanager

current_user_id: contextvars.ContextVar = contextvars.ContextVar(
    "current_user_id", default=None
)
current_tenant_code: contextvars.ContextVar = contextvars.ContextVar(
    "current_tenant_code", default=None
)
skip_audit_logging: contextvars.ContextVar[bool] = contextvars.ContextVar(
    "skip_audit_logging", default=False
)


@contextmanager
def without_audit_logging():
    """Tắt ghi audit log (dùng khi seed/provision DB tenant)."""
    token = skip_audit_logging.set(True)
    try:
        yield
    finally:
        skip_audit_logging.reset(token)


__all__ = [
    "current_user_id",
    "current_tenant_code",
    "skip_audit_logging",
    "without_audit_logging",
]
