import json
from typing import Annotated, Any

from pydantic import BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",  # Look at the root directory
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "InterviewX AI"
    API_V1_STR: str = "/api/v1"

    # CORS Origins configuration
    BACKEND_CORS_ORIGINS: Annotated[list[str], BeforeValidator(parse_cors)] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://interviewx-ai-one.vercel.app",
        "https://interviewx-ai-git-main-rajaryan2204s-projects.vercel.app",
        "https://interviewx-dh330j2q5-rajaryan2204s-projects.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str] | str:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        return parse_cors(v)

    # Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "interviewx_db"

    # Allow direct overrides for URLs (e.g. for sqlite local dev fallback)
    DATABASE_URL: str | None = None
    ASYNC_DATABASE_URL: str | None = None

    # JWT Authentication Configuration
    # In production, this MUST be a strong, randomly generated key.
    SECRET_KEY: str = "super_secret_interviewx_api_signing_key_production_grade_9988"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SECURE_COOKIE: bool = False

    # AI Engine Configuration
    AI_PROVIDER: str = "mock"  # Options: mock, openai, gemini, ollama, lm_studio

    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o"

    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    LM_STUDIO_BASE_URL: str = "http://localhost:1234/v1"
    LM_STUDIO_MODEL: str = "meta-llama-3-8b-instruct"

    # Voice Engine Configuration
    STT_PROVIDER: str = "mock"  # Options: mock, openai, deepgram, faster-whisper
    TTS_PROVIDER: str = "mock"  # Options: mock, openai, elevenlabs

    DEEPGRAM_API_KEY: str | None = None
    ELEVENLABS_API_KEY: str | None = None
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # default Rachel voice
    FASTER_WHISPER_URL: str = "http://localhost:8000"

    # Code Execution Engine
    CODE_EXECUTOR: str = "mock"  # Options: mock, judge0
    JUDGE0_BASE_URL: str = "http://localhost:2358"

    # Razorpay / Monetization Configuration
    RAZORPAY_KEY_ID: str = "rzp_test_mockkeyid1234"
    RAZORPAY_KEY_SECRET: str = "mockkeysecret5678"
    ACTIVE_PAYMENT_PROVIDER: str = "razorpay"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:  # noqa: N802
        """
        Synchronous database connection URI, primarily used by Alembic.
        """
        url = self.DATABASE_URL
        if not url:
            url = f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def ASYNC_SQLALCHEMY_DATABASE_URI(self) -> str:  # noqa: N802
        """
        Asynchronous database connection URI, used by the main FastAPI application.
        """
        if self.ASYNC_DATABASE_URL:
            url = self.ASYNC_DATABASE_URL
            if "?" in url:
                url = url.split("?")[0]
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
