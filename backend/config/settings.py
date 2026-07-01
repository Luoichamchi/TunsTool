from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10000000
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10000000
    SEED_ROOT_USERNAME: str = "root"
    SEED_ROOT_PASSWORD: str = "root123456"
    SEED_ADMIN_USERNAME: str = "admin"
    SEED_ADMIN_PASSWORD: str = "admin123456"
    SEED_USER_USERNAME: str = "user"
    SEED_USER_PASSWORD: str = "user123456"
    TENANT_DB_PREFIX: str = "app_"
    MQTT_SERVER: str = ""
    CORS_ORIGIN_REGEX: str = (
        r"^https?://("
        r"([\w-]+\.)?localhost"
        r"|127\.0\.0\.1"
        r"|(\d{1,3}(?:\.\d{1,3}){3})"
        r")(:\d+)?$"
    )

    class Config:
        env_file = ".env"


settings = Settings()
