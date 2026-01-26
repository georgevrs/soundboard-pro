import subprocess
import asyncio
from pathlib import Path
from typing import Optional
from app.config import settings
from app.services.storage import storage_service
import logging

logger = logging.getLogger(__name__)


class YouTubeService:
    def __init__(self):
        self.ytdlp_path = settings.YTDLP_PATH

    async def download_audio(self, youtube_url: str, sound_id: str, output_format: str = "mp3") -> str:
        """
        Download audio from YouTube URL using yt-dlp.
        Returns the path to the downloaded file.
        """
        output_path = storage_service.get_audio_path(sound_id, output_format)
        
        # If file already exists, return it (idempotent)
        if output_path.exists():
            logger.info(f"Audio file already exists for sound {sound_id}, skipping download")
            return str(output_path)

        # Build yt-dlp command
        # Use best audio quality, extract to mp3
        cmd = [
            self.ytdlp_path,
            "-x",  # extract audio
            "--audio-format", output_format,
            "--audio-quality", "0",  # best quality
            "-o", str(output_path.with_suffix("")),  # output path without extension (yt-dlp adds it)
            youtube_url
        ]

        try:
            # Run yt-dlp in a thread to avoid blocking
            process = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            # yt-dlp may add extension, so find the actual file
            actual_path = output_path
            if not actual_path.exists():
                # Try with different extensions
                for ext in ["mp3", "m4a", "opus", "webm"]:
                    candidate = output_path.with_suffix(f".{ext}")
                    if candidate.exists():
                        actual_path = candidate
                        break
                else:
                    raise FileNotFoundError(f"Downloaded file not found at {output_path}")
            
            logger.info(f"Successfully downloaded audio for sound {sound_id} to {actual_path}")
            return str(actual_path)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"yt-dlp failed: {e.stderr}")
            raise RuntimeError(f"Failed to download audio: {e.stderr}")
        except Exception as e:
            logger.error(f"Error downloading audio: {e}")
            raise

    def validate_youtube_url(self, url: str) -> bool:
        """Validate that the URL is a YouTube URL"""
        return "youtube.com" in url or "youtu.be" in url


youtube_service = YouTubeService()
