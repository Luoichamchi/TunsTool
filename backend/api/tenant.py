from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from dependencies import get_catalog_db, get_current_user
from dependencies.tenant import require_default_tenant
from database.models.tenant import Tenant
from database.models.user import User
from schemas.tenant import TenantCreate, TenantUpdate, TenantResponse, PaginatedTenantResponse
from services.tenant import TenantService

router = APIRouter(prefix="/tenant", tags=["Tenant Management"])


@router.get("/check/{tenant_code}")
async def check_tenant_code(
    tenant_code: str,
    db: AsyncSession = Depends(get_catalog_db),
):
    """Kiểm tra tenant_code có tồn tại không (public)"""
    result = await db.execute(
        select(Tenant).where(
            Tenant.tenant_code == tenant_code,
            Tenant.is_active == True,
        )
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Mã tổ chức không tồn tại")
    return {
        "exists": True,
        "name": tenant.name,
        "tenant_code": tenant.tenant_code,
        "subdomain": tenant.subdomain,
        "url_slug": tenant.subdomain or tenant.tenant_code,
    }


@router.get("/resolve/{slug}")
async def resolve_tenant_slug(
    slug: str,
    db: AsyncSession = Depends(get_catalog_db),
):
    """Tra slug trên hostname URL → tenant (ưu tiên subdomain, fallback tenant_code)."""
    key = slug.strip().lower()

    result = await db.execute(
        select(Tenant).where(
            Tenant.subdomain == key,
            Tenant.is_active == True,
        )
    )
    tenant = result.scalar_one_or_none()

    if not tenant:
        result = await db.execute(
            select(Tenant).where(
                Tenant.tenant_code == key,
                Tenant.is_active == True,
            )
        )
        tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tổ chức không tồn tại")

    return {
        "name": tenant.name,
        "tenant_code": tenant.tenant_code,
        "subdomain": tenant.subdomain,
        "url_slug": tenant.subdomain or tenant.tenant_code,
    }


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: AsyncSession = Depends(get_catalog_db),
    current_user: User = Depends(get_current_user),
    _: str = Depends(require_default_tenant),
):
    """Tạo tenant mới — chỉ tenant default."""
    service = TenantService(db)
    try:
        return await service.create_tenant_with_database(tenant_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Không thể tạo database cho tenant: {e}",
        )


@router.get("/", response_model=PaginatedTenantResponse)
async def list_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_catalog_db),
    current_user: User = Depends(get_current_user),
    _: str = Depends(require_default_tenant),
):
    """Danh sách tenants — chỉ tenant default."""
    skip = (page - 1) * page_size
    query = select(Tenant)

    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (Tenant.name.ilike(search_lower))
            | (Tenant.tenant_code.ilike(search_lower))
            | (Tenant.subdomain.ilike(search_lower))
        )

    count_result = await db.execute(query)
    total = len(count_result.scalars().all())

    result = await db.execute(query.offset(skip).limit(page_size))
    tenants = result.scalars().all()

    return PaginatedTenantResponse(
        data=tenants,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_catalog_db),
    current_user: User = Depends(get_current_user),
    _: str = Depends(require_default_tenant),
):
    """Lấy tenant theo ID — chỉ tenant default."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: AsyncSession = Depends(get_catalog_db),
    current_user: User = Depends(get_current_user),
    _: str = Depends(require_default_tenant),
):
    """Cập nhật tenant — chỉ tenant default."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = tenant_data.model_dump(exclude_unset=True)
    update_data.pop("db_host", None)
    update_data.pop("db_name", None)

    if update_data.get("subdomain"):
        existing = await db.execute(
            select(Tenant).where(
                Tenant.subdomain == update_data["subdomain"],
                Tenant.id != tenant_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Subdomain already exists")

    await db.execute(
        update(Tenant).where(Tenant.id == tenant_id).values(**update_data)
    )
    await db.commit()

    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    return result.scalar_one()


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_catalog_db),
    current_user: User = Depends(get_current_user),
    _: str = Depends(require_default_tenant),
):
    """Xóa tenant — chỉ tenant default."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    await db.delete(tenant)
    await db.commit()
    return None
