# TunsTool — Full-stack Base

Multi-tenant admin base: **FastAPI + PostgreSQL + Next.js 15 (App Router)** with JWT auth, RBAC, audit log, and a sample Demo CRUD module.

Domain-specific features from the original VIMON project are preserved as **Agent Skills** under [`.agents/skills/`](.agents/skills/) with verbatim reference code for reuse.

## Quick start (dev)

### Database

```bash
docker compose up db
```

### Backend

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default login (seeded): `root` / `root123456` with tenant code `default`.

## What's included in the base

| Layer | Generic modules |
|-------|-----------------|
| Backend | auth, users, RBAC, tenants, audit log, demo CRUD |
| Frontend | login, layout/theme, user/role/permission/tenant admin, demo page |

## Re-adding domain features

Use skills in `.agents/skills/` — each contains `SKILL.md` (step-by-step guide) + `reference/` (original code):

| Skill | Feature |
|-------|---------|
| `feature-stations` | Station + station config |
| `feature-parameters` | Parameters/sensors |
| `feature-measurements-reports` | Time-series data + reports + exceedance |
| `feature-cameras` | RTSP/HLS cameras |
| `feature-system-config-branding` | App branding + logo upload |
| `add-mqtt-realtime` | MQTT realtime (frontend + backend status) |
| `feature-monitoring-dashboard-ui` | Overview, map, station-data pages |

## Production

See [Readme-dockerfile.md](Readme-dockerfile.md) and `docker-compose.prod.yml`.
