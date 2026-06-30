from fastapi import FastAPI, APIRouter, Request
from middleware import log_requests
from contextlib import asynccontextmanager
from config.settings import settings
from starlette.routing import Match
from database.database import AsyncSessionLocal
from api import (
    auth,
    rbac,
    demo,
    user,
    audit_log,
    tenant,
)
from database.audit_event import register_audit_events
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.tenant_migration import run_startup_migrations

    register_audit_events()

    async with AsyncSessionLocal() as db:
        try:
            await run_startup_migrations(db)
        except Exception as e:
            print(f"Migration error: {e}")

        try:
            from database.seeds.auto_seed_data import auto_seed_all

            await auto_seed_all(db)
        except Exception as e:
            import traceback

            print(f"Error during seeding: {e}")
            traceback.print_exc()
    yield


app = FastAPI(
    title="TunsTool API",
    description="Multi-tenant FastAPI base with JWT auth and RBAC",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"message": "Welcome to the API"}


api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(demo.router)
api_router.include_router(rbac.router)
api_router.include_router(audit_log.router)
api_router.include_router(tenant.router)
app.include_router(api_router)


def _has_full_match(scope: dict) -> bool:
    """True if a route fully matches the path in scope (excluding redirects)."""
    for route in app.router.routes:
        match, _ = route.matches(scope)
        if match == Match.FULL:
            return True
    return False


@app.middleware("http")
async def normalize_trailing_slash(request: Request, call_next):
    """Allow API calls with or without trailing slash without 307 redirect."""
    scope = request.scope
    path = scope.get("path", "")
    if path and not _has_full_match(scope):
        alt = path[:-1] if path.endswith("/") and len(path) > 1 else path + "/"
        alt_scope = dict(scope)
        alt_scope["path"] = alt
        if _has_full_match(alt_scope):
            scope["path"] = alt
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(log_requests)
