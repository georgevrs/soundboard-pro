# KeySound Commander

A local-first desktop-style web app for managing and playing sounds via global keyboard shortcuts.

## Features

- 🎵 **Sound Management**: Add sounds from URLs, YouTube, or local files
- ⌨️ **Global Keyboard Shortcuts**: System-level shortcuts that work even when the app is closed
- 🎨 **Modern UI**: Beautiful React + TypeScript interface with shadcn-ui components
- 🐘 **PostgreSQL**: Robust database with SQLAlchemy 2.0 and Alembic migrations
- 🎬 **Audio Playback**: Uses `mpv` for high-quality audio playback
- 📥 **YouTube Integration**: Download and convert YouTube videos to audio
- 🖼️ **Cover Images**: Upload custom cover art for your sounds
- 🏷️ **Tags & Organization**: Organize sounds with tags and search

## Quick Start (Zero Configuration)

### First Time Setup

```bash
# Make scripts executable (if needed)
chmod +x setup.sh run.sh

# Run automated setup (installs everything)
./setup.sh

# Start the application
./run.sh
```

That's it! The setup script will:
- ✅ Install all system dependencies (Python, Node.js, Docker, mpv, yt-dlp)
- ✅ Set up Python virtual environment
- ✅ Install all Python and Node.js dependencies
- ✅ Configure PostgreSQL database
- ✅ Run database migrations
- ✅ Auto-detect audio devices
- ✅ Create all necessary directories

### Running the App

```bash
./run.sh
```

This will:
- ✅ Start PostgreSQL (if not running)
- ✅ Start the backend API server
- ✅ Start the frontend development server
- ✅ Open the app at http://localhost:8080

Press `Ctrl+C` to stop all services.

## Manual Setup (Advanced)

If you prefer manual setup, see the [backend setup guide](backend/README.md).

## System Requirements

- **OS**: Linux (Ubuntu/Debian/Arch recommended)
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher
- **Docker**: For PostgreSQL (or install PostgreSQL manually)
- **mpv**: Audio player
- **yt-dlp**: For YouTube downloads
- **gsettings**: For system-level keyboard shortcuts (GNOME)

## Project Structure

```
soundboard/
├── backend/           # Python FastAPI backend
│   ├── app/          # Application code
│   ├── alembic/     # Database migrations
│   └── storage/     # Audio files and covers
├── src/              # React frontend
├── setup.sh          # Automated setup script
└── run.sh            # Application launcher
```

## API Endpoints

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:8080

## Keyboard Shortcuts

Shortcuts are registered at the system level using GNOME's `gsettings`. They work globally, even when the app is closed.

To create a shortcut:
1. Select a sound in the app
2. Click "Bind Shortcut" in the inspector panel
3. Press your desired key combination (e.g., Ctrl+Alt+1)
4. The shortcut is now registered system-wide!

## Troubleshooting

### Docker Permission Issues

```bash
sudo usermod -aG docker $USER
# Then log out and log back in
```

### PostgreSQL Not Starting

```bash
# Check if port 5433 is available
sudo lsof -i :5433

# Or change the port in docker-compose.yml
```

### Audio Not Playing

```bash
# Check mpv installation
mpv --version

# Test audio device
pactl list short sinks

# Update DEFAULT_OUTPUT_DEVICE in backend/.env
```

### System Shortcuts Not Working

- Ensure `gsettings` is available (GNOME desktop)
- Check backend logs for shortcut registration errors
- Verify `API_BASE_URL` in `backend/.env` is correct

## Development

See [backend/README.md](backend/README.md) for development setup and API documentation.

## License

MIT
