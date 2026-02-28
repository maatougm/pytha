#!/bin/bash
# Setup script for the hosted server at pythagore-init.com
# Run this on the server to configure environment variables

set -e

echo "=========================================="
echo "School Hub Server Setup"
echo "=========================================="
echo ""

# Generate strong passwords if not already set
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64)
    echo "Generated JWT_SECRET"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    echo "Generated JWT_REFRESH_SECRET"
fi

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    echo "Generated DB_PASSWORD"
fi

if [ -z "$REDIS_PASSWORD" ]; then
    REDIS_PASSWORD=$(openssl rand -base64 32)
    echo "Generated REDIS_PASSWORD"
fi

# Create .env file
cat > .env << EOF
# Domain & API Configuration
DOMAIN_NAME=pythagore-init.com
API_BASE_URL=https://pythagore-init.com
WS_BASE_URL=https://pythagore-init.com
ALLOWED_ORIGINS=https://pythagore-init.com,http://localhost:8085,http://localhost:5173

# Database
DB_USER=sms_user_prod
DB_PASSWORD=$DB_PASSWORD

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Server
NODE_ENV=production
LOG_LEVEL=info
API_REPLICAS=1

# Grafana
GRAFANA_PASSWORD=$(openssl rand -base64 16)
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "Starting Docker containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=========================================="
echo "Server setup complete!"
echo "=========================================="
echo ""
echo "Testing endpoints..."
sleep 5

curl -s https://pythagore-init.com/api/health | jq . || echo "Health check failed"

echo ""
echo "Next steps:"
echo "1. Test auth: curl -X POST https://pythagore-init.com/api/auth/login \\"
echo "   -H 'Content-Type: application/json' \\"
echo "   -d '{\"email\":\"admin@school.com\",\"password\":\"Password123!\"}'"
echo ""
echo "2. Build and deploy mobile app"
