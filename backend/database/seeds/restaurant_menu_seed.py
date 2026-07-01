from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.restaurant_ordering import Product, ProductCategory

MENU_CATEGORIES = [
    {"name": "Đồ ăn", "sort_order": 1},
    {"name": "Nước uống", "sort_order": 2},
    {"name": "Chè", "sort_order": 3},
]

MENU_PRODUCTS = [
    # Đồ ăn
    {"category": "Đồ ăn", "name": "Bánh ép thịt", "price": 10000},
    {"category": "Đồ ăn", "name": "Bánh ép tôm thịt", "price": 15000},
    {"category": "Đồ ăn", "name": "Bánh ép pate thịt", "price": 15000},
    {"category": "Đồ ăn", "name": "Bánh ép trứng thịt", "price": 15000},
    {"category": "Đồ ăn", "name": "Bánh ép bò", "price": 15000},
    {"category": "Đồ ăn", "name": "Bánh ép thập cẩm", "price": 20000},
    {"category": "Đồ ăn", "name": "Bánh bèo Nghệ An (Bánh Lọc Trần)", "price": 25000},
    {
        "category": "Đồ ăn",
        "name": "Bánh bột lọc Huế",
        "description": "10 cái",
        "price": 35000,
    },
    {
        "category": "Đồ ăn",
        "name": "Bánh bèo lá Nghệ An",
        "description": "10 cái",
        "price": 30000,
    },
    {
        "category": "Đồ ăn",
        "name": "Ốc nhồi ly",
        "description": "6 ly",
        "price": 50000,
    },
    {
        "category": "Đồ ăn",
        "name": "Chân gà sốt Thái",
        "description": "1 phần",
        "price": 50000,
    },
    {"category": "Đồ ăn", "name": "Tré", "description": "1 cây", "price": 7000},
    # Nước uống
    {"category": "Nước uống", "name": "Trà tắc", "price": 15000},
    {"category": "Nước uống", "name": "Trà đá", "price": 3000},
    {"category": "Nước uống", "name": "Pepsi", "price": 15000},
    {"category": "Nước uống", "name": "Nước lọc", "price": 15000},
    # Chè
    {"category": "Chè", "name": "Chè thập cẩm", "price": 20000},
]


async def seed_restaurant_menu(db: AsyncSession) -> None:
    """Seed loại mặt hàng và menu mặc định (idempotent theo tên)."""
    category_map: dict[str, ProductCategory] = {}

    for idx, cat_data in enumerate(MENU_CATEGORIES):
        result = await db.execute(
            select(ProductCategory).where(ProductCategory.name == cat_data["name"])
        )
        category = result.scalar_one_or_none()
        if not category:
            category = ProductCategory(
                name=cat_data["name"],
                sort_order=cat_data["sort_order"],
                is_active=True,
            )
            db.add(category)
            await db.flush()
            print(f"Created product category: {cat_data['name']}")
        category_map[cat_data["name"]] = category

    await db.commit()

    created = 0
    for sort_idx, item in enumerate(MENU_PRODUCTS):
        category = category_map[item["category"]]
        result = await db.execute(
            select(Product).where(
                Product.name == item["name"],
                Product.category_id == category.id,
            )
        )
        if result.scalar_one_or_none():
            continue

        product = Product(
            category_id=category.id,
            name=item["name"],
            description=item.get("description"),
            price=Decimal(str(item["price"])),
            is_available=True,
            sort_order=sort_idx,
        )
        db.add(product)
        created += 1

    if created:
        await db.commit()
        print(f"Created {created} menu products")
    else:
        print("Menu products already seeded")
