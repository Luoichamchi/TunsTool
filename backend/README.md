# FastAPI Backend Template (DEV ONLY)

## 1. Tạo môi trường ảo

```bash
python -m venv .venv
.venv\Scripts\activate
```

## 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

## 3. Tạo file .env

```env
DATABASE_URL=postgresql://admin:admin123456@localhost:5434/tunstool_db
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10000000
REFRESH_TOKEN_EXPIRE_MINUTES=10000000
```

## 4. Khởi động PostgreSQL (DEV)

```bash
docker-compose up -d db
```

## 5. Chạy migrations

Hiện chỉ còn **một migration** duy nhất: `62fcd9fa78c3_init.py`.

```bash
alembic upgrade head
```

### Đồng bộ migration catalog ↔ tenant

Khi khởi động app (`main.py` → `run_startup_migrations`):

1. **Migrate catalog DB (`tunstool_db`)** — gồm bảng `tenants` + toàn bộ schema
2. **Lấy revision catalog** sau khi migrate xong
3. **Migrate từng DB tenant** (`app_<code>`, ...) lên **cùng revision**
4. **Tenant `default`** dùng chung `tunstool_db` → chỉ migrate qua bước 1, không migrate lại

Migration dùng chung file, phân biệt qua `tenant_mode`:
- Catalog (`tenant_mode=False`): chạy đủ, kể cả bảng `tenants`
- DB tenant (`tenant_mode=True`): bỏ qua phần catalog-only (dùng `skip_on_tenant_db()`)

Khi thêm migration mới, nhớ bọc thay đổi chỉ thuộc catalog bằng `skip_on_tenant_db()`.

### Đồng bộ lại DB (dev / server) khi migration cũ bị lệch

**DB mới hoặc chấp nhận xóa dữ liệu:**

```bash
# Xóa DB cũ rồi tạo lại (PostgreSQL)
# Sau đó:
alembic upgrade head
```

**DB đã có schema đúng, chỉ cần đồng bộ alembic_version:**

```sql
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('62fcd9fa78c3');
```

Hoặc:

```bash
alembic stamp head
```

## 6. Khởi động ứng dụng (DEV)

```bash
uvicorn main:app --reload
```

## Sử dụng 

- API Docs: http://127.0.0.1:8000/docs
- Tài khoản mặc định: `root` / `root123456` / `default` (tenant mặc định)
- Đăng nhập tại `/api/auth/login` để lấy token

### Đăng nhập:

```json
POST /api/auth/login
{
    "username": "root",
    "password": "root123456",
    "tenant_code": "default"  // Bắt buộc: Code của tenant
}
```

**Lưu ý:** `tenant_code` là bắt buộc để xác định user thuộc tenant nào.

### Sử dụng token:
- Header: `Authorization: Bearer YOUR_TOKEN`
- Token sẽ chứa thông tin tenant_id để xác định context
- Không cần API Key nữa!

## Hệ thống Multi-Tenant & RBAC

### 🏢 Multi-Tenant:
- Mỗi user thuộc về một tenant
- API calls tự động filter theo tenant context
- Admin có thể quản lý tất cả tenants

### 🎯 RBAC (Role-Based Access Control):
- **Cấu trúc:** User → Role → Permission → Module
- **Quyền:** `view`, `create`, `update`, `delete`
- **Modules:** `tenant`, `user`, `role`, `permission`, `demo`, `audit_log`

### 📊 Audit Logging:
- Tự động log tất cả thay đổi CRUD
- Xem tại: `/api/audit-logs`

## Một số lệnh hữu ích

```bash
# Tạo migration mới
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1

# Dừng database
docker-compose down
```
