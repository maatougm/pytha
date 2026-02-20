#!/bin/bash
# Run these commands on your server

echo "=== Check if this IS the repo ==="
git status

echo ""
echo "=== Check git log ==="
git log --oneline -3

echo ""
echo "=== Check all files (including hidden) ==="
ls -la

echo ""
echo "=== Check if files are in another branch ==="
git branch -a

echo ""
echo "=== Check Docker volumes (might have code there) ==="
docker volume ls | grep sms

echo ""
echo "=== Check if project is elsewhere ==="
find / -name "docker-compose.prod.yml" 2>/dev/null
find / -name "server" -type d 2>/dev/null | head -5
