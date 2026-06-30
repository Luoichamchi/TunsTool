from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, ForeignKey, BigInteger, Index
from database.models import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .parameter import Parameter
    from .station import Station


class StationConfig(BaseModel):
    __tablename__ = "station_configs"
    parameter_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("parameters.id"), nullable=True
    )
    station_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("stations.id"), nullable=True
    )
    min_value: Mapped[Optional[float]] = mapped_column(Float, nullable=False)
    max_value: Mapped[Optional[float]] = mapped_column(Float, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=False)
    
    # Relationships
    parameter: Mapped[Optional["Parameter"]] = relationship("Parameter", back_populates="station_configs")
    station: Mapped[Optional["Station"]] = relationship("Station", back_populates="station_configs")

    __table_args__ = (
        Index(
            "idx_station_parameter",
            "station_id",
            "parameter_id"
        ),
    )