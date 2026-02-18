# School Hub 🎓

**Production-Ready School Messaging & Management System**

A full-stack web application for educational institutions featuring real-time messaging, course management, assignments, attendance tracking, and file sharing.

[![Tests](https://img.shields.io/badge/tests-28%20passing-brightgreen)](./server)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](./client)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![School Hub Preview](docs/preview.png)

## 🚀 Quick Start (Local Development)

> ⚠️ **LOCAL USE ONLY - NOT FOR PRODUCTION**

### One-Command Startup

**Windows:**
```powershell
start-local.bat
```

**Linux/Mac:**
```bash
./start-local.sh
```

This will:
1. Start Docker containers (PostgreSQL, Redis, Backend)
2. Run database migrations
3. Build Flutter web app (if Flutter is installed)

Then open:
- Web App: http://localhost:8085
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

**Demo Login (after seeding):**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | Password123! |
| Teacher | teacher1@school.com | Password123! |
| Parent | parent1@school.com | Password123! |
| Student | student1@school.com | Password123! |

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Teacher, Parent, Student)
- Password hashing with bcrypt (12 rounds)
- Input validation and sanitization
- Helmet.js security headers
- Rate limiting on WebSocket events

### 💬 Real-Time Messaging
- WebSocket-powered instant messaging
- Redis adapter for horizontal scaling
- Channel-based conversations (class, teacher-parent, admin broadcasts)
- Message editing and deletion
- Typing indicators
- Online/offline status
- Read receipts

### 📚 Course Management
- Course catalog with departments
- Class scheduling with recurring sessions
- Student enrollment management
- Teacher assignments

### 📝 Assignments & Grading
- Assignment creation with due dates
- File submissions
- Grading with feedback
- Gradebook view
- Late submission tracking

### 📅 Attendance Tracking
- Session-based attendance marking
- Present/Absent/Late/Excused statuses
- Attendance reports and statistics
- Calendar view

### 📁 File Management
- Secure file uploads (max 10MB)
- MIME type validation
- Permission-based access
- Download tracking

### 📊 Admin Dashboard
- Real-time analytics via WebSocket
- User management
- Audit logs
- System health monitoring
- Content moderation queue

### 🌍 Internationalization
- Multi-language support (English, French, Arabic)
- RTL (Right-to-Left) layout for Arabic
- Language switching with persistence

### 📱 Progressive Web App (PWA)
- Installable on desktop and mobile devices
- Offline support with cached data
- Push notifications for messages and updates
- Background sync for queued messages
- App-like fullscreen experience
- Home screen shortcuts for quick access

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Vue 3)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Courses  │ │Messaging│ │  Files  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └─────────────┴─────────┴─────────────┘               │
│                         │                                    │
│                    Pinia Store                               │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              │   Vue Router        │                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼───────────────────────────────────┘
                          │ API / WebSocket
┌─────────────────────────┼───────────────────────────────────┐
│                    Server (NestJS)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Courses  │ │Messaging│ │  Files  │           │
│  │ Module  │ │ Module  │ │Gateway  │ │ Module  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └─────────────┴─────────┴─────────────┘               │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              │    Prisma ORM       │                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼───────────────────────────────────┘
              ┌───────────┴───────────┐
              │                       │
        ┌─────┴─────┐          ┌──────┴──────┐
        │ PostgreSQL │          │    Redis    │
        │    16     │          │     7       │
        └───────────┘          └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/school-hub.git
cd school-hub

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

```bash
# Server environment
cd ../server
cp .env.example .env

# Client environment
cd ../client
cp .env.example .env
```

Edit `.env` files with your configuration.

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

### 4. Database Setup

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run start:dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Visit `http://localhost:5173` and log in with:
- **Admin**: `admin@school.com` / `Password123!`
- **Teacher**: `teacher1@school.com` / `Password123!`
- **Student**: `student1@school.com` / `Password123!`
- **Parent**: `parent1@school.com` / `Password123!`

## ⚠️ IMPORTANT: Local Development Only

> **This setup is for LOCAL TESTING and DEVELOPMENT only.**
> 
> The `start-local` scripts and `docker-compose.yml` are NOT suitable for production use.
> They lack proper security hardening, SSL certificates, and production optimizations.
> 
> For production deployment, additional configuration is required (reverse proxy, SSL, secrets management, etc.)

---

## 📁 Project Structure

```
school-hub/
├── mobile/                 # Flutter Frontend (Web + Mobile)
│   ├── lib/                # Dart source code
│   ├── build/web/          # Compiled web app
│   └── web/                # Web-specific files
│
├── server/                 # NestJS Backend
│   ├── src/                # Source code
│   ├── prisma/             # Database schema
│   └── Dockerfile
│
├── docker-compose.yml      # Local development compose
├── start-local.bat         # Windows startup script
├── start-local.sh          # Linux/Mac startup script
└── .env                    # Environment variables
```

## 📁 Project Structure

```
school-hub/
├── client/                 # Vue 3 Frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # Pinia stores
│   │   ├── i18n/           # Translations
│   │   └── styles/         # CSS/SCSS
│   └── dist/               # Production build
│
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── messaging/      # Messaging module
│   │   ├── courses/        # Courses module
│   │   ├── grading/        # Assignments & grades
│   │   ├── attendance/     # Attendance module
│   │   ├── files/          # File management
│   │   ├── admin/          # Admin dashboard
│   │   └── prisma/         # Database schema
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── dist/               # Compiled output
│
├── docker-compose.yml      # Development compose
├── docker-compose.prod.yml # Production compose
└── .github/
    └── workflows/          # CI/CD pipelines
```

## 🧪 Testing

```bash
# Server tests
cd server
npm test

# Test coverage
cd server
npm run test:cov
```

## 📊 Database Schema

![Database Schema](docs/db-schema.png)

Key entities:
- **Users** with roles (admin, teacher, parent, student)
- **Channels** for messaging with members
- **Courses** and **Classes** with enrollments
- **Assignments** with submissions and grades
- **Attendance** sessions and records
- **Files** with permissions

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting (30 msg/min, 60 typing/min)
- ✅ Input validation with class-validator
- ✅ SQL injection prevention via Prisma
- ✅ XSS protection
- ✅ File upload validation (MIME types, size)
- ✅ JWT secret validation (no fallback)

## 🚀 Performance Optimizations

- Redis adapter for WebSocket horizontal scaling
- Database connection pooling
- Lazy-loaded Vue routes
- Asset compression (gzip/brotli)
- CDN-ready static assets
- Pagination on all list endpoints

## 🛠️ Tech Stack

### Frontend
- **Flutter** - Cross-platform UI framework
- **Dart** - Programming language
- **Riverpod** - State management
- **Go Router** - Navigation
- **Dio** - HTTP client
- **Socket.io Client** - WebSocket client

### Backend
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **Socket.io** - WebSocket server
- **Redis** - Session store & pub/sub
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Local orchestration
- **GitHub Actions** - CI/CD
- **Jest** - Testing framework

## 📝 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

## 🔧 Troubleshooting

### "Invalid length of startup packet" PostgreSQL Error

This error occurs when HTTP requests are sent to the PostgreSQL port (5433). Common causes:

1. **Port scanners or bots** hitting the exposed PostgreSQL port
2. **Browser accessing wrong URL** (e.g., `http://localhost:5433` instead of `http://localhost:5173`)
3. **Misconfigured health checks**

**Solution:**
- The docker-compose now binds PostgreSQL to `127.0.0.1:5433` only (localhost)
- In production, don't expose database ports publicly
- Check that your browser is pointing to the correct frontend port (5173)

```bash
# Restart containers with new config
docker-compose down
docker-compose up -d
```

### Database Connection Issues

If you see "Connection refused" errors:

1. Check if containers are running:
   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify environment variables in `server/.env`:
   ```env
   DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging"
   ```

4. For Docker deployment, use service names:
   ```env
   DATABASE_URL="postgresql://sms_user:sms_password_2026@postgres:5432/school_messaging"
   ```

### WebSocket Connection Issues

If real-time messaging doesn't work:

1. Check Redis is running:
   ```bash
   docker-compose logs redis
   ```

2. Verify `REDIS_URL` environment variable

3. Check browser console for CORS errors

4. Ensure `ALLOWED_ORIGINS` includes your frontend URL

### Reset Everything

To start fresh:

```bash
# Stop all containers
docker-compose down

# Remove volumes (DELETES ALL DATA!)
docker-compose down -v

# Restart and reseed
docker-compose up -d
cd server
npx prisma migrate dev
npx prisma db seed
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [Material Design Icons](https://materialdesignicons.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)

---

**Built with ❤️ for education**
#   p y t h a 
 
 