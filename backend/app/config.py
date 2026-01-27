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
    # YouTube download settings
    YTDLP_COOKIES_FROM_BROWSER: str = ""  # e.g., "chrome", "firefox", "edge" - empty to disable
    YTDLP_COOKIES_FILE: str = ""  # Path to cookies.txt file - empty to disable
    YTDLP_VERBOSE: bool = False  # Enable verbose logging for debugging
    API_BASE_URL: str = "http://localhost:8000"  # Base URL for API (used in system shortcuts)

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
