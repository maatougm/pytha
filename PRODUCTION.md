# School Hub - Production Deployment Guide

Complete guide for deploying School Hub to production with SSL, monitoring, and backups.

## 📋 Prerequisites

- Ubuntu 20.04/22.04 LTS server (2+ GB RAM, 20+ GB disk)
- Domain name pointing to your server
- Docker and Docker Compose installed
- Flutter installed (for building web app)

## 🚀 Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/yourusername/school-hub.git
cd school-hub

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Deploy
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh yourdomain.com admin@yourdomain.com
```

## 🔧 Step-by-Step Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Re-login for Docker permissions
exit
# SSH back in
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.production.example .env.production

# Generate secure secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For DB_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD

# Edit the file
nano .env.production
```

**Required values in `.env.production`:**

| Variable | Description | Generate With |
|----------|-------------|---------------|
| `JWT_SECRET` | JWT signing key | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Refresh token key | `openssl rand -base64 64` |
| `DB_PASSWORD` | Database password | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Redis password | `openssl rand -base64 32` |
| `DOMAIN_NAME` | Your domain | - |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `https://yourdomain.com` |

### 3. Deploy

```bash
./scripts/deploy-production.sh yourdomain.com admin@yourdomain.com
```

This script will:
1. ✅ Check prerequisites
2. ✅ Set up SSL certificates (Let's Encrypt)
3. ✅ Build Flutter web app
4. ✅ Build and start Docker containers
5. ✅ Run database migrations
6. ✅ Verify deployment
7. ✅ Configure SSL auto-renewal

## 🌐 Access Your Application

After deployment:

- **Web App**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **API Docs**: https://yourdomain.com/api/docs
- **Health Check**: https://yourdomain.com/api/health

## 📊 Monitoring (Optional)

Enable monitoring stack with Prometheus and Grafana:

```bash
docker-compose -f docker-compose.prod.yml --profile with-logging up -d
```

Access:
- **Grafana**: http://your-server-ip:3001 (admin/admin)
- **Prometheus**: http://your-server-ip:9090

## 💾 Backups

### Automated Backups

Backups run automatically daily at 2 AM. Files stored in `./backups/`.

Configure S3 backup (optional) in `.env.production`:
```env
S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Manual Backup

```bash
./scripts/backup.sh
```

### Restore from Backup

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
gunzip < backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U sms_user -d school_messaging

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 Updates

To update to a new version:

```bash
# Pull latest code
git pull origin main

# Re-run deployment (keeps data)
./scripts/deploy-production.sh yourdomain.com admin@yourdomain.com
```

## 📈 Scaling

### Scale API Servers

```bash
# Run 3 API instances behind load balancer
docker-compose -f docker-compose.prod.yml up -d --scale server=3
```

### Database Connection Pooling

Adjust in `docker-compose.prod.yml`:
```yaml
DATABASE_URL: postgresql://.../school_messaging?connection_limit=30
```

## 🔒 Security Checklist

- [ ] Changed all default passwords
- [ ] JWT secrets are 64+ characters
- [ ] Database password is strong
- [ ] Redis password is set
- [ ] Firewall enabled (UFW): `sudo ufw enable && sudo ufw allow 22,80,443`
- [ ] Automatic security updates: `sudo apt install unattended-upgrades`
- [ ] SSL certificates auto-renew
- [ ] Regular backups configured

## 🆘 Troubleshooting

### Check Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f server
```

### Restart Services

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Database Issues

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U sms_user -d school_messaging
```

### SSL Certificate Issues

```bash
# Renew manually
sudo certbot renew --force-renewal

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 📞 Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment: `docker-compose -f docker-compose.prod.yml config`
3. Health check: `curl https://yourdomain.com/api/health`
