from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from database.models import User
from dependencies import get_db, get_catalog_db, get_current_user
from services.auth import AuthService
from services.tenant import TenantService
from services.rbac import RBACService
from services.rbac_helper import is_root_user_global
from config.settings import settings
from config.session_tenant import tenant_db_session
from schemas import (
    TokenResponse,
    LoginRequest,
    ChangePasswordRequest,
    SimpleResetPasswordRequest,
    MessageResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    catalog_db: AsyncSession = Depends(get_catalog_db),
):
    """Đăng nhập vào DB của tenant — JWT chứa tenant_code."""
    tenant_service = TenantService(catalog_db)
    tenant_code = login_data.tenant_code.strip().lower()

    try:
        tenant = await tenant_service._get_tenant_by_code(tenant_code)
        if not tenant.is_active:
            raise ValueError("Tenant không hoạt động")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    try:
        async with tenant_db_session(catalog_db, tenant_code) as tenant_db:
            auth_service = AuthService(tenant_db)
            user = await auth_service.authenticate_user(
                login_data.username,
                login_data.password,
            )
            access_token = await auth_service.create_access_token(
                user,
                tenant_code,
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            refresh_token = await auth_service.create_refresh_token(
                user,
                tenant_code,
                expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
            )
            user_dict = await auth_service.get_user_info_dict(user)
            user_dict["tenant_code"] = tenant_code
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_dict,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    catalog_db: AsyncSession = Depends(get_catalog_db),
):
    from jose import jwt, JWTError

    try:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token found"
            )
        payload = jwt.decode(
            refresh_token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        tenant_code = payload.get("tenant_code")
        if not tenant_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token thiếu tenant_code",
            )
        tenant_code = str(tenant_code).lower()

        async with tenant_db_session(catalog_db, tenant_code) as tenant_db:
            auth_service = AuthService(tenant_db)
            new_access_token, new_refresh_token, _ = await auth_service.refresh_tokens(
                refresh_token
            )
            user = await auth_service.get_user_from_refresh_token(refresh_token)
            user_dict = await auth_service.get_user_info_dict(user)
            user_dict["tenant_code"] = tenant_code
    except (ValueError, JWTError) as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        user=user_dict,
    )


@router.put("/change-password", response_model=MessageResponse)
async def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    try:
        await auth_service.change_password(
            current_user,
            change_data.current_password,
            change_data.new_password,
        )
        return MessageResponse(message="Password changed successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/")
    return MessageResponse(message="Logged out successfully")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: SimpleResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await is_root_user_global(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ root mới có thể reset mật khẩu",
        )

    result = await db.execute(select(User).filter(User.username == reset_data.username))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không thể reset mật khẩu của chính mình",
        )

    role_service = RBACService(db)
    if await role_service.is_root(target_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không thể reset mật khẩu tài khoản root",
        )

    auth_service = AuthService(db)
    try:
        await auth_service.simple_reset_password(
            reset_data.username, reset_data.new_password
        )
        return MessageResponse(
            message=f"Đã reset mật khẩu cho {reset_data.username}"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
