# Server Deployment Checklist

## Problem
Auth endpoints return 404 on hosted server (187.77.70.67:3000)
- ✅ `/api/health` works
- ❌ `/api/auth/login` returns 404

## Root Cause
Missing required environment variables on the hosted server.

## Fix Steps

### 1. SSH into your hosted server
```bash
ssh root@187.77.70.67
```

### 2. Go to the project directory
```bash
cd /path/to/minivirson
```

### 3. Create the .env file
```bash
cat > .env << 'EOF'
# Domain & API
DOMAIN_NAME=187.77.70.67
API_BASE_URL=http://187.77.70.67:3000
WS_BASE_URL=http://187.77.70.67:3000
ALLOWED_ORIGINS=http://localhost:8085,http://localhost:5173,http://187.77.70.67:3000

# Database (use your actual credentials)
DB_USER=sms_user_prod
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE

# Redis
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD_HERE

# JWT Secrets (MUST be 64+ chars! Generate with: openssl rand -base64 64)
JWT_SECRET=YOUR_64_CHAR_JWT_SECRET_HERE_CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_64_CHARS
JWT_REFRESH_SECRET=YOUR_DIFFERENT_64_CHAR_REFRESH_SECRET_HERE_MINIMUM_64_CHARS_REQUIRED

# Server
NODE_ENV=production
LOG_LEVEL=info
API_REPLICAS=1
EOF
```

### 4. Generate strong secrets
```bash
# Run these and copy output to .env
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For DB_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
```

### 5. Restart the server
```bash
# Option A: Docker Compose
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Option B: If running directly with Node
# Stop the current process, then:
cd server
npm install
npm run build
npm run start:prod
```

### 6. Verify the fix
```bash
# Test health
curl http://187.77.70.67:3000/api/health

# Test auth - should return 401 (not 404)
curl -X POST http://187.77.70.67:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"Password123!"}'
```

## Expected Results After Fix

| Endpoint | Before (Broken) | After (Fixed) |
|----------|-----------------|---------------|
| `GET /api/health` | ✅ 200 OK | ✅ 200 OK |
| `POST /api/auth/login` | ❌ 404 Not Found | ✅ 401 Unauthorized (expected - wrong credentials) |
| `POST /api/auth/login` (correct creds) | ❌ 404 | ✅ 200 OK with tokens |

## Quick Test from Your PC

Once the server is fixed, test from your local Flutter app:

```bash
cd mobile
flutter run -d chrome
```

Then try to login with:
- Email: `admin@school.com`
- Password: `Password123!`
