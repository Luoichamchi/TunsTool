---
name: feature-measurements-reports
description: Thêm module dữ liệu đo (StationData), báo cáo lịch sử và vượt ngưỡng vào base
---

# Feature: Measurements + Reports + Exceedance

Skill tái dựng time-series data, báo cáo và phân tích vượt ngưỡng.

> **Reference code gốc**: `.agents/skills/feature-measurements-reports/reference/`

---

## Phụ thuộc

- `feature-stations` (Station model)
- `feature-parameters` (Parameter model)
- `feature-stations` StationConfig (ngưỡng min/max)

---

## Backend

| Layer | Reference | Destination |
|-------|-----------|-------------|
| Model | `stations_data.py` | `backend/database/models/stations_data.py` |
| Schema | `station_data.py` (schemas) | `backend/schemas/station_data.py` |
| Service | `station_data.py` (services) | `backend/services/station_data.py` |
| API | `station_data.py` (api) | `backend/api/station_data.py` |

### uid: `station_datas` table — `station_id`, `parameter_id`, `value`, `milisecond_time`, `record_data_id`

### API Endpoints chính

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| GET | `/api/station-data/` | `station_data.view` | List + filter |
| POST | `/api/station-data/` | `station_data.create` | Tạo 1 record |
| POST | `/api/station-data/bulk-insert` | `station_data.create` | Bulk insert |
| GET | `/api/station-data/data-by-station-id/{id}` | `station_data.view` | Data theo trạm |
| GET | `/api/station-data/data-by-station-id-max-date/{id}` | `station_data.view` | Latest per param |
| POST | `/api/station-data/report-station-data` | `report.view` | Báo cáo |
| POST | `/api/station-data/report-station-data-avg` | `report.view` | Báo cáo TB |
| POST | `/api/station-data/exceedance-summary` | `report.view` | Tổng hợp vượt ngưỡng |
| POST | `/api/station-data/exceedance-detail` | `report.view` | Chi tiết vượt ngưỡng |

### RBAC modules

`station_data`, `report` — xem `reference` và `global_permission_seed.py` gốc.

---

## Frontend

| Source | Destination |
|--------|-------------|
| `reference/frontend/report/` | `apps/report/` |
| `reference/frontend/excessive-data/` | `apps/excessive-data/` |

Dependencies: `echarts`, `exceljs`, `file-saver`, `antd` (date range)

### API constants — xem `api.js` gốc:

```javascript
GET_STATION_DATA_BY_STATION_ID, GET_STATION_DATA_REPORT,
GET_STATION_DATA_REPORT_AVG, POST_EXCEEDANCE_SUMMARY, POST_EXCEEDANCE_DETAIL, ...
```

---

## Checklist

- [ ] Copy backend 4 layers
- [ ] RBAC seeds (station_data + report)
- [ ] Router + exports
- [ ] Migration
- [ ] Copy frontend report + excessive-data
- [ ] api.js + menu items
