---
name: feature-system-config-branding
description: Thêm cấu hình hệ thống (branding, logo, MQTT server URL) với upload file
---

# Feature: System Config & Branding

Skill tái dựng cấu hình app name, logos, login background, MQTT server URL.

> **Reference code gốc**: `.agents/skills/feature-system-config-branding/reference/`

---

## Backend

| Layer | Reference | Destination |
|-------|-----------|-------------|
| Model | `system_config.py` | `backend/database/models/system_config.py` |
| Schema/Service/API | tương ứng | `backend/schemas/`, `services/`, `api/` |
| Seed | `system_config_seed.py` + `data_seed_system_config/` | `backend/database/seeds/` |

### Model `SystemConfig`

`app_name`, `mqtt_server`, `image_logo`, `navbar_logo`, `image_login`, `header_logo` (binary hoặc path)

### API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/system-configs/` | Public (no auth) |
| POST | `/api/system-configs/post-config` | Multipart form upload |

### Seed

Gọi `system_config_seed` trong `auto_seed_data.py` để seed logo mặc định.

---

## Frontend

| Source | Destination |
|--------|-------------|
| `reference/frontend/route.js` | `frontend/src/app/assets/[...path]/route.js` |

Proxy `/assets/*` → backend static files (logos).

Login page và layout đọc config từ `GET /api/system-configs/` để hiển thị branding.

---

## Checklist

- [ ] Copy model, schema, service, api
- [ ] Copy seed + asset SVG
- [ ] Wire seed trong auto_seed_data
- [ ] Migration
- [ ] Copy assets proxy route
- [ ] Test upload logo + GET config
