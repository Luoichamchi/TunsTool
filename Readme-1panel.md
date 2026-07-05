# Triển khai TunsTool trên VPS bằng 1Panel + Domain

Hướng dẫn này dùng **1Panel** (control panel có giao diện web) để chạy hệ thống, khớp sẵn với file [`docker-compose.prod.yml`](docker-compose.prod.yml) trong repo (dùng mạng ngoài `1panel-network`, image dựng sẵn, database ngoài).

> Nếu bạn thích thuần dòng lệnh (Docker Compose + Caddy tự dựng), xem hướng khác. File này chỉ tập trung vào 1Panel.

---

## 0. Kiến trúc sẽ dựng

```
Internet ──(HTTPS 443)──► [ OpenResty của 1Panel ]  ← reverse proxy + SSL Let's Encrypt
                                   │ proxy về 127.0.0.1:<FRONTEND_HOST_PORT>
                                   ▼
                            [ frontend ]  (Next.js, public)
                                   │ proxy /api/* , /assets/*  (server-side)
                                   ▼
                            [ backend ]   (FastAPI, nội bộ 1panel-network)
                                   │
                                   ▼
                            [ PostgreSQL ] (app cài qua 1Panel, nội bộ 1panel-network)
```

Điểm quan trọng:

- Trình duyệt **chỉ truy cập frontend**; frontend tự proxy `/api/*` sang backend qua mạng Docker nội bộ (`API_BASE_URL=http://backend:<port>`). Vì vậy **chỉ cần 1 domain** trỏ vào frontend, backend + DB **không expose ra internet**.
- Trong `docker-compose.prod.yml`, backend & frontend đều bind `127.0.0.1:<HOST_PORT>` → OpenResty của 1Panel (chạy trên host) proxy vào cổng localhost đó.
- Backend **tự tạo bảng + seed** (`root`, menu mẫu…) khi khởi động — **không cần migration thủ công**.

---

## 1. Mua domain

1. Chọn nhà cung cấp dễ quản DNS: **Cloudflare / Porkbun / Namecheap**, hoặc VN: **Mắt Bão / Tenten / PA Vietnam**.
2. Ví dụ dùng subdomain: `order.tenquan.com` (khuyên dùng subdomain, để domain gốc dành cho web giới thiệu).
3. Chưa cấu hình DNS vội — trỏ IP ở Bước 3 sau khi có VPS.

## 2. Mua VPS

- Cấu hình đề xuất: **2 vCPU / 4 GB RAM / 40–60 GB SSD**, OS **Ubuntu 24.04 LTS**.
  - RAM 4GB thoải mái vì còn chạy cả 1Panel + PostgreSQL + build image. Nếu chỉ 2GB, **phải tạo swap** (xem Phụ lục A) để build frontend không bị OOM.
- Vị trí: **Singapore** hoặc **Vietnam** (gần khách VN, ping thấp).
- Thêm **SSH key** khi tạo VPS. Ghi lại **IP public** (ví dụ `123.45.67.89`).

## 3. Trỏ domain về VPS (DNS)

Tại trang quản lý DNS, tạo bản ghi **A**:

| Type | Name  | Value          |
|------|-------|----------------|
| A    | order | `123.45.67.89` |

- Nếu dùng **Cloudflare**: lần đầu để **DNS only** (mây xám), chưa bật proxy, để 1Panel xin SSL Let's Encrypt dễ.
- Kiểm tra: `dig +short order.tenquan.com` phải ra IP VPS.

## 4. Chuẩn bị VPS & cài 1Panel

SSH vào và cập nhật:

```bash
ssh root@123.45.67.89
apt update && apt upgrade -y
```

Cài 1Panel (script chính thức — tự cài kèm Docker & Docker Compose):

```bash
curl -sSL https://resource.fit2cloud.com/1panel/package/quick_start.sh -o quick_start.sh
bash quick_start.sh
```

Kết thúc, script in ra: **URL panel** (dạng `http://IP:<port>/<đường-dẫn-bảo-mật>`), **user**, **password**. Lưu lại.

Mở tường lửa cho web + panel:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow <PORT_PANEL>/tcp   # cổng 1Panel in ra ở trên
ufw enable
```

Đăng nhập 1Panel bằng URL/user/password vừa nhận.

## 5. Cài các app cần thiết trong 1Panel App Store

Trong 1Panel vào **App Store**, cài:

1. **OpenResty** — dùng cho Website / reverse proxy / SSL (thường 1Panel gợi ý cài sẵn).
2. **PostgreSQL** — chọn bản **15**. Khi cài, đặt và lưu lại **mật khẩu root PostgreSQL**.

> 1Panel gắn các app này vào mạng Docker `1panel-network` — đúng mạng mà `docker-compose.prod.yml` yêu cầu.

## 6. Tạo database cho ứng dụng

Vào **Databases → PostgreSQL** trong 1Panel:

1. Tạo database mới: tên `tunstool_db`.
2. Tạo user: `tunsadmin` + mật khẩu mạnh, gán quyền trên `tunstool_db`.
3. Ghi lại **tên container PostgreSQL** (xem ở **Containers**, ví dụ `1Panel-postgresql-xxxx`). Backend sẽ kết nối tới host = tên container này, cổng `5432`, qua mạng `1panel-network`.

> Lưu ý multi-tenant: nếu sau này bạn tạo **nhiều tenant** (mỗi tenant 1 database riêng), user DB cần quyền **CREATEDB**. Quán nhỏ dùng 1 tenant `default` thì không cần.

## 7. Đưa mã nguồn lên VPS & build image

`docker-compose.prod.yml` dùng image dựng sẵn (`${BACKEND_IMAGE}`, `${FRONTEND_IMAGE}`). Cách đơn giản nhất cho quán nhỏ: **build ngay trên VPS** (không cần registry).

```bash
mkdir -p /opt/tunstool && cd /opt/tunstool
git clone <URL_REPO_CUA_BAN> .

# Build 2 image, đặt tag cố định
docker build -t tunstool-backend:latest ./backend
docker build -t tunstool-frontend:latest ./frontend
```

> Nếu build frontend bị kill vì thiếu RAM → tạo swap (Phụ lục A) rồi build lại.

*(Tùy chọn nâng cao: build ở máy khác rồi `docker push` lên Docker Hub/GHCR, sau đó đặt `BACKEND_IMAGE`/`FRONTEND_IMAGE` trỏ tới image trên registry.)*

## 8. Kiểm tra mạng `1panel-network`

```bash
docker network ls | grep 1panel-network
```

Nếu **chưa có** (hiếm, thường 1Panel đã tạo):

```bash
docker network create 1panel-network
```

## 9. Tạo file `.env`

Sinh secret:

```bash
openssl rand -hex 32   # chạy 2 lần cho 2 JWT secret
```

Tạo `/opt/tunstool/.env` theo đúng biến mà `docker-compose.prod.yml` cần:

```dotenv
# --- Cổng host (chỉ mở trên 127.0.0.1, OpenResty proxy vào) ---
BACKEND_HOST_PORT=8100
FRONTEND_HOST_PORT=3100

# --- Cổng trong container ---
BACKEND_CONTAINER_PORT=6001
FRONTEND_CONTAINER_PORT=3000

# --- Database (trỏ tới container PostgreSQL của 1Panel qua 1panel-network) ---
# Thay <TEN_CONTAINER_POSTGRES> bằng tên container ở Bước 6
POSTGRES_USER=tunsadmin
POSTGRES_PASSWORD=doi-mat-khau-manh
POSTGRES_DB=tunstool_db
DATABASE_URL=postgresql+psycopg://tunsadmin:doi-mat-khau-manh@<TEN_CONTAINER_POSTGRES>:5432/tunstool_db

# --- Backend / JWT ---
TZ=Asia/Ho_Chi_Minh
JWT_SECRET_KEY=dan-chuoi-openssl-1
JWT_REFRESH_SECRET_KEY=dan-chuoi-openssl-2
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REFRESH_TOKEN_EXPIRE_MINUTES=43200

# Tài khoản seed lần đầu (ĐỔI mật khẩu mặc định!)
SEED_ROOT_USERNAME=root
SEED_ROOT_PASSWORD=mat-khau-root-moi
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=mat-khau-admin-moi

# --- MQTT (tùy chọn, chỉ cần cho realtime monitoring) ---
MQTT_SERVER=

# --- Docker images (tag đã build ở Bước 7) ---
BACKEND_IMAGE=tunstool-backend:latest
FRONTEND_IMAGE=tunstool-frontend:latest
```

Quan trọng:

- `DATABASE_URL` giữ scheme `postgresql+psycopg://` (dự án dùng psycopg async).
- `API_BASE_URL` **không cần** đặt ở đây — `docker-compose.prod.yml` tự sinh `http://backend:${BACKEND_CONTAINER_PORT}`.
- **Đổi hết** mật khẩu/secret mặc định trước khi chạy thật.

## 10. Tạo Compose trong 1Panel

Vào **Containers → Compose → Create compose**:

1. Đặt tên, ví dụ `tunstool`.
2. Dán **nguyên nội dung** `docker-compose.prod.yml` của repo vào ô compose.
3. Dán nội dung `.env` ở Bước 9 vào ô environment/`.env` của form (hoặc trỏ tới file `.env` bạn đã tạo ở `/opt/tunstool/.env`).
4. Bấm **Confirm/Up** để khởi chạy.

Kiểm tra log:

```bash
cd /opt/tunstool
docker compose -f docker-compose.prod.yml logs -f backend
#  -> chờ dòng "Tenant database seed completed"
docker compose -f docker-compose.prod.yml ps
#  -> backend healthy, frontend up
```

> Nếu backend log báo lỗi kết nối DB: kiểm tra `<TEN_CONTAINER_POSTGRES>` trong `DATABASE_URL` và chắc chắn container PostgreSQL cùng mạng `1panel-network` (`docker inspect <ten> | grep 1panel-network`).

## 11. Tạo Website (reverse proxy) + HTTPS trong 1Panel

Vào **Websites → Create website → Reverse proxy**:

1. **Domain**: `order.tenquan.com`.
2. **Proxy target**: `http://127.0.0.1:3100` (chính là `FRONTEND_HOST_PORT`).
3. Tạo xong, mở website vừa tạo → tab **HTTPS**:
   - Tạo **Acme account** (nếu chưa có), rồi **Apply certificate** (Let's Encrypt).
   - Bật **HTTPS** + **Force HTTPS** (chuyển hướng http→https).
4. (Khuyến nghị) bật **WebSocket support** trong cấu hình proxy để realtime/SWR hoạt động mượt.

> Điều kiện cấp SSL: DNS đã trỏ đúng IP (Bước 3) + cổng 80/443 mở (Bước 4). Nếu dùng Cloudflare, để DNS-only khi xin cert lần đầu.

## 12. Đăng nhập & kiểm tra

1. Mở `https://order.tenquan.com` → trang login, có ổ khóa xanh.
2. Đăng nhập `root` / mật khẩu `SEED_ROOT_PASSWORD`, tenant code `default`.
3. Vào **Dining Tables**, mở 1 bàn → hệ thống sinh **QR**.
4. Dùng điện thoại **4G** (không WiFi quán) quét QR — phải mở được `https://order.tenquan.com/order/...`.

> QR tự lấy `window.location.origin`, nên khi bạn vào bằng `https://order.tenquan.com` thì QR tự chứa đúng domain HTTPS — **không cần** đặt `NEXT_PUBLIC_QR_BASE_URL`.

## 13. Backup

1Panel có sẵn công cụ backup:

- **Databases → PostgreSQL → Backup**: đặt lịch backup `tunstool_db` hằng ngày.
- **Toolbox → Backup Accounts**: gắn OneDrive/S3/Google Drive để đẩy backup lên cloud.
- (Tùy chọn) **Snapshot** cả hệ 1Panel để phục hồi nhanh.

Hoặc thủ công qua cron:

```bash
docker exec <TEN_CONTAINER_POSTGRES> pg_dump -U tunsadmin tunstool_db | gzip > /opt/backups/db_$(date +%F).sql.gz
```

## 14. Cập nhật khi có code mới

```bash
cd /opt/tunstool
git pull
docker build -t tunstool-backend:latest ./backend
docker build -t tunstool-frontend:latest ./frontend
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
```

Hoặc trong 1Panel: **Containers → Compose → tunstool → Rebuild/Up** sau khi đã build lại image.

---

## 15. (Tùy chọn) Tạo MQTT server realtime bằng subdomain

Phần này thêm **realtime cho trang Orders** (bếp/thu ngân nghe "ting" + tự cập nhật khi có món mới) bằng cách chạy broker **Mosquitto** ngay trên VPS và expose qua **subdomain `wss://`**.

### 15.1 Hiểu luồng MQTT của dự án

Hệ thống dùng MQTT **2 chiều khác giao thức**:

| Thành phần | Kết nối tới broker | Giao thức | Cổng |
|---|---|---|---|
| **Backend** (publish khi có order) `services/mqtt_publisher.py` | nội bộ Docker | MQTT/TCP | `1883` |
| **Browser** trang Orders `apps/orders/page.jsx` | qua internet | **WebSocket** | `wss` (443) |

- Backend đọc biến `MQTT_SERVER` (dạng `host:port`) để publish topic `TunsTool/<tenant>/orders`.
- Browser đọc `NEXT_PUBLIC_MQTT_SERVER || MQTT_SERVER` (qua `/api/runtime-config`) và kết nối bằng `mqtt.js`.

> Vì dashboard chạy **HTTPS**, trình duyệt **bắt buộc dùng `wss://`** (WebSocket bảo mật). Không thể dùng `ws://` hay IP trần → đây là lý do cần **subdomain + SSL** cho MQTT.

Mô hình sẽ dựng:

```
Backend ──(mqtt tcp 1883, nội bộ 1panel-network)──► [ Mosquitto ]
Browser ──(wss 443)──► [ OpenResty + SSL ] ──(ws 9001, 127.0.0.1)──► [ Mosquitto ]
                         mqtt.tenquan.com
```

> Lưu ý bảo mật: code hiện tại kết nối MQTT **ẩn danh (không user/password)** — cả backend (`paho.mqtt.publish.single`) lẫn frontend (`mqtt.connect`) đều không gửi credential. Vì vậy Mosquitto để `allow_anonymous true`. Cổng TCP `1883` **không** expose ra internet (chỉ dùng trong mạng Docker); chỉ WebSocket đi qua OpenResty + SSL.

### 15.2 Tạo DNS cho subdomain MQTT

Thêm bản ghi **A** giống Bước 3:

| Type | Name | Value          |
|------|------|----------------|
| A    | mqtt | `123.45.67.89` |

→ `mqtt.tenquan.com`. Nếu dùng Cloudflare, để **DNS only** khi xin SSL lần đầu.

### 15.3 Tạo file cấu hình Mosquitto

Tạo `/opt/tunstool/mqtt/mosquitto.conf`:

```conf
persistence true
persistence_location /mosquitto/data/

# Listener MQTT/TCP cho backend (chỉ nội bộ Docker)
listener 1883
protocol mqtt
allow_anonymous true

# Listener WebSocket cho browser (OpenResty proxy wss vào đây)
listener 9001
protocol websockets
allow_anonymous true
```

### 15.4 Thêm service `mqtt` vào compose

Thêm khối service sau vào `docker-compose.prod.yml` (cùng cấp với `backend`/`frontend`), và bổ sung `volumes` ở cuối file:

```yaml
  mqtt:
    image: eclipse-mosquitto:2
    container_name: mqtt
    restart: always
    volumes:
      - ./mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mqtt_data:/mosquitto/data
      - mqtt_log:/mosquitto/log
    ports:
      - "127.0.0.1:9001:9001"   # WebSocket — OpenResty proxy wss vào cổng này
    networks:
      - 1panel-network
    # KHÔNG expose 1883 ra host — backend gọi qua tên container "mqtt:1883"

volumes:
  mqtt_data:
  mqtt_log:
```

Đồng thời thêm biến môi trường MQTT cho **frontend** trong service `frontend` của compose:

```yaml
    environment:
      API_BASE_URL: http://backend:${BACKEND_CONTAINER_PORT}
      PORT: ${FRONTEND_CONTAINER_PORT}
      HOSTNAME: "0.0.0.0"
      NEXT_PUBLIC_MQTT_SERVER: ${NEXT_PUBLIC_MQTT_SERVER}   # thêm dòng này
```

### 15.5 Cập nhật `.env`

Sửa/thêm 2 biến trong `/opt/tunstool/.env`:

```dotenv
# Backend publish qua TCP nội bộ (tên container + cổng 1883)
MQTT_SERVER=mqtt:1883

# Browser subscribe qua subdomain wss
NEXT_PUBLIC_MQTT_SERVER=wss://mqtt.tenquan.com
```

- `MQTT_SERVER=mqtt:1883`: backend (`_normalize_mqtt_host`) tách thành host=`mqtt`, port=`1883`, publish qua mạng `1panel-network`.
- `NEXT_PUBLIC_MQTT_SERVER=wss://mqtt.tenquan.com`: giá trị `/api/runtime-config` trả cho browser.

### 15.6 Tạo Website reverse proxy cho MQTT trong 1Panel

Vào **Websites → Create website → Reverse proxy**:

1. **Domain**: `mqtt.tenquan.com`.
2. **Proxy target**: `http://127.0.0.1:9001` (listener WebSocket của Mosquitto).
3. **Bật WebSocket support** (bắt buộc — để OpenResty gửi header `Upgrade`/`Connection`).
4. Tab **HTTPS**: Apply certificate (Let's Encrypt) + bật **Force HTTPS**.

→ Sau bước này browser truy cập được `wss://mqtt.tenquan.com`.

### 15.7 Khởi động lại & kiểm tra

```bash
cd /opt/tunstool
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f mqtt   # thấy listener 1883 & 9001 mở
```

Kiểm tra:

1. Mở dashboard → trang **Orders**. Mở DevTools (Network → WS): phải thấy kết nối `wss://mqtt.tenquan.com` trạng thái **101 Switching Protocols**.
2. Từ máy/điện thoại khác, cho **khách quét QR đặt một món** → trang Orders phải **tự nhảy đơn mới + kêu beep** ngay (không cần chờ 5s polling).

> Nếu WS báo lỗi 400/426: kiểm tra đã bật **WebSocket support** ở reverse proxy. Nếu bị chặn mixed-content: đảm bảo dùng `wss://` (không phải `ws://`). Nếu backend không publish: xem log backend, kiểm tra `MQTT_SERVER=mqtt:1883` và container `mqtt` cùng mạng `1panel-network`.

### 15.8 (Nâng cao) Muốn bật user/password cho MQTT?

Code hiện tại **chưa** gửi credential MQTT, nên bật auth sẽ cần sửa code ở cả 2 phía (`mqtt_publisher.py` và `orders/page.jsx`). Với quán nhỏ, cách an toàn đơn giản hơn là: giữ ẩn danh nhưng **không mở cổng 1883 ra internet** (đã cấu hình) và có thể hạn chế truy cập subdomain `mqtt` bằng firewall/Cloudflare nếu cần.

---

## Phụ lục A — Tạo swap (nếu VPS RAM thấp)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Phụ lục B — Lưu ý bảo mật

- Đổi toàn bộ mật khẩu/secret mặc định (`root123456`, `admin123456`, JWT secret, DB password).
- Giữ backend & DB **không expose** ra internet (compose đã bind `127.0.0.1`).
- Đổi **cổng + đường dẫn bảo mật** mặc định của 1Panel; bật 2FA cho 1Panel.
- Tắt đăng nhập SSH bằng password, chỉ dùng SSH key.

## Tóm tắt thứ tự

1. Mua domain → 2. Mua VPS → 3. Trỏ DNS A về IP → 4. Cài 1Panel + mở firewall → 5. App Store: OpenResty + PostgreSQL → 6. Tạo DB `tunstool_db` + user → 7. `git clone` + build 2 image → 8. Kiểm tra `1panel-network` → 9. Tạo `.env` → 10. Tạo Compose trong 1Panel (dùng `docker-compose.prod.yml`) → 11. Website reverse proxy + HTTPS → 12. Login & test QR → 13. Backup → 14. Quy trình update → 15. (Tùy chọn) MQTT realtime qua subdomain `wss://`.
