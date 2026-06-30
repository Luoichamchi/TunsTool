from datetime import timedelta, datetime, timezone
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role
from config.settings import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, username: str, password: str) -> User:
        result = await self.db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Tài khoản không tồn tại")
        if not pwd_context.verify(password, str(user.hashed_password)):
            raise ValueError("Mật khẩu không đúng")
        return user

    async def create_access_token(
        self,
        user: User,
        tenant_code: str,
        expires_delta: timedelta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    ) -> str:
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_names = []
        if user_roles:
            role_ids = [ur.role_id for ur in user_roles]
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
            role_names = [r.name for r in roles]
        primary_role = role_names[0] if role_names else "user"
        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user.id),
            "tenant_code": tenant_code.lower(),
            "role": primary_role,
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def create_refresh_token(
        self,
        user: User,
        tenant_code: str,
        expires_delta: timedelta = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    ) -> str:
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_names = []
        if user_roles:
            role_ids = [ur.role_id for ur in user_roles]
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
            role_names = [r.name for r in roles]
        primary_role = role_names[0] if role_names else "user"
        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user.id),
            "tenant_code": tenant_code.lower(),
            "role": primary_role,
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(
            payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        if not pwd_context.verify(current_password, str(user.hashed_password)):
            raise ValueError("Current password is incorrect")
        hashed_new_password = pwd_context.hash(new_password)
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        return True

    def create_reset_token(self, user: User) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        payload = {
            "sub": str(user.id),
            "type": "password_reset",
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def verify_reset_token(self, token: str) -> User:
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get("sub")
            token_type = payload.get("type")
            if user_id is None or token_type != "password_reset":
                raise ValueError("Invalid token")
            result = await self.db.execute(select(User).filter(User.id == int(user_id)))
            user = result.scalar_one_or_none()
            if not user:
                raise ValueError("User not found")
            return user
        except JWTError:
            raise ValueError("Invalid or expired reset token")

    async def reset_password(self, token: str, new_password: str) -> bool:
        user = await self.verify_reset_token(token)
        hashed_new_password = pwd_context.hash(new_password)
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        return True

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str, str]:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_REFRESH_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("sub")
            tenant_code = payload.get("tenant_code")
            if user_id is None or not tenant_code:
                raise ValueError("Invalid token payload")
            tenant_code = str(tenant_code).lower()
        except JWTError:
            raise ValueError("Invalid or expired refresh token")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        new_access_token = await self.create_access_token(user, tenant_code)
        new_refresh_token = await self.create_refresh_token(user, tenant_code)
        return new_access_token, new_refresh_token, tenant_code

    async def get_user_info_dict(self, user: User) -> dict:
        from services.rbac import RBACService

        role_service = RBACService(self.db)
        user_dict = user.__dict__.copy()
        perms = await role_service.get_user_permissions(user.id)
        user_dict["permissions"] = perms
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if role_ids:
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
        else:
            roles = []
        user_dict["roles"] = [r.name for r in roles]
        user_dict.pop("hashed_password", None)
        user_dict.pop("_sa_instance_state", None)
        return user_dict

    async def get_user_from_refresh_token(self, refresh_token: str) -> User:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_REFRESH_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("sub")
            if user_id is None:
                raise ValueError("Invalid token payload")
        except JWTError:
            raise ValueError("Invalid or expired refresh token")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return user

    async def get_user_by_email(self, email: str) -> User:
        result = await self.db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User with this email not found")
        return user

    async def simple_reset_password(self, username: str, new_password: str) -> bool:
        result = await self.db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        hashed_new_password = pwd_context.hash(new_password)
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        return True
