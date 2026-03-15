"""DevForge AI Configuration."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "DevForge AI"
    debug: bool = True

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "codellama:7b"

    # ChromaDB
    chroma_persist_directory: str = "./data/chromadb"

    # Docker
    docker_socket: str = "unix:///var/run/docker.sock"
    sandbox_image: str = "python:3.12-slim"
    sandbox_timeout: int = 60
    sandbox_memory_limit: str = "512m"

    # Agent
    max_debug_iterations: int = 5

    # Monitoring
    prometheus_enabled: bool = True

    class Config:
        env_file = ".env"
        env_prefix = "DEVFORGE_"


settings = Settings()
