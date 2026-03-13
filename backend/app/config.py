from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "GRC Pro - Governanca, Risco e Conformidade"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://kpmg:kpmg123@localhost:5432/kpmg_risk"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://kpmg:kpmg123@localhost:5432/kpmg_risk"

    # JWT
    SECRET_KEY: str = "grc-pro-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
