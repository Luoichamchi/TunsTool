from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from database.models import User, UserRole, Role
from passlib.context import CryptContext
from config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_root_user(db: AsyncSession) -> None:
    """Seed root user với tất cả quyền"""
    root_username = settings.SEED_ROOT_USERNAME.strip()
    root_email = "root@system.local"
    result = await db.execute(
        select(User).filter(
            or_(User.username == root_username, User.email == root_email)
        )
    )
    root_user = result.scalars().first()

    if not root_user:
        hashed_password = pwd_context.hash(settings.SEED_ROOT_PASSWORD)
        root_user = User(
            username=root_username,
            email=root_email,
            hashed_password=hashed_password,
            full_name="Root User",
            is_active=1,
        )
        db.add(root_user)
        await db.commit()
        await db.refresh(root_user)
        print("✅ Created root user")
    else:
        root_user.username = root_username
        root_user.hashed_password = pwd_context.hash(settings.SEED_ROOT_PASSWORD)
        await db.commit()
        await db.refresh(root_user)
        print("✅ Upserted root user credentials")

    result = await db.execute(select(Role).filter_by(name="root"))
    root_role = result.scalar_one_or_none()

    if root_role and root_user:
        result = await db.execute(
            select(UserRole).filter_by(user_id=root_user.id, role_id=root_role.id)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(UserRole(user_id=root_user.id, role_id=root_role.id))
            await db.commit()
            print("✅ Assigned root role to root user")
        else:
            print("ℹ️ Root user already has root role")

    return root_user
