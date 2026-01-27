import subprocess
import asyncio
import os
import tempfile
import time
from typing import Dict, Optional
from datetime import datetime
from uuid import UUID
from pathlib import Path
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
        mpv_path = settings.MPV_PATH
        cmd = [mpv_path, "--no-video"]
        
        # Verify mpv exists
        if not os.path.exists(mpv_path) and mpv_path == "mpv":
            # Try to find mpv in PATH
            import shutil
            mpv_in_path = shutil.which("mpv")
            if mpv_in_path:
                cmd[0] = mpv_in_path
                logger.info(f"Found mpv in PATH: {mpv_in_path}")
            else:
                logger.error(f"mpv not found at {mpv_path} and not in PATH")

        # Audio device (mpv requires --audio-device=value format)
        device = output_device or settings.DEFAULT_OUTPUT_DEVICE
        if device and device.strip():  # Only add if device is set and not empty
            cmd.append(f"--audio-device={device.strip()}")

        # Volume (mpv requires --volume=value format)
        vol = volume if volume is not None else settings.DEFAULT_VOLUME
        if vol is not None:
            cmd.append(f"--volume={vol}")

        # Trimming (mpv requires --start=value and --length=value format)
        if trim_start is not None:
            cmd.append(f"--start={trim_start}")
        
        if trim_end is not None:
            if trim_start is not None:
                # Calculate length
                length = trim_end - trim_start
                cmd.append(f"--length={length}")
            else:
                cmd.append(f"--length={trim_end}")

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
        logger.info(f"Source file/URL: {source}")
        
        # Check if local file exists
        if sound.source_type == "LOCAL_FILE" or (sound.source_type == "YOUTUBE" and sound.local_path):
            source_path = Path(source)
            if not source_path.exists():
                logger.error(f"Source file does not exist: {source}")
                raise FileNotFoundError(f"Audio file not found: {source}")
            logger.info(f"Source file exists: {source_path} ({source_path.stat().st_size} bytes)")

        # Spawn mpv process
        try:
            # Capture stderr to log errors
            stderr_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.log')
            stderr_path = stderr_file.name
            stderr_file.close()
            
            logger.info(f"Executing mpv command: {' '.join(cmd)}")
            process = await asyncio.to_thread(
                subprocess.Popen,
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=open(stderr_path, 'w'),
            )
            
            # Check if process started successfully
            await asyncio.sleep(0.2)  # Brief wait to check if process crashed immediately
            if process.poll() is not None:
                # Process exited immediately - read stderr
                with open(stderr_path, 'r') as f:
                    stderr_output = f.read()
                logger.error(f"mpv process exited immediately with code {process.returncode}")
                logger.error(f"mpv stderr: {stderr_output}")
                os.unlink(stderr_path)
                raise RuntimeError(f"mpv failed to start: {stderr_output}")
            
            logger.info(f"mpv process started successfully with PID {process.pid}")
            
            session = PlaybackSession(sound_id, sound.name, process)
            self.sessions[sound_id] = session
            
            # Clean up when done (non-blocking)
            asyncio.create_task(self._wait_for_completion(sound_id, process, stderr_path))
            
            return session
        except FileNotFoundError:
            logger.error(f"mpv executable not found at: {settings.MPV_PATH}")
            raise RuntimeError(f"mpv not found. Please install mpv or set MPV_PATH in settings.")
        except Exception as e:
            logger.error(f"Failed to start playback for sound {sound_id}: {e}", exc_info=True)
            raise

    async def _wait_for_completion(self, sound_id: UUID, process: subprocess.Popen, stderr_path: str = None):
        """Wait for process to complete and clean up"""
        return_code = await asyncio.to_thread(process.wait)
        
        # Log stderr if process failed
        if return_code != 0 and stderr_path:
            try:
                with open(stderr_path, 'r') as f:
                    stderr_output = f.read()
                if stderr_output:
                    logger.warning(f"mpv process exited with code {return_code} for sound {sound_id}")
                    logger.warning(f"mpv stderr: {stderr_output}")
            except Exception:
                pass
            finally:
                # Clean up log file
                try:
                    import os
                    os.unlink(stderr_path)
                except Exception:
                    pass
        
        if sound_id in self.sessions:
            del self.sessions[sound_id]

    def stop(self, sound_id: UUID) -> bool:
        """Stop playback for a specific sound"""
        # Use pop() to safely remove - handles race condition where
        # _wait_for_completion may have already removed the session
        session = self.sessions.pop(sound_id, None)
        if session:
            try:
                session.stop()
            except Exception as e:
                logger.error(f"Error stopping session for sound {sound_id}: {e}")
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
