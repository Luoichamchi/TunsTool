from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Float,ForeignKey, DateTime, BigInteger, String, Index
from database.models import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .station import Station
    from .parameter import Parameter


class StationsData(BaseModel):
    __tablename__ = "station_datas"
    station_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stations.id"), nullable=False
    )
    parameter_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("parameters.id"), nullable=False
    )
    date_time: Mapped[DateTime] = mapped_column(
        DateTime(timezone=False), nullable=False,index=True
    )
    milisecond_time: Mapped[int] = mapped_column(BigInteger, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    record_data_id: Mapped[int] = mapped_column(
        BigInteger, nullable=False, index=True, server_default="0", unique=False
    )
    station_code: Mapped[str] = mapped_column(String, nullable=False)
    parameter_code: Mapped[str] = mapped_column(String, nullable=False)
    
    # Relationships
    station: Mapped["Station"] = relationship("Station", back_populates="stations_data")
    parameter: Mapped["Parameter"] = relationship("Parameter", back_populates="stations_data")

    __table_args__ = (
        Index(
            "idx_station_parameter_milisecond",
            "station_id",
            "milisecond_time",
            "parameter_id"
        ),
    )