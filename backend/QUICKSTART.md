# Quick Start Guide

## 🚀 Fast Setup

Run the setup script:

```bash
cd backend
./setup.sh
```

This will:
- ✅ Check prerequisites (Python, Docker, mpv, yt-dlp)
- ✅ Create virtual environment
- ✅ Install dependencies
- ✅ Create `.env` file
- ✅ Start PostgreSQL (via Docker)
- ✅ Run database migrations

## 🎯 Manual Setup (if needed)

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start PostgreSQL

From project root:

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Migrations

```bash
source venv/bin/activate
alembic upgrade head
```

### 5. Start Server

```bash
uvicorn app.main:app --reload
```

Or use Makefile:

```bash
make run
```

## 📡 API Endpoints

Once running, access:

- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## 🧪 Test It

```bash
# Create a sound
curl -X POST http://localhost:8000/api/sounds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sound",
    "source_type": "DIRECT_URL",
    "source_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  }'

# List sounds
curl http://localhost:8000/api/sounds

# Play a sound (replace {id} with actual sound ID)
curl -X POST http://localhost:8000/api/playback/play/{id}
```

## 🔧 Common Commands

```bash
# Run tests
make test
# or
pytest

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# View logs
docker-compose logs -f postgres
```

## 🐛 Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port already in use
Change the port in `.env` or use:
```bash
uvicorn app.main:app --reload --port 8001
```

### Missing dependencies
```bash
# Install mpv
sudo apt install mpv

# Install yt-dlp
pip install yt-dlp
# or
sudo apt install yt-dlp
```

## 📚 Next Steps

1. Connect your frontend to `http://localhost:8000/api`
2. Add sounds via the API or frontend
3. Set up global keyboard shortcuts (requires desktop wrapper like Tauri/Electron)
4. Configure audio output device in settings
