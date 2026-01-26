#!/bin/bash

set -e  # Exit on error

echo "🎵 KeySound Commander Backend Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Check Python version
echo "📋 Checking prerequisites..."
echo ""

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
REQUIRED_VERSION="3.11"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}Error: Python 3.11+ required. Found: $PYTHON_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker not found. PostgreSQL will need to be set up manually.${NC}"
    DOCKER_AVAILABLE=false
else
    echo -e "${GREEN}✓ Docker found${NC}"
    DOCKER_AVAILABLE=true
fi

# Detect docker compose command (docker-compose or docker compose)
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✓ docker-compose found${NC}"
    COMPOSE_AVAILABLE=true
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✓ docker compose found${NC}"
    COMPOSE_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ docker-compose not found. PostgreSQL will need to be set up manually.${NC}"
    COMPOSE_AVAILABLE=false
fi

# Check for mpv
if ! command -v mpv &> /dev/null; then
    echo -e "${YELLOW}⚠ mpv not found. Install with: sudo apt install mpv${NC}"
else
    echo -e "${GREEN}✓ mpv found${NC}"
fi

# Check for yt-dlp
if ! command -v yt-dlp &> /dev/null; then
    echo -e "${YELLOW}⚠ yt-dlp not found. Install with: pip install yt-dlp or sudo apt install yt-dlp${NC}"
else
    echo -e "${GREEN}✓ yt-dlp found${NC}"
fi

echo ""
echo "🔧 Setting up Python environment..."
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo "📝 Setting up configuration..."
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    
    # Try to detect audio device on Linux
    if command -v pactl &> /dev/null; then
        DEFAULT_DEVICE=$(pactl list short sinks | head -n1 | awk '{print $2}' 2>/dev/null || echo "")
        if [ ! -z "$DEFAULT_DEVICE" ]; then
            echo "Detected audio device: $DEFAULT_DEVICE"
            # Update .env with detected device
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|DEFAULT_OUTPUT_DEVICE=|DEFAULT_OUTPUT_DEVICE=$DEFAULT_DEVICE|" .env
            else
                # Linux
                sed -i "s|DEFAULT_OUTPUT_DEVICE=|DEFAULT_OUTPUT_DEVICE=$DEFAULT_DEVICE|" .env
            fi
        fi
    fi
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please review and update .env if needed${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo "🐘 Setting up PostgreSQL..."
echo ""

# Start PostgreSQL with docker-compose
if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    # Go to project root for docker-compose
    cd ..
    
    echo "Starting PostgreSQL container..."
    if $DOCKER_COMPOSE_CMD up -d postgres 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL container started${NC}"
        
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
        
        # Check if PostgreSQL is ready
        MAX_RETRIES=30
        RETRY_COUNT=0
        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U soundboard &> /dev/null; then
                echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
                break
            fi
            RETRY_COUNT=$((RETRY_COUNT + 1))
            sleep 1
        done
        
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo -e "${RED}⚠ PostgreSQL may not be ready. Please check manually.${NC}"
        fi
    else
        echo -e "${RED}⚠ Failed to start PostgreSQL container${NC}"
        echo ""
        echo -e "${YELLOW}Common issues:${NC}"
        echo "  1. Docker permission denied:"
        echo "     - Add your user to docker group: sudo usermod -aG docker $USER"
        echo "     - Then log out and log back in, or run: newgrp docker"
        echo "     - Or run with sudo: sudo $DOCKER_COMPOSE_CMD up -d postgres"
        echo ""
        echo "  2. Docker daemon not running:"
        echo "     - Start Docker: sudo systemctl start docker"
        echo ""
        echo "  3. Port 5432 already in use:"
        echo "     - Stop existing PostgreSQL: sudo systemctl stop postgresql"
        echo "     - Or change port in docker-compose.yml"
        echo ""
        echo "You can manually start PostgreSQL later with:"
        echo "  cd .. && $DOCKER_COMPOSE_CMD up -d postgres"
    fi
    
    cd backend
else
    echo -e "${YELLOW}⚠ Docker/docker-compose not available. Please set up PostgreSQL manually.${NC}"
    echo "   You can use: docker-compose up -d (from project root)"
    echo "   Or install Docker: https://docs.docker.com/get-docker/"
fi

echo ""
echo "🗄️  Running database migrations..."
echo ""

# Activate venv again (in case we're in a new shell context)
source venv/bin/activate

# Wait a bit more for DB to be fully ready
sleep 2

# Run migrations
if alembic upgrade head 2>/dev/null; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Migration failed. This might be normal if the database is not ready yet.${NC}"
    echo "   You can run migrations manually later with: alembic upgrade head"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review .env file and update if needed"
echo "  2. Activate virtual environment: source venv/bin/activate"
echo "  3. Start the server: uvicorn app.main:app --reload"
echo "  4. Or use Makefile: make run"
echo ""
echo "API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""
