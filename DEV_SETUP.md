# Development Setup - School Hub

## Quick Start

### 1. Start Backend & Database
```bash
# Start PostgreSQL, Redis, and Backend API
docker-compose up -d

# The backend will be available at http://localhost:3000
```

### 2. Run Flutter Web (Development)
```bash
cd mobile

# Get dependencies
flutter pub get

# Run in Chrome
flutter run -d chrome --web-port 8080

# Or build for production
flutter build web --release
```

### 3. Run Flutter Mobile (Development)
```bash
cd mobile

# Run on connected device/emulator
flutter run
```

---

## 🔒 Security Fixes Applied

All critical security issues have been fixed:

| Issue | Status | Location |
|-------|--------|----------|
| SQL Injection | ✅ Fixed | `admin.service.ts:520` - Using `Prisma.sql` |
| Bulk Action Validation | ✅ Fixed | `admin.service.ts:621` - UUID validation |
| File Preview Auth | ✅ Fixed | `files.controller.ts:375` - Auth check first |

---

## 🌐 Flutter Web Configuration

### Environment Variables

For **Web**, set these before building:
```bash
# API URL (use localhost for local dev)
API_BASE_URL=http://localhost:3000
WS_BASE_URL=http://localhost:3000
```

For **Mobile**, use your machine's IP:
```bash
API_BASE_URL=http://192.168.1.100:3000
WS_BASE_URL=http://192.168.1.100:3000
```

### Storage Abstraction

| Platform | Storage Method |
|----------|----------------|
| Web | Hive (IndexedDB) |
| Mobile | FlutterSecureStorage |

---

## 🐳 Docker Deployment

### Full Stack (Production)
```bash
# Build and run everything
docker-compose up -d --build

# Services:
# - Flutter Web: http://localhost:8080
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5434
# - Redis: localhost:6379
```

### Individual Services
```bash
# Only database
docker-compose up -d postgres redis

# Only backend (with local DB)
cd server && npm run dev

# Only Flutter web
cd mobile && flutter run -d chrome
```

---

## 📁 Project Structure

```
minivirson/
├── docker-compose.yml          # Full stack orchestration
├── mobile/                     # Flutter app (Mobile + Web)
│   ├── lib/
│   │   ├── main.dart          # Entry point with web support
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   └── api_client.dart      # Web/mobile storage abstraction
│   │   │   ├── socket/
│   │   │   │   └── socket_service.dart  # WebSocket with web support
│   │   │   └── config/
│   │   │       └── app_config.dart      # Platform-specific config
│   │   └── screens/           # All UI screens
│   ├── Dockerfile.web         # Flutter web Docker build
│   └── nginx.conf             # Web server config
└── server/                    # NestJS backend
    └── src/
        └── ... (security fixes applied)
```

---

## ✅ Testing Checklist

### Backend
- [ ] SQL injection prevented in admin analytics
- [ ] Bulk actions validate UUIDs
- [ ] File preview requires authentication
- [ ] API responds correctly at http://localhost:3000/api

### Flutter Web
- [ ] Login works with test credentials
- [ ] WebSocket connects and receives messages
- [ ] File upload works
- [ ] Responsive layout on different screen sizes

### Flutter Mobile
- [ ] App builds for Android/iOS
- [ ] Secure storage works
- [ ] Push notifications (if configured)

---

## 🚀 Production Deployment

### Build Flutter Web
```bash
cd mobile
flutter build web --release
# Output: mobile/build/web/
```

### Build Docker Images
```bash
# Production stack
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker-compose -f docker-compose.prod.yml push
```

---

## 🔧 Troubleshooting

### Flutter Web not connecting to API
```bash
# Check CORS is enabled in backend
# Verify API_BASE_URL environment variable
# Try: flutter run -d chrome --web-port 8080 --dart-define=API_BASE_URL=http://localhost:3000
```

### WebSocket connection failed (Web)
```bash
# Web requires polling transport first
# Check socket_service.dart uses correct transports
# Verify WS_BASE_URL is set correctly
```

### Hive errors on web
```bash
# Clear browser local storage
# Run: flutter clean && flutter pub get
```

---

## 📚 Next Steps

1. **Add Fee Management Module** - You have the MDB data ready!
2. **Implement Transport Management** - Bus tracking, routes
3. **Add Library Management** - Book catalog, lending
4. **Complete HR/Payroll** - Staff management

See `AGENTS.md` for full project documentation.
