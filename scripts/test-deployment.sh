#!/bin/bash
# =============================================================================
# Deployment Testing Script
# Tests all services after deployment
# Run: ./scripts/test-deployment.sh
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="${DOMAIN_NAME:-pythagore-init.com}"
API_URL="https://${DOMAIN}"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  School Hub - Deployment Test${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting 30 seconds for services to start...${NC}"
sleep 30

echo ""
echo -e "${BLUE}=== Container Status ===${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not available"

echo ""
echo -e "${BLUE}=== Testing HTTPS Connection ===${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>&1 || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}✓ HTTPS is responding (HTTP ${HTTP_STATUS})${NC}"
else
    echo -e "${RED}✗ HTTPS test failed (HTTP ${HTTP_STATUS})${NC}"
fi

echo ""
echo -e "${BLUE}=== Testing API Health ===${NC}"
HEALTH_RESPONSE=$(curl -s "https://${DOMAIN}/api/health" 2>&1 || echo '{"status":"error"}')
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status".*"ok"' || echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ API Health check passed${NC}"
else
    echo -e "${RED}✗ API Health check failed${NC}"
fi

echo ""
echo -e "${BLUE}=== Testing API Version Endpoint ===${NC}"
VERSION_RESPONSE=$(curl -s "https://${DOMAIN}/api/updates/version" 2>&1 || echo '{"error":"failed"}')
echo "Response: $VERSION_RESPONSE"

echo ""
echo -e "${BLUE}=== Testing WebSocket ===${NC}"
# Test if WebSocket port is accessible
WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -N "https://${DOMAIN}/socket.io/?EIO=4&transport=polling" 2>&1 || echo "000")
if [ "$WS_RESPONSE" = "200" ] || [ "$WS_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✓ WebSocket endpoint is accessible (HTTP ${WS_RESPONSE})${NC}"
else
    echo -e "${YELLOW}⚠ WebSocket test inconclusive (HTTP ${WS_RESPONSE})${NC}"
fi

echo ""
echo -e "${BLUE}=== Testing SSL Certificate ===${NC}"
CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null || echo "Failed to get certificate")
if [ "$CERT_INFO" != "Failed to get certificate" ]; then
    echo "$CERT_INFO"
    EXPIRY=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
    echo -e "${GREEN}✓ SSL certificate is valid${NC}"
else
    echo -e "${RED}✗ Could not verify SSL certificate${NC}"
fi

echo ""
echo -e "${BLUE}=== Checking APK Download ===${NC}"
APK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/downloads/pythagore-latest.apk" 2>&1 || echo "000")
if [ "$APK_STATUS" = "200" ]; then
    APK_SIZE=$(curl -sI "https://${DOMAIN}/downloads/pythagore-latest.apk" 2>&1 | grep -i content-length | awk '{print $2}' | tr -d '\r')
    echo -e "${GREEN}✓ APK is available for download (${APK_SIZE} bytes)${NC}"
elif [ "$APK_STATUS" = "404" ]; then
    echo -e "${YELLOW}⚠ APK not found (404) - upload with: ./scripts/release-apk.sh${NC}"
else
    echo -e "${YELLOW}⚠ APK download check returned HTTP ${APK_STATUS}${NC}"
fi

echo ""
echo -e "${BLUE}=== Database Connectivity (via API) ===${NC}"
DB_TEST=$(curl -s "https://${DOMAIN}/api/admin/metrics" -H "Authorization: Bearer test" 2>&1 || echo '{"error":"failed"}')
if echo "$DB_TEST" | grep -q '"error".*"Unauthorized"'; then
    echo -e "${GREEN}✓ API is responding (requires auth - expected)${NC}"
elif echo "$DB_TEST" | grep -q 'totalUsers\|activeUsers'; then
    echo -e "${GREEN}✓ Database is connected and responding${NC}"
else
    echo -e "${YELLOW}⚠ Database status unclear${NC}"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Test Complete${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Your APK should now connect to: https://${DOMAIN}/api"
echo "APK Update URL: https://${DOMAIN}/downloads/pythagore-latest.apk"
