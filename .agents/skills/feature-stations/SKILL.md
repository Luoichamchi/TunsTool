---
name: feature-stations
description: Thêm module quản lý trạm (Station) + cấu hình ngưỡng (StationConfig) vào base full-stack
---

# Feature: Stations + Station Config

Skill tái dựng module quản lý trạm quan trắc và cấu hình tham số theo trạm.

> **Reference code gốc**: `.agents/skills/feature-stations/reference/`

---

## Phụ thuộc

- Base đã có: auth, RBAC, multi-tenant, `demo` module pattern
- Feature `feature-parameters` (Parameter entity) nên có trước hoặc cùng lúc

---

## Backend — Files cần copy

| Layer | Source (reference) | Destination |
|-------|-------------------|-------------|
| Model | `reference/backend/station.py`, `station_config.py` | `backend/database/models/` |
| Schema | `reference/backend/station.py`, `station_config.py` (schemas) | `backend/schemas/` |
| Service | `reference/backend/station.py`, `station_config.py` (services) | `backend/services/` |
| API | `reference/backend/station.py`, `station_config.py` (api) | `backend/api/` |

### Model `Station`

```python
# stations table
station_code, name, address, coordinates, status, mqtt_status, description
# Relationships: station_configs, stations_data, users, parameters, cameras
```

### Model `StationConfig`

Ngưỡng min/max/color cho từng cặp station + parameter.

### API Endpoints

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| GET | `/api/stations/` | `station.view` | Danh sách có phân trang + search |
| POST | `/api/stations/` | `station.create` | Tạo trạm |
| GET | `/api/stations/{id}` | `station.view` | Chi tiết |
| GET | `/api/stations/configs/{id}` | `station.view` | Trạm + configs |
| PUT | `/api/stations/{id}` | `station.update` | Cập nhật |
| DELETE | `/api/stations/{id}` | `station.delete` | Xóa |
| POST | `/api/stations/update-mqtt-status` | `station.update` | Bật/tắt MQTT |

Station Config router: prefix `/api/station-configs` — xem `reference/backend/station_config.py` (api).

### RBAC seeds

Thêm vào `global_permission_seed.py`:

```python
("station", "Station management"),
("station_config", "Station config management"),
# permissions: station.view/create/update/delete, station_config.view/create/update/delete
```

### Đăng ký router

Trong `main.py`:

```python
from api import station, station_config
api_router.include_router(station.router)
api_router.include_router(station_config.router)
```

Export trong `services/__init__.py`, `schemas/__init__.py`.

---

## Frontend — Files cần copy

| Source | Destination |
|--------|-------------|
| `reference/frontend/station-manegement/` | `frontend/src/app/(DashboardLayout)/apps/station-manegement/` |

### API constants (thêm vào `api.js`)

```javascript
GET_STATION_LIST: "/api/stations",
POST_STATION: "/api/stations",
PUT_STATION: "/api/stations",
DELETE_STATION: "/api/stations/",
GET_STATION_CONFIG_BY_STATION_ID: "/api/stations/configs",
ADD_STATION_CONFIG: "/api/station-configs/create",
POST_UPDATE_MQTT_STATUS: "/api/stations/update-mqtt-status",
GET_CONFIG_PARAMETER_BY_STATION_ID: "/api/station-configs/get-config-parameter-by-station-id",
```

### Menu item

Thêm vào `MenuItems.js` với `permission: "station.view"`.

---

## Migration

Sau khi thêm models, chạy:

```bash
alembic revision --autogenerate -m "add stations and station_configs"
alembic upgrade head
```

---

## Checklist

- [ ] Copy models, schemas, services, api từ reference
- [ ] Thêm RBAC modules + permissions vào seed
- [ ] Đăng ký routers trong main.py
- [ ] Migration
- [ ] Copy frontend pages
- [ ] Thêm api.js constants + menu item
- [ ] Test CRUD station + config ngưỡng
