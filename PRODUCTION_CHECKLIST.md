# School Hub - Production Deployment Checklist

Use this checklist before deploying to production.

## ✅ Pre-Deployment Checks

### Environment Setup
- [ ] Created `.env.production` from `.env.production.example`
- [ ] Generated strong `JWT_SECRET` (64+ characters)
- [ ] Generated strong `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] Set secure database password
- [ ] Configured `ALLOWED_ORIGINS` with production domain(s)
- [ ] Verified all environment variables are set

### Security
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets committed to git
- [ ] SSL certificates ready (for HTTPS)
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Database not exposed to internet
- [ ] Redis not exposed to internet
- [ ] API rate limiting enabled

### Code Quality
- [ ] All tests passing
- [ ] No `console.log` statements in production code
- [ ] No debug flags enabled
- [ ] Flutter web built in release mode
- [ ] Database migrations tested

## ✅ Git Repository Setup

### Repository Configuration
```bash
# Run git setup script
./scripts/git-setup.sh        # Linux/Mac
.\scripts\git-setup.bat       # Windows
```

- [ ] Git hooks configured
- [ ] Line endings configured
- [ ] `.gitignore` up to date
- [ ] `.gitattributes` configured

### Files to Commit
- [ ] All source code
- [ ] Docker files
- [ ] Deployment scripts
- [ ] Configuration templates (`.env.example`)
- [ ] Documentation

### Files to NOT Commit
- [ ] `.env`
- [ ] `.env.production`
- [ ] `node_modules/`
- [ ] `build/`, `dist/`
- [ ] SSL certificates (`.pem`, `.key`)
- [ ] Uploaded files
- [ ] Log files

## ✅ Server Setup

### System Requirements
- [ ] Ubuntu 20.04/22.04 LTS or CentOS 8+
- [ ] 2GB+ RAM
- [ ] 20GB+ disk space
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed

### Security Hardening
- [ ] SSH key authentication only (no password)
- [ ] Root login disabled
- [ ] Firewall enabled (UFW/Firewalld)
- [ ] Automatic security updates enabled
- [ ] Fail2ban installed (optional)

## ✅ Deployment

### Build Process
```bash
# 1. Build Flutter web
cd mobile
flutter pub get
flutter build web --release

# 2. Run deployment
cd ..
./scripts/deploy.sh production
```

- [ ] Flutter web builds successfully
- [ ] Docker images build without errors
- [ ] Database migrations run successfully
- [ ] All containers start
- [ ] Health checks pass

### Post-Deployment Verification
```bash
# Check all services
docker ps

# Test API
curl http://localhost:3000/api/health

# Test web app
curl http://localhost:8085
```

- [ ] API responding correctly
- [ ] Web app loading
- [ ] Database connected
- [ ] Redis connected
- [ ] File uploads working
- [ ] WebSocket connections working

## ✅ SSL/HTTPS Setup

### Let's Encrypt
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

- [ ] SSL certificate obtained
- [ ] Certificate files in correct location
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured

## ✅ Backup & Recovery

### Backup Setup
```bash
# Create backup directory
sudo mkdir -p /backups/school-hub

# Setup automated backups
sudo crontab -e
# Add: 0 2 * * * /opt/school-hub/scripts/backup.sh
```

- [ ] Backup script created
- [ ] Automated backups scheduled
- [ ] Backup location configured
- [ ] Backup retention policy set

### Recovery Test
- [ ] Test database restore process
- [ ] Test file recovery process
- [ ] Document recovery procedures

## ✅ Monitoring & Alerts

### Health Monitoring
- [ ] Container health checks enabled
- [ ] API health endpoint monitored
- [ ] Database health monitored
- [ ] Disk space monitoring
- [ ] Memory usage monitoring

### Log Management
- [ ] Log rotation configured
- [ ] Centralized logging (optional)
- [ ] Error alerting setup (optional)

## ✅ Final Verification

### Functionality Tests
- [ ] User registration works
- [ ] User login works
- [ ] All user roles work (admin, teacher, parent, student)
- [ ] Messaging works
- [ ] File upload/download works
- [ ] Attendance tracking works
- [ ] Grading system works

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Concurrent user handling tested

### Security Tests
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] JWT tokens expire correctly

## 🆘 Rollback Plan

If deployment fails:

```bash
# Stop new containers
docker-compose -f docker-compose.production.yml down

# Restore from backup (if needed)
# See DEPLOYMENT.md for restore procedures

# Revert to previous version
git checkout <previous-commit>
./scripts/deploy.sh production
```

## 📞 Support Contacts

- **Technical Lead**: [Name] - [Email]
- **DevOps**: [Name] - [Email]
- **Hosting Provider**: [Contact]

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Verification Completed**: _______________
