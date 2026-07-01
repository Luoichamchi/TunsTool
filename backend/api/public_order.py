from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_public_db
from schemas import (
    OrderResponse,
    PublicCurrentOrderResponse,
    PublicMenuResponse,
    PublicOrderCreate,
    PublicTableResponse,
)
from services.restaurant_ordering import OrderService, get_product_image

router = APIRouter(prefix="/public/{tenant}", tags=["Public Ordering"])


@router.get("/tables/{session_token}", response_model=PublicTableResponse)
async def get_public_table(
    tenant: str,
    session_token: str,
    db: AsyncSession = Depends(get_public_db),
):
    service = OrderService(db)
    return await service.get_public_table(session_token)


@router.get("/menu", response_model=PublicMenuResponse)
async def get_public_menu(
    tenant: str,
    db: AsyncSession = Depends(get_public_db),
):
    service = OrderService(db)
    return await service.get_public_menu()


@router.get("/products/{product_id}/image")
async def get_public_product_image(
    tenant: str,
    product_id: int,
    db: AsyncSession = Depends(get_public_db),
):
    product = await get_product_image(db, product_id)
    return Response(content=product.image, media_type=product.image_content_type or "image/png")


@router.post("/orders")
async def submit_public_order(
    tenant: str,
    payload: PublicOrderCreate,
    db: AsyncSession = Depends(get_public_db),
):
    service = OrderService(db)
    return await service.submit_public_order(payload)


@router.get("/tables/{session_token}/current-order", response_model=PublicCurrentOrderResponse)
async def get_current_public_order(
    tenant: str,
    session_token: str,
    db: AsyncSession = Depends(get_public_db),
):
    service = OrderService(db)
    return await service.get_current_order_by_session(session_token)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_public_order(
    tenant: str,
    order_id: int,
    session_token: str,
    db: AsyncSession = Depends(get_public_db),
):
    service = OrderService(db)
    return await service.get_public_order_by_session(session_token, order_id)
