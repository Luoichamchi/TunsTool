from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user, get_db
from schemas import (
    PaginatedProductCategoryResponse,
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCategoryUpdate,
)
from services.restaurant_ordering import ProductCategoryService

router = APIRouter(prefix="/product-categories", tags=["Product Categories"])


@router.get("/", response_model=PaginatedProductCategoryResponse)
async def get_product_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductCategoryService(db)
    try:
        return await service.get_all_for(current_user.id, page, page_size, search or None)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_product_category(
    payload: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductCategoryService(db)
    try:
        return await service.create_for(current_user.id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.put("/{category_id}", response_model=ProductCategoryResponse)
async def update_product_category(
    category_id: int,
    payload: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductCategoryService(db)
    try:
        return await service.update_for(current_user.id, category_id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.delete("/{category_id}")
async def delete_product_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductCategoryService(db)
    try:
        return await service.delete_for(current_user.id, category_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
