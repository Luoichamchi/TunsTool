from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from database.models import BaseModel
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .station_config import StationConfig
    from .stations_data import StationsData
    from .station import Station

class Parameter(BaseModel):
    __tablename__ = "parameters"
    parameter_code: Mapped[str] = mapped_column(
        String(10), nullable=False, index=True
    )
    parameter_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String(10), nullable=True, index=True)
    station_id: Mapped[Optional[int]] = mapped_column(ForeignKey("stations.id"), nullable=True, index=True)
    
    # Relationships
    station: Mapped[Optional["Station"]] = relationship("Station", back_populates="parameters")
    station_configs: Mapped[List["StationConfig"]] = relationship("StationConfig", back_populates="parameter")
    stations_data: Mapped[List["StationsData"]] = relationship("StationsData", back_populates="parameter")
