# School Hub - School Messaging System (SMS)

A full-stack school management platform featuring real-time messaging, course management, assignments, attendance tracking, and file sharing with role-based access control.

## Project Overview

School Hub is a **School Management System** designed to facilitate communication and collaboration between administrators, teachers, parents, and students. The system provides comprehensive role-based access control and real-time messaging via WebSockets.

### Key Features

- **Real-time Messaging**: WebSocket-powered instant messaging with channels for teacher-parent, teacher-admin, classroom, and broadcast communications
- **Course Management**: Course catalog, class scheduling with recurring sessions, enrollments, and teacher assignments
- **Assignment & Grading**: Assignment creation, file submissions, grade tracking with feedback, and late submission tracking
- **Attendance Tracking**: Session-based attendance marking with present/absent/late/excused statuses
- **File Management**: Secure file uploads (max 10MB) with MIME type validation and permission-based access
- **Role-Based Access**: Four user roles (admin, teacher, parent, student) with different permissions
- **Admin Dashboard**: Real-time analytics, user management, audit logs, system health monitoring, and content moderation
- **Audit Logging**: Track important actions for compliance and moderation
- **Mobile App**: Flutter-based cross-platform mobile application

## Technology Stack

### Backend (server/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.4.x | Node.js framework for building scalable server-side applications |
| **TypeScript** | 5.6.x | Type-safe JavaScript development |
| **Prisma** | 5.20.x | ORM for database operations and schema management |
| **PostgreSQL** | 16 | Primary relational database |
| **Redis** | 7 | Caching, WebSocket adapter storage, and pub/sub |
| **Socket.IO** | 4.7.x | Real-time bidirectional event-based communication |
| **JWT** | - | Authentication with access (15min) and refresh (7d) tokens |
| **bcrypt** | 5.1.x | Password hashing (12 rounds) |
| **class-validator** | 0.14.x | DTO validation |
| **Helmet** | 8.1.x | Security headers |
| **Swagger** | 7.4.x | API documentation |
| **Jest** | 29.5.x | Testing framework |
| **Winston** | 3.19.x | Logging |
| **DOMPurify** | 3.3.x | XSS protection |

### Mobile App (mobile/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Flutter** | 3.x+ | Cross-platform mobile framework |
| **Dart** | 3.x+ | Programming language |
| **Dio** | 5.7.x | HTTP client for API communication |
| **Socket.IO Client** | 2.0.x | Real-time WebSocket client |
| **Riverpod** | 2.6.x | State management |
| **Go Router** | 14.6.x | Navigation |
| **Hive** | 1.1.x | Local storage |
| **flutter_secure_storage** | 9.2.x | Secure key storage |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization for all services |
| **Docker Compose** | Local development and production orchestration |
| **Nginx** | Reverse proxy and static file serving (production) |
| **GitHub Actions** | CI/CD pipeline |

## Project Structure

```
minivirson/
├── .env                      # Shared environment configuration
├── .env.example              # Environment template
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline configuration
├── docker-compose.yml        # Development infrastructure (PostgreSQL + Redis)
├── docker-compose.prod.yml   # Full production stack
├── docker-compose.loadbalanced.yml # Load-balanced multi-instance setup
├── README.md                # Human-readable documentation
├── SCALING.md               # Scalability and performance guide
├── AGENTS.md                # This file - AI agent documentation
├── mobile/                  # Flutter mobile application
│   ├── pubspec.yaml         # Flutter dependencies
│   ├── lib/
│   │   ├── main.dart        # Application entry point
│   │   ├── app.dart         # Root application widget
│   │   ├── core/            # Core utilities
│   │   │   ├── api/         # API client (dio)
│   │   │   ├── socket/      # WebSocket management
│   │   │   └── theme/       # App theming
│   │   ├── models/          # Data models (user, course, file, etc.)
│   │   ├── providers/       # Riverpod state providers
│   │   ├── repositories/    # Data access layer
│   │   └── screens/         # UI screens
│   │       ├── admin/       # Admin dashboard screens
│   │       ├── assignments/ # Assignment screens
│   │       ├── attendance/  # Attendance screens
│   │       ├── auth/        # Login/register screens
│   │       ├── courses/     # Course screens
│   │       ├── files/       # File management screens
│   │       ├── grades/      # Grade viewing screens
│   │       ├── home/        # Home dashboard
│   │       ├── messaging/   # Chat/messaging screens
│   │       └── profile/     # User profile screens
│   └── assets/              # Images and icons
├── scripts/                 # Utility scripts
│   ├── migrate-mdb-to-prisma.js  # Legacy database migration
│   └── requirements.txt     # Python dependencies for scripts
└── server/                  # Backend application
    ├── Dockerfile           # Multi-stage production build
    ├── package.json         # Backend dependencies
    ├── tsconfig.json        # TypeScript configuration
    ├── nest-cli.json        # NestJS CLI configuration
    ├── jest.config.js       # Unit test configuration
    ├── jest-e2e.config.js   # E2E test configuration
    ├── prisma/
    │   ├── schema.prisma    # Database schema definition
    │   ├── seed.ts          # Database seeding script
    │   └── migrations/      # Database migrations
    ├── uploads/             # File upload storage directory
    ├── coverage/            # Test coverage reports
    ├── test/                # Test files
    │   ├── setup.ts         # Unit test setup
    │   ├── setup.e2e.ts     # E2E test setup
    │   ├── auth.e2e-spec.ts # Auth E2E tests
    │   └── load/            # Load testing configuration
    └── src/
        ├── main.ts          # NestJS application entry
        ├── app.module.ts    # Root application module
        ├── config/          # Configuration
        │   └── env.validation.ts
        ├── prisma/          # Prisma service module
        │   ├── prisma.module.ts
        │   └── prisma.service.ts
        ├── auth/            # Authentication module
        │   ├── auth.controller.ts
        │   ├── auth.module.ts
        │   ├── auth.service.ts
        │   ├── auth.service.spec.ts
        │   ├── dto/auth.dto.ts
        │   ├── guards/jwt-auth.guard.ts
        │   ├── guards/roles.guard.ts
        │   ├── strategies/jwt.strategy.ts
        │   └── decorators/roles.decorator.ts
        ├── users/           # User management module
        │   ├── users.controller.ts
        │   ├── users.module.ts
        │   └── users.service.ts
        ├── messaging/       # Messaging & WebSocket gateway
        │   ├── messaging.controller.ts
        │   ├── messaging.controller.spec.ts
        │   ├── messaging.gateway.ts
        │   ├── messaging.module.ts
        │   ├── messaging.service.ts
        │   ├── typing.service.ts
        │   └── dto/
        ├── admin/           # Admin dashboard module
        │   ├── admin.controller.ts
        │   ├── admin.gateway.ts
        │   ├── admin.module.ts
        │   ├── admin.service.ts
        │   └── dto/
        ├── analytics/       # Analytics module
        │   ├── analytics.controller.ts
        │   ├── analytics.module.ts
        │   └── analytics.service.ts
        ├── moderation/      # Audit logging and moderation
        │   ├── moderation.controller.ts
        │   ├── moderation.module.ts
        │   └── moderation.service.ts
        ├── courses/         # Course and class management
        │   ├── courses.controller.ts
        │   ├── courses.module.ts
        │   ├── courses.service.ts
        │   └── dto/courses.dto.ts
        ├── grading/         # Assignments and grades
        │   ├── grading.controller.ts
        │   ├── grading.module.ts
        │   ├── grading.service.ts
        │   └── dto/grading.dto.ts
        ├── attendance/      # Attendance tracking
        │   ├── attendance.controller.ts
        │   ├── attendance.module.ts
        │   ├── attendance.service.ts
        │   └── dto/attendance.dto.ts
        ├── files/           # File upload and management
        │   ├── files.controller.ts
        │   ├── files.module.ts
        │   ├── files.service.ts
        │   └── dto/files.dto.ts
        ├── health/          # Health checks
        │   ├── health.controller.ts
        │   ├── health.module.ts
        │   └── health.interface.ts
        ├── notifications/   # Email notifications
        │   ├── notifications.module.ts
        │   ├── notifications.service.ts
        │   ├── notifications.controller.ts
        │   ├── email.processor.ts
        │   ├── queue.service.ts
        │   └── dto/notifications.dto.ts
        ├── mentions/        # User mentions in messages
        │   ├── mentions.module.ts
        │   ├── mentions.service.ts
        │   └── mentions.controller.ts
        ├── redis/           # Redis client module
        │   ├── redis.module.ts
        │   └── redis.service.ts
        └── common/          # Shared utilities
            ├── decorators/  # Custom decorators
            ├── guards/      # WebSocket rate limit guards
            ├── interceptors/# Logging interceptors
            ├── logger/      # Winston configuration
            ├── pipes/       # Sanitization pipes
            ├── redis/       # Redis utilities
            ├── soft-delete/ # Soft delete functionality
            └── utils/       # Helper utilities
```

## Module Architecture

### Backend Modules

Each module follows NestJS conventions with controllers, services, and DTOs:

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **AuthModule** | JWT-based authentication with access/refresh tokens | `auth.service.ts`, `jwt.strategy.ts`, `roles.guard.ts` |
| **UsersModule** | User CRUD and profile management | `users.controller.ts`, `users.service.ts` |
| **MessagingModule** | Real-time messaging via Socket.IO gateway + REST API | `messaging.gateway.ts`, `messaging.service.ts`, `typing.service.ts` |
| **AdminModule** | Admin dashboard, user management, system stats | `admin.controller.ts`, `admin.gateway.ts` |
| **AnalyticsModule** | System analytics and reporting | `analytics.service.ts` |
| **CoursesModule** | Course catalog, classes, enrollments, schedules | `courses.controller.ts`, `courses.service.ts` |
| **GradingModule** | Assignments, submissions, and gradebook | `grading.controller.ts`, `grading.service.ts` |
| **AttendanceModule** | Attendance sessions and records | `attendance.controller.ts`, `attendance.service.ts` |
| **FilesModule** | File uploads with permission-based access | `files.controller.ts`, `files.service.ts` |
| **ModerationModule** | Audit logging for compliance | `moderation.controller.ts`, `moderation.service.ts` |
| **NotificationsModule** | Email notifications and queue | `notifications.service.ts`, `email.processor.ts` |
| **MentionsModule** | User mentions in messages | `mentions.service.ts` |
| **SoftDeleteModule** | Soft delete functionality with cleanup jobs | `soft-delete.service.ts` |
| **HealthModule** | System health checks | `health.controller.ts` |
| **PrismaModule** | Database connection | `prisma.service.ts` |
| **RedisModule** | Redis client management | `redis.service.ts` |

## Environment Configuration

The project uses environment files at multiple levels:

### Root `.env` (Shared)

```env
# Database
DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging?schema=public&connect_timeout=10"

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
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4173"
CLIENT_URL=http://localhost:5173
```

### Server `.env` (Extended)

```env
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads

# Admin Dashboard WebSocket Namespace
ADMIN_WS_NAMESPACE=/admin
```

## Build and Development Commands

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- npm 8+
- Docker & Docker Compose
- Flutter SDK 3.x+ (for mobile)

### Infrastructure Setup

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

# Testing
flutter test               # Run unit tests
flutter test --coverage    # Run tests with coverage

# Code generation
flutter pub run build_runner build    # Generate code (freezed, json_serializable)
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
# Build and run production stack
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

Production stack includes:
- PostgreSQL (internal network only)
- Redis (internal network only)
- NestJS API server (port 3000)

## Testing Strategy

### Unit Tests

- **Framework**: Jest with ts-jest
- **Location**: `src/**/*.spec.ts`
- **Configuration**: `jest.config.js`
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
- **Setup**: `test/setup.e2e.ts`

```bash
cd server
npm run test:e2e           # Run E2E tests
```

### Test Setup Files

- `test/setup.ts`: Unit test environment variables and mocks
- `test/setup.e2e.ts`: E2E test database setup and migrations

### Mocking Strategy

- Prisma client is mocked for unit tests
- External services (bcrypt, JWT) are mocked
- Console methods are mocked to reduce test noise

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

The Prisma schema defines these main entities:

### Users & Roles
- `User`: Core user accounts with profile information
- `Role`: User roles (admin, teacher, parent, student)
- `UserRole`: Many-to-many join table
- `ParentStudent`: Links parents to their children
- `RefreshToken`: JWT refresh token storage

### Messaging
- `Channel`: Message channels (podcast, classroom, direct_message, teacher_parent, teacher_student, admin_broadcast, group)
- `ChannelMember`: Channel membership with roles (owner, moderator, member, student)
- `ChannelMute`: Track who is muted and by whom with expiration
- `ChannelReport`: Channel moderation reports
- `Message`: Chat messages with reply support
- `MessageAttachment`: File attachments for messages
- `MessageRead`: Read receipts
- `Reaction`: Message reactions
- `TypingIndicator`: Real-time typing indicators
- `EditHistory`: Message edit history
- `Mention`: User mentions in messages
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
- `EmailQueue`: Pending email notifications

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
- Weekly cleanup job (Sundays at 2 AM UTC)
- Admin API for restore before grace period ends
- All queries filter out soft-deleted items by default
- Audit logs for all soft delete/restore operations

## Security Considerations

### Authentication & Authorization
- **JWT**: Short-lived access tokens (15 min) and refresh tokens (7 days)
- **Password Hashing**: bcrypt with 12 rounds
- **Role Guards**: `@Roles()` decorator with `RolesGuard` for authorization
- **Token Validation**: JWT secrets validated at startup

### API Security
- **CORS**: Configured with explicit allowed origins
- **Rate Limiting**: Global throttler (100 req/min) + WebSocket rate limits
  - 30 messages/minute
  - 20 edits/minute
  - 10 deletes/minute
  - 60 typing events/minute
- **Validation**: Global `ValidationPipe` with whitelist enabled
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Compression**: Response compression enabled
- **Input Sanitization**: DOMPurify for XSS protection via `SanitizePipe`

### Data Security
- **SQL Injection**: Prisma ORM provides parameterized queries
- **XSS Protection**: Input validation and output sanitization
- **File Uploads**:
  - Size limit: 10MB
  - MIME type whitelist validation
  - Extension matching
  - Stored outside web root

### Environment Security
Production validation requires:
- JWT_SECRET >= 32 characters
- JWT_REFRESH_SECRET >= 32 characters
- Different secrets for JWT and refresh
- SSL for database connections

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

### Jobs
1. **test**: Run unit tests with coverage
   - PostgreSQL and Redis services
   - Prisma generate and migrate
   - Upload coverage to Codecov

2. **e2e-test**: Run end-to-end tests
   - Depends on test job
   - Separate test database

3. **security-scan**:
   - npm audit
   - Trivy vulnerability scanner

4. **build-and-push**: Build Docker image
   - Depends on test and e2e-test
   - Only on main branch

## Scalability & Performance

### Current Capabilities
| Component | Capacity |
|-----------|----------|
| HTTP API | 100 req/min per IP |
| WebSocket Connections | ~500/server |
| File Uploads | ~50/min |
| Admin Analytics | 1M+ records |

### Scalability Features
- **Redis Adapter**: WebSocket horizontal scaling across multiple instances
- **Database Indexes**: Optimized compound indexes for common queries
- **Streaming Uploads**: Files written directly to disk, not buffered in memory
- **Raw SQL Analytics**: PostgreSQL native date grouping for large datasets
- **Pagination**: All list endpoints with configurable limits (default 20, max 200)

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

See `SCALING.md` for detailed scaling instructions.

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
2. Add route in `mobile/lib/core/router/app_router.dart`
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
- 5433 (PostgreSQL - mapped from 5432)
- 6379 (Redis)

### Database Connection Errors
- Verify Docker containers: `docker-compose ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Ensure correct DATABASE_URL format

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
- **SCALING.md**: Detailed scalability and performance guide
- **API Docs**: Available at `http://localhost:3000/api/docs` when server is running
- **Prisma Studio**: Run `npm run prisma:studio` in server directory

## License

MIT License - See LICENSE file for details.
