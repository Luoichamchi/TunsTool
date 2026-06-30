---
name: add-mqtt-realtime
description: Thêm MQTT realtime data display (frontend + backend config/status) theo đúng convention
---

# Thêm MQTT Realtime Display

Skill này hướng dẫn tích hợp MQTT vào page frontend để hiển thị dữ liệu realtime từ các trạm quan trắc.

> **Reference pages**: `apps/station-data/page.jsx`, `apps/overview/view/page.jsx`, `apps/overview/cardOverview.jsx`, `apps/map/page.jsx`

---

## Kiến trúc MQTT trong VIMON

```
MQTT Broker (wss://...)
    ├── Topic: VIPiLOG/{station_code}/data     ← Dữ liệu realtime từ trạm
    └── Topic: VIPiLOG/Station/Status          ← Trạng thái kết nối trạm (connect/disconnect)

Frontend (mqtt.js v5.14.1)
    ├── Connect → NEXT_PUBLIC_MQTT_SERVER
    ├── Subscribe các topic theo station_code
    ├── Handle message → parse JSON → update state
    └── Cleanup khi unmount (unsubscribe + end client)

Backend
    ├── system_config.mqtt_server              ← URL MQTT server (lưu DB)
    ├── station.mqtt_status                    ← True/False bật MQTT cho trạm
    └── API: POST /api/stations/update-mqtt-status
```

---

## Tham số đầu vào

- `TOPIC_PREFIX`: prefix topic MQTT (mặc định: `VIPiLOG`)
- `DATA_TOPIC_PATTERN`: pattern topic dữ liệu (mặc định: `{prefix}/{station_code}/data`)
- `STATUS_TOPIC`: topic trạng thái (mặc định: `VIPiLOG/Station/Status`)
- `DATA_FIELDS`: danh sách fields dữ liệu cần hiển thị từ message MQTT

---

## Step 1: Kiểm tra cấu hình env

File: `frontend/.env`

```env
# MQTT Server — phải dùng protocol wss:// cho browser
NEXT_PUBLIC_MQTT_SERVER=wss://mqtt.example.com:8084/mqtt
```

> ⚠️ **QUAN TRỌNG**: Browser chỉ hỗ trợ `ws://` hoặc `wss://`, KHÔNG dùng `mqtt://` cho frontend.

---

## Step 2: Utility — normalizeMqttUrl

Hàm normalize URL MQTT, đã có sẵn trong project (copy từ `station-data/page.jsx`):

```javascript
const normalizeMqttUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (!/^(mqtt|ws|wss):\/\//.test(value)) {
    value = "mqtt://" + value;
  }
  try {
    new URL(value);
    return value;
  } catch {
    return null;
  }
};
```

> 💡 **Lưu ý**: Hàm này hiện đang duplicate ở 3 file. Nếu tạo page mới, copy hàm này vào đầu file hoặc tạo file util dùng chung `utils/mqtt.js`.

---

## Step 3: Template useEffect — Connect & Subscribe MQTT

### Pattern A: Một trạm (single station)

Dùng khi page hiển thị chi tiết 1 trạm (ví dụ: `overview/view/page.jsx`).

```jsx
"use client";
import { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";

const YourPage = () => {
  const clientRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const [received, setReceived] = useState(false);
  const [data, setData] = useState(null);

  const handleMessage = (topic, message) => {
    try {
      const dataMqtt = JSON.parse(message.toString());

      if (topic !== "VIPiLOG/Station/Status") {
        // Xử lý dữ liệu realtime
        setReceived(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setData((prev) => ({
          ...prev,
          // Map dữ liệu MQTT vào state
          // dataMqtt chứa: { station_code, timestamp, param1: value1, param2: value2, ... }
        }));
      } else if (topic === "VIPiLOG/Station/Status") {
        // Xử lý trạng thái kết nối trạm
        if (dataMqtt.event === "client.disconnected" && dataMqtt.clientid === stationCode) {
          // Trạm ngắt kết nối → fallback sang polling
          setReceived(false);
        }
      }
    } catch (err) {
      toast.error("Lỗi khi parse JSON MQTT", { position: "top-right", autoClose: 3000 });
    }
  };

  useEffect(() => {
    const mqttUrl = normalizeMqttUrl(process.env.NEXT_PUBLIC_MQTT_SERVER);
    if (!mqttUrl) {
      console.warn("MQTT server không hợp lệ:", process.env.NEXT_PUBLIC_MQTT_SERVER);
      return;
    }

    const client = mqtt.connect(mqttUrl, { clean: true });
    clientRef.current = client;

    // Subscribe topic dữ liệu
    client.subscribe(`VIPiLOG/${stationCode}/data`, (err) => {
      if (err) {
        toast.error("Lỗi khi subscribe MQTT");
      } else {
        // Timeout: nếu sau 10s không nhận data → fallback polling
        timeoutRef.current = setTimeout(() => {
          if (!received) {
            if (!intervalRef.current) {
              intervalRef.current = setInterval(fetchData, 60000);
            }
          }
        }, 10000);
      }
    });

    // Subscribe topic trạng thái
    client.subscribe("VIPiLOG/Station/Status");

    client.on("message", handleMessage);

    // ⚠️ CLEANUP — BẮT BUỘC
    return () => {
      client.off("message", handleMessage);
      client.end(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stationId]); // Re-subscribe khi đổi trạm

  // ...
};
```

### Pattern B: Nhiều trạm (multi station)

Dùng khi page hiển thị tất cả trạm (ví dụ: `station-data/page.jsx`, `map/page.jsx`).

```jsx
const YourMultiStationPage = () => {
  const clientRef = useRef(null);
  const intervalRef = useRef({});   // Object — key: `interval_${station.id}`
  const timeoutRef = useRef({});    // Object — key: station.id
  const stationDataMapRef = useRef(null);
  const [stationDataMap, setStationDataMap] = useState({});
  const [statusMqtt, setStatusMqtt] = useState({});
  const [received, setReceived] = useState({});

  const handleMessage = async (topic, message) => {
    try {
      const dataMqtt = JSON.parse(message.toString());

      if (topic !== "VIPiLOG/Station/Status") {
        // Tìm trạm match theo station_code trong topic
        const matchedStation = Object.values(stationDataMapRef.current).find(
          (st) => st.station_code === topic.split("/")[1]
        );
        if (matchedStation) {
          setStationDataMap((prev) => {
            const updatedMap = { ...prev };
            // Update data cho trạm matched
            // ...
            return updatedMap;
          });
          setStatusMqtt((prev) => ({ ...prev, [matchedStation.id]: "Đang hoạt động" }));
          setReceived((prev) => ({ ...prev, [matchedStation.id]: true }));
        }
      } else {
        // Handle disconnect event
        const data = dataMqtt;
        const matchedStation = Object.values(stationDataMapRef.current).find(
          (st) => st.station_code === data.clientid
        );
        if (matchedStation && data.event === "client.disconnected") {
          // Re-fetch data từ API
          await fetchStationData(matchedStation, clientRef.current);
        }
      }
    } catch (err) {
      toast.error("Lỗi khi parse JSON MQTT");
    }
  };

  const fetchStationData = async (station, client) => {
    const data = await getFetcher(api.GET_STATION_DATA_BY_STATION_ID + `/${station.id}`);
    setStationDataMap((prev) => {
      const updated = { ...prev, [station.id]: data };
      stationDataMapRef.current = updated;
      return updated;
    });

    if (data?.station_code && data.mqtt_status) {
      // Trạm có MQTT bật → subscribe
      setStatusMqtt((prev) => ({ ...prev, [station.id]: "Đang kết nối MQTT" }));
      setReceived((prev) => ({ ...prev, [station.id]: false }));

      client.subscribe(`VIPiLOG/${data.station_code}/data`, (err) => {
        if (!err) {
          timeoutRef.current[station.id] = setTimeout(() => {
            setReceived((prevReceived) => {
              if (!prevReceived[station.id]) {
                setStatusMqtt((prev) => ({ ...prev, [station.id]: "Mất tín hiệu MQTT" }));
                if (!intervalRef.current[`interval_${station.id}`]) {
                  intervalRef.current[`interval_${station.id}`] = setInterval(
                    () => fetchStationData(station, client), 60000
                  );
                }
              }
              return prevReceived;
            });
          }, 10000);
        }
      });
    } else {
      // Trạm không có MQTT → polling
      if (!intervalRef.current[`interval_${station.id}`]) {
        intervalRef.current[`interval_${station.id}`] = setInterval(
          () => fetchStationData(station, client), 60000
        );
      }
    }
  };

  useEffect(() => {
    const mqttUrl = normalizeMqttUrl(process.env.NEXT_PUBLIC_MQTT_SERVER);
    if (!mqttUrl) return;

    const client = mqtt.connect(mqttUrl, { clean: true });
    client.subscribe("VIPiLOG/Station/Status");
    clientRef.current = client;

    // Lấy danh sách trạm → subscribe từng trạm
    getFetcher(api.GET_STATION_LIST).then((data) => {
      data.data.forEach((station) => fetchStationData(station, client));
    });

    client.on("message", handleMessage);

    // ⚠️ CLEANUP
    return () => {
      client.off("message", handleMessage);
      client.end(true);
      Object.keys(timeoutRef.current).forEach((key) => clearTimeout(timeoutRef.current[key]));
      Object.keys(intervalRef.current).forEach((key) => clearInterval(intervalRef.current[key]));
    };
  }, []);
};
```

---

## Step 4: Hiển thị trạng thái MQTT trên UI

### Trạng thái MQTT indicator

```jsx
{/* Dot indicator (góc trên phải card) */}
<span
  style={{
    position: "absolute",
    top: 12,
    right: 12,
    display: "inline-block",
    width: 20,
    height: 20,
    borderRadius: "50%",
    backgroundColor: station.mqtt_status !== true
      ? station.status === "active" ? "green" : "#f44336"
      : mqttStatus ? "green" : "#f44336",
    border: "2px solid #fff",
    zIndex: 2,
  }}
  title={station.mqtt_status !== true
    ? station.status === "active" ? "Đang hoạt động" : "Không hoạt động"
    : mqttStatus ? "Đang hoạt động" : "Không hoạt động"}
/>

{/* Text MQTT status */}
{station.mqtt_status === true && (
  <p style={{ fontSize: "12px", color: statusMqtt === "Đang hoạt động" ? "green" : "#f44336" }}>
    Trạng thái MQTT: {statusMqtt || "Chờ kết nối"}
  </p>
)}
```

### Logic trạng thái

| `mqtt_status` | Nhận data | Trạng thái hiển thị | Màu |
|---|---|---|---|
| `false` | N/A | Dùng `station.status` từ API | xanh/đỏ |
| `true` | Chưa nhận | "Đang kết nối MQTT" / "Chờ kết nối" | đỏ |
| `true` | Đang nhận | "Đang hoạt động" | xanh |
| `true` | Mất tín hiệu >10s | "Mất tín hiệu MQTT" | đỏ |

---

## Step 5: Cấu trúc dữ liệu MQTT Message

### Topic dữ liệu: `VIPiLOG/{station_code}/data`

```json
{
  "station_code": "TRAM_01",
  "timestamp": "2026-03-23T09:30:00Z",
  "pH": 7.2,
  "DO": 5.8,
  "TSS": 12.3,
  "COD": 45.0
}
```

- Key là `parameter_code` (lowercase match)
- `timestamp` dùng UTC, frontend convert sang UTC+7

### Topic trạng thái: `VIPiLOG/Station/Status`

```json
{
  "event": "client.disconnected",
  "clientid": "TRAM_01"
}
```

- `clientid` match với `station_code` trong DB
- Events: `client.connected`, `client.disconnected`

---

## Step 6: Backend — Quản lý MQTT Status

> **Reference code gốc**: `.agents/skills/add-mqtt-realtime/reference/`

### Model field `Station.mqtt_status`

```python
mqtt_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
```

Cần feature `feature-stations` trước.

### Bật/tắt MQTT cho trạm

API: `POST /api/stations/update-mqtt-status` (trong `api/station.py`)

```json
{
  "station_id": 1,
  "mqtt_status": true
}
```

Service method: `StationService.update_mqtt_status_for()`

### Cấu hình MQTT Server (DB)

Field `SystemConfig.mqtt_server` — xem skill `feature-system-config-branding`.

### Station Status Scheduler (APScheduler)

File reference: `reference/backend/station_status.py`

Job chạy mỗi 1 phút, cập nhật `Station.status` (active/unactive) dựa trên `station_datas.milisecond_time`:

- Không có data → `unactive`
- Data cũ hơn 10 phút → `unactive`
- Data trong 10 phút → `active`

Đăng ký trong `main.py` lifespan:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.station_status import StationStatusService

scheduler = AsyncIOScheduler()
# job per tenant DB session...
scheduler.add_job(update_status, "interval", minutes=1)
scheduler.start()
```

### Runtime Config API (Frontend)

**Không dùng `NEXT_PUBLIC_*`** — expose MQTT URL qua server route:

| File | Reference | Destination |
|------|-----------|-------------|
| Route | `reference/frontend/route.js` | `frontend/src/app/api/runtime-config/route.js` |
| Hook | `reference/frontend/useRuntimeConfig.js` | `frontend/src/app/utils/hooks/useRuntimeConfig.js` |

Env server-side: `MQTT_SERVER=wss://mqtt.example.com:8084/mqtt` trong `frontend/.env`

```javascript
// useRuntimeConfig() → { mqttServer }
const { mqttServer } = useRuntimeConfig();
const mqttUrl = normalizeMqttUrl(mqttServer || process.env.NEXT_PUBLIC_MQTT_SERVER);
```

---

## Quy tắc quan trọng

1. **Ưu tiên `useRuntimeConfig().mqttServer`** từ `/api/runtime-config` — KHÔNG hardcode URL MQTT
2. **LUÔN cleanup** khi unmount — `client.off()` + `client.end(true)` + clear all intervals/timeouts
3. **LUÔN có fallback polling** — khi MQTT mất tín hiệu >10s, chuyển sang polling API mỗi 60s
4. **Dùng `useRef`** cho MQTT client, intervals, timeouts — tránh stale closure
5. **Dùng `stationDataMapRef`** (useRef) song song với `stationDataMap` (useState) để tránh stale data trong callback
6. **Try/catch** khi parse JSON message — MQTT message có thể không phải JSON hợp lệ
7. **Kiểm tra `mqtt_status`** trước khi subscribe — chỉ subscribe trạm có `mqtt_status === true`
8. **Protocol**: Browser yêu cầu `ws://` hoặc `wss://`, không dùng `mqtt://`

---

## Checklist

- [ ] Cấu hình `MQTT_SERVER` trong `frontend/.env`
- [ ] Copy `runtime-config/route.js` + `useRuntimeConfig.js`
- [ ] Backend: `Station.mqtt_status` + API update-mqtt-status
- [ ] Backend: `StationStatusService` + APScheduler job (optional)
- [ ] Import `mqtt` from `"mqtt"` (đã có trong `package.json`)
- [ ] Thêm `normalizeMqttUrl` utility
- [ ] Thêm state: clientRef, intervalRef, timeoutRef, received, statusMqtt
- [ ] Viết `handleMessage` xử lý data topic + status topic
- [ ] Viết `useEffect` connect/subscribe/cleanup
- [ ] Thêm fallback polling khi mất tín hiệu
- [ ] Hiển thị trạng thái MQTT trên UI (dot indicator + text)
- [ ] Test: bật MQTT cho trạm → kiểm tra nhận data realtime
- [ ] Test: tắt MQTT broker → kiểm tra fallback polling hoạt động
