from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "served",
    "completed",
    "cancelled",
]


class ProductCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ProductCategoryResponse(ProductCategoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    is_available: bool = True
    sort_order: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    is_available: Optional[bool] = None
    sort_order: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    image_url: Optional[str] = None
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PaginatedProductResponse(BaseModel):
    data: List[ProductResponse]
    total: int
    page: int
    page_size: int


class PaginatedProductCategoryResponse(BaseModel):
    data: List[ProductCategoryResponse]
    total: int
    page: int
    page_size: int


class DiningTableBase(BaseModel):
    table_code: str
    name: str
    is_active: bool = True


class DiningTableCreate(DiningTableBase):
    pass


class DiningTableUpdate(BaseModel):
    table_code: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None


class TableSessionResponse(BaseModel):
    id: int
    table_id: int
    session_token: str
    status: str
    opened_at: datetime
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DiningTableResponse(DiningTableBase):
    id: int
    qr_token: str
    status: str = "empty"
    current_session: Optional[TableSessionResponse] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class CloseTableRequest(BaseModel):
    force: bool = False


class OpenTableResponse(BaseModel):
    table: DiningTableResponse
    session: TableSessionResponse


class PaginatedDiningTableResponse(BaseModel):
    data: List[DiningTableResponse]
    total: int
    page: int
    page_size: int


class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    unit_price: Decimal
    quantity: int
    note: Optional[str] = None
    subtotal: Decimal
    batch_no: int


class OrderItemResponse(OrderItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    table_id: int
    table_code: Optional[str] = None
    table_name: Optional[str] = None
    status: str
    is_paid: bool
    total_amount: Decimal
    note: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    served_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedOrderResponse(BaseModel):
    data: List[OrderResponse]
    total: int
    page: int
    page_size: int


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|preparing|served|completed|cancelled)$")


class OrderPaymentUpdate(BaseModel):
    is_paid: bool = True


class PublicOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)
    note: Optional[str] = None


class PublicOrderCreate(BaseModel):
    session_token: str
    note: Optional[str] = None
    items: List[PublicOrderItemCreate]


class PublicTableResponse(BaseModel):
    id: int
    table_code: str
    name: str
    session_token: str
    session_status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class PublicMenuCategory(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    products: List[ProductResponse]


class PublicMenuResponse(BaseModel):
    categories: List[PublicMenuCategory]


class PublicCurrentOrderResponse(BaseModel):
    orders: List[OrderResponse] = []
    total_amount: Decimal = Decimal("0")
    order_count: int = 0


class TablePaymentResponse(BaseModel):
    table_id: int
    table_code: Optional[str] = None
    table_name: Optional[str] = None
    total_amount: Decimal
    orders: List[OrderResponse] = []
