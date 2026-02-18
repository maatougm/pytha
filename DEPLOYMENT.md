# School Hub - Production Deployment Guide

This guide covers deploying the School Hub application to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Deployment](#local-deployment)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** 20.10+ and Docker Compose 2.0+
- **Flutter** 3.24+ (for building web)
- **Node.js** 20+ (for running migrations locally)
- **Git** (for version control)

### Server Requirements

- **OS**: Ubuntu 20.04/22.04 LTS or CentOS 8+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **CPU**: 2 cores minimum

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/school-hub.git
cd school-hub

# 2. Copy environment file
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Build and deploy
./scripts/deploy.sh production
```

## Local Deployment

### Option 1: Using Deploy Script

```bash
./scripts/deploy.sh local
```

### Option 2: Manual Steps

```bash
# Build Flutter web
cd mobile
flutter pub get
flutter build web --release
cd ..

# Start services
docker-compose up -d

# Run migrations
cd server
npx prisma migrate deploy
```

## Production Deployment

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/school-hub
sudo chown $USER:$USER /opt/school-hub
cd /opt/school-hub

# Clone repository
git clone https://github.com/yourusername/school-hub.git .

# Setup environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### Step 3: Deploy

```bash
# Run deployment script
./scripts/deploy.sh production

# Or manually:
docker-compose -f docker-compose.production.yml up -d
```

## CI/CD Pipeline

The repository includes a GitHub Actions workflow for automatic deployment.

### Setup GitHub Secrets

Go to `Settings > Secrets and variables > Actions` and add:

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `SSH_HOST` | Production server IP/hostname |
| `SSH_USERNAME` | SSH username |
| `SSH_PRIVATE_KEY` | SSH private key |
| `SSH_PORT` | SSH port (default: 22) |

### Workflow Triggers

- **Push to main**: Deploys to production
- **Pull request**: Runs tests only
- **Tag (v*)**: Deploys tagged version

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `super_secure_password` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Different from JWT_SECRET |
| `ALLOWED_ORIGINS` | CORS origins | `https://yourschool.com` |

### Generating Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64

# Generate database password
openssl rand -base64 32
```

## SSL/HTTPS Setup

### Option 1: Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

### Option 2: Using Cloudflare

1. Set up Cloudflare DNS
2. Enable "Full (Strict)" SSL mode
3. Use Cloudflare origin certificates

## Backup and Recovery

### Automated Backups

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/school-hub"

# Backup database
docker exec sms_postgres_prod pg_dump -U sms_user school_messaging > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/school-hub/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# Add to cron (daily at 2 AM)
echo "0 2 * * * /opt/backup.sh" | sudo crontab -
```

### Restore from Backup

```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Restore database
docker exec -i sms_postgres_prod psql -U sms_user school_messaging < db_backup.sql

# Restore uploads
tar -xzf uploads_backup.tar.gz -C /

# Start services
docker-compose -f docker-compose.production.yml up -d
```

## Monitoring

### Health Checks

```bash
# Check all services
docker ps

# Check API health
curl http://localhost:3000/api/health

# View logs
docker logs -f sms_server_prod
docker logs -f sms_flutter_web_prod
```

### Log Aggregation (Optional)

```yaml
# Add to docker-compose.production.yml
services:
  # ... existing services
  
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs sms_server_prod

# Check for port conflicts
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
```

### Database Connection Issues

```bash
# Check if database is running
docker ps | grep postgres

# Check database logs
docker logs sms_postgres_prod

# Test connection
docker exec -it sms_postgres_prod psql -U sms_user -d school_messaging
```

### Flutter Web Not Loading

```bash
# Check if files exist
docker exec sms_flutter_web_prod ls -la /usr/share/nginx/html

# Check nginx configuration
docker exec sms_flutter_web_prod nginx -t

# Check nginx logs
docker logs sms_flutter_web_prod
```

### SSL Issues

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test HTTPS connection
curl -v https://yourdomain.com
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS only (no HTTP)
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Disable root SSH login
- [ ] Enable automatic security updates
- [ ] Set up log monitoring
- [ ] Configure regular backups
- [ ] Use Docker secrets for sensitive data
- [ ] Enable rate limiting

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/school-hub/issues
- Documentation: See AGENTS.md and README.md
