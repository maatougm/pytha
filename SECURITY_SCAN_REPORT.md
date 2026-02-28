# School Hub - Security Vulnerability Scan Report

**Scan Date:** 2026-02-27  
**Scan Type:** OWASP 2025 Comprehensive Security Assessment  
**Scope:** Full-stack (NestJS Backend + React Native Mobile)  

---

## Executive Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| **Critical** | ⚠️ | 1 |
| **High** | ⚠️ | 2 |
| **Medium** | ⚠️ | 4 |
| **Low** | ℹ️ | 5 |
| **Informational** | ℹ️ | 3 |

**Overall Risk Rating:** MEDIUM-HIGH  
**Recommendation:** Address Critical and High issues before production deployment.

---

## 🔴 Critical Issues (A01: Broken Access Control)

### C1: $queryRawUnsafe Usage in PrismaService

**File:** `server/src/prisma/prisma.service.ts`  
**Line:** 45  
**Severity:** CRITICAL  
**CVSS Score:** 9.1  

**Description:**
The `executeRaw` method uses `$queryRawUnsafe` which allows raw SQL queries without parameterization safety. This is a direct SQL injection vulnerability.

```typescript
async executeRaw(query: string, ...parameters: any[]) {
    return await this.$queryRawUnsafe(query, ...parameters);
}
```

**Attack Scenario:**
An attacker could inject malicious SQL through this method if it's ever called with user-controlled input.

**Remediation:**
```typescript
// Use Prisma.sql tagged template instead
async executeRaw(query: string, ...parameters: any[]) {
    const sql = Prisma.sql([query], ...parameters);
    return await this.$queryRaw(sql);
}
```

**Impact:** 
- Database compromise
- Data exfiltration
- Authentication bypass
- Complete system takeover

---

## 🟠 High Issues

### H1: Weak Default Password in Seed Data

**File:** `server/prisma/seed.ts`  
**Line:** 43  
**Severity:** HIGH  
**CVSS Score:** 7.5  
**OWASP:** A07: Authentication Failures

**Description:**
All demo accounts use predictable password `Password123!` with bcrypt factor 12. If seed data is accidentally deployed to production, accounts are easily compromised.

```typescript
const passwordHash = await bcrypt.hash('Password123!', 12);
```

**Risk:**
- Brute force attacks against demo accounts
- Credential stuffing if users reuse passwords
- Easy admin takeover

**Remediation:**
1. Generate random passwords for seed data
2. Log generated passwords only in development
3. Add warning comments
4. Exclude seed.ts from production builds

```typescript
const seedPassword = process.env.NODE_ENV === 'production' 
    ? crypto.randomBytes(32).toString('hex')
    : 'Password123!';
```

---

### H2: Missing Input Length Validation

**File:** Multiple DTO files  
**Severity:** HIGH  
**OWASP:** A05: Injection

**Description:**
Several DTOs lack `@MaxLength()` decorators, allowing potential DoS through extremely large payloads:

**Affected Areas:**
- `CreateChannelDto.name` - no max length
- `SendMessageDto.content` - no max length (database is limited but no app-level validation)
- `CreateAssignmentDto.description` - no max length

**Attack Scenario:**
Attacker sends 10MB+ messages causing:
- Memory exhaustion
- Database bloat
- Denial of service

**Remediation:**
```typescript
@IsString()
@MinLength(1)
@MaxLength(5000) // Enforce reasonable limits
content: string;
```

---

## 🟡 Medium Issues

### M1: No Rate Limiting on WebSocket Events

**File:** `server/src/messaging/messaging.gateway.ts`  
**Severity:** MEDIUM  
**OWASP:** A06: Insecure Design

**Description:**
While HTTP endpoints have rate limiting via `@nestjs/throttler`, WebSocket events lack equivalent protection. The `ws-rate-limit.guard.ts` exists but isn't consistently applied to all events.

**Risk:**
- WebSocket spam/flooding
- Resource exhaustion
- Message flooding attacks

**Remediation:**
Apply rate limiting to all WebSocket handlers:
```typescript
@UseGuards(WsRateLimitGuard)
@SubscribeMessage('message:send')
async handleMessage(...) { }
```

---

### M2: Missing Security Headers on Static Files

**File:** `server/src/main.ts`  
**Severity:** MEDIUM  
**OWASP:** A02: Security Misconfiguration

**Description:**
Static files served from `/downloads/` don't have security headers applied. The `helmet()` middleware is applied globally but may not cover static file routes properly.

**Risk:**
- XSS via malicious downloaded files
- MIME sniffing attacks
- Clickjacking on downloads

**Remediation:**
```typescript
app.useStaticAssets(join(__dirname, '..', 'downloads'), {
    prefix: '/downloads/',
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
});
```

---

### M3: File Upload Path Traversal Risk

**File:** `server/src/files/files.service.ts`  
**Severity:** MEDIUM  
**OWASP:** A01: Broken Access Control

**Description:**
The `category` parameter is validated against an enum but could be bypassed if validation fails silently. Path construction uses user-controlled category:

```typescript
const categoryDir = path.join(this.uploadsDir, category);
```

While validation exists (line 584-588), it could be enhanced with additional path sanitization.

**Remediation:**
```typescript
const sanitizedCategory = path.basename(category);
const categoryDir = path.join(this.uploadsDir, sanitizedCategory);
```

---

### M4: JWT Token Not Expired on Password Change

**File:** `server/src/auth/auth.service.ts`  
**Severity:** MEDIUM  
**OWASP:** A07: Authentication Failures

**Description:**
When a user changes their password, existing JWT access tokens remain valid until their natural expiration (15 minutes). This allows stolen tokens to remain usable even after password change.

**Remediation:**
Add password change tracking:
```typescript
// Store password change timestamp in JWT
const payload = { 
    sub: userId, 
    email, 
    roles, 
    jti,
    iat: Date.now(),
    pwdVersion: user.passwordVersion // Increment on password change
};
```

---

## 🟢 Low Issues

### L1: Information Disclosure in Error Messages

**File:** Multiple files  
**Severity:** LOW  
**OWASP:** A09: Logging Failures

**Description:**
Some error messages reveal internal implementation details:
- Database error messages in logs
- Stack traces in non-production environments

**Remediation:**
Sanitize error messages and use error codes:
```typescript
throw new BadRequestException({
    code: 'FILE_UPLOAD_FAILED',
    message: 'File upload failed. Please try again.'
});
```

---

### L2: Missing HTTPS Enforcement

**File:** `server/src/main.ts`  
**Severity:** LOW  
**OWASP:** A02: Security Misconfiguration

**Description:**
No automatic redirect from HTTP to HTTPS in production.

**Remediation:**
Add HTTPS enforcement middleware:
```typescript
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (!req.secure) {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}
```

---

### L3: Dependency Vulnerabilities

**File:** `server/package.json`  
**Severity:** LOW  
**OWASP:** A03: Supply Chain Security

**Description:**
Dependencies should be regularly audited for known vulnerabilities:

```bash
npm audit --audit-level moderate
```

**Remediation:**
1. Run `npm audit fix` regularly
2. Use Dependabot or Snyk for automated scanning
3. Pin exact versions in package.json

---

### L4: Missing API Versioning

**File:** Global  
**Severity:** LOW  
**OWASP:** A06: Insecure Design

**Description:**
No API versioning strategy implemented. Breaking changes could affect clients.

**Remediation:**
Add version prefix:
```typescript
app.setGlobalPrefix('api/v1');
```

---

### L5: Email Header Injection Possible

**File:** `server/src/notifications/email.service.ts`  
**Severity:** LOW  
**OWASP:** A05: Injection

**Description:**
Email subject and content are sanitized but could still contain injection vectors.

**Current mitigation:**
```typescript
private sanitizeForEmail(content: string): string {
    return content
        .replace(/[\r\n]/g, ' ')
        .replace(/[<>]/g, '')
        .substring(0, 500);
}
```

This is acceptable but should be documented.

---

## ℹ️ Informational Findings

### I1: Comprehensive Security Measures Already Implemented

The codebase demonstrates strong security practices:

| Security Measure | Implementation |
|------------------|----------------|
| **Password Hashing** | bcrypt with 12 rounds |
| **JWT Security** | Short expiry (15min), refresh tokens, Redis denylist |
| **XSS Prevention** | DOMPurify with strict config |
| **SQL Injection** | Prisma ORM (mostly parameterized) |
| **CORS** | Explicit origin whitelist |
| **Rate Limiting** | Redis-based distributed rate limiting |
| **File Upload** | Virus scanning, mime validation, size limits |
| **AuthZ** | Role-based guards |
| **Audit Logging** | Comprehensive audit trail |
| **Input Validation** | class-validator with whitelist |

---

### I2: Security Headers Configured

Helmet.js is properly configured with:
- Content Security Policy
- HSTS (production only)
- X-Content-Type-Options
- X-Frame-Options

---

### I3: Soft Delete Pattern

Good data protection through soft delete pattern:
- Users marked as deleted but data preserved
- 30-day grace period before permanent deletion
- Audit logs maintained

---

## Mobile App Security Assessment

### Strengths

| Feature | Status |
|---------|--------|
| Secure Token Storage | ✅ expo-secure-store |
| Certificate Pinning | ⚠️ Not implemented |
| Root Detection | ⚠️ Not implemented |
| Biometric Auth | ✅ Implemented |
| Push Notification Security | ✅ Token-based |

### Issues Found

#### M-M1: Hardcoded API URL Fallback

**File:** `mobile/src/services/api-client.ts`  
**Line:** 47-49  
**Severity:** LOW

```typescript
const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || process.env.EXPO_PUBLIC_API_URL 
  || 'http://localhost:3000/api'; // Fallback could be exploited
```

**Risk:** If environment variables are not set, app falls back to localhost which could be hijacked.

---

#### M-M2: No Certificate Pinning

**Severity:** MEDIUM

The mobile app doesn't implement certificate pinning, making it vulnerable to MITM attacks on public WiFi.

---

## Compliance Mapping

| Requirement | Status | Notes |
|-------------|--------|-------|
| **GDPR - Right to be Forgotten** | ✅ | Soft delete + 30-day purge |
| **GDPR - Data Portability** | ⚠️ | Export functionality missing |
| **FERPA - Education Records** | ✅ | Audit logging, role-based access |
| **COPPA - Under 13 Protection** | ⚠️ | Age verification not implemented |

---

## Recommendations Summary

### Immediate Actions (Before Production)

1. **Fix C1:** Remove or secure `$queryRawUnsafe` usage
2. **Fix H1:** Randomize seed passwords or remove seed data from production
3. **Fix H2:** Add `@MaxLength()` decorators to all string inputs

### Short-term (Within 30 days)

1. Implement consistent WebSocket rate limiting
2. Add security headers to static file serving
3. Implement certificate pinning in mobile app
4. Set up automated dependency scanning

### Long-term (Within 90 days)

1. Implement API versioning
2. Add password version tracking for JWT invalidation
3. Add root/jailbreak detection in mobile app
4. Implement data export functionality for GDPR compliance

---

## Testing Recommendations

### Security Testing

```bash
# Run dependency audit
npm audit --audit-level moderate

# Run SAST (if using SonarQube or similar)
npx eslint . --ext .ts

# Test for SQL injection
sqlmap -u "http://localhost:3000/api/messages/search?q=test" --batch

# Test for XSS
# Use OWASP ZAP or Burp Suite for comprehensive testing
```

### Penetration Testing Checklist

- [ ] Authentication bypass attempts
- [ ] Session fixation testing
- [ ] Privilege escalation (student → admin)
- [ ] File upload bypass (double extensions, null bytes)
- [ ] WebSocket message injection
- [ ] Rate limit bypass testing
- [ ] CORS misconfiguration testing
- [ ] JWT token manipulation

---

## Appendix: Code Examples

### Secure DTO Example

```typescript
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'Password must contain uppercase, lowercase, number, and special character'
    })
    password: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;
}
```

### Secure Raw Query Example

```typescript
// ❌ BAD
const result = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ GOOD
const result = await prisma.$queryRaw`
    SELECT * FROM users WHERE id = ${userId}
`;
```

---

**Report Generated By:** Vulnerability Scanner Agent  
**Next Review Date:** 2026-03-27  
**Classification:** Internal - Restricted Distribution
