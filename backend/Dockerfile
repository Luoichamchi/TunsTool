FROM python:3.12-slim
WORKDIR /app

# uv binary (copy từ image chính thức)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/usr/local

# Cài dependencies theo lockfile (tách layer để tận dụng cache)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy source code
COPY . .

# PORT truyền từ docker-compose / .env lúc runtime (mặc định 6001)
EXPOSE 6001

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-6001} --lifespan on"]
