from fastapi import Depends, HTTPException, status

from config.tenant_database import DEFAULT_TENANT_CODE
from .database import get_tenant_code_from_token

__all__ = ["require_default_tenant", "DEFAULT_TENANT_CODE"]


async def require_default_tenant(
    tenant_code: str = Depends(get_tenant_code_from_token),
) -> str:
    """Chỉ tenant default được quản lý registry tenant (catalog)."""
    if tenant_code != DEFAULT_TENANT_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ tenant default mới được quản lý tenant",
        )
    return tenant_code
