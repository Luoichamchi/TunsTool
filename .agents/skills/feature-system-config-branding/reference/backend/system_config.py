from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import LargeBinary, String
from database.models import BaseModel
from typing import Optional


class SystemConfig(BaseModel):
    __tablename__ = "system_configs"
    image_logo: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    navbar_logo: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    image_login: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    header_logo: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    app_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mqtt_server: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)