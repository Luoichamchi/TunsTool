from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime
from typing import List

from config.tenant_database import get_catalog_db_host_port


# Pydantic models
class TenantCreate(BaseModel):
    name: str
    tenant_code: str
    subdomain: Optional[str] = None
    expiration_date: Optional[datetime] = None
    is_active: Optional[bool] = True
    db_name: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tenant_code: Optional[str] = None
    subdomain: Optional[str] = None
    is_active: Optional[bool] = None
    expiration_date: Optional[datetime] = None
    db_name: Optional[str] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    tenant_code: str
    subdomain: Optional[str]
    is_active: bool
    expiration_date: Optional[datetime]
    db_host: str
    db_name: str
    created_at: datetime
    updated_at: Optional[datetime]

    @model_validator(mode="after")
    def apply_shared_db_host(self):
        self.db_host = get_catalog_db_host_port()
        return self

    class Config:
        from_attributes = True

class PaginatedTenantResponse(BaseModel):
    data: List[TenantResponse]
    total: int
    page: int
    page_size: int