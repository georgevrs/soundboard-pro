# Environment Variables Setup Guide

This guide will help you configure your `.env` file for the KeySound Commander backend.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings (see details below)

## Configuration Details

### Database Configuration

#### `DATABASE_URL`
PostgreSQL connection string.

**Format**: `postgresql://username:password@host:port/database`

**Default (Docker)**: `postgresql://soundboard:soundboard@localhost:5432/soundboard`

**If using local PostgreSQL**:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/soundboard
```

**If using remote PostgreSQL**:
```env
DATABASE_URL=postgresql://user:pass@remote-host:5432/soundboard
```

### Storage Configuration

#### `STORAGE_DIR`
Directory where downloaded audio files and cover images are stored.

**Default**: `./storage`

**Examples**:
- Relative: `./storage` (creates `backend/storage/`)
- Absolute: `/home/user/soundboard-storage`
- Custom: `./data/audio-files`

The directory structure will be:
```
storage/
├── audio/      # Downloaded YouTube files and local audio
└── covers/     # Cover images
```

### External Tools

#### `MPV_PATH`
Path to the `mpv` media player executable.

**Default**: `mpv` (assumes it's in your PATH)

**If mpv is not in PATH**:
```bash
# Find mpv location
which mpv
# or
whereis mpv
```

Then set:
```env
MPV_PATH=/usr/bin/mpv
# or wherever it's located
```

**Installation**:
- Ubuntu/Debian: `sudo apt install mpv`
- macOS: `brew install mpv`
- Windows: Download from https://mpv.io/

#### `YTDLP_PATH`
Path to the `yt-dlp` executable for YouTube downloads.

**Default**: `yt-dlp` (assumes it's in your PATH)

**If yt-dlp is not in PATH**:
```bash
# Find yt-dlp location
which yt-dlp
```

Then set:
```env
YTDLP_PATH=/usr/local/bin/yt-dlp
```

**Installation**:
- Python: `pip install yt-dlp`
- Ubuntu/Debian: `sudo apt install yt-dlp`
- macOS: `brew install yt-dlp`

### Audio Configuration

#### `DEFAULT_OUTPUT_DEVICE`
Default audio output device for playback.

**Leave empty** to use system default.

**On Linux (PipeWire/PulseAudio)**:

1. List available devices:
   ```bash
   pactl list short sinks
   ```

2. Example output:
   ```
   0	alsa_output.pci-0000_00_1f.3.analog-stereo	PipeWire	s16le 2ch 48000Hz	RUNNING
   ```

3. Use the device name:
   ```env
   DEFAULT_OUTPUT_DEVICE=pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo
   ```

**On Linux (ALSA)**:
```bash
# List ALSA devices
aplay -l
```

**On macOS**:
```bash
# List audio devices
system_profiler SPAudioDataType
```

Usually leave empty on macOS to use default.

**On Windows**:
Usually leave empty to use default, or specify device name from Windows Sound settings.

#### `DEFAULT_VOLUME`
Default playback volume (0-100).

**Default**: `80`

**Examples**:
- `50` = 50% volume
- `100` = Maximum volume
- Leave empty or set to `null` for no default (mpv default)

### Playback Behavior

#### `STOP_PREVIOUS_ON_PLAY`
Whether to stop currently playing sounds when starting a new one.

**Default**: `true`

**Options**:
- `true` - Stop previous sound when playing new one
- `false` - Allow sounds to overlap

#### `ALLOW_OVERLAPPING`
Whether to allow multiple sounds to play simultaneously.

**Default**: `false`

**Options**:
- `true` - Multiple sounds can play at once
- `false` - Only one sound at a time (when `STOP_PREVIOUS_ON_PLAY=true`)

**Note**: If `STOP_PREVIOUS_ON_PLAY=false`, overlapping is automatically allowed.

### CORS Configuration

#### `CORS_ORIGINS`
Comma-separated list of allowed frontend origins.

**Default**: `http://localhost:5173,http://localhost:3000`

**Common setups**:

**Vite (default port)**:
```env
CORS_ORIGINS=http://localhost:5173
```

**Create React App**:
```env
CORS_ORIGINS=http://localhost:3000
```

**Multiple origins**:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

**Production**:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Complete Example

Here's a complete `.env` example for a Linux system with PipeWire:

```env
# Database
DATABASE_URL=postgresql://soundboard:soundboard@localhost:5432/soundboard

# Storage
STORAGE_DIR=./storage

# Tools
MPV_PATH=mpv
YTDLP_PATH=yt-dlp

# Audio (found via: pactl list short sinks)
DEFAULT_OUTPUT_DEVICE=pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo
DEFAULT_VOLUME=80

# Playback
STOP_PREVIOUS_ON_PLAY=true
ALLOW_OVERLAPPING=false

# CORS
CORS_ORIGINS=http://localhost:5173
```

## Verification

After setting up your `.env`, verify it works:

1. **Check database connection**:
   ```bash
   # If using Docker
   docker-compose ps
   
   # Test connection
   psql postgresql://soundboard:soundboard@localhost:5432/soundboard
   ```

2. **Check mpv**:
   ```bash
   mpv --version
   ```

3. **Check yt-dlp**:
   ```bash
   yt-dlp --version
   ```

4. **Test audio device** (Linux):
   ```bash
   # Test with mpv
   mpv --audio-device=pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo test.mp3
   ```

5. **Start the server**:
   ```bash
   uvicorn app.main:app --reload
   ```

   Check: http://localhost:8000/health

## Troubleshooting

### Database connection fails
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL format (no spaces, correct credentials)
- Verify port 5432 is not blocked

### mpv not found
- Install: `sudo apt install mpv` (Ubuntu/Debian)
- Or set full path in `MPV_PATH`

### Audio not playing
- Check `DEFAULT_OUTPUT_DEVICE` is correct
- Test mpv manually with the device
- Check system audio is working

### CORS errors in browser
- Add your frontend URL to `CORS_ORIGINS`
- Ensure no trailing slashes
- Restart the backend server after changes

## Security Notes

⚠️ **Never commit `.env` to version control!**

The `.env` file contains sensitive information:
- Database credentials
- System paths
- Configuration details

The `.gitignore` file should already exclude `.env`. Always use `.env.example` as a template.
