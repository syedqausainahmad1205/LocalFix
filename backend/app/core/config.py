from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LocalFix API"
    PROJECT_DESCRIPTION: str = "Verified Local Service Marketplace API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "postgresql+psycopg://localfix_user:localfix_password@localhost:5432/localfix"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+psycopg://"):
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    SECRET_KEY: str = "localfix-super-secret-development-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Email & SMTP Notifications Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@localfix.com"
    EMAILS_FROM_NAME: str = "LocalFix Platform"
    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_TEST_MODE: bool = True

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Multi-City & Pan-Regional Support
    DEFAULT_CITY: str = "All Cities"
    DEFAULT_LATITUDE: float = 27.8974
    DEFAULT_LONGITUDE: float = 78.0880

    SUPPORTED_CITIES: dict = {
        "All Cities": {"lat": 27.8974, "lon": 78.0880, "state": "India"},
        "Aligarh": {"lat": 27.8974, "lon": 78.0880, "state": "Uttar Pradesh"},
        "Delhi NCR": {"lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
        "Noida": {"lat": 28.5355, "lon": 77.3910, "state": "Uttar Pradesh"},
        "Lucknow": {"lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh"},
        "Agra": {"lat": 27.1767, "lon": 78.0081, "state": "Uttar Pradesh"},
        "Kanpur": {"lat": 26.4499, "lon": 80.3319, "state": "Uttar Pradesh"},
        "Bangalore": {"lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
        "Mumbai": {"lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    }

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
