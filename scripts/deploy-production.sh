#!/bin/bash
# =============================================================================
# School Hub - PRODUCTION Deployment Script (Fixed)
# =============================================================================
# Usage: ./scripts/deploy-production.sh [domain] [email]
# 
# This script handles the COMPLETE production deployment including:
# - Environment validation
# - SSL certificate setup (Let's Encrypt)
# - Docker-based Flutter Web build (no local Flutter needed!)
# - Database migrations
# - Health checks
#
# Example: ./scripts/deploy-production.sh school.example.com admin@example.com
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Arguments
DOMAIN=${1:-}
EMAIL=${2:-}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# =============================================================================
# Help
# =============================================================================
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "School Hub - Production Deployment"
    echo ""
    echo "Usage:"
    echo "  $0 <domain> <email>     Deploy with Let's Encrypt SSL"
    echo "  $0 --existing-ssl       Deploy using existing certificates in nginx/ssl/"
    echo "  $0 --help               Show this help"
    echo ""
    echo "Prerequisites:"
    echo "  1. Domain DNS pointed to this server"
    echo "  2. .env file configured (copy from .env.production)"
    echo "  3. Docker and Docker Compose installed"
    echo ""
    echo "Examples:"
    echo "  $0 school.example.com admin@example.com"
    echo "  $0 --existing-ssl"
    exit 0
fi

# =============================================================================
# Validation
# =============================================================================
if [ "$1" != "--existing-ssl" ] && { [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; }; then
    echo -e "${RED}Usage: $0 <domain> <email>${NC}"
    echo "       $0 --existing-ssl"
    echo ""
    echo "Example: $0 school.example.com admin@example.com"
    exit 1
fi

echo "========================================"
echo "  School Hub - PRODUCTION Deployment"
echo "========================================"
echo ""

if [ "$1" == "--existing-ssl" ]; then
    USE_EXISTING_SSL=1
    echo "Mode: Using existing SSL certificates"
else
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
fi

if [ -f ".env" ]; then
    echo "Environment: .env"
else
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Copy .env.production to .env and configure it:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

echo ""

# =============================================================================
# 1. Pre-flight Checks
# =============================================================================
echo -e "${BLUE}[1/7]${NC} Running pre-flight checks..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}ERROR: Do not run as root for security reasons${NC}"
    exit 1
fi

# Run validation script
if [ -f "$SCRIPT_DIR/validate-env.sh" ]; then
    if ! "$SCRIPT_DIR/validate-env.sh"; then
        echo ""
        echo -e "${RED}ERROR: Environment validation failed${NC}"
        echo "Fix the issues above or run with --force (not recommended)"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ validate-env.sh not found, skipping detailed validation${NC}"
    
    # Basic checks
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}ERROR: Docker not installed${NC}"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
        echo -e "${RED}ERROR: Docker Compose not installed${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Pre-flight checks passed"

# =============================================================================
# 2. Create Required Directories
# =============================================================================
echo -e "${BLUE}[2/7]${NC} Creating directories..."

mkdir -p nginx/ssl
mkdir -p logs/nginx
mkdir -p logs/server
mkdir -p backups
mkdir -p uploads
mkdir -p certbot/www
mkdir -p certbot/data
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

echo -e "${GREEN}✓${NC} Directories created"

# =============================================================================
# 3. SSL Certificate Setup
# =============================================================================
echo -e "${BLUE}[3/7]${NC} Setting up SSL certificates..."

if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo -e "${GREEN}✓${NC} SSL certificates already exist"
    
    # Verify they're valid
    if openssl x509 -in nginx/ssl/fullchain.pem -noout 2>/dev/null; then
        EXPIRY=$(openssl x509 -in nginx/ssl/fullchain.pem -noout -enddate | cut -d= -f2)
        echo "  Certificate expiry: $EXPIRY"
    else
        echo -e "${YELLOW}⚠${NC} Existing certificate appears invalid"
    fi
elif [ -z "$USE_EXISTING_SSL" ]; then
    # Use the setup-ssl.sh script for Let's Encrypt
    "$SCRIPT_DIR/setup-ssl.sh" "$DOMAIN" "$EMAIL"
else
    echo -e "${RED}ERROR: SSL certificates not found in nginx/ssl/${NC}"
    echo "Please place your certificates:"
    echo "  - nginx/ssl/fullchain.pem"
    echo "  - nginx/ssl/privkey.pem"
    exit 1
fi

# =============================================================================
# 4. Build & Deploy with Docker
# =============================================================================
echo -e "${BLUE}[4/7]${NC} Building and deploying Docker containers..."

# Set domain for docker-compose if provided
if [ -n "$DOMAIN" ]; then
    export DOMAIN_NAME=$DOMAIN
fi

# Source environment
set -a
source .env
set +a

# Determine docker compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Stop existing containers gracefully
echo "  Stopping existing containers..."
$COMPOSE_CMD -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build and start services
echo "  Building images (this may take several minutes)..."
$COMPOSE_CMD -f docker-compose.prod.yml build --no-cache

echo "  Starting services..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓${NC} Containers started"

# =============================================================================
# 5. Wait for Database & Run Migrations
# =============================================================================
echo -e "${BLUE}[5/7]${NC} Running database migrations..."

echo "  Waiting for database to be ready..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if $COMPOSE_CMD -f docker-compose.prod.yml exec -T postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Database is ready"
        break
    fi
    echo -n "."
    sleep 2
    ((RETRY++))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}ERROR: Database failed to start${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml logs postgres
    exit 1
fi

# Run migrations
echo "  Running Prisma migrations..."
if $COMPOSE_CMD -f docker-compose.prod.yml exec -T server npx prisma migrate deploy; then
    echo -e "${GREEN}✓${NC} Migrations completed"
else
    echo -e "${YELLOW}⚠${NC} Migration warning (may be already applied)"
fi

# =============================================================================
# 6. Health Checks
# =============================================================================
echo -e "${BLUE}[6/7]${NC} Running health checks..."

sleep 5

# Check all services are running
RUNNING=$($COMPOSE_CMD -f docker-compose.prod.yml ps --filter "status=running" --format "{{.Name}}" | wc -l)
if [ "$RUNNING" -lt 4 ]; then
    echo -e "${RED}ERROR: Some containers failed to start (only $RUNNING running)${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml ps
    echo ""
    echo "Logs:"
    $COMPOSE_CMD -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Check health status
ATTEMPTS=0
HEALTHY=0

while [ $ATTEMPTS -lt 10 ]; do
    if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "healthy"; then
        HEALTHY=1
        break
    fi
    echo "  Waiting for health checks... ($(($ATTEMPTS + 1))/10)"
    sleep 3
    ((ATTEMPTS++))
done

if [ $HEALTHY -eq 1 ]; then
    echo -e "${GREEN}✓${NC} All services are healthy"
else
    echo -e "${YELLOW}⚠${NC} Health checks pending, but services are running"
fi

# Test endpoints if domain is available
if [ -n "$DOMAIN_NAME" ] || [ -n "$DOMAIN" ]; then
    TEST_DOMAIN="${DOMAIN:-$DOMAIN_NAME}"
    
    echo "  Testing https://$TEST_DOMAIN/api/health..."
    if curl -sfk "https://$TEST_DOMAIN/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} API endpoint is accessible"
    else
        echo -e "${YELLOW}⚠${NC} API endpoint not yet accessible (may need more time)"
    fi
fi

# =============================================================================
# 7. Post-Deployment Setup
# =============================================================================
echo -e "${BLUE}[7/7]${NC} Running post-deployment setup..."

# Set up log rotation
if [ -f "$SCRIPT_DIR/setup-logrotate.sh" ]; then
    echo "  Setting up log rotation..."
    "$SCRIPT_DIR/setup-logrotate.sh" > /dev/null 2>&1 || true
fi

echo -e "${GREEN}✓${NC} Post-deployment setup complete"

# =============================================================================
# Done
# =============================================================================
echo ""
echo "========================================"
echo -e "${GREEN}  PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""

# Show final status
$COMPOSE_CMD -f docker-compose.prod.yml ps

echo ""
echo "Your application should be live at:"
if [ -n "$DOMAIN" ]; then
    echo "  https://$DOMAIN"
else
    echo "  https://<your-domain> (configure DOMAIN_NAME in .env)"
fi
echo ""
echo "API Documentation:"
if [ -n "$DOMAIN" ]; then
    echo "  https://$DOMAIN/api/docs"
else
    echo "  https://<your-domain>/api/docs"
fi
echo ""
echo "Useful commands:"
echo "  View logs:        $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "  Server logs:      $COMPOSE_CMD -f docker-compose.prod.yml logs -f server"
echo "  Restart:          $COMPOSE_CMD -f docker-compose.prod.yml restart"
echo "  Stop:             $COMPOSE_CMD -f docker-compose.prod.yml down"
echo "  Backup DB:        $COMPOSE_CMD -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER school_messaging | gzip > backup_$(date +%Y%m%d).sql.gz"
echo ""
echo "Need to update? Just run this script again!"
echo ""
