from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user, get_db
from schemas import PaginatedProductResponse, ProductCreate, ProductResponse, ProductUpdate
from services.restaurant_ordering import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=PaginatedProductResponse)
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductService(db)
    try:
        return await service.get_all_for(current_user.id, page, page_size, search or None)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    category_id: Optional[int] = Form(None),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: Decimal = Form(...),
    is_available: bool = Form(True),
    sort_order: int = Form(0),
    image_file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductService(db)
    payload = ProductCreate(
        category_id=category_id,
        name=name,
        description=description,
        price=price,
        is_available=is_available,
        sort_order=sort_order,
    )
    try:
        return await service.create_for(current_user.id, payload, image_file)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    category_id: Optional[int] = Form(None),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[Decimal] = Form(None),
    is_available: Optional[bool] = Form(None),
    sort_order: Optional[int] = Form(None),
    image_file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductService(db)
    payload = ProductUpdate(
        category_id=category_id,
        name=name,
        description=description,
        price=price,
        is_available=is_available,
        sort_order=sort_order,
    )
    try:
        return await service.update_for(current_user.id, product_id, payload, image_file)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ProductService(db)
    try:
        return await service.delete_for(current_user.id, product_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
