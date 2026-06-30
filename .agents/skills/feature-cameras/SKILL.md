---
name: feature-cameras
description: Thêm module quản lý camera RTSP/HLS gắn với trạm
---

# Feature: Cameras

Skill tái dựng CRUD camera và viewer HLS trên trang chi tiết trạm.

> **Reference code gốc**: `.agents/skills/feature-cameras/reference/`

---

## Phụ thuộc

- `feature-stations` (camera.station_id FK)

---

## Backend

| Layer | Reference | Destination |
|-------|-----------|-------------|
| Model | `camera.py` | `backend/database/models/camera.py` |
| Schema/Service/API | tương ứng | `backend/schemas/`, `services/`, `api/` |

### Model

`name`, `rtsp_url`, `hls_url`, `station_id`, `description`, `status`

### API

Prefix `/api/cameras` — CRUD với filter `station_id`. Permission module `camera`.

---

## Frontend

| Source | Destination |
|--------|-------------|
| `reference/frontend/camera-management/` | `systems/camera-management/` |
| `reference/frontend/overview-view/camera.jsx` | `apps/overview/view/camera.jsx` |

### API constants

```javascript
GET_CAMERA_LIST, POST_CAMERA, PUT_CAMERA, DELETE_CAMERA
```

---

## Checklist

- [ ] Copy backend
- [ ] RBAC camera module
- [ ] Migration
- [ ] Copy camera-management page + camera viewer component
- [ ] Menu (optional — không có trong sidebar gốc)
