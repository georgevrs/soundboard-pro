import os
import shutil
from pathlib import Path
from app.config import settings


class StorageService:
    def __init__(self):
        self.storage_dir = Path(settings.STORAGE_DIR)
        self.audio_dir = self.storage_dir / "audio"
        self.covers_dir = self.storage_dir / "covers"
        self._ensure_directories()

    def _ensure_directories(self):
        """Ensure all storage directories exist"""
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.covers_dir.mkdir(parents=True, exist_ok=True)

    def get_audio_path(self, sound_id: str, extension: str = "mp3") -> Path:
        """Get the path for an audio file for a sound"""
        return self.audio_dir / f"{sound_id}.{extension}"

    def get_cover_path(self, sound_id: str, extension: str = "jpg") -> Path:
        """Get the path for a cover image for a sound"""
        return self.covers_dir / f"{sound_id}.{extension}"

    def save_cover_image(self, sound_id: str, file_content: bytes, extension: str = "jpg") -> str:
        """Save cover image and return the path"""
        path = self.get_cover_path(sound_id, extension)
        path.write_bytes(file_content)
        return str(path)

    def copy_local_file(self, source_path: str, sound_id: str, extension: str = None) -> str:
        """Copy a local file to storage and return the new path"""
        source = Path(source_path)
        if not source.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")

        if extension is None:
            extension = source.suffix.lstrip(".")
        
        dest = self.get_audio_path(sound_id, extension)
        shutil.copy2(source, dest)
        return str(dest)

    def file_exists(self, path: str) -> bool:
        """Check if a file exists"""
        return Path(path).exists()

    def delete_file(self, path: str) -> bool:
        """Delete a file if it exists"""
        file_path = Path(path)
        if file_path.exists():
            file_path.unlink()
            return True
        return False


storage_service = StorageService()
