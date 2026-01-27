import subprocess
import logging
import os
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
        """Build the command to execute when shortcut is pressed"""
        # Use curl to call the backend API
        # The backend must be running for this to work
        endpoint = f"{self.api_base_url}/api/playback/{action.lower()}/{sound_id}"
        return f"curl -X POST '{endpoint}' > /dev/null 2>&1"
    
    def register_shortcut(
        self, 
        shortcut_id: str, 
        hotkey: str, 
        sound_id: str,
        sound_name: str,
        action: str = "play"
    ) -> bool:
        """
        Register a system-level keyboard shortcut using gsettings
        
        Args:
            shortcut_id: Unique identifier for the shortcut
            hotkey: Hotkey in format "Ctrl+Alt+1"
            sound_name: Name of the sound (for display)
            action: Action to perform (play, stop, toggle, restart)
        
        Returns:
            True if successful, False otherwise
        """
        if not self._check_gsettings_available():
            logger.warning("gsettings not available - system shortcuts will not work")
            return False
        
        try:
            binding_path = self._get_binding_path(shortcut_id)
            gsettings_hotkey = self._convert_hotkey_to_gsettings_format(hotkey)
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
    
    def sync_all_shortcuts(self, shortcuts: list) -> bool:
        """
        Sync all shortcuts from database to system
        This should be called on startup to register all enabled shortcuts
        
        Args:
            shortcuts: List of shortcut dicts with id, hotkey, sound_name, action, enabled
        
        Returns:
            True if successful, False otherwise
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
                        shortcut.get("action", "play").lower()
                    )
            
            logger.info(f"Synced {len([s for s in shortcuts if s.get('enabled', True)])} shortcuts to system")
            return True
            
        except Exception as e:
            logger.error(f"Error syncing shortcuts: {e}", exc_info=True)
            return False


# Global instance
system_shortcut_service = SystemShortcutService()
