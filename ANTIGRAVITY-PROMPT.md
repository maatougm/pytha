# Antigravity Prompt: Fix School Hub (Minivirson) Production Deployment

## Project Overview
School Hub (Minivirson) is a Flutter + NestJS school messaging app. SSL is configured but auth endpoints are broken.

## Current Status

### ✅ What's Working
- Domain: https://pythagore-init.com with SSL certificate
- Health endpoint: `GET https://pythagore-init.com/api/health` returns `{"status":"ok"}`
- Flutter app configured to use `https://pythagore-init.com/api`
- Docker containers exist (sms_postgres, sms_redis) but are stopped

### ❌ What's Broken
- Auth endpoints return 404: `POST https://pythagore-init.com/api/auth/login`
- Server environment variables not configured
- Project files missing from /root (only .git exists, no server/ or mobile/ folders)

## Server Information
- **Server**: srv1368151 (root access available)
- **Domain**: pythagore-init.com
- **Current directory**: /root (has .git but no project files)
- **Docker containers**: sms_postgres, sms_redis exist but stopped

## Tasks Required

### Task 1: Restore Project Files (CRITICAL)
The project was in /root but files are missing. Options:
1. Check git history: `git log --oneline`, `git status`, restore files
2. Or clone from backup/repository if exists
3. Or check if files are in another location: `find / -name "docker-compose.prod.yml"`

### Task 2: Create Environment File
Create `/root/.env` with:
```bash
DOMAIN_NAME=pythagore-init.com
API_BASE_URL=https://pythagore-init.com
WS_BASE_URL=https://pythagore-init.com
ALLOWED_ORIGINS=https://pythagore-init.com,http://localhost:8085

DB_USER=sms_user_prod
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
NODE_ENV=production
LOG_LEVEL=info
```

### Task 3: Start Production Server
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Task 4: Verify Auth Works
Test should return 401 (not 404):
```bash
curl -X POST https://pythagore-init.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"test"}'
```

### Task 5: Build Flutter APK (if needed)
```bash
cd mobile
flutter build apk --release
cp build/app/outputs/flutter-apk/app-release.apk ../server/downloads/minivirson-latest.apk
```

## Success Criteria
- [ ] `POST https://pythagore-init.com/api/auth/login` returns 401 (not 404)
- [ ] `POST https://pythagore-init.com/api/auth/login` with correct credentials returns 200 with tokens
- [ ] `GET https://pythagore-init.com/api/update/check` works
- [ ] Flutter app can login successfully

## Notes
- Database may need migrations: `npm run prisma:migrate` in server container
- Seed data may need to be re-added if database was wiped
- SSL certificates are already working (handled by hosting provider)

## Access
- Server: root@srv1368151 (already logged in)
- Working directory: /root
- Docker available: Yes
- Git repository: Yes (but files missing)

GET THIS APP WORKING PRODUCTION READY NOW!
