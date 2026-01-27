#!/bin/bash

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         KeySound Commander - Automated Setup               ║"
echo "║         Zero-Configuration Installation Script               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

# Check if running as root (we don't want that for most operations)
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root/sudo"
    exit 1
fi

echo "📋 Checking system prerequisites..."
echo ""

# Check Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    print_status "Detected OS: $PRETTY_NAME"
else
    print_warning "Cannot detect Linux distribution"
    OS="unknown"
fi

# Function to install package (Debian/Ubuntu)
install_package_debian() {
    if ! dpkg -l | grep -q "^ii  $1 "; then
        print_step "Installing $1..."
        sudo apt-get update -qq
        sudo apt-get install -y -qq "$1" > /dev/null 2>&1
        print_status "$1 installed"
    else
        print_status "$1 already installed"
    fi
}

# Function to install package (Arch)
install_package_arch() {
    if ! pacman -Qi "$1" &> /dev/null; then
        print_step "Installing $1..."
        sudo pacman -S --noconfirm "$1" > /dev/null 2>&1
        print_status "$1 installed"
    else
        print_status "$1 already installed"
    fi
}

# Check and install Python 3.11+
print_step "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
        print_status "Python $PYTHON_VERSION found"
    else
        print_warning "Python 3.11+ required. Found: $PYTHON_VERSION"
        if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
            install_package_debian "python3.11" || install_package_debian "python3"
        elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
            install_package_arch "python"
        else
            print_error "Please install Python 3.11+ manually"
            exit 1
        fi
    fi
else
    print_step "Installing Python 3..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "python3"
        install_package_debian "python3-venv"
        install_package_debian "python3-pip"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "python"
    else
        print_error "Please install Python 3.11+ manually"
        exit 1
    fi
fi

# Check and install Node.js
print_step "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION found"
else
    print_step "Installing Node.js..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "nodejs"
        install_package_debian "npm"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "nodejs"
        install_package_arch "npm"
    else
        # Try using nvm or download from nodejs.org
        print_warning "Node.js not found. Please install manually from https://nodejs.org/"
        print_warning "Or use: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        exit 1
    fi
fi

# Check and install npm
if ! command -v npm &> /dev/null; then
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "npm"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "npm"
    fi
fi

# Check and install Docker
print_step "Checking Docker..."
if command -v docker &> /dev/null; then
    print_status "Docker found"
    # Check if user is in docker group
    if groups | grep -q docker; then
        print_status "User is in docker group"
    else
        print_warning "Adding user to docker group (requires logout/login to take effect)"
        sudo usermod -aG docker "$USER" || true
    fi
else
    print_step "Installing Docker..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        # Install Docker
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        sudo sh /tmp/get-docker.sh
        sudo usermod -aG docker "$USER"
        print_status "Docker installed. Please log out and log back in for group changes to take effect."
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "docker"
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker "$USER"
    else
        print_error "Please install Docker manually from https://docs.docker.com/get-docker/"
        exit 1
    fi
fi

# Check docker-compose
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    print_status "docker-compose found"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    print_status "docker compose (plugin) found"
else
    print_step "Installing docker-compose..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "docker-compose"
        DOCKER_COMPOSE_CMD="docker-compose"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "docker-compose"
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_warning "docker-compose not found, but Docker Compose plugin should work"
        DOCKER_COMPOSE_CMD="docker compose"
    fi
fi

# Check and install mpv
print_step "Checking mpv..."
if command -v mpv &> /dev/null; then
    print_status "mpv found"
else
    print_step "Installing mpv..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "mpv"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "mpv"
    else
        print_warning "mpv not found. Please install manually: sudo apt install mpv"
    fi
fi

# Check and install yt-dlp
print_step "Checking yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    print_status "yt-dlp found"
else
    print_step "Installing yt-dlp..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        # Try apt first
        if install_package_debian "yt-dlp" 2>/dev/null; then
            print_status "yt-dlp installed via apt"
        else
            # Fallback to pip
            print_step "Installing yt-dlp via pip..."
            python3 -m pip install --user yt-dlp > /dev/null 2>&1 || sudo python3 -m pip install yt-dlp > /dev/null 2>&1
            print_status "yt-dlp installed via pip"
        fi
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "yt-dlp"
    else
        # Fallback to pip
        python3 -m pip install --user yt-dlp > /dev/null 2>&1 || sudo python3 -m pip install yt-dlp > /dev/null 2>&1
        print_status "yt-dlp installed via pip"
    fi
fi

# Check gsettings (for GNOME shortcuts)
print_step "Checking gsettings (for system shortcuts)..."
if command -v gsettings &> /dev/null; then
    print_status "gsettings found (system shortcuts will work)"
else
    print_warning "gsettings not found (system shortcuts won't work, but app will still function)"
fi

# Check curl
print_step "Checking curl..."
if command -v curl &> /dev/null; then
    print_status "curl found"
else
    print_step "Installing curl..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        install_package_debian "curl"
    elif [[ "$OS" == "arch" ]] || [[ "$OS" == "manjaro" ]]; then
        install_package_arch "curl"
    fi
fi

echo ""
echo "🔧 Setting up backend..."
echo ""

cd "$SCRIPT_DIR/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
print_step "Upgrading pip..."
pip install --upgrade pip --quiet > /dev/null 2>&1

# Install Python dependencies
print_step "Installing Python dependencies..."
pip install -r requirements.txt --quiet
print_status "Python dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_step "Creating .env file..."
    cp .env.example .env
    
    # Auto-detect audio device on Linux
    if command -v pactl &> /dev/null; then
        DEFAULT_DEVICE=$(pactl list short sinks 2>/dev/null | head -n1 | awk '{print $2}' || echo "pipewire")
        if [ ! -z "$DEFAULT_DEVICE" ] && [ "$DEFAULT_DEVICE" != "pipewire" ]; then
            if grep -q "DEFAULT_OUTPUT_DEVICE=" .env; then
                sed -i "s|^DEFAULT_OUTPUT_DEVICE=.*|DEFAULT_OUTPUT_DEVICE=$DEFAULT_DEVICE|" .env
            else
                echo "DEFAULT_OUTPUT_DEVICE=$DEFAULT_DEVICE" >> .env
            fi
            print_status "Auto-detected audio device: $DEFAULT_DEVICE"
        else
            if grep -q "DEFAULT_OUTPUT_DEVICE=" .env; then
                sed -i "s|^DEFAULT_OUTPUT_DEVICE=.*|DEFAULT_OUTPUT_DEVICE=pipewire|" .env
            else
                echo "DEFAULT_OUTPUT_DEVICE=pipewire" >> .env
            fi
            print_status "Using default audio device: pipewire"
        fi
    else
        if ! grep -q "DEFAULT_OUTPUT_DEVICE=" .env; then
            echo "DEFAULT_OUTPUT_DEVICE=pipewire" >> .env
        fi
    fi
    
    # Fix database port (docker-compose uses 5433)
    sed -i "s|localhost:5432|localhost:5433|" .env
    
    # Set API_BASE_URL (if not already set)
    if ! grep -q "API_BASE_URL=" .env; then
        echo "" >> .env
        echo "# System Shortcuts (GNOME)" >> .env
        echo "API_BASE_URL=http://localhost:8000" >> .env
    else
        sed -i "s|^API_BASE_URL=.*|API_BASE_URL=http://localhost:8000|" .env
    fi
    
    print_status ".env file created with defaults"
else
    print_status ".env file already exists"
fi

# Create storage directories
print_step "Creating storage directories..."
mkdir -p storage/audio storage/covers
print_status "Storage directories created"

echo ""
echo "🐘 Setting up PostgreSQL..."
echo ""

cd "$SCRIPT_DIR"

# Start PostgreSQL with Docker
print_step "Starting PostgreSQL container..."
if $DOCKER_COMPOSE_CMD up -d postgres 2>&1; then
    print_status "PostgreSQL container started"
    
    # Wait for PostgreSQL to be ready
    print_step "Waiting for PostgreSQL to be ready..."
    MAX_RETRIES=30
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U soundboard &> /dev/null 2>&1; then
            print_status "PostgreSQL is ready"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 1
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_warning "PostgreSQL may not be ready yet, but continuing..."
    fi
else
    print_warning "Failed to start PostgreSQL container"
    print_warning "You may need to run: sudo $DOCKER_COMPOSE_CMD up -d postgres"
    print_warning "Or add your user to docker group and log out/in"
fi

echo ""
echo "🗄️  Running database migrations..."
echo ""

cd "$SCRIPT_DIR/backend"
source venv/bin/activate

# Wait a bit more for DB
sleep 3

# Run migrations
if alembic upgrade head 2>/dev/null; then
    print_status "Database migrations completed"
else
    print_warning "Migration failed (database may not be ready yet)"
    print_warning "Migrations will run automatically on first start"
fi

echo ""
echo "🎨 Setting up frontend..."
echo ""

cd "$SCRIPT_DIR"

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm install --silent
    print_status "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

# Create .env file for frontend if needed
if [ ! -f ".env" ]; then
    print_step "Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:8000/api" > .env
    print_status "Frontend .env created"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ Setup Complete!                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🎉 KeySound Commander is ready to use!"
echo ""
echo "📝 Next steps:"
echo "   1. Run the app: ./run.sh"
echo "   2. Open your browser: http://localhost:8080"
echo ""
echo "💡 Tips:"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - If Docker permissions fail, run: sudo usermod -aG docker $USER"
echo "     Then log out and log back in"
echo ""
