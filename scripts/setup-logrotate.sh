#!/bin/bash
# =============================================================================
# Log Rotation Setup Script
# =============================================================================
# Installs log rotation configuration for School Hub
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Detect actual path
if [ -d "$PROJECT_DIR/logs" ]; then
    LOGS_PATH="$PROJECT_DIR/logs"
    BACKUPS_PATH="$PROJECT_DIR/backups"
else
    echo "ERROR: Could not find logs directory"
    exit 1
fi

echo "Setting up log rotation..."
echo "Logs path: $LOGS_PATH"
echo "Backups path: $BACKUPS_PATH"

# Create logrotate config with actual paths
cat > /tmp/school-hub-logrotate <<EOF
$LOGS_PATH/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        docker exec sms_nginx_prod nginx -s reload 2>/dev/null || true
    endscript
}

$LOGS_PATH/server/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}

$BACKUPS_PATH/*.sql.gz {
    daily
    rotate 7
    missingok
    notifempty
}
EOF

# Install the config
if command -v logrotate &> /dev/null; then
    sudo cp /tmp/school-hub-logrotate /etc/logrotate.d/school-hub
    sudo chmod 644 /etc/logrotate.d/school-hub
    echo "✓ Log rotation config installed to /etc/logrotate.d/school-hub"
    
    # Test the configuration
    if sudo logrotate -d /etc/logrotate.d/school-hub 2>&1 | grep -q "error"; then
        echo "Warning: logrotate config test showed errors"
    else
        echo "✓ Log rotation config is valid"
    fi
else
    echo "Warning: logrotate not found. Please install logrotate."
    echo "Config saved to: /tmp/school-hub-logrotate"
fi

# Clean up
rm -f /tmp/school-hub-logrotate

echo ""
echo "Log rotation configured:"
echo "  - Nginx logs: 14 days retention"
echo "  - Server logs: 30 days retention"
echo "  - Backups: 7 days retention"
