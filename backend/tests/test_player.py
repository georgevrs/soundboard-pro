import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.player import PlayerService, PlaybackSession
from app.models import Sound, Settings as SettingsModel
from uuid import uuid4
import subprocess


@pytest.fixture
def mock_sound():
    """Create a mock sound"""
    sound = Mock(spec=Sound)
    sound.id = uuid4()
    sound.name = "Test Sound"
    sound.source_type = "DIRECT_URL"
    sound.source_url = "https://example.com/sound.mp3"
    sound.local_path = None
    sound.output_device = None
    sound.volume = None
    sound.trim_start_sec = None
    sound.trim_end_sec = None
    return sound


@pytest.fixture
def mock_settings():
    """Create mock settings"""
    settings = Mock(spec=SettingsModel)
    settings.default_output_device = None
    settings.default_volume = 80
    settings.stop_previous_on_play = True
    settings.allow_overlapping = False
    return settings


def test_build_mpv_command(mock_sound, mock_settings):
    """Test building mpv command"""
    player = PlayerService()
    
    cmd = player._build_mpv_command(
        source="https://example.com/sound.mp3",
        output_device=None,
        volume=80,
        trim_start=None,
        trim_end=None,
    )
    
    assert cmd[0] == "mpv"
    assert "--no-video" in cmd
    assert "https://example.com/sound.mp3" in cmd


def test_build_mpv_command_with_device(mock_sound, mock_settings):
    """Test building mpv command with audio device"""
    player = PlayerService()
    
    cmd = player._build_mpv_command(
        source="https://example.com/sound.mp3",
        output_device="pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo",
        volume=80,
    )
    
    assert "--audio-device" in cmd
    assert "pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo" in cmd


def test_build_mpv_command_with_trimming(mock_sound, mock_settings):
    """Test building mpv command with trimming"""
    player = PlayerService()
    
    cmd = player._build_mpv_command(
        source="https://example.com/sound.mp3",
        trim_start=5.0,
        trim_end=10.0,
    )
    
    assert "--start" in cmd
    assert "--length" in cmd


@pytest.mark.asyncio
async def test_play_sound(mock_sound, mock_settings):
    """Test playing a sound"""
    player = PlayerService()
    
    with patch("app.services.player.subprocess.Popen") as mock_popen:
        mock_process = MagicMock()
        mock_process.pid = 12345
        mock_process.poll.return_value = None  # Still running
        mock_popen.return_value = mock_process
        
        session = await player.play(mock_sound, mock_settings)
        
        assert session is not None
        assert session.sound_id == mock_sound.id
        assert session.process_id == 12345
        mock_popen.assert_called_once()


@pytest.mark.asyncio
async def test_stop_sound(mock_sound, mock_settings):
    """Test stopping a sound"""
    player = PlayerService()
    
    with patch("app.services.player.subprocess.Popen") as mock_popen:
        mock_process = MagicMock()
        mock_process.pid = 12345
        mock_process.poll.return_value = None
        mock_process.terminate = MagicMock()
        mock_process.wait = MagicMock()
        mock_popen.return_value = mock_process
        
        # Play first
        session = await player.play(mock_sound, mock_settings)
        
        # Stop it
        stopped = player.stop(mock_sound.id)
        assert stopped is True
        mock_process.terminate.assert_called_once()


def test_is_playing(mock_sound):
    """Test checking if sound is playing"""
    player = PlayerService()
    
    # Not playing initially
    assert player.is_playing(mock_sound.id) is False
    
    # Create a mock session
    mock_process = MagicMock()
    mock_process.pid = 12345
    mock_process.poll.return_value = None  # Running
    
    session = PlaybackSession(mock_sound.id, mock_sound.name, mock_process)
    player.sessions[mock_sound.id] = session
    
    assert player.is_playing(mock_sound.id) is True
    
    # Simulate process ending
    mock_process.poll.return_value = 0  # Finished
    assert player.is_playing(mock_sound.id) is False  # Should clean up


@pytest.mark.asyncio
async def test_stop_all(mock_sound, mock_settings):
    """Test stopping all sounds"""
    player = PlayerService()
    
    with patch("app.services.player.subprocess.Popen") as mock_popen:
        mock_process = MagicMock()
        mock_process.pid = 12345
        mock_process.poll.return_value = None
        mock_process.terminate = MagicMock()
        mock_process.wait = MagicMock()
        mock_popen.return_value = mock_process
        
        # Play a sound
        await player.play(mock_sound, mock_settings)
        
        # Stop all
        await player.stop_all()
        
        assert len(player.sessions) == 0
        mock_process.terminate.assert_called_once()
