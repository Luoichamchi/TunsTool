# Request flow

```
Client
  -> api/*.py (router + Pydantic validation)
  -> dependencies/ (JWT auth, tenant DB session)
  -> services/*.py (business logic + RBAC checks)
  -> database/models/*.py (SQLAlchemy ORM)
  -> PostgreSQL
```

## Example: Demo CRUD

```
POST /api/demos/
  api/demo.py:create_demo()
  dependencies/auth.py:get_current_user()
  services/demo.py:DemoService.create_demo_for()
  database/models/demo.py:Demo
  schemas/demo.py:DemoResponse
```

## Multi-tenant

- **Catalog DB** (`DATABASE_URL`): tenant registry + default tenant data
- **Tenant DBs** (`{TENANT_DB_PREFIX}{tenant_code}`): isolated app tables per tenant
- JWT carries `tenant_code`; `get_db()` resolves the correct database session

## Adding new modules

1. Copy pattern from `demo` module (model, schema, service, api)
2. Register router in `main.py`
3. Add RBAC module + permissions in `database/seeds/global_permission_seed.py`
4. Create Alembic migration

For domain features removed from base, see `.agents/skills/*/SKILL.md`.
