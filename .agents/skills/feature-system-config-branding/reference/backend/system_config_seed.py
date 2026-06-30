from sqlalchemy.ext.asyncio import AsyncSession
from services import SystemConfigService
from schemas import SystemConfigCreate


async def seed_default_system_config(db: AsyncSession):
    system_config_service = SystemConfigService(db)
    system_config_data = SystemConfigCreate(
        image_logo="logo-vimon.png",
        navbar_logo="vimon-logo.png",
        image_login="login-bg.png",
        header_logo="vietcis-logo.png",
        app_name="VIMON",
        mqtt_server="localhost",
    )
    try:
        print("📝 Seeding system config...")
        await system_config_service.create_system_config(system_config_data)
        print("✅ System config created successfully")
    except Exception as e:
        print(f"❌ Error creating system config: {str(e)}")
        raise
