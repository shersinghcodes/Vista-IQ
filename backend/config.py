from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    # Database
    MONGODB_URI: str = ""

    # App
    FRONTEND_URL: str = "http://localhost:5173"

    # Email / SMTP
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_SERVER: str = ""
    MAIL_PORT: int = 587
    MAIL_FROM: str = ""
    MAIL_USE_TLS: bool = True

    gemini_api_key: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
