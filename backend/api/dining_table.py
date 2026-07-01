from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user, get_db
from schemas import (
    DiningTableCreate,
    DiningTableResponse,
    DiningTableUpdate,
    PaginatedDiningTableResponse,
)
from services.restaurant_ordering import DiningTableService

router = APIRouter(prefix="/dining-tables", tags=["Dining Tables"])


@router.get("/", response_model=PaginatedDiningTableResponse)
async def get_dining_tables(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DiningTableService(db)
    try:
        return await service.get_all_for(current_user.id, page, page_size, search or None)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/", response_model=DiningTableResponse, status_code=status.HTTP_201_CREATED)
async def create_dining_table(
    payload: DiningTableCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DiningTableService(db)
    try:
        return await service.create_for(current_user.id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.put("/{table_id}", response_model=DiningTableResponse)
async def update_dining_table(
    table_id: int,
    payload: DiningTableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DiningTableService(db)
    try:
        return await service.update_for(current_user.id, table_id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.delete("/{table_id}")
async def delete_dining_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DiningTableService(db)
    try:
        return await service.delete_for(current_user.id, table_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
