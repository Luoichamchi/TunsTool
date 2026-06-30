from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from database.models import BaseModel
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .station_config import StationConfig
    from .stations_data import StationsData
    from .user import User
    from .parameter import Parameter
    from .camera import Camera


class Station(BaseModel):
    __tablename__ = "stations"
    station_code: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    address: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    coordinates: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", index=True
    )
    mqtt_status: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Relationships
    station_configs: Mapped[List["StationConfig"]] = relationship("StationConfig", back_populates="station")
    stations_data: Mapped[List["StationsData"]] = relationship("StationsData", back_populates="station")
    users: Mapped[List["User"]] = relationship("User", back_populates="station")
    parameters: Mapped[List["Parameter"]] = relationship("Parameter", back_populates="station")
    cameras: Mapped[List["Camera"]] = relationship("Camera", back_populates="station")