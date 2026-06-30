from fastapi import Depends
from .auth import get_current_user
from database.models.user import User

async def get_current_user_with_tenant(
    current_user: User = Depends(get_current_user),
) -> User:
    """Lấy user hiện tại (giữ tên dependency cho tương thích API cũ)"""
    return current_user
