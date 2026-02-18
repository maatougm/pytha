#!/bin/bash
# =============================================================================
# School Hub - Local Development Startup Script (LINUX/MAC)
# =============================================================================
# ⚠️  LOCAL USE ONLY - DO NOT USE IN PRODUCTION
# ⚠️  This script is for local development/testing only
# =============================================================================

set -e

echo "========================================"
echo "  School Hub - LOCAL STARTUP"
echo "  (Development Only - NOT for Production)"
echo "========================================"
echo ""

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# =============================================================================
# Step 1: Start Docker Services
# =============================================================================
echo -e "${GREEN}[1/3]${NC} Starting Docker services..."
if ! docker-compose up -d; then
    echo -e "${RED}[ERROR]${NC} Failed to start Docker services"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker services started"

# Wait for services to initialize
echo "[INFO] Waiting for services to initialize..."
sleep 5

# =============================================================================
# Step 2: Run Database Migrations
# =============================================================================
echo -e "${GREEN}[2/3]${NC} Running database migrations..."
cd server
if ! npx prisma migrate deploy 2>/dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Migration may have failed or already applied"
fi
cd ..

# =============================================================================
# Step 3: Build Flutter Web (if Flutter is available)
# =============================================================================
echo -e "${GREEN}[3/3]${NC} Building Flutter web app..."

if ! command -v flutter &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Flutter not found in PATH"
    echo "[INFO] Skipping Flutter build - using existing files if available"
    echo "[INFO] To build Flutter manually, run: flutter build web --release"
else
    cd mobile
    flutter pub get
    if ! flutter build web --release; then
        echo -e "${RED}[ERROR]${NC} Flutter build failed"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}[OK]${NC} Flutter build complete"
fi

# =============================================================================
# Done
# =============================================================================
echo ""
echo "========================================"
echo "  LOCAL STARTUP COMPLETE!"
echo "========================================"
echo ""
echo "[LOCAL ONLY - NOT FOR PRODUCTION]"
echo ""
echo "Services:"
echo "  API:      http://localhost:3000"
echo "  Web:      http://localhost:8085"
echo "  API Docs: http://localhost:3000/api/docs"
echo ""
echo "To stop: docker-compose down"
echo ""
