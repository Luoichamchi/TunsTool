from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user, get_db
from schemas import (
    OrderPaymentUpdate,
    OrderResponse,
    OrderStatusUpdate,
    PaginatedOrderResponse,
)
from services.restaurant_ordering import OrderService, get_order_summary_counts

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=PaginatedOrderResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = OrderService(db)
    try:
        return await service.get_all_for(current_user.id, page, page_size, status_filter)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/summary")
async def get_order_summary(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = OrderService(db)
    try:
        await service.get_all_for(current_user.id, 1, 1, None)
        return await get_order_summary_counts(db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = OrderService(db)
    try:
        return await service.get_order_for(current_user.id, order_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = OrderService(db)
    try:
        return await service.update_status_for(current_user.id, order_id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/{order_id}/mark-paid", response_model=OrderResponse)
async def mark_order_paid(
    order_id: int,
    payload: OrderPaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = OrderService(db)
    try:
        return await service.mark_payment_for(current_user.id, order_id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
