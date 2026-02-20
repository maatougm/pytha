#!/bin/bash
# =============================================================================
# Production Environment Validation Script
# =============================================================================
# This script validates your .env file before deployment
# Run: ./scripts/validate-env.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: $ENV_FILE not found!${NC}"
    echo "Copy .env.production to .env and configure it:"
    echo "  cp .env.production .env"
    exit 1
fi

echo "========================================="
echo "Validating Production Environment"
echo "========================================="
echo ""

# Load the env file
set -a
source "$ENV_FILE"
set +a

ERRORS=0
WARNINGS=0

# Function to check if variable is set
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ] || [[ "$var_value" == CHANGE_* ]] || [[ "$var_value" == "yourdomain.com" ]]; then
        echo -e "${RED}✗ $var_name is not set or uses default value${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $var_name is set${NC}"
        return 0
    fi
}

# Function to check password strength
check_password_strength() {
    local var_name=$1
    local var_value=${!var_name}
    local min_length=${2:-32}
    
    if [ ${#var_value} -lt $min_length ]; then
        echo -e "${RED}✗ $var_name is too short (${#var_value} chars, min $min_length)${NC}"
        return 1
    fi
    
    if [[ "$var_value" =~ (password|secret|admin|123|default) ]]; then
        echo -e "${YELLOW}⚠ $var_name may contain common weak words${NC}"
        ((WARNINGS++))
        return 0
    fi
    
    echo -e "${GREEN}✓ $var_name meets length requirement (${#var_value} chars)${NC}"
    return 0
}

echo "Checking Required Variables..."
echo "----------------------------------------"

# Required variables
REQUIRED_VARS=("DOMAIN_NAME" "API_BASE_URL" "DB_USER" "DB_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")

for var in "${REQUIRED_VARS[@]}"; do
    if ! check_required "$var"; then
        ((ERRORS++))
    fi
done

echo ""
echo "Checking Password/Secret Strength..."
echo "----------------------------------------"

# Check password strength
if ! check_password_strength "DB_PASSWORD" 32; then
    ((ERRORS++))
fi

if ! check_password_strength "REDIS_PASSWORD" 32; then
    ((ERRORS++))
fi

# JWT secrets should be 64+ characters
if ! check_password_strength "JWT_SECRET" 64; then
    ((ERRORS++))
fi

if ! check_password_strength "JWT_REFRESH_SECRET" 64; then
    ((ERRORS++))
fi

# Check JWT secrets are different
if [ "$JWT_SECRET" == "$JWT_REFRESH_SECRET" ]; then
    echo -e "${RED}✗ JWT_SECRET and JWT_REFRESH_SECRET must be different!${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ JWT secrets are different${NC}"
fi

echo ""
echo "Checking Domain Configuration..."
echo "----------------------------------------"

# Check API_BASE_URL uses HTTPS in production
if [[ "$API_BASE_URL" == http://* ]] && [[ "$API_BASE_URL" != "http://localhost"* ]]; then
    echo -e "${YELLOW}⚠ API_BASE_URL should use HTTPS in production${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ API_BASE_URL uses HTTPS or localhost${NC}"
fi

# Check if ALLOWED_ORIGINS includes DOMAIN_NAME
if [[ "$ALLOWED_ORIGINS" != *"$DOMAIN_NAME"* ]]; then
    echo -e "${YELLOW}⚠ ALLOWED_ORIGINS should include $DOMAIN_NAME${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ ALLOWED_ORIGINS includes domain${NC}"
fi

echo ""
echo "Checking SSL Certificates..."
echo "----------------------------------------"

# Check SSL certificates exist
SSL_DIR="nginx/ssl"
if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo -e "${GREEN}✓ SSL certificates found${NC}"
    
    # Check if certificates are readable
    if openssl x509 -in "$SSL_DIR/fullchain.pem" -noout 2>/dev/null; then
        echo -e "${GREEN}✓ SSL certificate is valid${NC}"
        
        # Check expiry
        EXPIRY=$(openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -enddate | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s)
        NOW_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
            echo -e "${RED}✗ SSL certificate expires in $DAYS_UNTIL_EXPIRY days!${NC}"
            ((ERRORS++))
        elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo -e "${YELLOW}⚠ SSL certificate expires in $DAYS_UNTIL_EXPIRY days${NC}"
            ((WARNINGS++))
        else
            echo -e "${GREEN}✓ SSL certificate expires in $DAYS_UNTIL_EXPIRY days${NC}"
        fi
    else
        echo -e "${RED}✗ SSL certificate is invalid or corrupted${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠ SSL certificates not found in $SSL_DIR/${NC}"
    echo "  Expected files: fullchain.pem, privkey.pem"
    ((WARNINGS++))
fi

echo ""
echo "Checking Docker..."
echo "----------------------------------------"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
    
    if docker compose version &> /dev/null || docker-compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose is available${NC}"
    else
        echo -e "${RED}✗ Docker Compose is not installed${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗ Docker is not installed${NC}"
    ((ERRORS++))
fi

echo ""
echo "========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Deploy with:"
    echo "  docker-compose -f docker-compose.prod.yml up -d --build"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found. Review before deploying.${NC}"
    echo ""
    echo "You can proceed with:"
    echo "  docker-compose -f docker-compose.prod.yml up -d --build"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found. Fix before deploying.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) also found.${NC}"
    fi
    exit 1
fi
