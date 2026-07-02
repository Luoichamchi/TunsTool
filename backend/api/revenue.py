from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_current_user, get_db
from schemas import (
    EXPENSE_CATEGORIES,
    REVENUE_GRANULARITIES,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    PaginatedExpenseResponse,
    RevenueSummaryResponse,
)
from services.revenue import ExpenseService, RevenueReportService

router = APIRouter(prefix="/revenue", tags=["Revenue"])


@router.get("/summary", response_model=RevenueSummaryResponse)
async def get_revenue_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    granularity: str = Query("day"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if granularity not in REVENUE_GRANULARITIES:
        raise HTTPException(status_code=400, detail="Invalid granularity")
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    service = RevenueReportService(db)
    try:
        return await service.get_summary_for(current_user.id, start_date, end_date, granularity)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.get("/expenses", response_model=PaginatedExpenseResponse)
async def get_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category: str | None = Query(None),
    search: str | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if category and category not in EXPENSE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid expense category")
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")

    service = ExpenseService(db)
    try:
        return await service.get_all_for(
            current_user.id,
            page,
            page_size,
            category,
            search,
            start_date,
            end_date,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ExpenseService(db)
    try:
        return await service.create_for(current_user.id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ExpenseService(db)
    try:
        return await service.update_for(current_user.id, expense_id, payload)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ExpenseService(db)
    try:
        return await service.delete_for(current_user.id, expense_id)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
