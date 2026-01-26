from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    STORAGE_DIR: str = "./storage"
    MPV_PATH: str = "mpv"
    YTDLP_PATH: str = "yt-dlp"
    DEFAULT_OUTPUT_DEVICE: str = ""
    DEFAULT_VOLUME: int = 80
    STOP_PREVIOUS_ON_PLAY: bool = True
    ALLOW_OVERLAPPING: bool = False
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "covers"), exist_ok=True)
