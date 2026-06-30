from schemas import (
    UserResponse,
    PaginatedUserResponse,
    UserCreate,
    UserUpdate,
    UserChangePasswordRequest,
    MessageResponse,
    PermissionError,
)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies import get_db, get_current_user
from services import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.create_user_for(current_user.id, user_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.list_users_for(current_user.id, page, page_size, search)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.get_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.update_user_for(current_user.id, user_id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.delete_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{user_id}/change-password", response_model=MessageResponse)
async def change_user_password(
    user_id: int,
    change_data: UserChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = UserService(db)
    try:
        return await service.change_password_for(
            current_user.id,
            user_id,
            change_data.new_password,
            change_data.current_password,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
