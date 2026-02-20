#!/bin/bash
# Run these commands on your server (you're already in /root)

echo "=== Finding minivirson directory ==="
ls -la | grep -i minivirson

# If you see minivirson directory:
cd minivirson

# Create the environment file
cat > .env << 'EOF'
DOMAIN_NAME=pythagore-init.com
API_BASE_URL=https://pythagore-init.com
WS_BASE_URL=https://pythagore-init.com
ALLOWED_ORIGINS=https://pythagore-init.com,http://localhost:8085,http://localhost:5173

DB_USER=sms_user_prod
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
NODE_ENV=production
LOG_LEVEL=info
API_REPLICAS=1
GRAFANA_PASSWORD=$(openssl rand -base64 16)
EOF

echo "=== Environment file created ==="
cat .env

echo ""
echo "=== Restarting Docker containers ==="
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Waiting for server to start ==="
sleep 10

echo "=== Testing endpoints ==="
echo "Health check:"
curl -s https://pythagore-init.com/api/health | jq . 2>/dev/null || curl -s https://pythagore-init.com/api/health

echo ""
echo "Auth test (expect 401, not 404):"
curl -s -X POST https://pythagore-init.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"test"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "=== Done! ==="
