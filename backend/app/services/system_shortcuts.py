import subprocess
import logging
import os
import shlex
from typing import Optional
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)


class SystemShortcutService:
    """Service for registering/unregistering system-level keyboard shortcuts on Linux (GNOME)"""
    
    def __init__(self):
        from app.config import settings
        self.api_base_url = settings.API_BASE_URL
        self.gsettings_path = "gsettings"
        self.custom_bindings_base = "/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings"
        
    def _check_gsettings_available(self) -> bool:
        """Check if gsettings is available"""
        try:
            result = subprocess.run(
                ["which", "gsettings"],
                capture_output=True,
                text=True,
                timeout=2
            )
            return result.returncode == 0
        except Exception:
            return False
    
    def _convert_hotkey_to_gsettings_format(self, hotkey: str) -> str:
        """Convert hotkey format (Ctrl+Alt+1) to gsettings format (<Ctrl><Alt>1)"""
        parts = hotkey.split('+')
        gsettings_parts = []
        
        for part in parts:
            part = part.strip()
            if part.lower() in ['ctrl', 'control']:
                gsettings_parts.append('<Ctrl>')
            elif part.lower() in ['alt']:
                gsettings_parts.append('<Alt>')
            elif part.lower() in ['shift']:
                gsettings_parts.append('<Shift>')
            elif part.lower() in ['meta', 'super', 'win', 'cmd']:
                gsettings_parts.append('<Super>')
            else:
                # Regular key
                gsettings_parts.append(part)
        
        return ''.join(gsettings_parts)
    
    def _get_binding_path(self, shortcut_id: str) -> str:
        """Get the gsettings path for a shortcut binding"""
        return f"{self.custom_bindings_base}/soundboard_{shortcut_id}/"
    
    def _get_all_custom_bindings(self) -> list:
        """Get current list of custom keybindings"""
        try:
            result = subprocess.run(
                [self.gsettings_path, "get", "org.gnome.settings-daemon.plugins.media-keys", "custom-keybindings"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Parse the output (it's a list in string format)
                output = result.stdout.strip()
                if output and output != "@as []":
                    # Remove brackets and quotes, split by comma
                    output = output.strip("'\"[]")
                    if output:
                        return [b.strip().strip("'\"") for b in output.split(',') if b.strip()]
            return []
        except Exception as e:
            logger.error(f"Failed to get custom bindings: {e}")
            return []
    
    def _set_custom_bindings(self, bindings: list):
        """Set the list of custom keybindings"""
        try:
            # Format as gsettings array
            bindings_str = "[" + ",".join([f"'{b}'" for b in bindings]) + "]"
            subprocess.run(
                [self.gsettings_path, "set", "org.gnome.settings-daemon.plugins.media-keys", 
                 "custom-keybindings", bindings_str],
                check=True,
                timeout=5,
                capture_output=True
            )
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to set custom bindings: {e}")
            raise
    
    def _build_command(self, sound_id: str, action: str) -> str:
        """Build the command to execute when shortcut is pressed (API call; requires backend)."""
        endpoint = f"{self.api_base_url}/api/playback/{action.lower()}/{sound_id}"
        return f"curl -X POST '{endpoint}' > /dev/null 2>&1"

    def _build_direct_play_command(
        self,
        local_path: str,
        mpv_path: str = "mpv",
        volume: Optional[int] = 80,
        trim_start_sec: Optional[float] = None,
        trim_end_sec: Optional[float] = None,
        audio_device: Optional[str] = None,
    ) -> str:
        """
        Build a command that runs mpv directly on the audio file.
        This works when the app is not running (no backend required).
        Path must be absolute so it works from any working directory.
        """
        path = Path(local_path).resolve()
        if not path.is_absolute():
            path = path.resolve()
        path_str = str(path)
        # Quote path for safe shell execution (handles spaces and special chars)
        path_quoted = shlex.quote(path_str)
        mpv_quoted = shlex.quote(mpv_path) if os.path.sep in mpv_path else mpv_path
        parts = [mpv_quoted, "--no-video", "--really-quiet", "--no-terminal"]
        if volume is not None:
            parts.append(f"--volume={volume}")
        if audio_device and audio_device.strip():
            # --audio-device value may need quoting
            dev = audio_device.strip()
            if " " in dev or "'" in dev:
                parts.append(f"--audio-device={shlex.quote(dev)}")
            else:
                parts.append(f"--audio-device={dev}")
        if trim_start_sec is not None:
            parts.append(f"--start={trim_start_sec}")
        if trim_end_sec is not None and trim_start_sec is not None:
            length = trim_end_sec - trim_start_sec
            if length > 0:
                parts.append(f"--length={length}")
        elif trim_end_sec is not None:
            parts.append(f"--length={trim_end_sec}")
        parts.append(path_quoted)
        return " ".join(parts) + " &"
    
    def register_shortcut(
        self,
        shortcut_id: str,
        hotkey: str,
        sound_id: str,
        sound_name: str,
        action: str = "play",
        *,
        local_path: Optional[str] = None,
        volume: Optional[int] = None,
        trim_start_sec: Optional[float] = None,
        trim_end_sec: Optional[float] = None,
        mpv_path: str = "mpv",
        audio_device: Optional[str] = None,
    ) -> bool:
        """
        Register a system-level keyboard shortcut using gsettings.

        When action is "play" and local_path is provided and the file exists,
        the shortcut runs mpv directly so it works even when the app is not running.
        Otherwise the shortcut calls the backend API (requires app running).
        """
        if not self._check_gsettings_available():
            logger.warning("gsettings not available - system shortcuts will not work")
            return False

        try:
            binding_path = self._get_binding_path(shortcut_id)
            gsettings_hotkey = self._convert_hotkey_to_gsettings_format(hotkey)

            # Prefer direct mpv command when we have a playable local file (works without app)
            if action.lower() == "play" and local_path:
                path = Path(local_path).resolve()
                if path.is_file():
                    command = self._build_direct_play_command(
                        local_path=str(path),
                        mpv_path=mpv_path or "mpv",
                        volume=volume if volume is not None else 80,
                        trim_start_sec=trim_start_sec,
                        trim_end_sec=trim_end_sec,
                        audio_device=audio_device or "",
                    )
                    logger.info(f"Shortcut {shortcut_id} will play file directly (no backend required)")
                else:
                    command = self._build_command(sound_id, action)
                    logger.warning(f"Shortcut {shortcut_id}: file not found at {path}, using API fallback")
            else:
                command = self._build_command(sound_id, action)
            
            # Get current bindings
            current_bindings = self._get_all_custom_bindings()
            
            # Remove this binding if it already exists
            current_bindings = [b for b in current_bindings if f"soundboard_{shortcut_id}" not in b]
            
            # Add new binding
            current_bindings.append(binding_path)
            
            # Set the bindings list
            self._set_custom_bindings(current_bindings)
            
            # Configure the binding
            subprocess.run(
                [self.gsettings_path, "set", 
                 f"org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:{binding_path}",
                 "name", f"Soundboard: {sound_name}"],
                check=True,
                timeout=5,
                capture_output=True
            )
            
            subprocess.run(
                [self.gsettings_path, "set",
                 f"org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:{binding_path}",
                 "command", command],
                check=True,
                timeout=5,
                capture_output=True
            )
            
            subprocess.run(
                [self.gsettings_path, "set",
                 f"org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:{binding_path}",
                 "binding", gsettings_hotkey],
                check=True,
                timeout=5,
                capture_output=True
            )
            
            logger.info(f"Registered system shortcut: {hotkey} -> {sound_name} ({action})")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to register shortcut {shortcut_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Error registering shortcut {shortcut_id}: {e}", exc_info=True)
            return False
    
    def unregister_shortcut(self, shortcut_id: str) -> bool:
        """
        Unregister a system-level keyboard shortcut
        
        Args:
            shortcut_id: Unique identifier for the shortcut
        
        Returns:
            True if successful, False otherwise
        """
        if not self._check_gsettings_available():
            return False
        
        try:
            # Get current bindings
            current_bindings = self._get_all_custom_bindings()
            
            # Remove this binding
            binding_path = self._get_binding_path(shortcut_id)
            current_bindings = [b for b in current_bindings if b != binding_path]
            
            # Set the updated bindings list
            self._set_custom_bindings(current_bindings)
            
            logger.info(f"Unregistered system shortcut: {shortcut_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error unregistering shortcut {shortcut_id}: {e}", exc_info=True)
            return False
    
    def sync_all_shortcuts(
        self,
        shortcuts: list,
        *,
        mpv_path: str = "mpv",
        audio_device: Optional[str] = None,
    ) -> bool:
        """
        Sync all shortcuts from database to system.
        Shortcut dicts may include local_path, volume, trim_start_sec, trim_end_sec
        so that play shortcuts use direct mpv (works when app is not running).
        """
        if not self._check_gsettings_available():
            logger.warning("gsettings not available - skipping shortcut sync")
            return False

        try:
            # First, clear all soundboard bindings
            current_bindings = self._get_all_custom_bindings()
            soundboard_bindings = [b for b in current_bindings if "soundboard_" in b]
            for binding in soundboard_bindings:
                current_bindings.remove(binding)
            self._set_custom_bindings(current_bindings)

            # Register all enabled shortcuts
            for shortcut in shortcuts:
                if shortcut.get("enabled", True):
                    self.register_shortcut(
                        shortcut["id"],
                        shortcut["hotkey"],
                        shortcut.get("sound_id", ""),
                        shortcut.get("sound_name", "Unknown"),
                        shortcut.get("action", "play").lower(),
                        local_path=shortcut.get("local_path"),
                        volume=shortcut.get("volume"),
                        trim_start_sec=shortcut.get("trim_start_sec"),
                        trim_end_sec=shortcut.get("trim_end_sec"),
                        mpv_path=shortcut.get("mpv_path") or mpv_path,
                        audio_device=shortcut.get("audio_device") or audio_device or "",
                    )

            logger.info(f"Synced {len([s for s in shortcuts if s.get('enabled', True)])} shortcuts to system")
            return True

        except Exception as e:
            logger.error(f"Error syncing shortcuts: {e}", exc_info=True)
            return False


# Global instance
system_shortcut_service = SystemShortcutService()
