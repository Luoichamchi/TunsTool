from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Role

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User"),
]


async def seed_default_roles(db: AsyncSession) -> None:
    """Seed roles mặc định nếu chưa có"""
    for name, desc in BASE_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            db.add(Role(name=name, description=desc))
            await db.commit()
            print(f"✅ Created global role: {name}")
        else:
            print(f"ℹ️ Role {name} already exists")
