from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from database.models import User, UserRole, Role
from passlib.context import CryptContext
from services import UserService
from schemas import UserCreate
from config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_default_accounts(db: AsyncSession) -> None:
    """Seed tài khoản mặc định"""
    user_service = UserService(db)
    default_accounts = [
        (
            settings.SEED_ADMIN_USERNAME,
            "Admin",
            "admin@local.com",
            settings.SEED_ADMIN_PASSWORD,
            "admin",
        ),
        (
            settings.SEED_USER_USERNAME,
            "User",
            "user@local.com",
            settings.SEED_USER_PASSWORD,
            "user",
        ),
    ]

    for username, full_name, email, password, role in default_accounts:
        username = username.strip()
        result = await db.execute(
            select(User).filter(or_(User.username == username, User.email == email))
        )
        user = result.scalars().first()

        if not user:
            try:
                user_create = UserCreate(
                    username=username,
                    email=email,
                    password=password,
                    full_name=full_name,
                    role=role,
                )
                user = await user_service.create_user(user_create)
            except Exception as e:
                print(f"❌ Error creating user {username}: {str(e)}")
                continue
        else:
            user.username = username
            user.hashed_password = pwd_context.hash(password)
            await db.commit()
            await db.refresh(user)
            print(f"✅ Upserted credentials for user {username}")

        result = await db.execute(select(Role).filter_by(name=role))
        role_obj = result.scalar_one_or_none()
        if user and role_obj:
            result = await db.execute(
                select(UserRole).filter_by(user_id=user.id, role_id=role_obj.id)
            )
            existing = result.scalar_one_or_none()
            if not existing:
                db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                await db.commit()
                print(f"✅ Assigned role {role} to user {username}")
