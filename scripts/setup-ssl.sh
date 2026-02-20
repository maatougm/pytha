#!/bin/bash
# =============================================================================
# SSL Certificate Setup Script (Let's Encrypt)
# =============================================================================
# This script helps set up Let's Encrypt SSL certificates
# 
# Prerequisites:
#   - Domain must point to this server
#   - Ports 80 and 443 must be open
#
# Usage:
#   ./scripts/setup-ssl.sh yourdomain.com
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}ERROR: Domain name is required${NC}"
    echo "Usage: ./scripts/setup-ssl.sh yourdomain.com [email@example.com]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$(dirname "$SCRIPT_DIR")/nginx/ssl"
CERTBOT_DIR="$(dirname "$SCRIPT_DIR")/certbot"

echo "========================================="
echo "SSL Certificate Setup"
echo "========================================="
echo "Domain: $DOMAIN"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing..."
    
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS
        sudo yum install -y certbot
    elif command -v apk &> /dev/null; then
        # Alpine
        sudo apk add certbot
    else
        echo -e "${RED}ERROR: Could not install certbot. Please install manually.${NC}"
        exit 1
    fi
fi

# Create directories
mkdir -p "$SSL_DIR"
mkdir -p "$CERTBOT_DIR/data"
mkdir -p "$CERTBOT_DIR/www"

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${YELLOW}Certificates already exist for $DOMAIN${NC}"
    echo "Renewing certificates..."
    sudo certbot renew --force-renewal -d "$DOMAIN"
else
    echo "Obtaining new certificates for $DOMAIN..."
    
    if [ -z "$EMAIL" ]; then
        echo ""
        read -p "Enter your email for Let's Encrypt notifications: " EMAIL
    fi
    
    # Obtain certificate
    sudo certbot certonly --standalone \
        --agree-tos \
        --no-eff-email \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --cert-name "$DOMAIN"
fi

# Copy certificates to nginx/ssl
echo ""
echo "Copying certificates to nginx/ssl/..."

# Use sudo to read from /etc/letsencrypt
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
sudo cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/" 2>/dev/null || true

# Set proper permissions
sudo chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
chmod 644 "$SSL_DIR"/fullchain.pem
chmod 600 "$SSL_DIR"/privkey.pem

# Create renewal hook to update nginx/ssl on auto-renewal
RENEWAL_HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
if [ -d "$RENEWAL_HOOK_DIR" ]; then
    echo ""
    echo "Setting up auto-renewal hook..."
    
    sudo tee "$RENEWAL_HOOK_DIR/school-hub-$DOMAIN.sh" > /dev/null <<EOF
#!/bin/bash
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
chown $(whoami):$(whoami) "$SSL_DIR"/*.pem
chmod 644 "$SSL_DIR"/fullchain.pem
chmod 600 "$SSL_DIR"/privkey.pem

# Reload nginx if running
if docker ps | grep -q sms_nginx_prod; then
    docker exec sms_nginx_prod nginx -s reload
fi
EOF
    
    sudo chmod +x "$RENEWAL_HOOK_DIR/school-hub-$DOMAIN.sh"
fi

echo ""
echo -e "${GREEN}✓ SSL certificates installed successfully!${NC}"
echo ""
echo "Certificate location: $SSL_DIR/"
echo "  - fullchain.pem"
echo "  - privkey.pem"
echo ""
echo "Auto-renewal:"
echo "  Certificates will auto-renew. The renewal hook will update nginx/ssl/."
echo ""
echo "Manual renewal:"
echo "  sudo certbot renew"
echo ""

# Verify certificate
echo "Verifying certificate..."
openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -subject -dates
