#!/bin/bash
# Check system and container status

echo "=========================================="
echo "📊 School Hub - System Status"
echo "=========================================="
echo ""

cd /opt/school-hub || exit 1

echo "🐳 Container Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "💻 System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory: $(free -h | awk '/^Mem:/{print $3 "/" $2}')"
echo "Disk: $(df -h /opt | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "🌐 Network:"
IP=$(curl -s ifconfig.me || echo "Unavailable")
echo "Public IP: $IP"
echo "Ports: 80 (HTTP), 443 (HTTPS)"

echo ""
echo "📋 Recent Logs (last 10 lines):"
docker compose -f docker-compose.prod.yml logs --tail=10 2>/dev/null || echo "No logs available"

echo ""
echo "✅ Status check complete"
