# Frontend Dockerfile (standalone)

Image production chỉ chứa `.next/standalone` — không copy toàn bộ `node_modules`, pull/push nhẹ hơn nhiều.

## Build local

```bash
cd frontend
docker build -t vimon-frontend:local .
```

## Cấu hình runtime trên server

Không bake `NEXT_PUBLIC_*` lúc build. Cấu hình qua `.env` trên server:

| Biến | Mục đích |
|------|----------|
| `*_HOST_PORT` | Cổng expose ra ngoài server |
| `*_CONTAINER_PORT` | Cổng app lắng nghe trong container (`PORT` env) |
| `API_BASE_URL` | Tự sinh: `http://backend:<BACKEND_CONTAINER_PORT>` |
| `MQTT_SERVER` | Browser lấy qua `/api/runtime-config` |

## Dockerfile

```dockerfile
# ── Stage 1: build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat build-base vips-dev

ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: production (chỉ standalone trace, không copy full node_modules) ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
# PORT truyền từ docker-compose / .env lúc runtime

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Cần `output: 'standalone'` trong `next.config.mjs`.
