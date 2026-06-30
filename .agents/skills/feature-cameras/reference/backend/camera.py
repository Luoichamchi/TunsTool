from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, BigInteger, ForeignKey
from database.models.base import BaseModel
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .station import Station


class Camera(BaseModel):
    __tablename__ = "cameras"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rtsp_link: Mapped[str] = mapped_column(String(500), nullable=False)
    station_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stations.id"), nullable=False, index=True)

    # Relationships
    station: Mapped["Station"] = relationship("Station", back_populates="cameras")
