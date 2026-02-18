#!/bin/bash
# =============================================================================
# School Hub - PRODUCTION Deployment Script
# =============================================================================
# Usage: ./deploy-production.sh [domain] [email]
# Example: ./deploy-production.sh school.example.com admin@example.com
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

# Validation
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Usage: $0 <domain> <email>${NC}"
    echo "Example: $0 school.example.com admin@example.com"
    exit 1
fi

echo "========================================"
echo "  School Hub - PRODUCTION Deployment"
echo "========================================"
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# =============================================================================
# 1. Pre-flight Checks
# =============================================================================
echo -e "${BLUE}[1/8]${NC} Running pre-flight checks..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}ERROR: Do not run as root${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose not installed${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}ERROR: .env.production not found${NC}"
    echo "Copy .env.production.example to .env.production and fill in values"
    exit 1
fi

# Source production environment
set -a
source .env.production
set +a

# Validate required variables
if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}ERROR: JWT_SECRET must be at least 32 characters${NC}"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}ERROR: DB_PASSWORD not set${NC}"
    exit 1
fi

if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${RED}ERROR: REDIS_PASSWORD not set${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Pre-flight checks passed"

# =============================================================================
# 2. Create Required Directories
# =============================================================================
echo -e "${BLUE}[2/8]${NC} Creating directories..."

mkdir -p nginx/ssl
mkdir -p logs/nginx
mkdir -p backups
mkdir -p uploads
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

echo -e "${GREEN}✓${NC} Directories created"

# =============================================================================
# 3. SSL Certificate Setup (Let's Encrypt)
# =============================================================================
echo -e "${BLUE}[3/8]${NC} Setting up SSL certificates..."

if [ ! -f "nginx/ssl/fullchain.pem" ]; then
    echo "SSL certificates not found. Setting up Let's Encrypt..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot
    fi
    
    # Create temporary nginx config for certbot
    mkdir -p var/www/certbot
    
    # Get certificate
    sudo certbot certonly --standalone \
        --preferred-challenges http \
        --agree-tos \
        --non-interactive \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" || true
    
    # Copy certificates
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" nginx/ssl/
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" nginx/ssl/
        sudo cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" nginx/ssl/
        sudo chown -R $USER:$USER nginx/ssl/
        echo -e "${GREEN}✓${NC} SSL certificates installed"
    else
        echo -e "${YELLOW}⚠${NC} SSL certificate generation failed. Using self-signed..."
        
        # Generate self-signed certificate temporarily
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/privkey.pem \
            -out nginx/ssl/fullchain.pem \
            -subj "/CN=$DOMAIN"
        cp nginx/ssl/fullchain.pem nginx/ssl/chain.pem
    fi
else
    echo -e "${GREEN}✓${NC} SSL certificates already exist"
fi

# =============================================================================
# 4. Build Flutter Web
# =============================================================================
echo -e "${BLUE}[4/8]${NC} Building Flutter web app..."

cd mobile

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Flutter not found. Please install Flutter first."
    exit 1
fi

# Get dependencies
flutter pub get

# Build for production
flutter build web --release

cd ..

echo -e "${GREEN}✓${NC} Flutter build completed"

# =============================================================================
# 5. Database Migrations
# =============================================================================
echo -e "${BLUE}[5/8]${NC} Running database migrations..."

cd server

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build the server
npm run build

cd ..

echo -e "${GREEN}✓${NC} Server build completed"

# =============================================================================
# 6. Deploy with Docker
# =============================================================================
echo -e "${BLUE}[6/8]${NC} Deploying with Docker Compose..."

# Export environment for docker-compose
export DOMAIN_NAME=$DOMAIN

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "Waiting for database..."
sleep 15

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T server npx prisma migrate deploy

echo -e "${GREEN}✓${NC} Deployment completed"

# =============================================================================
# 7. Post-deployment Verification
# =============================================================================
echo -e "${BLUE}[7/8]${NC} Verifying deployment..."

# Wait for services
sleep 10

# Check if containers are running
RUNNING=$(docker-compose -f docker-compose.prod.yml ps -q | wc -l)
if [ "$RUNNING" -lt 3 ]; then
    echo -e "${RED}ERROR: Some containers failed to start${NC}"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Test health endpoint
if curl -sf "https://$DOMAIN/api/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} API is healthy"
else
    echo -e "${YELLOW}⚠${NC} API health check failed (may still be starting)"
fi

# Test web app
if curl -sf "https://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}✓${NC} Web app is accessible"
else
    echo -e "${YELLOW}⚠${NC} Web app check failed"
fi

echo -e "${GREEN}✓${NC} Verification completed"

# =============================================================================
# 8. Setup Auto-renewal for SSL
# =============================================================================
echo -e "${BLUE}[8/8]${NC} Setting up SSL auto-renewal..."

# Add certbot renewal hook
if command -v certbot &> /dev/null; then
    # Create renewal hook
    sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    
    cat << EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/school-hub.sh > /dev/null
#!/bin/bash
# Copy new certificates to app directory
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/school-hub/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/school-hub/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/chain.pem /opt/school-hub/nginx/ssl/
chown -R deploy:deploy /opt/school-hub/nginx/ssl/

# Reload nginx
cd /opt/school-hub && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
EOF
    
    sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/school-hub.sh
    
    # Add cron job for renewal
    (sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 2 * * * certbot renew --quiet") | sudo crontab -
    
    echo -e "${GREEN}✓${NC} SSL auto-renewal configured"
fi

# =============================================================================
# Done
# =============================================================================
echo ""
echo "========================================"
echo -e "${GREEN}  PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Your application is now live at:"
echo "  https://$DOMAIN"
echo ""
echo "API Documentation:"
echo "  https://$DOMAIN/api/docs"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Scale API: docker-compose -f docker-compose.prod.yml up -d --scale server=3"
echo "  Backup:    ./scripts/backup.sh"
echo "  Update:    ./scripts/deploy-production.sh $DOMAIN $EMAIL"
echo ""
