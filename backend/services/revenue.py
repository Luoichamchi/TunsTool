from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import DateTime, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Expense, Order, OrderItem
from schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    PaginatedExpenseResponse,
    RevenueSeriesPoint,
    RevenueSummaryResponse,
    TopProductItem,
)
from services.rbac_helper import ensure_permission_global


def _decimal_zero() -> Decimal:
    return Decimal("0.00")


def _date_range_to_datetimes(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    start_at = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_at = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    return start_at, end_at


def _format_period(period_start: datetime, granularity: str) -> tuple[str, str]:
    if granularity == "year":
        return period_start.strftime("%Y"), period_start.strftime("%Y")
    if granularity == "month":
        return period_start.strftime("%Y-%m"), period_start.strftime("%m/%Y")
    return period_start.strftime("%Y-%m-%d"), period_start.strftime("%d/%m/%Y")


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, expense_id: int) -> Optional[Expense]:
        result = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 10,
        category: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> PaginatedExpenseResponse:
        query = select(Expense)
        if category:
            query = query.where(Expense.category == category)
        if search:
            query = query.where(Expense.note.ilike(f"%{search}%"))
        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)

        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = int(total_result.scalar() or 0)
        result = await self.db.execute(
            query.order_by(Expense.expense_date.desc(), Expense.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedExpenseResponse(
            data=[ExpenseResponse.model_validate(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def create(self, payload: ExpenseCreate, created_by: Optional[int]) -> Expense:
        row = Expense(**payload.model_dump(), created_by=created_by)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def update(self, expense_id: int, payload: ExpenseUpdate) -> Optional[Expense]:
        row = await self.get_by_id(expense_id)
        if not row:
            return None
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(row, key, value)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def delete(self, expense_id: int) -> bool:
        row = await self.get_by_id(expense_id)
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def get_all_for(
        self,
        user_id: int,
        page: int,
        page_size: int,
        category: Optional[str],
        search: Optional[str],
        start_date: Optional[date],
        end_date: Optional[date],
    ):
        await ensure_permission_global(self.db, user_id, "revenue", "view")
        return await self.get_all(page, page_size, category, search, start_date, end_date)

    async def create_for(self, user_id: int, payload: ExpenseCreate):
        await ensure_permission_global(self.db, user_id, "revenue", "create")
        return ExpenseResponse.model_validate(await self.create(payload, user_id))

    async def update_for(self, user_id: int, expense_id: int, payload: ExpenseUpdate):
        await ensure_permission_global(self.db, user_id, "revenue", "update")
        row = await self.update(expense_id, payload)
        if not row:
            raise HTTPException(status_code=404, detail="Expense not found")
        return ExpenseResponse.model_validate(row)

    async def delete_for(self, user_id: int, expense_id: int):
        await ensure_permission_global(self.db, user_id, "revenue", "delete")
        deleted = await self.delete(expense_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": f"Expense {expense_id} deleted"}


class RevenueReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary(
        self,
        start_date: date,
        end_date: date,
        granularity: str,
    ) -> RevenueSummaryResponse:
        start_at, end_at = _date_range_to_datetimes(start_date, end_date)

        order_period = func.date_trunc(granularity, Order.created_at).label("period_start")
        order_result = await self.db.execute(
            select(
                order_period,
                func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
                func.count(Order.id).label("order_count"),
            )
            .where(
                Order.is_paid == True,
                Order.created_at >= start_at,
                Order.created_at < end_at,
            )
            .group_by(order_period)
            .order_by(order_period.asc())
        )

        expense_period = func.date_trunc(
            granularity,
            cast(Expense.expense_date, DateTime(timezone=True)),
        ).label("period_start")
        expense_result = await self.db.execute(
            select(
                expense_period,
                func.coalesce(func.sum(Expense.amount), 0).label("expense"),
            )
            .where(
                Expense.expense_date >= start_date,
                Expense.expense_date <= end_date,
            )
            .group_by(expense_period)
            .order_by(expense_period.asc())
        )

        top_products_result = await self.db.execute(
            select(
                OrderItem.product_name,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("quantity_sold"),
                func.coalesce(func.sum(OrderItem.subtotal), 0).label("revenue"),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.is_paid == True,
                Order.created_at >= start_at,
                Order.created_at < end_at,
            )
            .group_by(OrderItem.product_name)
            .order_by(func.sum(OrderItem.subtotal).desc(), func.sum(OrderItem.quantity).desc())
            .limit(10)
        )

        series_map: dict[str, dict] = {}
        total_revenue = _decimal_zero()
        total_expense = _decimal_zero()
        order_count = 0

        for period_start, revenue, period_order_count in order_result.all():
            period_key, period_label = _format_period(period_start, granularity)
            revenue_decimal = Decimal(revenue or 0)
            total_revenue += revenue_decimal
            order_count += int(period_order_count or 0)
            series_map[period_key] = {
                "period_key": period_key,
                "period_label": period_label,
                "period_start": period_start,
                "revenue": revenue_decimal,
                "expense": _decimal_zero(),
                "order_count": int(period_order_count or 0),
            }

        for period_start, expense in expense_result.all():
            period_key, period_label = _format_period(period_start, granularity)
            expense_decimal = Decimal(expense or 0)
            total_expense += expense_decimal
            if period_key not in series_map:
                series_map[period_key] = {
                    "period_key": period_key,
                    "period_label": period_label,
                    "period_start": period_start,
                    "revenue": _decimal_zero(),
                    "expense": expense_decimal,
                    "order_count": 0,
                }
            else:
                series_map[period_key]["expense"] = expense_decimal

        series = []
        for period_key in sorted(series_map.keys()):
            item = series_map[period_key]
            profit = Decimal(item["revenue"]) - Decimal(item["expense"])
            series.append(
                RevenueSeriesPoint(
                    period_key=item["period_key"],
                    period_label=item["period_label"],
                    period_start=item["period_start"],
                    revenue=item["revenue"],
                    expense=item["expense"],
                    profit=profit,
                    order_count=item["order_count"],
                )
            )

        top_products = [
            TopProductItem(
                product_name=product_name,
                quantity_sold=int(quantity_sold or 0),
                revenue=Decimal(revenue or 0),
            )
            for product_name, quantity_sold, revenue in top_products_result.all()
        ]

        profit = total_revenue - total_expense
        avg_order_value = (
            (total_revenue / Decimal(order_count)).quantize(Decimal("0.01"))
            if order_count
            else _decimal_zero()
        )

        return RevenueSummaryResponse(
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
            total_revenue=total_revenue,
            total_expense=total_expense,
            profit=profit,
            order_count=order_count,
            avg_order_value=avg_order_value,
            series=series,
            top_products=top_products,
        )

    async def get_summary_for(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        granularity: str,
    ) -> RevenueSummaryResponse:
        await ensure_permission_global(self.db, user_id, "revenue", "view")
        return await self.get_summary(start_date, end_date, granularity)
