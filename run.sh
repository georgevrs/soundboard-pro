#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down...${NC}"
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Wait for processes to finish
    wait 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         KeySound Commander - Starting Application            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if setup has been run
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}✗ Backend virtual environment not found${NC}"
    echo ""
    echo "Please run setup first:"
    echo "  ./setup.sh"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${RED}✗ Frontend dependencies not found${NC}"
    echo ""
    echo "Please run setup first:"
    echo "  ./setup.sh"
    exit 1
fi

# Check if PostgreSQL is running
echo -e "${BLUE}▶${NC} Checking PostgreSQL..."
cd "$SCRIPT_DIR"

# Detect docker compose command
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
fi

if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
    # Check if container is running
    if ! $DOCKER_COMPOSE_CMD ps postgres | grep -q "Up"; then
        echo -e "${YELLOW}⚠${NC} PostgreSQL container not running. Starting..."
        if $DOCKER_COMPOSE_CMD up -d postgres 2>&1; then
            echo -e "${GREEN}✓${NC} PostgreSQL container started"
            echo "   Waiting for PostgreSQL to be ready..."
            sleep 5
            
            # Wait for PostgreSQL to be ready
            MAX_RETRIES=30
            RETRY_COUNT=0
            while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U soundboard &> /dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
                    break
                fi
                RETRY_COUNT=$((RETRY_COUNT + 1))
                sleep 1
            done
        else
            echo -e "${RED}✗${NC} Failed to start PostgreSQL"
            echo "   Try running: sudo $DOCKER_COMPOSE_CMD up -d postgres"
            exit 1
        fi
    else
        echo -e "${GREEN}✓${NC} PostgreSQL is running"
    fi
else
    echo -e "${YELLOW}⚠${NC} docker-compose not found. Assuming PostgreSQL is running manually."
fi

# Run migrations
echo -e "${BLUE}▶${NC} Running database migrations..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate

# Wait a bit for DB to be fully ready
sleep 2

if alembic upgrade head 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Database migrations up to date"
else
    echo -e "${YELLOW}⚠${NC} Migration check failed (may be normal if DB not ready)"
fi

# Start backend
echo ""
echo -e "${BLUE}▶${NC} Starting backend server..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}✗${NC} .env file not found in backend directory"
    echo "   Please run ./setup.sh first"
    exit 1
fi

# Start backend in background
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/soundboard-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "   Waiting for backend to start..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null && curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend server started (PID: $BACKEND_PID)"
    echo "   API: http://localhost:8000"
    echo "   Docs: http://localhost:8000/docs"
else
    echo -e "${RED}✗${NC} Backend failed to start or not responding"
    echo "   Check logs: tail -f /tmp/soundboard-backend.log"
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    exit 1
fi

# Start frontend
echo ""
echo -e "${BLUE}▶${NC} Starting frontend server..."
cd "$SCRIPT_DIR"

# Check if .env exists for frontend
if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8000/api" > .env
fi

# Start frontend in background
npm run dev > /tmp/soundboard-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "   Waiting for frontend to start..."
MAX_RETRIES=15
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend server started (PID: $FRONTEND_PID)"
    echo "   App: http://localhost:8080"
else
    echo -e "${RED}✗${NC} Frontend failed to start"
    echo "   Check logs: tail -f /tmp/soundboard-frontend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ Application Running!                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:8080"
echo -e "${GREEN}🔧 Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for user interrupt
wait
