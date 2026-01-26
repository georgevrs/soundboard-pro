import subprocess
import asyncio
from typing import Dict, Optional
from datetime import datetime
from uuid import UUID
import logging
from app.config import settings
from app.models import Sound, Settings as SettingsModel
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class PlaybackSession:
    def __init__(self, sound_id: UUID, sound_name: str, process: subprocess.Popen):
        self.sound_id = sound_id
        self.sound_name = sound_name
        self.process = process
        self.started_at = datetime.now()

    @property
    def process_id(self) -> int:
        return self.process.pid

    def is_running(self) -> bool:
        """Check if the process is still running"""
        return self.process.poll() is None

    def stop(self):
        """Stop the playback process"""
        try:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        except Exception as e:
            logger.error(f"Error stopping process {self.process_id}: {e}")


class PlayerService:
    def __init__(self):
        self.sessions: Dict[UUID, PlaybackSession] = {}

    def _build_mpv_command(
        self,
        source: str,
        output_device: Optional[str] = None,
        volume: Optional[int] = None,
        trim_start: Optional[float] = None,
        trim_end: Optional[float] = None,
    ) -> list:
        """Build mpv command with all options"""
        cmd = [settings.MPV_PATH, "--no-video"]

        # Audio device
        device = output_device or settings.DEFAULT_OUTPUT_DEVICE
        if device:
            cmd.extend(["--audio-device", device])

        # Volume
        vol = volume if volume is not None else settings.DEFAULT_VOLUME
        if vol is not None:
            cmd.extend(["--volume", str(vol)])

        # Trimming
        if trim_start is not None:
            cmd.extend(["--start", str(trim_start)])
        
        if trim_end is not None:
            if trim_start is not None:
                # Calculate length
                length = trim_end - trim_start
                cmd.extend(["--length", str(length)])
            else:
                cmd.extend(["--length", str(trim_end)])

        # Source (file or URL)
        cmd.append(source)

        return cmd

    async def play(
        self,
        sound: Sound,
        db_settings: SettingsModel,
        restart: bool = False
    ) -> PlaybackSession:
        """Play a sound"""
        sound_id = sound.id

        # Check if already playing
        if sound_id in self.sessions:
            existing = self.sessions[sound_id]
            if existing.is_running():
                if restart:
                    existing.stop()
                else:
                    return existing  # Already playing

        # Stop previous if needed
        if db_settings.stop_previous_on_play and not db_settings.allow_overlapping:
            await self.stop_all()

        # Determine source
        if sound.source_type == "LOCAL_FILE" or (sound.source_type == "YOUTUBE" and sound.local_path):
            source = sound.local_path
        elif sound.source_type == "DIRECT_URL" or sound.source_type == "YOUTUBE":
            source = sound.source_url
        else:
            raise ValueError(f"Invalid source configuration for sound {sound_id}")

        if not source:
            raise ValueError(f"No source available for sound {sound_id}")

        # Build command
        cmd = self._build_mpv_command(
            source=source,
            output_device=sound.output_device or db_settings.default_output_device,
            volume=sound.volume or db_settings.default_volume,
            trim_start=sound.trim_start_sec,
            trim_end=sound.trim_end_sec,
        )

        logger.info(f"Playing sound {sound_id} with command: {' '.join(cmd)}")

        # Spawn mpv process
        try:
            process = await asyncio.to_thread(
                subprocess.Popen,
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            
            session = PlaybackSession(sound_id, sound.name, process)
            self.sessions[sound_id] = session
            
            # Clean up when done (non-blocking)
            asyncio.create_task(self._wait_for_completion(sound_id, process))
            
            return session
        except Exception as e:
            logger.error(f"Failed to start playback for sound {sound_id}: {e}")
            raise

    async def _wait_for_completion(self, sound_id: UUID, process: subprocess.Popen):
        """Wait for process to complete and clean up"""
        await asyncio.to_thread(process.wait)
        if sound_id in self.sessions:
            del self.sessions[sound_id]

    def stop(self, sound_id: UUID) -> bool:
        """Stop playback for a specific sound"""
        if sound_id in self.sessions:
            session = self.sessions[sound_id]
            session.stop()
            del self.sessions[sound_id]
            return True
        return False

    async def stop_all(self):
        """Stop all playing sounds"""
        sessions_to_stop = list(self.sessions.values())
        for session in sessions_to_stop:
            session.stop()
        self.sessions.clear()

    def toggle(self, sound: Sound, db_settings: SettingsModel) -> PlaybackSession:
        """Toggle playback (play if stopped, stop if playing)"""
        sound_id = sound.id
        if sound_id in self.sessions and self.sessions[sound_id].is_running():
            self.stop(sound_id)
            return None
        else:
            # Need to make this async, but toggle is called from sync context
            # We'll handle this in the router
            raise NotImplementedError("Toggle should be handled in router with async play")

    def get_now_playing(self) -> list:
        """Get list of currently playing sounds"""
        playing = []
        for sound_id, session in list(self.sessions.items()):
            if session.is_running():
                playing.append({
                    "sound_id": sound_id,
                    "sound_name": session.sound_name,
                    "started_at": session.started_at,
                    "process_id": session.process_id,
                })
            else:
                # Clean up dead sessions
                del self.sessions[sound_id]
        return playing

    def is_playing(self, sound_id: UUID) -> bool:
        """Check if a sound is currently playing"""
        if sound_id in self.sessions:
            if self.sessions[sound_id].is_running():
                return True
            else:
                del self.sessions[sound_id]
        return False


player_service = PlayerService()
