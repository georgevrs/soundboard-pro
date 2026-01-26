# KeySound Commander Backend

Python FastAPI backend for the keyboard-driven soundboard application.

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- `mpv` (media player)
- `yt-dlp` (for YouTube downloads)
- Docker and Docker Compose (for running PostgreSQL)

## Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start PostgreSQL

From the project root:

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- User: `soundboard`
- Password: `soundboard`
- Database: `soundboard`

### 3. Configure Environment

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql://soundboard:soundboard@localhost:5432/soundboard
STORAGE_DIR=./storage
MPV_PATH=mpv
YTDLP_PATH=yt-dlp
DEFAULT_OUTPUT_DEVICE=pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo
DEFAULT_VOLUME=80
STOP_PREVIOUS_ON_PLAY=true
ALLOW_OVERLAPPING=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Run Migrations

```bash
alembic upgrade head
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Sounds

- `GET /api/sounds` - List sounds (supports `q`, `tag`, `source_type`, `sort` query params)
- `POST /api/sounds` - Create a sound
- `GET /api/sounds/{id}` - Get a sound
- `PUT /api/sounds/{id}` - Update a sound
- `DELETE /api/sounds/{id}` - Delete a sound
- `POST /api/sounds/{id}/cover` - Upload cover image
- `POST /api/sounds/{id}/ingest` - Download YouTube audio

### Shortcuts

- `GET /api/shortcuts` - List shortcuts
- `POST /api/shortcuts` - Create shortcut
- `PUT /api/shortcuts/{id}` - Update shortcut
- `DELETE /api/shortcuts/{id}` - Delete shortcut
- `GET /api/shortcuts/conflicts?hotkey=...` - Check hotkey conflicts

### Settings

- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Playback

- `POST /api/playback/play/{sound_id}` - Play a sound
- `POST /api/playback/stop/{sound_id}` - Stop a sound
- `POST /api/playback/toggle/{sound_id}` - Toggle playback
- `POST /api/playback/restart/{sound_id}` - Restart a sound
- `POST /api/playback/stop-all` - Stop all sounds
- `GET /api/playback/now-playing` - Get currently playing sounds

## Example API Calls

### Create a Sound

```bash
curl -X POST http://localhost:8000/api/sounds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Air Horn",
    "description": "Classic air horn sound",
    "tags": ["funny", "alert"],
    "source_type": "DIRECT_URL",
    "source_url": "https://example.com/airhorn.mp3",
    "volume": 100
  }'
```

### Play a Sound

```bash
curl -X POST http://localhost:8000/api/playback/play/{sound_id}
```

### Ingest YouTube Sound

```bash
# First create the sound
curl -X POST http://localhost:8000/api/sounds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Epic Music",
    "source_type": "YOUTUBE",
    "source_url": "https://www.youtube.com/watch?v=..."
  }'

# Then ingest it
curl -X POST http://localhost:8000/api/sounds/{sound_id}/ingest
```

## Development

### Running Tests

```bash
pytest
```

### Creating Migrations

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Audio Device Configuration

On Linux with PipeWire, find your audio device:

```bash
pactl list short sinks
```

Use the device name in `DEFAULT_OUTPUT_DEVICE` or per-sound `output_device`.

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Configuration
│   ├── db.py             # Database setup
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── routers/          # API routers
│   │   ├── sounds.py
│   │   ├── shortcuts.py
│   │   ├── settings.py
│   │   └── playback.py
│   └── services/         # Business logic
│       ├── player.py     # mpv playback manager
│       ├── youtube.py    # yt-dlp wrapper
│       └── storage.py    # File management
├── alembic/              # Database migrations
├── requirements.txt
└── README.md
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is accessible: `psql -h localhost -U soundboard -d soundboard`

### mpv Not Found

- Install mpv: `sudo apt install mpv` (Ubuntu/Debian)
- Or set `MPV_PATH` in `.env` to full path

### yt-dlp Not Found

- Install yt-dlp: `pip install yt-dlp` or `sudo apt install yt-dlp`
- Or set `YTDLP_PATH` in `.env` to full path

### Audio Not Playing

- Check audio device name in settings
- Test mpv manually: `mpv --audio-device=<device> <file>`
- Check process logs for errors
