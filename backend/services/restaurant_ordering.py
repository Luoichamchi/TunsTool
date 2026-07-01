import secrets
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.context import current_tenant_code
from database.models import DiningTable, Order, OrderItem, Product, ProductCategory
from schemas import (
    DiningTableCreate,
    DiningTableResponse,
    DiningTableUpdate,
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
)
from services.mqtt_publisher import publish_order_event
from .rbac_helper import ensure_permission_global


def _decimal_zero() -> Decimal:
    return Decimal("0.00")


def _product_image_url(tenant_code: str, product_id: int, has_image: bool) -> Optional[str]:
    if not has_image:
        return None
    return f"/api/public/{tenant_code}/products/{product_id}/image"


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

    async def _ensure_unique_table_code(self, table_code: str, exclude_id: Optional[int] = None) -> None:
        query = select(DiningTable).where(DiningTable.table_code == table_code)
        result = await self.db.execute(query)
        row = result.scalar_one_or_none()
        if row and row.id != exclude_id:
            raise HTTPException(status_code=400, detail="Table code already exists")

    async def get_all(self, page: int = 1, page_size: int = 10, search: Optional[str] = None):
        query = select(DiningTable)
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
            data=[DiningTableResponse.model_validate(row) for row in rows],
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
        return DiningTableResponse.model_validate(await self.create(payload))

    async def update_for(self, user_id: int, table_id: int, payload: DiningTableUpdate):
        await ensure_permission_global(self.db, user_id, "dining_table", "update")
        row = await self.update(table_id, payload)
        if not row:
            raise HTTPException(status_code=404, detail="Table not found")
        return DiningTableResponse.model_validate(row)

    async def delete_for(self, user_id: int, table_id: int):
        await ensure_permission_global(self.db, user_id, "dining_table", "delete")
        deleted = await self.delete(table_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Table not found")
        return {"message": f"Table {table_id} deleted"}


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

    async def _get_open_order_by_table(self, table_id: int) -> Optional[Order]:
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
        return result.scalars().first()

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
        row = await self._load_order(order_id)
        self.publish_event("payment_updated", row)
        return row

    async def get_current_order_by_token(self, qr_token: str) -> PublicCurrentOrderResponse:
        table_service = DiningTableService(self.db)
        table = await table_service.get_by_token(qr_token)
        if not table or not table.is_active:
            raise HTTPException(status_code=404, detail="Table not found")
        order = await self._get_open_order_by_table(table.id)
        if not order:
            return PublicCurrentOrderResponse(order=None)
        return PublicCurrentOrderResponse(order=self._to_response(order))

    async def get_public_table(self, qr_token: str) -> PublicTableResponse:
        table_service = DiningTableService(self.db)
        table = await table_service.get_by_token(qr_token)
        if not table or not table.is_active:
            raise HTTPException(status_code=404, detail="Table not found")
        return PublicTableResponse.model_validate(table)

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

        table_service = DiningTableService(self.db)
        table = await table_service.get_by_token(payload.qr_token)
        if not table or not table.is_active:
            raise HTTPException(status_code=404, detail="Table not found")

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

        order = await self._get_open_order_by_table(table.id)
        is_append = order is not None
        event_name = "order_appended" if is_append else "order_created"
        if not order:
            order = Order(
                table_id=table.id,
                status="pending",
                is_paid=False,
                total_amount=_decimal_zero(),
                note=payload.note,
            )
            self.db.add(order)
            await self.db.flush()

        current_batch = 1
        if is_append and order.items:
            current_batch = max(item.batch_no for item in order.items) + 1

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
                batch_no=current_batch,
            )
            self.db.add(order_item)

        order.total_amount = Decimal(order.total_amount) + added_total
        if payload.note:
            order.note = payload.note

        order_id = order.id
        await self.db.commit()
        order = await self._load_order(order_id)
        self.publish_event(event_name, order)
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
