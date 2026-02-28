# School Hub - School Management System

A full-stack school management platform featuring real-time messaging, course management, assignments, attendance tracking, and file sharing with role-based access control.

## Project Overview

School Hub is a **School Management System** designed to facilitate communication and collaboration between administrators, teachers, parents, and students. The system provides comprehensive role-based access control and real-time messaging via WebSockets.

### Key Features

- **Real-time Messaging**: WebSocket-powered instant messaging with channels for teacher-parent, teacher-admin, classroom, and broadcast communications
- **Course Management**: Course catalog, class scheduling with recurring sessions, enrollments, and teacher assignments
- **Assignment & Grading**: Assignment creation, file submissions, grade tracking with feedback, and late submission tracking
- **Attendance Tracking**: Session-based attendance marking with present/absent/late/excused statuses
- **File Management**: Secure file uploads (max 10MB) with MIME type validation, permission-based access, and S3-compatible storage support
- **Role-Based Access**: Four user roles (admin, teacher, parent, student) with different permissions
- **Admin Dashboard**: Real-time analytics, user management, audit logs, system health monitoring, and content moderation
- **Audit Logging**: Track important actions for compliance and moderation
- **Mobile App**: React Native (Expo) cross-platform mobile application with offline support
- **Prometheus Metrics**: Application metrics for monitoring and observability
- **Parent-Teacher Conferences**: Schedule and manage parent-teacher meetings
- **Report Cards**: Generate and track student report cards by academic year
- **Payment Processing**: Fee invoices and payment tracking with Stripe integration
- **Behavior Tracking**: Record and monitor student behavior incidents
- **Calendar Events**: School-wide and personal calendar management

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
| **bcrypt** | 6.0.x | Password hashing |
| **class-validator** | 0.14.x | DTO validation |
| **Helmet** | 8.1.x | Security headers |
| **Swagger** | 7.4.x | API documentation |
| **Jest** | 29.5.x | Testing framework |
| **Winston** | 3.19.x | Logging |
| **DOMPurify** | 3.3.x | XSS protection via jsdom |
| **@nestjs/schedule** | 6.1.x | Cron jobs for soft-delete cleanup |
| **@nestjs/throttler** | 6.5.x | Rate limiting |
| **@willsoto/nestjs-prometheus** | 6.0.x | Prometheus metrics |
| **@aws-sdk/client-s3** | 3.998.x | S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces) |
| **ioredis** | 5.4.x | Redis client with cluster support |
| **nodemailer** | 8.0.x | Email notifications |

### Mobile App (mobile/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.76.0 | Cross-platform mobile framework |
| **Expo** | 52.0.0 | React Native development platform |
| **Expo Router** | 4.0.0 | File-based routing for navigation |
| **React** | 18.3.x | UI library |
| **TypeScript** | 5.3.x | Type-safe JavaScript development |
| **TanStack Query** | 5.60.x | Server state management and data fetching |
| **React Navigation** | 7.x | Navigation library |
| **Lucide React Native** | 0.460.x | Icon library |
| **Socket.IO Client** | 4.8.x | Real-time messaging client |
| **date-fns** | 4.1.x | Date manipulation library |
| **i18next** | 25.0.x | Internationalization framework |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization for all services |
| **Docker Compose** | Development and production orchestration |
| **Nginx** | Reverse proxy and static file serving (production) |
| **Prometheus** | Metrics collection |
| **Grafana** | Metrics visualization |

## Project Structure

```
minivirson/
├── .env                        # Local development environment
├── .env.example                # Environment template for development
├── .env.production             # Production environment template
├── .gitattributes              # Git configuration
├── .gitignore                  # Git ignore patterns
├── docker-compose.yml          # Main Docker Compose configuration
├── docker-compose.backend.yml  # Backend-only configuration
├── docker-compose.backend-only.yml  # Minimal backend setup
├── docker-compose.monitoring.yml    # Monitoring stack
├── docker-compose.nginx.yml    # Nginx-specific configuration
├── AGENTS.md                   # This file - AI agent documentation
├── mobile/                     # React Native mobile application
│   ├── package.json           # npm dependencies
│   ├── app.json               # Expo configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── index.ts               # Application entry point
│   ├── jest.config.js         # Jest test configuration
│   ├── app/                   # Expo Router file-based routes
│   │   ├── _layout.tsx        # Root layout with providers
│   │   ├── +not-found.tsx     # 404 error page
│   │   ├── modal.tsx          # Modal component
│   │   ├── (auth)/            # Authentication routes group (login, forgot-password, role-select)
│   │   ├── (tabs)/            # Tab navigation routes (index, messages, courses, assignments, profile, admin)
│   │   └── (app)/             # Main app routes
│   │       ├── admin/         # Admin screens (analytics, users, courses, classes, etc.)
│   │       ├── teacher/       # Teacher screens (grading, attendance, roster, etc.)
│   │       ├── parent/        # Parent screens (children, conferences, payments, etc.)
│   │       ├── student/       # Student screens (grades, attendance, resources)
│   │       ├── channel/       # Chat channel screens
│   │       ├── course/        # Course detail screens
│   │       ├── assignment/    # Assignment detail screens
│   │       └── settings/      # Settings screens
│   ├── src/
│   │   ├── assets/            # Images and icons
│   │   ├── components/        # Reusable UI components
│   │   ├── providers/         # Context providers (SocketProvider)
│   │   ├── services/          # API services
│   │   ├── constants/         # App constants
│   │   └── types/             # TypeScript type definitions
│   ├── providers/             # Context providers (Auth, Theme, Query)
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service layer (api.ts)
│   ├── stores/                # State management stores
│   ├── types/                 # Type definitions
│   ├── utils/                 # Utility functions
│   └── __tests__/             # Test files
├── nginx/                     # Nginx configuration for production
│   ├── nginx.conf             # Main nginx configuration
│   ├── nginx-simple.conf      # Simplified nginx config
│   ├── nginx-ssl.conf         # SSL-enabled nginx config
│   ├── Dockerfile             # Nginx container build
│   └── docker-entrypoint.sh   # Entrypoint script
├── monitoring/                # Monitoring configuration
│   ├── prometheus.yml         # Prometheus configuration
│   └── grafana/               # Grafana dashboards
├── scripts/                   # Utility scripts
│   ├── backup.sh              # Database backup script
│   ├── deploy-production.sh   # Production deployment
│   ├── hostinger-setup.sh     # Hostinger VPS setup
│   ├── setup-logrotate.sh     # Log rotation setup
│   ├── setup-server-env.sh    # Server environment setup
│   ├── setup-ssl.sh           # SSL certificate setup
│   ├── status.sh              # Service status check
│   ├── test-deployment.sh     # Deployment testing
│   └── validate-env.sh        # Environment validation
└── server/                    # Backend application
    ├── Dockerfile             # Multi-stage production build
    ├── docker-entrypoint.sh   # Container entrypoint script
    ├── package.json           # Backend dependencies
    ├── tsconfig.json          # TypeScript configuration
    ├── nest-cli.json          # NestJS CLI configuration (webpack builder)
    ├── jest.config.js         # Unit test configuration
    ├── jest-e2e.config.js     # E2E test configuration
    ├── prisma/
    │   ├── schema.prisma      # Database schema definition
    │   ├── seed.ts            # Database seeding script
    │   └── migrations/        # Database migrations
    ├── uploads/               # File upload storage directory
    ├── downloads/             # APK download directory
    ├── test/                  # Test files
    │   ├── setup.ts           # Unit test setup with Redis mock
    │   ├── setup.e2e.ts       # E2E test setup with migrations
    │   └── __mocks__/         # Jest mocks (jsdom.mock.ts)
    └── src/
        ├── main.ts            # NestJS application entry
        ├── app.module.ts      # Root application module
        ├── config/            # Configuration (env.validation.ts)
        ├── prisma/            # Prisma service module
        ├── auth/              # Authentication module (JWT, guards, strategies)
        ├── users/             # User management module
        ├── messaging/         # Messaging & WebSocket gateway
        │   ├── messaging.gateway.ts        # Socket.IO gateway
        │   ├── messaging.service.ts        # Core messaging logic
        │   ├── messaging-enhanced.service.ts  # Enhanced messaging features
        │   ├── typing.service.ts           # Typing indicators
        │   ├── handlers/                   # Message handlers
        │   │   ├── message.handler.ts
        │   │   ├── reaction.handler.ts
        │   │   ├── typing.handler.ts
        │   │   └── channel.handler.ts
        │   ├── dto/                        # WebSocket DTOs
        │   └── guards/                     # Channel membership guards
        ├── admin/             # Admin dashboard module
        ├── analytics/         # Analytics module
        ├── courses/           # Course and class management
        ├── grading/           # Assignments and grades
        ├── attendance/        # Attendance tracking
        ├── files/             # File upload and management
        ├── health/            # Health checks
        ├── metrics/           # Prometheus metrics
        ├── notifications/     # Email notifications and push
        ├── mentions/          # User mentions in messages
        ├── moderation/        # Audit logging
        ├── payments/          # Payment processing (Stripe)
        ├── parent/            # Parent-specific features
        ├── conferences/       # Parent-teacher conferences
        ├── report-cards/      # Student report cards
        ├── redis/             # Redis client module
        ├── update/            # Mobile app update endpoints
        └── common/            # Shared utilities
            ├── decorators/    # Custom decorators (sanitize)
            ├── guards/        # Guards (ws-rate-limit.guard)
            ├── interceptors/  # Logging interceptors
            ├── logger/        # Winston logger configuration
            ├── pipes/         # Sanitize pipe for XSS protection
            ├── redis/         # Redis module and service
            ├── soft-delete/   # Soft delete functionality
            └── utils/         # Utility functions
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
| **AnalyticsModule** | System analytics and reporting | `analytics.service.ts`, `analytics.controller.ts` |
| **CoursesModule** | Course catalog, classes, enrollments, schedules | `courses.controller.ts`, `courses.service.ts` |
| **GradingModule** | Assignments, submissions, and gradebook | `grading.controller.ts`, `grading.service.ts` |
| **AttendanceModule** | Attendance sessions and records | `attendance.controller.ts`, `attendance.service.ts` |
| **FilesModule** | File uploads with permission-based access, supports local and S3 storage | `files.controller.ts`, `files.service.ts` |
| **ModerationModule** | Audit logging for compliance | `moderation.controller.ts`, `moderation.service.ts` |
| **NotificationsModule** | Email notifications, push notifications, and queue | `notifications.service.ts`, `email.service.ts`, `push.service.ts` |
| **MentionsModule** | User mentions in messages | `mentions.service.ts`, `mentions.controller.ts` |
| **PaymentsModule** | Fee invoices and Stripe payment processing | `payments.controller.ts`, `payments.service.ts` |
| **ParentModule** | Parent-specific features and dashboard | `parent.controller.ts`, `parent.service.ts` |
| **ConferencesModule** | Parent-teacher conference scheduling | `conferences.controller.ts`, `conferences.service.ts` |
| **ReportCardsModule** | Student report card generation and tracking | `report-cards.controller.ts`, `report-cards.service.ts` |
| **SoftDeleteModule** | Soft delete functionality with cleanup jobs | `soft-delete.service.ts`, `soft-delete-cleanup.service.ts` |
| **HealthModule** | System health checks | `health.controller.ts` |
| **MetricsModule** | Prometheus metrics for monitoring | `metrics.controller.ts`, `metrics.service.ts` |
| **UpdateModule** | Mobile app version checking | `update.controller.ts` |

## Environment Configuration

### Root `.env.example` (Template)

Copy this file to `.env` and configure for development:

```env
# Application Settings
NODE_ENV=development
PORT=3000
DOMAIN_NAME=localhost

# Database
DATABASE_URL="postgresql://sms_user:sms_password_2026@localhost:5434/school_messaging?schema=public&connect_timeout=10"
DB_USER=sms_user
DB_PASSWORD=sms_password_2026
DB_NAME=school_messaging

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET="school-msg-jwt-secret-change-in-production-2026-min-32-chars"
JWT_REFRESH_SECRET="school-msg-refresh-secret-change-in-production-2026-min-32-chars"
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Storage Configuration
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads

# S3 Configuration (optional)
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_REGION=us-east-1
# S3_BUCKET=school-hub-uploads
# S3_ACCESS_KEY_ID=your-access-key
# S3_SECRET_ACCESS_KEY=your-secret-key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Client URLs
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin

# Security
ADMIN_EMAILS=admin@school.com
```

### Production `.env.production`

See `.env.production` file for production configuration template. Key requirements:
- JWT_SECRET >= 64 characters
- JWT_REFRESH_SECRET different from JWT_SECRET
- Strong passwords for DB and Redis (minimum 32 characters)
- HTTPS for API_BASE_URL
- Valid SSL certificates in `nginx/ssl/`

## Build and Development Commands

### Prerequisites

- Node.js 18+ (see `engines` in `package.json`)
- npm 8+
- Docker & Docker Compose
- Expo CLI (for mobile development): `npm install -g @expo/cli`

### Full Docker Development

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Backend (server/)

```bash
cd server

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
cd mobile

# Install dependencies
npm install

# Development
npx expo start             # Start Expo development server
npx expo start --android   # Start with Android emulator
npx expo start --ios       # Start with iOS simulator (macOS only)
npx expo start --web       # Start web version

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript type checking

# Build
npx expo build:android     # Build Android APK/AAB
npx expo build:ios         # Build iOS app (macOS only)
```

### Full Development Startup

```bash
# 1. Start infrastructure (Docker)
docker-compose -f docker-compose.backend-only.yml up -d

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
npm install
npx expo start
```

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

### Mobile Tests

- **Framework**: Jest with jest-expo preset
- **Location**: `__tests__/**/*.test.ts(x)`
- **Configuration**: `jest.config.js`
- **Coverage Thresholds**: 30% minimum for branches, functions, lines, statements

```bash
cd mobile
npm test                   # Run mobile tests
npm run test:coverage      # Generate coverage report
```

### Test Setup Files

- `test/setup.ts`: Unit test environment variables, Redis mock, JSDOM mock for DOMPurify
- `test/setup.e2e.ts`: E2E test database setup and migrations
- `test/__mocks__/jsdom.mock.ts`: JSDOM mock for DOMPurify
- `mobile/__tests__/setup.ts`: Mobile test setup

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

### Mobile (TypeScript/React Native)

- **Component Names**: PascalCase (e.g., `LoginScreen`, `MessageCard`)
- **Variables/Functions**: camelCase (e.g., `fetchUserById`, `isAuthenticated`)
- **File Names**: kebab-case or camelCase (e.g., `auth-provider.tsx`, `api.ts`)
- **Hooks**: Prefix with `use` (e.g., `useAuth`, `useTheme`)
- **State Management**: TanStack Query for server state, React Context for global UI state
- **API Calls**: Abstracted in `services/` directory
- **Navigation**: Expo Router file-based routing

Example:
```typescript
// Component
export function LoginScreen() {
  const { login } = useAuth();
  // ...
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## Database Schema

The Prisma schema defines these main entities:

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
- `AcademicYear`: School year management with current year tracking

### Files & Notifications
- `File`: Uploaded file metadata with soft delete
- `FilePermission`: Role/user-based file access control
- `EmailQueue`: Pending email notifications with retry logic
- `PushToken`: Mobile push notification tokens

### Payments & Fees
- `FeeInvoice`: Student fee invoices with items and payment status
- `Payment`: Payment records with Stripe integration

### Conferences & Reports
- `Conference`: Parent-teacher conference scheduling
- `ReportCard`: Student report cards by academic year and term

### Behavior & Calendar
- `BehaviorRecord`: Student behavior tracking (positive/negative)
- `CalendarEvent`: School and personal calendar events

### Encryption & Sync
- `UserPublicKey`: E2E encryption public keys
- `SyncQueue`: Offline sync queue for mobile app

### Soft Delete
All major entities support soft delete functionality:

**Entities with `deletedAt` field:**
- `User`: Deactivated users cannot log in, data preserved for 30 days
- `Channel`: Archived channels hidden from normal queries
- `Course`: Deactivated courses hidden from catalog
- `Class`: Deactivated classes hidden from listings
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
1. **Login**: POST `/api/auth/login` returns `accessToken` (15min) + `refreshToken` in httpOnly cookie
2. **Token Storage**: Mobile uses secure storage, web uses httpOnly cookies
3. **Auto Refresh**: Token refresh happens via POST `/api/auth/refresh` with cookie
4. **Logout**: POST `/api/auth/logout` clears cookie and adds token to Redis denylist

### WebSocket Gateway (messaging.gateway.ts)
- Uses Socket.IO with Redis adapter for horizontal scaling
- JWT authentication on connection via handshake auth
- Rate limiting per socket with in-memory tracking
- Automatic room joining for user's channels on connection

### Soft Delete Cleanup
- Weekly cleanup job runs Sundays at 2 AM UTC
- Permanently deletes records where `deletedAt` is older than 30 days
- Admin API allows restore before grace period ends

### File Storage
The system supports both local and S3-compatible storage:

**Local Storage:**
- Files stored in `server/uploads/` directory
- Served via static file middleware

**S3 Storage (AWS S3, MinIO, DigitalOcean Spaces):**
- Configure via `STORAGE_PROVIDER=s3` environment variable
- Supports presigned URLs for secure direct uploads
- Required env vars: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

### Metrics and Monitoring
- **Prometheus Metrics**: Available at `/api/metrics`
- **Health Check**: Available at `/api/health`
- **Grafana**: Pre-configured dashboards for visualization

### Push Notifications
- Expo Notifications for mobile push
- Push tokens stored per user device
- Support for iOS, Android, and web push

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

5. Register the module in `app.module.ts` if it's a new module

### Adding a Mobile Screen

1. Create screen component in `mobile/app/(app)/` or appropriate group
2. Add route using Expo Router file-based routing
3. Update navigation if needed
4. Add API calls in the appropriate service in `mobile/services/`
5. Update TypeScript types in `mobile/types/` if needed

### Database Changes

1. Update `server/prisma/schema.prisma`
2. Run `npm run prisma:migrate` in server directory
3. Run `npm run prisma:generate` to update client
4. Update seed script if needed for new tables
5. Run `npm run prisma:seed` to test

### Production Deployment

1. Validate environment:
   ```bash
   ./scripts/validate-env.sh
   ```

2. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. Monitor deployment:
   ```bash
   ./scripts/status.sh
   docker-compose logs -f backend
   ```

## Testing Credentials

After seeding the database (`npm run prisma:seed`), use these demo accounts:

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

## Troubleshooting

### Port Conflicts
Ensure these ports are available:
- 3000 (backend API)
- 5434 (PostgreSQL - mapped from container 5432)
- 6379 (Redis)
- 8085 (Expo development server)
- 80/443 (Nginx - production)

### Database Connection Errors
- Verify PostgreSQL container is running: `docker-compose ps`
- Check DATABASE_URL format in `.env`
- Ensure database user has proper permissions
- View logs: `docker-compose logs postgres`

### WebSocket Connection Issues
- Verify Redis is running
- Check `ALLOWED_ORIGINS` includes frontend URL
- Check browser console for CORS errors
- Verify WebSocket URL matches API base URL

### Prisma Client Errors
Regenerate client:
```bash
cd server
npm run prisma:generate
```

### Mobile App Issues
Clear and restart:
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Docker Issues
```bash
# Rebuild all containers
docker-compose down
docker-compose up -d --build

# Reset everything (WARNING: loses all data)
docker-compose down -v
docker-compose up -d
```

## License

MIT License - See LICENSE file for details.
