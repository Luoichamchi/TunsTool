---
name: feature-parameters
description: Thêm module quản lý tham số đo (Parameter/Sensor) vào base full-stack
---

# Feature: Parameters (Sensors)

Skill tái dựng module định nghĩa tham số quan trắc (pH, DO, TSS, COD...).

> **Reference code gốc**: `.agents/skills/feature-parameters/reference/`

---

## Phụ thuộc

- Base auth + RBAC
- Optional: `feature-stations` nếu parameter gắn với station

---

## Backend

| Layer | Reference file | Destination |
|-------|---------------|-------------|
| Model | `reference/backend/parameter.py` | `backend/database/models/parameter.py` |
| Schema | `reference/backend/parameter.py` (schemas) | `backend/schemas/parameter.py` |
| Service | `reference/backend/parameter.py` (services) | `backend/services/parameter.py` |
| API | `reference/backend/parameter.py` (api) | `backend/api/parameter.py` |

### Model fields

`parameter_code`, `name`, `unit`, `description`, `station_id` (FK optional)

### API Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/parameters/` | `parameter.view` |
| POST | `/api/parameters/` | `parameter.create` |
| GET | `/api/parameters/{id}` | `parameter.view` |
| PUT | `/api/parameters/{id}` | `parameter.update` |
| DELETE | `/api/parameters/{id}` | `parameter.delete` |

### RBAC

Module `parameter` với permissions `parameter.view/create/update/delete`.

---

## Frontend

| Source | Destination |
|--------|-------------|
| `reference/frontend/sensor/` | `frontend/src/app/(DashboardLayout)/apps/sensor/` |

### API constants

```javascript
GET_SENSOR_LIST: "/api/parameters",
POST_SENSOR: "/api/parameters",
PUT_SENSOR: "/api/parameters",
DELETE_SENSOR: "/api/parameters/",
```

Route: `/apps/sensor` — permission `parameter.view`

---

## Checklist

- [ ] Copy backend layers từ reference
- [ ] RBAC seed + router registration
- [ ] Migration
- [ ] Copy frontend sensor pages
- [ ] Menu + api.js
