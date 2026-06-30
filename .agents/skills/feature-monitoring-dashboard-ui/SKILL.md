---
name: feature-monitoring-dashboard-ui
description: Thêm các trang dashboard giám sát realtime (overview, map, station-data) với MQTT
---

# Feature: Monitoring Dashboard UI

Skill tái dựng các trang frontend giám sát: overview cards, bản đồ Leaflet, bảng dữ liệu realtime.

> **Reference code gốc**: `.agents/skills/feature-monitoring-dashboard-ui/reference/`

---

## Phụ thuộc

- `feature-stations`, `feature-parameters`, `feature-measurements-reports`
- `add-mqtt-realtime` skill (MQTT connect/subscribe)
- `feature-system-config-branding` (MQTT server URL)
- `feature-cameras` (camera viewer trong overview/view)

---

## Frontend files

| Source | Destination | Mô tả |
|--------|-------------|-------|
| `reference/frontend/overview/` | `apps/overview/` | Grid card trạm + detail view |
| `reference/frontend/map/` | `apps/map/` | Leaflet map + MQTT status |
| `reference/frontend/station-data/` | `apps/station-data/` | Multi-station MQTT table |
| `reference/frontend/mapsIcon/` | `public/images/mapsIcon/` | Map marker icons |

### Dependencies

`mqtt`, `leaflet`, `react-leaflet`, `echarts`, `echarts-for-react`

### Routes

- `/apps/overview` — permission `station.view`
- `/apps/overview/view?idTram=` — chi tiết 1 trạm
- `/apps/map` — permission `station.view`
- `/apps/station-data` — permission `station_data.view`

### Menu items

Thêm vào `MenuItems.js` và `MobileBottomNav.jsx`.

---

## Checklist

- [ ] Đảm bảo backend + MQTT skill đã có
- [ ] Copy 3 app folders + map icons
- [ ] api.js constants đầy đủ
- [ ] Menu + mobile nav
- [ ] Test MQTT realtime trên overview, map, station-data
