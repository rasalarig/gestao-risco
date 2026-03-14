import os

from pydantic import field_validator
from pydantic_settings import BaseSettings


def _convert_db_url(url: str, driver: str) -> str:
    """Convert a database URL to use the specified SQLAlchemy driver.

    Render.com provides DATABASE_URL with ``postgresql://`` prefix.
    SQLAlchemy needs ``postgresql+asyncpg://`` for async and
    ``postgresql+psycopg2://`` for sync connections.
    """
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return url.replace(prefix, f"postgresql+{driver}://", 1)
    return url


class Settings(BaseSettings):
    PROJECT_NAME: str = "GRC Pro - Governanca, Risco e Conformidade"
    API_V1_PREFIX: str = "/api/v1"

    # Database ----------------------------------------------------------------
    # Accepts the raw DATABASE_URL from Render (postgresql://...) and converts
    # it automatically for both async (asyncpg) and sync (psycopg2) usage.
    DATABASE_URL: str = "postgresql+asyncpg://kpmg:kpmg123@localhost:5432/kpmg_risk"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://kpmg:kpmg123@localhost:5432/kpmg_risk"

    # JWT ---------------------------------------------------------------------
    SECRET_KEY: str = "grc-pro-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS --------------------------------------------------------------------
    # Accepts either a JSON list (local dev) or a comma-separated string
    # (Render env var).  Examples:
    #   CORS_ORIGINS='["http://localhost:4200"]'   (list, local)
    #   CORS_ORIGINS=https://grc-pro-frontend.onrender.com   (string, Render)
    #   CORS_ORIGINS=https://a.example.com,https://b.example.com  (multi)
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from a comma-separated string if needed."""
        if isinstance(v, str):
            # If it looks like a JSON list, let pydantic handle it
            if v.startswith("["):
                import json
                return json.loads(v)
            # Otherwise split on commas and strip whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_async_db_url(cls, v):
        """Ensure the async database URL uses the asyncpg driver."""
        return _convert_db_url(v, "asyncpg")

    @field_validator("DATABASE_URL_SYNC", mode="before")
    @classmethod
    def fix_sync_db_url(cls, v):
        """Ensure the sync database URL uses the psycopg2 driver."""
        return _convert_db_url(v, "psycopg2")

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


# If only DATABASE_URL is set (Render provides only one), derive the sync URL.
_raw_db_url = os.environ.get("DATABASE_URL", "")
if _raw_db_url and "DATABASE_URL_SYNC" not in os.environ:
    os.environ["DATABASE_URL_SYNC"] = _convert_db_url(_raw_db_url, "psycopg2")

settings = Settings()
