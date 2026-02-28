# Critical Fixes - School Hub

## Security Hardening Summary (OWASP 2025 Compliance)

### CRITICAL SEVERITY

#### 1. SQL Injection Fix (COMPLETE)
**File:** `server/src/prisma/prisma.service.ts`

**Change:** Removed `$queryRawUnsafe` method entirely. All database queries now use safe `Prisma.sql` tagged templates.

**Before:**
```typescript
async executeRaw(query: string, ...params: any[]): Promise<any> {
    return this.$queryRawUnsafe(query, ...params);
}
```

**After:**
```typescript
// REMOVED - Use safe Prisma.sql tagged templates instead
// Example: await this.$queryRaw(Prisma.sql`SELECT * FROM users WHERE id = ${id}`);
```

---

### HIGH SEVERITY

#### 2. Seed Password Security (COMPLETE)
**File:** `server/prisma/seed.ts`

**Change:** Replaced hardcoded passwords with cryptographically secure random generation.

**Before:**
```typescript
const passwordHash = await bcrypt.hash('Password123!', 12);
```

**After:**
```typescript
import * as crypto from 'crypto';

function generateSecurePassword(): string {
    const random = crypto.randomBytes(8).toString('hex');
    return `Secure${random}Pass!`;
}

const passwordHash = await bcrypt.hash(generateSecurePassword(), 12);
```

#### 3. DoS via Oversized Payloads (COMPLETE)
**Files:** All DTO files in the application

**Change:** Added `@MaxLength()` decorators to all string/number inputs to prevent DoS attacks via oversized payloads.

**Auth DTOs:** `server/src/auth/dto/auth.dto.ts`
- Email: @MaxLength(255)
- Password: @MaxLength(128) with @MinLength(8)
- Names: @MaxLength(100)
- Phone: @MaxLength(20)

**Messaging DTOs:** `server/src/messaging/dto/`
- Message content: @MaxLength(4000)
- Channel name: @MaxLength(200)
- Member arrays: @ArrayMaxSize(500)
- Attachments: @ArrayMaxSize(10)

**Course DTOs:** `server/src/courses/dto/`
- Course code: @MaxLength(20)
- Course name: @MaxLength(200)
- Descriptions: @MaxLength(5000)
- Bulk operations: @ArrayMaxSize(100)

**Grading DTOs:** `server/src/grading/dto/`
- Assignment titles: @MaxLength(200)
- Content: @MaxLength(10000)
- Feedback: @MaxLength(2000)
- Scores: @Min(0) @Max(10000)
- Bulk grades: @ArrayMaxSize(100)

**File DTOs:** `server/src/files/dto/`
- File names: @MaxLength(255)
- MIME types: @MaxLength(100)
- Descriptions: @MaxLength(1000)

---

### MEDIUM SEVERITY

#### 4. WebSocket Rate Limiting (COMPLETE)
**File:** `server/src/common/guards/ws-rate-limit.guard.ts`

**Existing:** Already implemented with comprehensive per-user rate limiting

**Limits Applied:**
- `message:send`: 30/minute
- `message:edit`: 20/minute
- `message:delete`: 10/minute
- `message:read`: 120/minute
- `message:read_bulk`: 30/minute
- `typing:start/stop/get`: 60/minute each
- `channel:join`: 20/minute
- `reaction:add/remove`: 50/minute each
- Default: 100/minute

**Enhancement:** Applied `@UseGuards(WsRateLimitGuard)` to all handlers in `messaging.gateway.ts`:
- `message:read`
- `message:read_bulk`
- `typing:start`
- `typing:stop`
- `typing:get`
- `channel:join`

#### 5. Path Traversal in File Uploads (COMPLETE)
**File:** `server/src/files/files.service.ts`

**Status:** Already protected via:
- MIME type whitelist validation
- File extension matching
- File size limits (10MB)
- Sanitized filename generation using UUIDs
- Virus scanning via ClamAV integration

#### 6. Dependency Vulnerabilities (PARTIAL)
**Command:** `npm audit`

**Before:** 38 vulnerabilities (5 high, 9 moderate, 24 low)
**After:** 35 vulnerabilities (2 high, 9 moderate, 24 low)

**Fixed:**
- Updated `bcrypt` 5.1.1 → 6.0.0 (fixes `tar` high-severity vulnerabilities)

**Remaining:** All in dev dependencies only (@nestjs/cli, webpack, glob, etc.)
- Not exploitable in production runtime
- Affect only build-time tooling

---

### LOW SEVERITY

#### 7. JWT Token Rotation (ACCEPTED RISK)
**Status:** Tokens remain valid after password change until expiry

**Mitigation:**
- Short-lived access tokens (15 minutes)
- Redis-based token denylist on logout
- Refresh tokens stored in database with rotation

**Decision:** Low risk given short token lifetime and existing denylist mechanism.

---

## Existing Security Protections (Already in Place)

### Authentication & Authorization
- JWT with 15min access / 7d refresh token expiry
- Redis-based token denylist for revocation
- bcrypt with 12 rounds for password hashing
- Role-based access control (RBAC)

### API Security
- CORS with explicit allowed origins
- Helmet security headers
- Global rate limiting (100 req/min)
- Input validation with class-validator
- DOMPurify XSS protection via SanitizePipe

### WebSocket Security
- JWT authentication on connection
- Per-socket + per-user rate limiting
- Redis adapter for horizontal scaling

### File Upload Security
- 10MB size limit
- MIME type whitelist validation
- Extension matching
- Virus scanning (ClamAV)
- Quota management per user

### Data Security
- Prisma ORM (parameterized queries)
- SQL injection protection
- XSS input sanitization
- Soft delete for data retention

---

## Verification Commands

```bash
# Backend
cd server
npm run build
npm test

# Security audit
npm audit --audit-level=moderate
```

## Testing Checklist

- [x] SQL queries use safe Prisma.sql templates
- [x] All DTOs have @MaxLength decorators
- [x] WebSocket handlers have rate limiting
- [x] Seed passwords are cryptographically random
- [x] File uploads validate MIME types and paths
- [x] bcrypt updated to 6.0.0
- [ ] Pagination loads messages in correct order
- [ ] Only admins/moderators can add/remove members
