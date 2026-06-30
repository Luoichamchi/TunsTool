"""
Helper functions for RBAC operations — luôn dùng session DB của tenant hiện tại.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from services.rbac import RBACService


async def ensure_permission_global(
    db: AsyncSession, user_id: int, module: str, action: str
) -> None:
    role_service = RBACService(db)
    await role_service.ensure_permission(user_id, module, action)


async def get_user_permissions_global(db: AsyncSession, user_id: int) -> dict:
    role_service = RBACService(db)
    return await role_service.get_user_permissions(user_id)


async def is_root_user_global(db: AsyncSession, user_id: int) -> bool:
    from sqlalchemy import select

    from database.models import User

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return False
    role_service = RBACService(db)
    return await role_service.is_root(user)
