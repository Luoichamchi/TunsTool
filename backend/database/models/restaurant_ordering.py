from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, LargeBinary, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.models import BaseModel


class ProductCategory(BaseModel):
    __tablename__ = "product_categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="category",
    )


class Product(BaseModel):
    __tablename__ = "products"

    category_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("product_categories.id"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    image: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    image_content_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    category: Mapped[Optional["ProductCategory"]] = relationship(
        "ProductCategory",
        back_populates="products",
    )
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
    )


class DiningTable(BaseModel):
    __tablename__ = "dining_tables"

    table_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    qr_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="table",
    )
    sessions: Mapped[List["TableSession"]] = relationship(
        "TableSession",
        back_populates="table",
    )


class TableSession(BaseModel):
    __tablename__ = "table_sessions"

    table_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dining_tables.id"),
        nullable=False,
        index=True,
    )
    session_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opened_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    closed_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    table: Mapped["DiningTable"] = relationship(
        "DiningTable",
        back_populates="sessions",
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="session",
    )


class Order(BaseModel):
    __tablename__ = "orders"

    table_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dining_tables.id"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("table_sessions.id"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending", index=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    served_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    table: Mapped["DiningTable"] = relationship(
        "DiningTable",
        back_populates="orders",
    )
    session: Mapped[Optional["TableSession"]] = relationship(
        "TableSession",
        back_populates="orders",
    )
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("products.id"),
        nullable=True,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    batch_no: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
    )
    product: Mapped[Optional["Product"]] = relationship(
        "Product",
        back_populates="order_items",
    )
