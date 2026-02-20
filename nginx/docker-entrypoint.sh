#!/bin/sh
# =============================================================================
# Nginx Docker Entrypoint
# =============================================================================
# Substitutes environment variables into nginx configuration template
# =============================================================================

set -e

echo "========================================="
echo "Starting Nginx Configuration"
echo "========================================="

# Required environment variables
: "${DOMAIN_NAME:?DOMAIN_NAME is required}"
: "${API_BASE_URL:?API_BASE_URL is required}"

echo "Domain: ${DOMAIN_NAME}"
echo "API Base URL: ${API_BASE_URL}"

# Substitute environment variables into nginx config
envsubst '${DOMAIN_NAME} ${API_BASE_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Verify nginx configuration
echo "Validating nginx configuration..."
nginx -t

echo "========================================="
echo "Nginx configuration validated successfully"
echo "========================================="

# Execute the main command
exec "$@"
