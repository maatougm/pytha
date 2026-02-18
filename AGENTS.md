# School Hub - School Messaging System (SMS)

A full-stack web application for educational institutions featuring real-time messaging, course management, assignments, attendance tracking, and file sharing with role-based access control.

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
- **Internationalization**: Multi-language support (English, French, Arabic) with RTL layout for Arabic

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

### Frontend (client/)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vue 3** | 3.5.x | Progressive JavaScript framework (Composition API) |
| **Vite** | 5.4.x | Next-generation frontend build tool |
| **Pinia** | 2.2.x | State management for Vue |
| **Vue Router** | 4.4.x | Client-side routing |
| **Axios** | 1.7.x | HTTP client for API communication |
| **Socket.IO Client** | 4.7.x | Real-time WebSocket client |
| **Vue I18n** | 9.14.x | Internationalization support |
| **Chart.js** | 4.5.x | Data visualization |

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
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline configuration
├── docker-compose.yml        # Development infrastructure (PostgreSQL + Redis)
├── docker-compose.prod.yml   # Full production stack
├── README.md                # Human-readable documentation
├── SCALING.md               # Scalability and performance guide
├── AGENTS.md                # This file - AI agent documentation
├── client/                  # Frontend application
│   ├── Dockerfile           # Multi-stage production build
│   ├── nginx.conf           # Nginx configuration for production
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite build configuration
│   ├── index.html           # HTML entry point
│   └── src/
│       ├── main.js          # Application entry point
│       ├── App.vue          # Root component
│       ├── assets/          # Static assets (styles.css)
│       ├── components/      # Reusable Vue components
│       │   ├── MainLayout.vue
│       │   ├── SubmissionGradeModal.vue
│       │   ├── ToastContainer.vue
│       │   └── admin/       # Admin-specific components
│       ├── composables/     # Vue composables
│       │   ├── useSocket.js # WebSocket management
│       │   └── useToast.js  # Toast notifications
│       ├── i18n/            # Internationalization
│       │   ├── index.js     # i18n configuration
│       │   └── locales/     # Translation files
│       │       ├── en.json
│       │       ├── fr.json
│       │       └── ar.json
│       ├── router/          # Vue Router configuration
│       │   └── index.js
│       ├── services/        # API service modules
│       │   ├── api.js       # Axios configuration with interceptors
│       │   ├── assignments.js
│       │   ├── attendance.js
│       │   ├── courses.js
│       │   ├── files.js
│       │   └── messaging.js
│       ├── stores/          # Pinia state stores
│       │   ├── auth.js      # Authentication state
│       │   ├── admin.js     # Admin dashboard state
│       │   └── messaging.js # Messaging state
│       ├── styles/          # Global styles
│       │   └── design-system.css
│       ├── utils/           # Utility functions
│       │   └── debounce.js
│       └── views/           # Page-level Vue components
│           ├── LoginView.vue
│           ├── RegisterView.vue
│           ├── HomeView.vue
│           ├── MessagingView.vue
│           ├── CoursesView.vue
│           ├── AssignmentsView.vue
│           ├── AttendanceView.vue
│           ├── FilesView.vue
│           ├── AdminView.vue
│           ├── AdminDashboardView.vue
│           └── UserManagementView.vue
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
        │   ├── messaging-enhanced.service.ts
        │   ├── channel-management.controller.ts
        │   ├── channel-management.service.ts
        │   └── dto/
        ├── admin/           # Admin dashboard module
        │   ├── admin.controller.ts
        │   ├── admin.gateway.ts
        │   ├── admin.module.ts
        │   ├── admin.service.ts
        │   └── dto/
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
        │   ├── health.controller.spec.ts
        │   ├── health.module.ts
        │   └── health.interface.ts
        └── common/          # Shared utilities
            ├── guards/ws-rate-limit.guard.ts
            ├── interceptors/logging.interceptor.ts
            └── utils/
                ├── audit-helper.ts
                ├── user-sanitizer.ts
                └── user-sanitizer.spec.ts
```

## Module Architecture

### Backend Modules

Each module follows NestJS conventions with controllers, services, and DTOs:

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **AuthModule** | JWT-based authentication with access/refresh tokens | `auth.service.ts`, `jwt.strategy.ts`, `roles.guard.ts` |
| **UsersModule** | User CRUD and profile management | `users.controller.ts`, `users.service.ts` |
| **MessagingModule** | Real-time messaging via Socket.IO gateway + REST API | `messaging.gateway.ts`, `messaging.service.ts` |
| **AdminModule** | Admin dashboard, user management, system stats | `admin.controller.ts`, `admin.gateway.ts` |
| **CoursesModule** | Course catalog, classes, enrollments, schedules | `courses.controller.ts`, `courses.service.ts` |
| **GradingModule** | Assignments, submissions, and gradebook | `grading.controller.ts`, `grading.service.ts` |
| **AttendanceModule** | Attendance sessions and records | `attendance.controller.ts`, `attendance.service.ts` |
| **FilesModule** | File uploads with permission-based access | `files.controller.ts`, `files.service.ts` |
| **ModerationModule** | Audit logging for compliance | `moderation.controller.ts`, `moderation.service.ts` |
| **SoftDeleteModule** | Soft delete functionality with cleanup jobs | `soft-delete.service.ts`, `soft-delete.controller.ts` |
| **HealthModule** | System health checks | `health.controller.ts` |
| **PrismaModule** | Database connection | `prisma.service.ts` |

### Frontend Structure

- **Views**: Page components (Login, Register, Messaging, Courses, Assignments, Attendance, Files, Admin)
- **Components**: Reusable UI components (MainLayout, SubmissionGradeModal, ToastContainer, Admin components)
- **Stores**: Pinia stores using Composition API style (auth.js, admin.js, messaging.js)
- **Services**: API client configuration with interceptors (api.js)
- **Composables**: Shared logic (useSocket.js for WebSocket management, useToast.js)
- **i18n**: Multi-language support with lazy-loaded locale files

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

# Client
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Server `.env` (Extended)

```env
# CORS Origins (comma-separated)
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads

# Admin Dashboard WebSocket Namespace
ADMIN_WS_NAMESPACE=/admin
```

### Client `.env`

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
# VITE_SENTRY_DSN=  # Optional: Sentry DSN for error tracking
```

## Build and Development Commands

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- npm 8+
- Docker & Docker Compose

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

### Frontend (client/)

```bash
# Install dependencies
npm install

# Development
npm run dev                # Start Vite dev server (port 5173)

# Production
npm run build              # Build for production to dist/
npm run preview            # Preview production build locally (port 4173)
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

# 4. Start frontend (in client/ directory, new terminal)
cd ../client
npm install
npm run dev
```

### Production Deployment

```bash
# Build and run production stack
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

Production stack includes:
- PostgreSQL (port 5434 internally)
- Redis (port 6379 internally)
- NestJS API server (port 3000)
- Nginx frontend (port 8085)

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

### Frontend (Vue 3/JavaScript)

- **Component Files**: PascalCase (e.g., `LoginView.vue`, `MainLayout.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useSocket.js`, `useToast.js`)
- **Stores**: camelCase (e.g., `auth.js`, `messaging.js`)
- **API**: Use Composition API with `<script setup>` syntax
- **State**: Pinia stores use Composition API style (`defineStore` with function)
- **API Calls**: Abstracted in `services/` directory
- **Notifications**: Global toast via `provide/inject` pattern

Example:
```vue
<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const email = ref('')

const isValid = computed(() => email.value.includes('@'))
</script>
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
- `Message`: Chat messages with reply support
- `MessageAttachment`: File attachments for messages
- `AuditLog`: Action audit trail

### Academic
- `Course`: Course catalog entries with departments
- `Class`: Scheduled course instances with teachers
- `ClassEnrollment`: Student enrollments with status
- `Schedule`: Class meeting times (dayOfWeek, startTime, endTime)
- `Assignment`: Coursework assignments with due dates
- `Submission`: Student assignment submissions with file IDs
- `Grade`: Graded scores, feedback, and letter grades
- `AttendanceSession`: Daily attendance records
- `AttendanceRecord`: Individual student attendance status

### Files
- `File`: Uploaded file metadata with soft delete
- `FilePermission`: Role/user-based file access control

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

**API Endpoints:**
- `DELETE /admin/soft-delete/:type/:id` - Soft delete item
- `POST /admin/restore/:type/:id` - Restore soft-deleted item
- `DELETE /admin/permanent-delete/:type/:id` - Permanent delete (after grace period)
- `GET /admin/deleted-items` - List soft-deleted items
- `POST /admin/cleanup-deleted-items` - Trigger manual cleanup

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
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `channel:join` - Join a channel room

### Server → Client
- `message:new` - New message received
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `typing:indicator` - User is typing
- `typing:stop` - User stopped typing
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

### Adding a New Page

1. Create Vue component in `client/src/views/`
2. Add route in `client/src/router/index.js`:
   ```javascript
   {
       path: '/new-page',
       name: 'NewPage',
       component: () => import('../views/NewPageView.vue'),
       meta: { requiresAuth: true, role: 'admin' }
   }
   ```
3. Add navigation link in `MainLayout.vue` if needed
4. Implement API calls in the appropriate store or component

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
- 5173 (frontend dev server)
- 5433 (PostgreSQL - mapped from 5432)
- 6379 (Redis)
- 8085 (production frontend)

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
