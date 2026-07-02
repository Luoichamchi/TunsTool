from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


EXPENSE_CATEGORIES = [
    "ingredient",
    "utility",
    "labor",
    "rent",
    "other",
]

REVENUE_GRANULARITIES = ["day", "month", "year"]


class ExpenseBase(BaseModel):
    expense_date: date
    amount: Decimal = Field(..., ge=0)
    category: Literal["ingredient", "utility", "labor", "rent", "other"]
    note: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    category: Optional[Literal["ingredient", "utility", "labor", "rent", "other"]] = None
    note: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PaginatedExpenseResponse(BaseModel):
    data: List[ExpenseResponse]
    total: int
    page: int
    page_size: int


class RevenueSeriesPoint(BaseModel):
    period_key: str
    period_label: str
    period_start: datetime
    revenue: Decimal = Decimal("0.00")
    expense: Decimal = Decimal("0.00")
    profit: Decimal = Decimal("0.00")
    order_count: int = 0


class TopProductItem(BaseModel):
    product_name: str
    quantity_sold: int = 0
    revenue: Decimal = Decimal("0.00")


class RevenueSummaryResponse(BaseModel):
    start_date: date
    end_date: date
    granularity: Literal["day", "month", "year"]
    total_revenue: Decimal = Decimal("0.00")
    total_expense: Decimal = Decimal("0.00")
    profit: Decimal = Decimal("0.00")
    order_count: int = 0
    avg_order_value: Decimal = Decimal("0.00")
    series: List[RevenueSeriesPoint] = []
    top_products: List[TopProductItem] = []
