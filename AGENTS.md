# School Hub (Minivirson) - School Messaging System

A full-stack school management platform featuring real-time messaging, course management, assignments, attendance tracking, and file sharing with role-based access control.

## Project Overview

School Hub is a **School Management System** designed to facilitate communication and collaboration between administrators, teachers, parents, and students. The system provides comprehensive role-based access control and real-time messaging via WebSockets. The mobile application is packaged under the name "Minivirson".

### Key Features

- **Real-time Messaging**: WebSocket-powered instant messaging with channels for teacher-parent, teacher-admin, classroom, and broadcast communications
- **Course Management**: Course catalog, class scheduling with recurring sessions, enrollments, and teacher assignments
- **Assignment & Grading**: Assignment creation, file submissions, grade tracking with feedback, and late submission tracking
- **Attendance Tracking**: Session-based attendance marking with present/absent/late/excused statuses
- **File Management**: Secure file uploads (max 10MB) with MIME type validation and permission-based access
- **Role-Based Access**: Four user roles (admin, teacher, parent, student) with different permissions
- **Admin Dashboard**: Real-time analytics, user management, audit logs, system health monitoring, and content moderation
- **Audit Logging**: Track important actions for compliance and moderation
- **Mobile App**: Flutter-based cross-platform mobile application (named "Minivirson")
- **Mobile App Updates**: Built-in update checking and APK download endpoints

## Technology Stack

### Backend (server/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.4.x | Node.js framework for building scalable server-side applications |
| **TypeScript** | 5.6.x | Type-safe JavaScript development |
| **Prisma** | 5.20.x | ORM for database operations and schema management |
| **PostgreSQL** | 16 | Primary relational database |
| **Redis** | 7 | Caching, WebSocket adapter storage, pub/sub, and token denylist |
| **Socket.IO** | 4.7.x | Real-time bidirectional event-based communication |
| **JWT** | - | Authentication with access (15min) and refresh (7d) tokens |
| **bcrypt** | 5.1.x | Password hashing (12 rounds) |
| **class-validator** | 0.14.x | DTO validation |
| **Helmet** | 8.1.x | Security headers |
| **Swagger** | 7.4.x | API documentation |
| **Jest** | 29.5.x | Testing framework |
| **Winston** | 3.19.x | Logging |
| **DOMPurify** | 3.3.x | XSS protection via jsdom |
| **@nestjs/schedule** | 6.1.x | Cron jobs for soft-delete cleanup |
| **@nestjs/throttler** | 6.5.x | Rate limiting |

### Mobile App (mobile/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | 3.24.x | Cross-platform mobile framework |
| **Dart** | 3.x+ | Programming language |
| **Dio** | 5.7.x | HTTP client for API communication |
| **Socket.IO Client** | 2.0.x | Real-time WebSocket client |
| **Riverpod** | 2.6.x | State management |
| **Go Router** | 14.6.x | Navigation |
| **Hive** | 1.1.x | Local storage for web |
| **flutter_secure_storage** | 9.2.x | Secure key storage for mobile |
| **freezed** | 2.5.x | Immutable data classes |
| **json_serializable** | 6.8.x | JSON serialization |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization for all services |
| **Docker Compose** | Local development and production orchestration |
| **Nginx** | Reverse proxy and static file serving (production) |
| **Prometheus** | Metrics collection (production optional) |
| **Grafana** | Metrics visualization (production optional) |
| **Loki** | Log aggregation (production optional) |

## Project Structure

```
minivirson/
├── .env                      # Shared environment configuration
├── .env.example              # Environment template
├── .env.production           # Production environment template
├── docker-compose.yml        # Development infrastructure
├── docker-compose.prod.yml   # Full production stack
├── README.md                # Human-readable documentation
├── PRODUCTION.md            # Production deployment guide
├── PRODUCTION_DEPLOYMENT.md # Detailed deployment procedures
├── PRODUCTION_FIX_QUICKSTART.md # Production troubleshooting
├── PRODUCTION_FIXES_SUMMARY.md # Known issues and fixes
├── PRODUCTION_ROADMAP.md    # Production roadmap
├── AGENTS.md                # This file - AI agent documentation
├── backups/                 # Database backup storage
├── mobile/                  # Flutter mobile application
│   ├── pubspec.yaml         # Flutter dependencies
│   ├── analysis_options.yaml # Dart analyzer configuration
│   ├── lib/
│   │   ├── main.dart        # Application entry point
│   │   ├── app.dart         # Root application widget
│   │   ├── core/            # Core utilities
│   │   │   ├── api/         # API client (dio with auth interceptor)
│   │   │   ├── config/      # App configuration
│   │   │   ├── socket/      # WebSocket management
│   │   │   └── theme/       # App theming (light/dark)
│   │   ├── models/          # Data models (user, course, file, etc.)
│   │   ├── providers/       # Riverpod state providers (auth, messaging)
│   │   ├── repositories/    # Data access layer (auth_repository)
│   │   ├── screens/         # UI screens
│   │   │   ├── admin/       # Admin dashboard screens
│   │   │   ├── assignments/ # Assignment screens
│   │   │   ├── attendance/  # Attendance screens
│   │   │   ├── auth/        # Login/register screens
│   │   │   ├── courses/     # Course screens
│   │   │   ├── files/       # File management screens
│   │   │   ├── grades/      # Grade viewing screens
│   │   │   ├── home/        # Home dashboard
│   │   │   ├── messaging/   # Chat/messaging screens
│   │   │   └── profile/     # User profile screens
│   │   └── services/        # Business logic services
│   ├── assets/              # Images and icons
│   ├── android/             # Android platform files
│   ├── web/                 # Web-specific files
│   └── Dockerfile.web       # Flutter web build Dockerfile
├── nginx/                   # Nginx configuration for production
├── monitoring/              # Monitoring configuration (Grafana, Prometheus, Loki)
├── scripts/                 # Utility scripts
│   ├── backup.sh            # Database backup script
│   ├── deploy-production.sh # Production deployment
│   ├── setup-kvm.sh         # KVM server setup
│   ├── setup-ssl.sh         # SSL certificate setup
│   ├── status.sh            # Service status check
│   └── validate-env.sh      # Environment validation
└── server/                  # Backend application
    ├── Dockerfile           # Multi-stage production build
    ├── package.json         # Backend dependencies
    ├── tsconfig.json        # TypeScript configuration
    ├── nest-cli.json        # NestJS CLI configuration
    ├── jest.config.js       # Unit test configuration
    ├── jest-e2e.config.js   # E2E test configuration
    ├── prisma/
    │   ├── schema.prisma    # Database schema definition (731 lines)
    │   ├── seed.ts          # Database seeding script
    │   └── migrations/      # Database migrations
    ├── uploads/             # File upload storage directory
    ├── downloads/           # APK download directory
    ├── coverage/            # Test coverage reports
    ├── test/                # Test files
    │   ├── setup.ts         # Unit test setup with Redis mock
    │   ├── setup.e2e.ts     # E2E test setup with migrations
    │   ├── auth.e2e-spec.ts # Auth E2E tests
    │   └── __mocks__/       # Jest mocks
    └── src/
        ├── main.ts          # NestJS application entry
        ├── app.module.ts    # Root application module
        ├── config/          # Configuration
        ├── prisma/          # Prisma service module
        ├── auth/            # Authentication module
        ├── users/           # User management module
        ├── messaging/       # Messaging & WebSocket gateway
        ├── admin/           # Admin dashboard module
        ├── analytics/       # Analytics module
        ├── courses/         # Course and class management
        ├── grading/         # Assignments and grades
        ├── attendance/      # Attendance tracking
        ├── files/           # File upload and management
        ├── health/          # Health checks
        ├── notifications/   # Email notifications
        ├── mentions/        # User mentions in messages
        ├── moderation/      # Audit logging
        ├── redis/           # Redis client module
        ├── update/          # Mobile app update endpoints
        └── common/          # Shared utilities
```

## Module Architecture

### Backend Modules

Each module follows NestJS conventions with controllers, services, and DTOs:

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **AuthModule** | JWT-based authentication with access/refresh tokens, Redis denylist | `auth.service.ts`, `jwt.strategy.ts`, `roles.guard.ts` |
| **UsersModule** | User CRUD and profile management | `users.controller.ts`, `users.service.ts` |
| **MessagingModule** | Real-time messaging via Socket.IO gateway + REST API, Redis adapter for scaling | `messaging.gateway.ts`, `messaging.service.ts`, `typing.service.ts` |
| **AdminModule** | Admin dashboard, user management, system stats | `admin.controller.ts`, `admin.gateway.ts` |
| **AnalyticsModule** | System analytics and reporting | `analytics.service.ts` |
| **CoursesModule** | Course catalog, classes, enrollments, schedules | `courses.controller.ts`, `courses.service.ts` |
| **GradingModule** | Assignments, submissions, and gradebook | `grading.controller.ts`, `grading.service.ts` |
| **AttendanceModule** | Attendance sessions and records | `attendance.controller.ts`, `attendance.service.ts` |
| **FilesModule** | File uploads with permission-based access | `files.controller.ts`, `files.service.ts` |
| **ModerationModule** | Audit logging for compliance | `moderation.controller.ts`, `moderation.service.ts` |
| **NotificationsModule** | Email notifications and queue | `notifications.service.ts`, `email.processor.ts` |
| **MentionsModule** | User mentions in messages | `mentions.service.ts` |
| **SoftDeleteModule** | Soft delete functionality with cleanup jobs | `soft-delete.service.ts`, `soft-delete-cleanup.service.ts` |
| **HealthModule** | System health checks | `health.controller.ts` |
| **PrismaModule** | Database connection | `prisma.service.ts` |
| **RedisModule** | Redis client management | `redis.service.ts` |
| **UpdateModule** | Mobile app version checking and APK updates | `update.controller.ts` |

## Environment Configuration

The project uses environment files at multiple levels:

### Root `.env` (Shared)

```env
# Database
DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5434/school_messaging?schema=public&connect_timeout=10"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="school-msg-jwt-secret-change-in-production-2026"
JWT_REFRESH_SECRET="school-msg-refresh-secret-change-in-production-2026"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4173,http://localhost:8085"
CLIENT_URL=http://localhost:5173
```

### Production `.env`

See `.env.production` for the complete production environment template. Key required variables:

```env
# Domain & API Configuration
DOMAIN_NAME=yourdomain.com
API_BASE_URL=https://yourdomain.com
WS_BASE_URL=${API_BASE_URL}
ALLOWED_ORIGINS=https://yourdomain.com

# Database
DB_USER=sms_user_prod
DB_PASSWORD=<strong-password>

# Redis
REDIS_PASSWORD=<strong-password>

# JWT (64+ characters)
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<different-64-char-secret>

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# S3/Object Storage (optional)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## Build and Development Commands

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- npm 8+
- Docker & Docker Compose
- Flutter SDK 3.x+ (for mobile)

### Quick Start (One Command)

**Windows:**
```powershell
start-local.bat
```

**Linux/Mac:**
```bash
./start-local.sh
```

This will start Docker containers, run migrations, and build the Flutter web app.

### Infrastructure Setup (Manual)

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### Backend (server/)

```bash
# Install dependencies
npm install

# Database operations
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:seed        # Seed database with demo data
npm run prisma:studio      # Open Prisma Studio GUI

# Development
npm run dev                # Start development server with hot reload (port 3000)
npm run start:debug        # Start with debugger enabled

# Production
npm run build              # Build TypeScript to dist/
npm run start:prod         # Run production build

# Testing
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:e2e           # Run end-to-end tests

# Code quality
npm run lint               # Run ESLint with auto-fix
```

### Mobile App (mobile/)

```bash
# Install dependencies
flutter pub get

# Development
flutter run                # Run on connected device/emulator
flutter run --debug        # Debug mode
flutter run --profile      # Profile mode

# Build
flutter build apk          # Build Android APK
flutter build appbundle    # Build Android App Bundle
flutter build ios          # Build iOS (macOS only)
flutter build web          # Build web app

# Testing
flutter test               # Run unit tests
flutter test --coverage    # Run tests with coverage

# Code generation
flutter pub run build_runner build    # Generate code (freezed, json_serializable)
flutter pub run build_runner build --delete-conflicting-outputs
```

### Full Development Startup

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Setup database (in server/ directory)
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 3. Start backend (in server/ directory)
npm run dev

# 4. Start mobile app (in mobile/ directory, new terminal)
cd ../mobile
flutter pub get
flutter run
```

### Production Deployment

```bash
# 1. Copy and configure production environment
cp .env.production .env
# Edit .env with your actual values

# 2. Validate environment
./scripts/validate-env.sh

# 3. Build and run production stack
docker-compose -f docker-compose.prod.yml up -d --build
```

Production stack includes:
- PostgreSQL (internal network only)
- Redis (internal network only, password-protected)
- NestJS API server (port 3000)
- Flutter Web frontend (port 80)
- Nginx reverse proxy/load balancer (ports 80/443)
- Optional: Backup service, Grafana, Prometheus, Loki

## Testing Strategy

### Unit Tests

- **Framework**: Jest with ts-jest
- **Location**: `src/**/*.spec.ts`
- **Configuration**: `jest.config.js`
- **Setup**: `test/setup.ts` with Redis mocking
- **Coverage**: Reports generated in `coverage/` directory

```bash
cd server
npm test                   # Run all unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
```

### E2E Tests

- **Framework**: Jest with supertest
- **Location**: `test/*.e2e-spec.ts`
- **Configuration**: `jest-e2e.config.js`
- **Setup**: `test/setup.e2e.ts` with database migrations

```bash
cd server
npm run test:e2e           # Run E2E tests
```

### Test Setup Files

- `test/setup.ts`: Unit test environment variables, Redis mock, JSDOM mock for DOMPurify
- `test/setup.e2e.ts`: E2E test database setup and migrations
- `test/__mocks__/jsdom.mock.ts`: JSDOM mock for DOMPurify

### Load Testing

- Configuration: `test/load/artillery.config.yml`
- Uses Artillery for load testing

## Code Style Guidelines

### Backend (TypeScript/NestJS)

- **Class Names**: PascalCase (e.g., `AuthService`, `MessagingGateway`)
- **Variables/Functions**: camelCase (e.g., `findUserById`, `isAuthenticated`)
- **File Names**: kebab-case (e.g., `auth.service.ts`, `jwt-auth.guard.ts`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Decorators**: Use metadata decorators (`@Controller()`, `@Injectable()`)
- **DTOs**: Use `class-validator` decorators for validation
- **Architecture**: Services contain business logic; controllers handle HTTP layer
- **Database**: Use Prisma's type-safe queries
- **Imports**: Group by external, then internal, then relative

Example:
```typescript
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}
```

### Mobile (Dart/Flutter)

- **Class Names**: PascalCase (e.g., `AuthProvider`, `MessagingScreen`)
- **Variables/Functions**: camelCase (e.g., `fetchUserById`, `isAuthenticated`)
- **File Names**: snake_case (e.g., `auth_provider.dart`, `messaging_screen.dart`)
- **Constants**: camelCase with `k` prefix for constants (e.g., `kBaseUrl`)
- **State Management**: Riverpod with StateNotifier/AsyncNotifier
- **API Calls**: Abstracted in `repositories/` directory
- **Models**: Freezed for immutable data classes

Example:
```dart
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AuthState build() => const AuthState.loading();
  
  Future<void> login(String email, String password) async {
    // Implementation
  }
}
```

## Database Schema

The Prisma schema defines these main entities (731 lines):

### Users & Roles
- `User`: Core user accounts with profile information, soft delete via `deletedAt`
- `Role`: User roles (admin, teacher, parent, student)
- `UserRole`: Many-to-many join table
- `ParentStudent`: Links parents to their children
- `RefreshToken`: JWT refresh token storage

### Messaging
- `Channel`: Message channels (podcast, classroom, direct_message, teacher_parent, teacher_student, admin_broadcast, group)
- `ChannelMember`: Channel membership with roles (owner, moderator, member, student)
- `ChannelMute`: Track who is muted and by whom with expiration
- `ChannelReport`: Channel moderation reports
- `Message`: Chat messages with reply support, full-text search vector
- `MessageAttachment`: File attachments for messages
- `MessageRead`: Read receipts
- `Reaction`: Message reactions
- `TypingIndicator`: Real-time typing indicators with expiration
- `EditHistory`: Message edit history
- `Mention`: User mentions in messages with read tracking
- `AuditLog`: Action audit trail

### Academic
- `AcademicYear`: School year management
- `Course`: Course catalog entries with departments
- `Class`: Scheduled course instances with teachers
- `ClassTeacher`: Many-to-many teacher-class assignments
- `ClassEnrollment`: Student enrollments with status
- `Schedule`: Class meeting times (dayOfWeek, startTime, endTime)
- `Assignment`: Coursework assignments with due dates
- `Submission`: Student assignment submissions with file IDs
- `Grade`: Graded scores, feedback, and letter grades
- `AttendanceSession`: Daily attendance records with period
- `AttendanceRecord`: Individual student attendance status

### Files & Notifications
- `File`: Uploaded file metadata with soft delete
- `FilePermission`: Role/user-based file access control
- `EmailQueue`: Pending email notifications with retry logic

### Soft Delete
All major entities support soft delete functionality:

**Entities with `deletedAt` field:**
- `User`: Deactivated users cannot log in, data preserved for 30 days
- `Channel`: Archived channels hidden from normal queries
- `Course`: Deactivated courses hidden from catalog
- `Class`: Deactivated classes hidden from listings

**Entities with `isDeleted` + `deletedAt`:**
- `Message`: Soft deleted messages preserve content for moderation
- `File`: Soft deleted files preserve metadata

**Key Features:**
- 30-day grace period before permanent deletion
- Weekly cleanup job (Sundays at 2 AM UTC) via `@nestjs/schedule`
- Admin API for restore before grace period ends
- All queries filter out soft-deleted items by default
- Audit logs for all soft delete/restore operations

## Security Considerations

### Authentication & Authorization
- **JWT**: Short-lived access tokens (15 min) with unique `jti` (JWT ID) for revocation
- **Refresh Tokens**: 7-day expiration, stored in database, rotated on refresh
- **Token Denylist**: Redis-based denylist for revoked access tokens on logout
- **Password Hashing**: bcrypt with 12 rounds
- **Role Guards**: `@Roles()` decorator with `RolesGuard` for authorization
- **Token Validation**: JWT secrets validated at startup (minimum 32 characters)

### API Security
- **CORS**: Configured with explicit allowed origins, credentials enabled
- **Rate Limiting**: Global throttler (100 req/min) via `@nestjs/throttler` + WebSocket rate limits:
  - 30 messages/minute
  - 20 edits/minute
  - 10 deletes/minute
  - 60 typing events/minute
- **Validation**: Global `ValidationPipe` with whitelist enabled
- **Helmet**: Security headers (CSP, HSTS in production)
- **Compression**: Response compression enabled
- **Input Sanitization**: DOMPurify via `SanitizePipe` for XSS protection

### Data Security
- **SQL Injection**: Prisma ORM provides parameterized queries
- **XSS Protection**: Input validation and output sanitization via DOMPurify
- **File Uploads**:
  - Size limit: 10MB
  - MIME type whitelist validation
  - Extension matching
  - Stored outside web root

### Environment Security
Production validation requires:
- JWT_SECRET >= 32 characters (64+ recommended)
- JWT_REFRESH_SECRET >= 32 characters (64+ recommended)
- Different secrets for JWT and refresh tokens
- SSL for database connections
- Strong passwords for DB and Redis

## Scalability & Performance

### Current Capabilities
| Component | Capacity |
|-----------|----------|
| HTTP API | 100 req/min per IP |
| WebSocket Connections | ~500/server |
| File Uploads | ~50/min |
| Admin Analytics | 1M+ records |

### Scalability Features
- **Redis Adapter**: WebSocket horizontal scaling across multiple instances via `@socket.io/redis-adapter`
- **Database Indexes**: Optimized compound indexes for common queries (see schema.prisma)
- **Streaming Uploads**: Files written directly to disk, not buffered in memory
- **Raw SQL Analytics**: PostgreSQL native date grouping for large datasets
- **Pagination**: All list endpoints with configurable limits (default 20, max 200)
- **Docker Swarm**: Production compose supports replicas via `API_REPLICAS`

### Scaling Architecture
```
                    ┌─────────────┐
                    │ Load Balancer│
                    │  (Nginx/ALB) │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼─────┐  ┌──────▼─────┐  ┌──────▼─────┐
    │  Server 1  │  │  Server 2  │  │  Server 3  │
    │  (Node.js) │  │  (Node.js) │  │  (Node.js) │
    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
           │               │               │
           └───────────────┼───────────────┘
                    ┌──────┴──────┐
                    │    Redis    │
                    │ (Pub/Sub)   │
                    └──────┬──────┘
                    ┌──────┴──────┐
                    │  PostgreSQL │
                    └─────────────┘
```

## Testing Credentials

After seeding the database, use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | Password123! |
| Teacher | teacher1@school.com | Password123! |
| Teacher | teacher2@school.com | Password123! |
| Teacher | teacher3@school.com | Password123! |
| Parent | parent1@school.com | Password123! |
| Parent | parent2@school.com | Password123! |
| Parent | parent3@school.com | Password123! |
| Student | student1@school.com | Password123! |
| Student | student2@school.com | Password123! |
| Student | student3@school.com | Password123! |
| Student | student4@school.com | Password123! |
| Student | student5@school.com | Password123! |

## WebSocket Events

### Client → Server
- `message:send` - Send a message to a channel
- `message:edit` - Edit an existing message
- `message:delete` - Delete a message
- `message:read` - Mark message as read
- `message:read_bulk` - Mark multiple messages as read
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `typing:get` - Get currently typing users
- `channel:join` - Join a channel room
- `reaction:add` - Add reaction to message
- `reaction:remove` - Remove reaction from message

### Server → Client
- `message:new` - New message received
- `message:updated` - Message was edited
- `message:deleted` - Message was deleted
- `message:read_receipt` - Read receipt notification
- `message:reaction_added` - Reaction added
- `message:reaction_removed` - Reaction removed
- `typing:update` - Typing indicator update
- `user:online` - User came online
- `user:offline` - User went offline

## Key Implementation Details

### Authentication Flow
1. **Login**: POST `/api/auth/login` returns `accessToken` (15min) + `refreshToken`
2. **Token Storage**: Mobile uses `flutter_secure_storage`, web uses Hive
3. **Auto Refresh**: Dio interceptor automatically refreshes expired tokens
4. **Logout**: POST `/api/auth/logout` with refresh token; access token added to Redis denylist

### Mobile API Client
- Uses Dio with `_AuthInterceptor` for automatic token refresh
- Platform-aware storage: `flutter_secure_storage` for mobile, Hive for web
- Handles 401 responses by attempting token refresh before failing

### WebSocket Gateway (messaging.gateway.ts)
- Uses Socket.IO with Redis adapter for horizontal scaling
- JWT authentication on connection via handshake auth
- Rate limiting per socket with in-memory tracking
- Automatic room joining for user's channels on connection

### Soft Delete Cleanup
- Weekly cleanup job runs Sundays at 2 AM UTC
- Permanently deletes records where `deletedAt` is older than 30 days
- Admin API allows restore before grace period ends

### Mobile App Updates
The `UpdateModule` provides endpoints for mobile app version management:

- **GET `/api/updates/version`** - Get latest app version info
- **POST `/api/updates/check`** - Check if update is required (send `versionCode` and `platform`)
- **GET `/api/updates/download/latest`** - Get download URL for latest APK

To release a new version:
1. Update `versionCode` and `versionName` in `update.controller.ts`
2. Build new APK: `flutter build apk`
3. Copy APK to `server/downloads/minivirson-latest.apk`
4. Restart server

## Common Development Tasks

### Adding a New API Endpoint

1. Create/update DTO in the appropriate module's `dto/` folder:
   ```typescript
   export class CreateExampleDto {
       @IsString()
       @IsNotEmpty()
       name: string;
   }
   ```

2. Add method to the controller with HTTP verb decorator:
   ```typescript
   @Post()
   async create(@Body() dto: CreateExampleDto) {
       return this.service.create(dto);
   }
   ```

3. Implement business logic in the service

4. Apply guards/decorators as needed:
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin', 'teacher')
   ```

### Adding a Mobile Screen

1. Create screen widget in `mobile/lib/screens/`
2. Update routing in the appropriate provider (likely in `auth_provider.dart`)
3. Add provider if state management needed in `mobile/lib/providers/`
4. Implement API calls in the appropriate repository

### Database Changes

1. Update `server/prisma/schema.prisma`
2. Run `npm run prisma:migrate` in server directory
3. Run `npm run prisma:generate` to update client
4. Update seed script if needed for new tables
5. Run `npm run prisma:seed` to test

## Troubleshooting

### Port Conflicts
Ensure these ports are available:
- 3000 (backend API)
- 5434 (PostgreSQL - mapped from 5432 in development)
- 6379 (Redis)
- 8085 (Flutter web - development)
- 80/443 (Nginx - production)

### Database Connection Errors
- Verify Docker containers: `docker-compose ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Ensure correct DATABASE_URL format (note port 5434 for dev)

### WebSocket Connection Issues
- Verify Redis is running: `docker-compose logs redis`
- Check `ALLOWED_ORIGINS` includes frontend URL
- Check browser console for CORS errors

### Prisma Client Errors
Regenerate client:
```bash
cd server
npm run prisma:generate
```

### Flutter Build Issues
Clean and rebuild:
```bash
cd mobile
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Reset Everything
```bash
docker-compose down -v  # Remove volumes (DELETES ALL DATA!)
docker-compose up -d
cd server
npm run prisma:migrate
npm run prisma:seed
```

## Additional Documentation

- **README.md**: Human-readable project overview and quick start
- **PRODUCTION.md**: Production deployment overview
- **PRODUCTION_DEPLOYMENT.md**: Detailed deployment procedures
- **PRODUCTION_FIX_QUICKSTART.md**: Quick troubleshooting guide
- **PRODUCTION_FIXES_SUMMARY.md**: Known issues and fixes
- **PRODUCTION_ROADMAP.md**: Production roadmap and TODOs
- **API Docs**: Available at `http://localhost:3000/api/docs` when server is running
- **Prisma Studio**: Run `npm run prisma:studio` in server directory

## License

MIT License - See LICENSE file for details.
