from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class StationDataBase(BaseModel):
    station_id: int
    parameter_id: int
    date_time: datetime
    value: float
    record_data_id: int


class StationDataCreate(StationDataBase):
    pass


class StationDataUpdate(BaseModel):
    station_id: Optional[int] = None
    parameter_id: Optional[int] = None
    date_time: Optional[datetime] = None
    value: Optional[float] = None
    record_data_id: Optional[int] = None


class StationBasicResponse(BaseModel):
    """Basic station info for station data response"""
    id: int
    name: str
    station_code: str
    
    class Config:
        from_attributes = True


class ParameterBasicResponse(BaseModel):
    """Basic parameter info for station data response"""
    id: int
    parameter_code: str
    parameter_name: str
    unit: Optional[str] = None
    
    class Config:
        from_attributes = True

class DataResponseWithStationID(BaseModel):
    chiTieu: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    value: Optional[float] = None
    color: Optional[str] = None
    parameter_code: Optional[str] = None
    unit: Optional[str] = None

    class Config:
        from_attributes = True

class FinalDataResponseWithStationID(BaseModel):
    station_name: Optional[str] = None
    time: Optional[int] = None
    station_code: Optional[str] = None
    id:Optional[int] = None
    coordinates:Optional[str] = None
    mqtt_status: Optional[bool] = None
    status: Optional[str] = None
    data: List[DataResponseWithStationID] = []

    class Config:
        from_attributes = True

class DataResponseWithStationIDMaxDate(BaseModel):
    chiTieu: str
    data_points: Optional[list[dict]] = None
    color: Optional[str] = None
    unit: Optional[str] = None
    class Config:
        from_attributes = True

class DataReportStationReponse(BaseModel):
    time: int
    parameters: dict
    class Config:
        from_attributes = True
class FinalDataReportStationReponse(BaseModel):
    station_id: int
    station_name: Optional[str] = None
    data: List[DataReportStationReponse] = []
    total: int
    page: int
    page_size: int
    class Config:
        from_attributes = True


class DataReportStationReponseAvg(BaseModel):
    time: date
    parameters: dict
    class Config:
        from_attributes = True
class FinalDataReportStationReponseAvg(BaseModel):
    station_id: int
    station_name: Optional[str] = None
    data: List[DataReportStationReponseAvg] = []
    total: int
    page: int
    page_size: int
    class Config:
        from_attributes = True

class DataReportRequest(BaseModel):
    station_id: int
    start_date: int
    end_date: int
    list_parameter_id: List[int]

class DataReportRequestChart(BaseModel):
    station_id: int
    start_date: int
    end_date: int

class StationDataResponse(StationDataBase):
    id: int
    tenant_id: Optional[int] = None
    created_at: str
    updated_at: Optional[str] = None
    station: Optional[StationBasicResponse] = None
    parameter: Optional[ParameterBasicResponse] = None

    class Config:
        from_attributes = True


class StationDataInsertRequest(BaseModel):
    station_code: str
    time: int  # timestamp in milliseconds
    record_data_id: int
    # Dynamic fields for parameters (sensor_code: value)
    # This will be handled as a dict in the service


class StationDataInsertResponse(BaseModel):
    listIdLog: List[int]  # List of inserted record_data_ids


class PaginatedStationDataResponse(BaseModel):
    data: List[StationDataResponse]
    total: int
    page: int
    page_size: int


class StationDataQueryParams(BaseModel):
    station_id: Optional[int] = None
    parameter_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    record_data_id: Optional[int] = None

class StationDataInsertRequest(BaseModel):
    id: int
    param_code: str
    value: float
    time: int
    station_code: str

    class Config:
        from_attributes = True


# === Threshold Exceedance (Dữ liệu vượt ngưỡng) ===

class ThresholdExceedanceRequest(BaseModel):
    """Request filter cho dữ liệu vượt ngưỡng"""
    station_id: Optional[int] = None
    parameter_id: Optional[int] = None
    start_date: int  # millisecond timestamp
    end_date: int  # millisecond timestamp
    period: str = "day"  # day | week | month


class ExceedanceCountByParameter(BaseModel):
    """Tổng hợp số lần vượt ngưỡng theo parameter (cho chart)"""
    parameter_name: str
    parameter_code: str
    exceedance_count: int = 0
    average_count: float = 0
    color: Optional[str] = None


class ExceedanceSummaryResponse(BaseModel):
    """Response cho chart tổng hợp"""
    data: List[ExceedanceCountByParameter] = []


class ExceedanceDetailItem(BaseModel):
    """Chi tiết một bản ghi vượt ngưỡng"""
    date_time: int  # millisecond timestamp
    parameter_name: str
    parameter_code: str
    value: float
    threshold: str  # dạng "6.5 - 8.5"
    severity: str  # NGHIÊM_TRỌNG | CẢNH_BÁO | THEO_DÕI
    station_name: Optional[str] = None
    unit: Optional[str] = None


class PaginatedExceedanceDetailResponse(BaseModel):
    """Response phân trang cho bảng chi tiết"""
    data: List[ExceedanceDetailItem] = []
    total: int = 0
    page: int = 1
    page_size: int = 10