from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Enterprise AI Agent Core"
    APP_ENV: str = "development"
    DEBUG: bool = False

    LLM_PROVIDER: str = "gemini"
    # Any Gemini model id, e.g. gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite
    LLM_MODEL: str = "gemini-2.5-flash"
    GEMINI_API_KEY: str = ""

    PINECONE_API_KEY: str = ""
    PINECONE_ENV: str = "us-east-1"
    PINECONE_INDEX_NAME: str = "agent-core"
    PINECONE_HOST: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
