from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from schemas import SystemConfigCreate, system_config_form
from dependencies import get_db
from services import SystemConfigService
from fastapi import UploadFile, File, Form
from typing import Optional

router = APIRouter(prefix="/system-configs", tags=["System Configs"])


@router.get("/", response_model=SystemConfigCreate)
async def get_system_config(db: AsyncSession = Depends(get_db)):
    system_config_service = SystemConfigService(db)
    try:
        return await system_config_service.get_system_config()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/post-config")
async def post_system_config(
    app_name: Optional[str] = Form(None),
    mqtt_server: Optional[str] = Form(None),
    image_logo: UploadFile = File(None),
    navbar_logo: UploadFile = File(None),
    image_login: UploadFile = File(None),
    header_logo: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
):
    system_config_service = SystemConfigService(db)
    try:
        result = await system_config_service.create_system_config_with_upload_file(
            app_name,
            mqtt_server,
            image_logo,
            navbar_logo,
            image_login,
            header_logo,
        )
        if result:
            return {"detail": "Cập nhật cấu hình hệ thống thành công"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
