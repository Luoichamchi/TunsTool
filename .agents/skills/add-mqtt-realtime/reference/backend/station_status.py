from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database.models import Station
import time
class StationStatusService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def update_station_status(self):
        result = await self.db.execute(
            text(
                """
                SELECT s.id
                FROM stations s
                """
            )
        )
        stations = result.mappings().all()
        station_ids = [station["id"] for station in stations]
        get_max_time_station_data = await self.db.execute(
            text(
                """
                SELECT sd.station_id, MAX(sd.milisecond_time) as max_time
                FROM station_datas sd
                WHERE sd.station_id = ANY(:station_ids)
                GROUP BY sd.station_id
                """
            ),
            {"station_ids": station_ids}
        )
        max_time_station_data = get_max_time_station_data.mappings().all()
        max_time_station_data_map = {station["station_id"]: station["max_time"] for station in max_time_station_data}
        for station_id in station_ids:
            max_time = max_time_station_data_map.get(station_id)
            if max_time is None:
                station = await self.db.execute(
                    select(Station).where(Station.id == station_id)
                )
                station = station.scalar_one_or_none()
                if station.status != "unactive":
                    station.status = "unactive"
            else:
                current_millis = int(time.time() * 1000)
                if(((current_millis - max_time)/(1000*60)) > 10):
                    station = await self.db.execute(
                        select(Station).where(Station.id == station_id)
                    )
                    station = station.scalar_one_or_none()
                    if station.status != "unactive":
                        station.status = "unactive"
                        
                else:
                    station = await self.db.execute(
                        select(Station).where(Station.id == station_id)
                    )
                    station = station.scalar_one_or_none()
                    if station.status != "active":
                        station.status = "active"
        await self.db.commit()
                        