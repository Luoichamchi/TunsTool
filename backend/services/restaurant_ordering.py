import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.context import current_tenant_code
from database.models import DiningTable, Order, OrderItem, Product, ProductCategory, TableSession
from schemas import (
    CloseTableRequest,
    DiningTableCreate,
    DiningTableResponse,
    DiningTableUpdate,
    OpenTableResponse,
    OrderPaymentUpdate,
    OrderResponse,
    OrderStatusUpdate,
    PaginatedDiningTableResponse,
    PaginatedOrderResponse,
    PaginatedProductCategoryResponse,
    PaginatedProductResponse,
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCategoryUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    PublicCurrentOrderResponse,
    PublicMenuCategory,
    PublicMenuResponse,
    PublicOrderCreate,
    PublicTableResponse,
    TablePaymentResponse,
    TableSessionResponse,
)
from services.mqtt_publisher import publish_order_event
from .rbac_helper import ensure_permission_global


def _decimal_zero() -> Decimal:
    return Decimal("0.00")


def _product_image_url(tenant_code: str, product_id: int, has_image: bool) -> Optional[str]:
    if not has_image:
        return None
    return f"/api/public/{tenant_code}/products/{product_id}/image"


def _session_to_response(session: TableSession) -> TableSessionResponse:
    return TableSessionResponse(
        id=session.id,
        table_id=session.table_id,
        session_token=session.session_token,
        status=session.status,
        opened_at=session.created_at,
        closed_at=session.closed_at,
    )


def _get_active_session_from_table(table: DiningTable) -> Optional[TableSession]:
    for session in table.sessions or []:
        if session.status == "active":
            return session
    return None


def _table_to_response(table: DiningTable) -> DiningTableResponse:
    active_session = _get_active_session_from_table(table)
    return DiningTableResponse(
        id=table.id,
        table_code=table.table_code,
        name=table.name,
        is_active=table.is_active,
        qr_token=table.qr_token,
        status="serving" if active_session else "empty",
        current_session=_session_to_response(active_session) if active_session else None,
        created_at=table.created_at,
        updated_at=table.updated_at,
    )


class ProductCategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> PaginatedProductCategoryResponse:
        query = select(ProductCategory)
        if search:
            like = f"%{search}%"
            query = query.filter(ProductCategory.name.ilike(like))
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        result = await self.db.execute(
            query.order_by(ProductCategory.sort_order.asc(), ProductCategory.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedProductCategoryResponse(
            data=[ProductCategoryResponse.model_validate(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_by_id(self, category_id: int) -> Optional[ProductCategory]:
        result = await self.db.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def create(self, payload: ProductCategoryCreate) -> ProductCategory:
        row = ProductCategory(**payload.model_dump())
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def update(
        self, category_id: int, payload: ProductCategoryUpdate
    ) -> Optional[ProductCategory]:
        row = await self.get_by_id(category_id)
        if not row:
            return None
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(row, key, value)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def delete(self, category_id: int) -> bool:
        row = await self.get_by_id(category_id)
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def get_all_for(self, user_id: int, page: int, page_size: int, search: Optional[str]):
        await ensure_permission_global(self.db, user_id, "product_category", "view")
        return await self.get_all(page, page_size, search)

    async def create_for(self, user_id: int, payload: ProductCategoryCreate):
        await ensure_permission_global(self.db, user_id, "product_category", "create")
        return ProductCategoryResponse.model_validate(await self.create(payload))

    async def update_for(self, user_id: int, category_id: int, payload: ProductCategoryUpdate):
        await ensure_permission_global(self.db, user_id, "product_category", "update")
        row = await self.update(category_id, payload)
        if not row:
            raise HTTPException(status_code=404, detail="Category not found")
        return ProductCategoryResponse.model_validate(row)

    async def delete_for(self, user_id: int, category_id: int):
        await ensure_permission_global(self.db, user_id, "product_category", "delete")
        deleted = await self.delete(category_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": f"Category {category_id} deleted"}


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _ensure_category_exists(self, category_id: Optional[int]) -> None:
        if category_id is None:
            return
        result = await self.db.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    async def _apply_upload(self, row: Product, image_file: Optional[UploadFile]) -> None:
        if image_file is None:
            return
        content = await image_file.read()
        row.image = content or None
        row.image_content_type = image_file.content_type if content else None

    def _to_response(self, row: Product) -> ProductResponse:
        tenant_code = current_tenant_code.get() or ""
        return ProductResponse(
            id=row.id,
            category_id=row.category_id,
            name=row.name,
            description=row.description,
            price=row.price,
            is_available=row.is_available,
            sort_order=row.sort_order,
            image_url=_product_image_url(tenant_code, row.id, bool(row.image)),
            category_name=row.category.name if row.category else None,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def get_all(
        self, page: int = 1, page_size: int = 10, search: Optional[str] = None
    ) -> PaginatedProductResponse:
        query = select(Product).options(selectinload(Product.category))
        if search:
            like = f"%{search}%"
            query = query.filter(
                Product.name.ilike(like) | Product.description.ilike(like)
            )
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        result = await self.db.execute(
            query.order_by(Product.sort_order.asc(), Product.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedProductResponse(
            data=[self._to_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def create(self, payload: ProductCreate, image_file: Optional[UploadFile]) -> Product:
        await self._ensure_category_exists(payload.category_id)
        row = Product(**payload.model_dump())
        await self._apply_upload(row, image_file)
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return await self.get_by_id(row.id)

    async def update(self, product_id: int, payload: ProductUpdate, image_file: Optional[UploadFile]) -> Optional[Product]:
        row = await self.get_by_id(product_id)
        if not row:
            return None
        data = payload.model_dump(exclude_unset=True)
        if "category_id" in data:
            await self._ensure_category_exists(data["category_id"])
        for key, value in data.items():
            setattr(row, key, value)
        await self._apply_upload(row, image_file)
        await self.db.commit()
        await self.db.refresh(row)
        return await self.get_by_id(row.id)

    async def delete(self, product_id: int) -> bool:
        row = await self.get_by_id(product_id)
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def get_all_for(self, user_id: int, page: int, page_size: int, search: Optional[str]):
        await ensure_permission_global(self.db, user_id, "product", "view")
        return await self.get_all(page, page_size, search)

    async def create_for(self, user_id: int, payload: ProductCreate, image_file: Optional[UploadFile]):
        await ensure_permission_global(self.db, user_id, "product", "create")
        return self._to_response(await self.create(payload, image_file))

    async def update_for(self, user_id: int, product_id: int, payload: ProductUpdate, image_file: Optional[UploadFile]):
        await ensure_permission_global(self.db, user_id, "product", "update")
        row = await self.update(product_id, payload, image_file)
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")
        return self._to_response(row)

    async def delete_for(self, user_id: int, product_id: int):
        await ensure_permission_global(self.db, user_id, "product", "delete")
        deleted = await self.delete(product_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": f"Product {product_id} deleted"}


class DiningTableService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_unique_qr_token(self) -> str:
        while True:
            token = secrets.token_urlsafe(16)
            result = await self.db.execute(
                select(DiningTable).where(DiningTable.qr_token == token)
            )
            if not result.scalar_one_or_none():
                return token

    async def _generate_unique_session_token(self) -> str:
        while True:
            token = secrets.token_urlsafe(16)
            result = await self.db.execute(
                select(TableSession).where(TableSession.session_token == token)
            )
            if not result.scalar_one_or_none():
                return token

    async def _load_table_with_sessions(self, table_id: int) -> Optional[DiningTable]:
        result = await self.db.execute(
            select(DiningTable)
            .options(selectinload(DiningTable.sessions))
            .where(DiningTable.id == table_id)
        )
        return result.scalar_one_or_none()

    async def _get_active_session_for_table(self, table_id: int) -> Optional[TableSession]:
        result = await self.db.execute(
            select(TableSession).where(
                TableSession.table_id == table_id,
                TableSession.status == "active",
            )
        )
        return result.scalar_one_or_none()

    async def _close_session(self, session: TableSession, closed_by: Optional[int] = None) -> None:
        session.status = "closed"
        session.closed_at = datetime.now(timezone.utc)
        session.closed_by = closed_by

    async def _ensure_unique_table_code(self, table_code: str, exclude_id: Optional[int] = None) -> None:
        query = select(DiningTable).where(DiningTable.table_code == table_code)
        result = await self.db.execute(query)
        row = result.scalar_one_or_none()
        if row and row.id != exclude_id:
            raise HTTPException(status_code=400, detail="Table code already exists")

    async def get_all(self, page: int = 1, page_size: int = 10, search: Optional[str] = None):
        query = select(DiningTable).options(selectinload(DiningTable.sessions))
        if search:
            like = f"%{search}%"
            query = query.filter(
                DiningTable.name.ilike(like) | DiningTable.table_code.ilike(like)
            )
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        result = await self.db.execute(
            query.order_by(DiningTable.table_code.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedDiningTableResponse(
            data=[_table_to_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_by_id(self, table_id: int) -> Optional[DiningTable]:
        result = await self.db.execute(select(DiningTable).where(DiningTable.id == table_id))
        return result.scalar_one_or_none()

    async def get_by_token(self, qr_token: str) -> Optional[DiningTable]:
        result = await self.db.execute(
            select(DiningTable).where(DiningTable.qr_token == qr_token)
        )
        return result.scalar_one_or_none()

    async def get_session_by_token(self, session_token: str) -> Optional[TableSession]:
        result = await self.db.execute(
            select(TableSession)
            .options(selectinload(TableSession.table))
            .where(TableSession.session_token == session_token)
        )
        return result.scalar_one_or_none()

    async def open_table(self, table_id: int, user_id: int) -> OpenTableResponse:
        table = await self._load_table_with_sessions(table_id)
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if not table.is_active:
            raise HTTPException(status_code=400, detail="Bàn đang bị khoá")
        existing = await self._get_active_session_for_table(table_id)
        if existing:
            raise HTTPException(status_code=409, detail="Bàn đang được phục vụ")

        session = TableSession(
            table_id=table.id,
            session_token=await self._generate_unique_session_token(),
            status="active",
            opened_by=user_id,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        table = await self._load_table_with_sessions(table_id)
        return OpenTableResponse(
            table=_table_to_response(table),
            session=_session_to_response(session),
        )

    async def close_table(
        self, table_id: int, user_id: int, payload: CloseTableRequest
    ) -> DiningTableResponse:
        table = await self._load_table_with_sessions(table_id)
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")

        session = await self._get_active_session_for_table(table_id)
        if not session:
            raise HTTPException(status_code=404, detail="Bàn không có phiên đang mở")

        order_service = OrderService(self.db)
        open_orders = await order_service._get_open_orders_by_table(table_id)
        if open_orders:
            if not payload.force:
                raise HTTPException(
                    status_code=409,
                    detail="Bàn còn đơn chưa thanh toán",
                )
            for open_order in open_orders:
                open_order.status = "cancelled"

        await self._close_session(session, closed_by=user_id)
        await self.db.commit()

        table = await self._load_table_with_sessions(table_id)
        return _table_to_response(table)

    async def create(self, payload: DiningTableCreate) -> DiningTable:
        await self._ensure_unique_table_code(payload.table_code)
        row = DiningTable(**payload.model_dump(), qr_token=await self._generate_unique_qr_token())
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def update(self, table_id: int, payload: DiningTableUpdate) -> Optional[DiningTable]:
        row = await self.get_by_id(table_id)
        if not row:
            return None
        data = payload.model_dump(exclude_unset=True)
        if "table_code" in data:
            await self._ensure_unique_table_code(data["table_code"], exclude_id=table_id)
        for key, value in data.items():
            setattr(row, key, value)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def delete(self, table_id: int) -> bool:
        row = await self.get_by_id(table_id)
        if not row:
            return False
        await self.db.delete(row)
        await self.db.commit()
        return True

    async def get_all_for(self, user_id: int, page: int, page_size: int, search: Optional[str]):
        await ensure_permission_global(self.db, user_id, "dining_table", "view")
        return await self.get_all(page, page_size, search)

    async def create_for(self, user_id: int, payload: DiningTableCreate):
        await ensure_permission_global(self.db, user_id, "dining_table", "create")
        row = await self.create(payload)
        table = await self._load_table_with_sessions(row.id)
        return _table_to_response(table)

    async def update_for(self, user_id: int, table_id: int, payload: DiningTableUpdate):
        await ensure_permission_global(self.db, user_id, "dining_table", "update")
        row = await self.update(table_id, payload)
        if not row:
            raise HTTPException(status_code=404, detail="Table not found")
        table = await self._load_table_with_sessions(table_id)
        return _table_to_response(table)

    async def delete_for(self, user_id: int, table_id: int):
        await ensure_permission_global(self.db, user_id, "dining_table", "delete")
        deleted = await self.delete(table_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Table not found")
        return {"message": f"Table {table_id} deleted"}

    async def open_table_for(self, user_id: int, table_id: int) -> OpenTableResponse:
        await ensure_permission_global(self.db, user_id, "dining_table", "update")
        return await self.open_table(table_id, user_id)

    async def close_table_for(
        self, user_id: int, table_id: int, payload: CloseTableRequest
    ) -> DiningTableResponse:
        await ensure_permission_global(self.db, user_id, "dining_table", "update")
        return await self.close_table(table_id, user_id, payload)


class OrderService:
    OPEN_STATUSES = {"pending", "confirmed", "preparing", "served"}

    def __init__(self, db: AsyncSession):
        self.db = db

    def _serialize_item(self, item: OrderItem):
        return {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "unit_price": item.unit_price,
            "quantity": item.quantity,
            "note": item.note,
            "subtotal": item.subtotal,
            "batch_no": item.batch_no,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }

    def _to_response(self, row: Order) -> OrderResponse:
        return OrderResponse(
            id=row.id,
            table_id=row.table_id,
            table_code=row.table.table_code if row.table else None,
            table_name=row.table.name if row.table else None,
            status=row.status,
            is_paid=row.is_paid,
            total_amount=row.total_amount,
            note=row.note,
            created_at=row.created_at,
            updated_at=row.updated_at,
            items=[self._serialize_item(item) for item in sorted(row.items, key=lambda x: (x.batch_no, x.id))],
        )

    async def _load_order(self, order_id: int) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.table),
                selectinload(Order.items),
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def _get_open_orders_by_table(self, table_id: int) -> list[Order]:
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.table),
                selectinload(Order.items),
            )
            .where(
                Order.table_id == table_id,
                Order.is_paid == False,
                Order.status.in_(tuple(self.OPEN_STATUSES)),
            )
            .order_by(Order.id.desc())
        )
        return list(result.scalars().all())

    async def _close_table_session_if_idle(self, table_id: int) -> None:
        open_orders = await self._get_open_orders_by_table(table_id)
        if open_orders:
            return
        table_service = DiningTableService(self.db)
        active_session = await table_service._get_active_session_for_table(table_id)
        if active_session:
            await table_service._close_session(active_session)
            await self.db.commit()

    async def get_all(self, page: int = 1, page_size: int = 10, status_filter: Optional[str] = None):
        query = select(Order).options(selectinload(Order.table), selectinload(Order.items))
        if status_filter:
            query = query.filter(Order.status == status_filter)
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        result = await self.db.execute(
            query.order_by(Order.created_at.desc(), Order.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedOrderResponse(
            data=[self._to_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_status(self, order_id: int, payload: OrderStatusUpdate) -> Order:
        row = await self._load_order(order_id)
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        row.status = payload.status
        if payload.status in {"completed", "cancelled"} and not row.is_paid:
            row.is_paid = payload.status == "completed"
        await self.db.commit()
        await self.db.refresh(row)

        if payload.status == "completed":
            await self._close_table_session_if_idle(row.table_id)

        row = await self._load_order(order_id)
        self.publish_event("status_changed", row)
        return row

    async def mark_payment(self, order_id: int, payload: OrderPaymentUpdate) -> Order:
        row = await self._load_order(order_id)
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        row.is_paid = payload.is_paid
        if payload.is_paid:
            row.status = "completed"
        await self.db.commit()
        await self.db.refresh(row)

        if payload.is_paid:
            await self._close_table_session_if_idle(row.table_id)

        row = await self._load_order(order_id)
        self.publish_event("payment_updated", row)
        return row

    async def mark_table_payment(self, table_id: int, payload: OrderPaymentUpdate) -> TablePaymentResponse:
        if not payload.is_paid:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ xác nhận thanh toán")

        open_orders = await self._get_open_orders_by_table(table_id)
        if not open_orders:
            raise HTTPException(status_code=404, detail="Bàn không có đơn chưa thanh toán")

        total_amount = _decimal_zero()
        for order in open_orders:
            order.is_paid = True
            order.status = "completed"
            total_amount += Decimal(order.total_amount)

        await self.db.commit()
        await self._close_table_session_if_idle(table_id)

        paid_orders = [await self._load_order(order.id) for order in open_orders]
        table = paid_orders[0].table if paid_orders else None
        for order in paid_orders:
            self.publish_event("payment_updated", order)

        return TablePaymentResponse(
            table_id=table_id,
            table_code=table.table_code if table else None,
            table_name=table.name if table else None,
            total_amount=total_amount,
            orders=[self._to_response(order) for order in paid_orders],
        )

    async def _get_active_session(self, session_token: str) -> TableSession:
        table_service = DiningTableService(self.db)
        session = await table_service.get_session_by_token(session_token)
        if not session or session.status != "active":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Phiên đã kết thúc",
            )
        table = session.table
        if not table or not table.is_active:
            raise HTTPException(status_code=404, detail="Table not found")
        return session

    async def get_current_order_by_session(self, session_token: str) -> PublicCurrentOrderResponse:
        session = await self._get_active_session(session_token)
        orders = await self._get_open_orders_by_table(session.table_id)
        order_responses = [self._to_response(order) for order in orders]
        total_amount = sum((Decimal(order.total_amount) for order in orders), _decimal_zero())
        return PublicCurrentOrderResponse(
            orders=order_responses,
            total_amount=total_amount,
            order_count=len(order_responses),
        )

    async def get_public_order_by_session(self, session_token: str, order_id: int) -> OrderResponse:
        session = await self._get_active_session(session_token)
        order = await self._load_order(order_id)
        if not order or order.table_id != session.table_id:
            raise HTTPException(status_code=404, detail="Order not found")
        return self._to_response(order)

    async def get_public_table(self, session_token: str) -> PublicTableResponse:
        session = await self._get_active_session(session_token)
        table = session.table
        return PublicTableResponse(
            id=table.id,
            table_code=table.table_code,
            name=table.name,
            session_token=session.session_token,
            session_status=session.status,
            is_active=table.is_active,
        )

    async def get_public_menu(self) -> PublicMenuResponse:
        tenant_code = current_tenant_code.get() or ""
        categories_result = await self.db.execute(
            select(ProductCategory)
            .options(selectinload(ProductCategory.products))
            .where(ProductCategory.is_active == True)
            .order_by(ProductCategory.sort_order.asc(), ProductCategory.id.asc())
        )
        categories = categories_result.scalars().all()
        payload = []
        for category in categories:
            products = [
                ProductResponse(
                    id=product.id,
                    category_id=product.category_id,
                    name=product.name,
                    description=product.description,
                    price=product.price,
                    is_available=product.is_available,
                    sort_order=product.sort_order,
                    image_url=_product_image_url(tenant_code, product.id, bool(product.image)),
                    category_name=category.name,
                    created_at=product.created_at,
                    updated_at=product.updated_at,
                )
                for product in sorted(category.products, key=lambda p: (p.sort_order, p.id))
                if product.is_available
            ]
            payload.append(
                PublicMenuCategory(
                    id=category.id,
                    name=category.name,
                    description=category.description,
                    products=products,
                )
            )
        return PublicMenuResponse(categories=payload)

    async def submit_public_order(self, payload: PublicOrderCreate) -> OrderResponse:
        if not payload.items:
            raise HTTPException(status_code=400, detail="Giỏ hàng đang trống")

        session = await self._get_active_session(payload.session_token)
        table = session.table

        product_ids = [item.product_id for item in payload.items]
        products_result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = {product.id: product for product in products_result.scalars().all()}
        missing_ids = [product_id for product_id in product_ids if product_id not in products]
        if missing_ids:
            raise HTTPException(status_code=404, detail="Một số sản phẩm không tồn tại")

        unavailable_ids = [product.id for product in products.values() if not product.is_available]
        if unavailable_ids:
            raise HTTPException(status_code=400, detail="Có sản phẩm đang tạm hết")

        order = Order(
            table_id=table.id,
            session_id=session.id,
            status="pending",
            is_paid=False,
            total_amount=_decimal_zero(),
            note=payload.note,
        )
        self.db.add(order)
        await self.db.flush()

        added_total = _decimal_zero()
        for item in payload.items:
            product = products[item.product_id]
            subtotal = Decimal(product.price) * Decimal(item.quantity)
            added_total += subtotal
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=item.quantity,
                note=item.note,
                subtotal=subtotal,
                batch_no=1,
            )
            self.db.add(order_item)

        order.total_amount = added_total

        order_id = order.id
        await self.db.commit()
        order = await self._load_order(order_id)
        self.publish_event("order_created", order)
        return self._to_response(order)

    def publish_event(self, event_name: str, order: Order) -> None:
        tenant_code = current_tenant_code.get() or ""
        if not tenant_code or not order:
            return
        try:
            publish_order_event(
                tenant_code,
                {
                    "event": event_name,
                    "order_id": order.id,
                    "table_id": order.table_id,
                    "table_code": order.table.table_code if order.table else None,
                    "status": order.status,
                    "is_paid": order.is_paid,
                    "total_amount": str(order.total_amount),
                },
            )
        except Exception:
            pass

    async def get_all_for(self, user_id: int, page: int, page_size: int, status_filter: Optional[str]):
        await ensure_permission_global(self.db, user_id, "order", "view")
        return await self.get_all(page, page_size, status_filter)

    async def update_status_for(self, user_id: int, order_id: int, payload: OrderStatusUpdate):
        await ensure_permission_global(self.db, user_id, "order", "update")
        return self._to_response(await self.update_status(order_id, payload))

    async def mark_payment_for(self, user_id: int, order_id: int, payload: OrderPaymentUpdate):
        await ensure_permission_global(self.db, user_id, "order", "update")
        return self._to_response(await self.mark_payment(order_id, payload))

    async def mark_table_payment_for(self, user_id: int, table_id: int, payload: OrderPaymentUpdate):
        await ensure_permission_global(self.db, user_id, "order", "update")
        return await self.mark_table_payment(table_id, payload)

    async def get_order_for(self, user_id: int, order_id: int):
        await ensure_permission_global(self.db, user_id, "order", "view")
        row = await self._load_order(order_id)
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        return self._to_response(row)


async def get_product_image(db: AsyncSession, product_id: int) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    row = result.scalar_one_or_none()
    if not row or not row.image:
        raise HTTPException(status_code=404, detail="Image not found")
    return row


async def get_order_summary_counts(db: AsyncSession) -> dict:
    result = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    return {status: count for status, count in result.all()}
