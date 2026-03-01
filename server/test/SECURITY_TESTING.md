# Security Testing Guide for School Hub

## Overview

This comprehensive security test suite covers 10 major security categories:

1. **Authentication Bypass** - JWT attacks, session fixation, token manipulation
2. **Authorization** - IDOR, privilege escalation (horizontal & vertical)
3. **Injection** - SQL, NoSQL, Command, LDAP, XPath injection
4. **XSS** - Stored, Reflected, DOM-based, SVG XSS
5. **File Upload Security** - MIME spoofing, extension bypass, path traversal
6. **CSRF** - Missing tokens, CORS validation, SameSite cookies
7. **Rate Limiting** - Brute force, DDoS simulation, bypass attempts
8. **Information Disclosure** - Error messages, stack traces, sensitive data
9. **Input Validation** - Boundary values, type confusion, Unicode attacks
10. **Business Logic** - Payment validation, grade manipulation, scheduling

## Prerequisites

Before running security tests:

```bash
# Ensure database is running
docker-compose up -d postgres redis

# Install dependencies
cd server && npm install

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

## Running Security Tests

### Run All Security Tests

```bash
npm run test:e2e -- security.e2e-spec.ts
```

### Run Specific Security Category

```bash
# Authentication tests only
npm run test:e2e -- security.e2e-spec.ts -t "Authentication Bypass"

# Authorization tests
npm run test:e2e -- security.e2e-spec.ts -t "Authorization"

# XSS tests
npm run test:e2e -- security.e2e-spec.ts -t "XSS"

# Injection tests
npm run test:e2e -- security.e2e-spec.ts -t "Injection"
```

### Run with Verbose Output

```bash
npm run test:e2e -- security.e2e-spec.ts --verbose
```

### Run with Coverage Report

```bash
npm run test:e2e -- security.e2e-spec.ts --coverage
```

## Test Environment Configuration

### Required Environment Variables

Create or update `server/.env.test`:

```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test-security-jwt-secret-must-be-32-characters
JWT_REFRESH_SECRET=test-security-refresh-secret-must-be-32-chars
DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging_test"
REDIS_URL="redis://localhost:6379"
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads-test
```

### Test Database Setup

```bash
# Create test database
docker exec -it school-hub-postgres psql -U sms_user -c "CREATE DATABASE school_messaging_test;"

# Run migrations
DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging_test" npx prisma migrate deploy
```

## Interpreting Test Results

### Understanding Test Status

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ PASS | Security control working as expected | None |
| ❌ FAIL | Security vulnerability detected | **Immediate action required** |
| ⚠️ SKIP | Test skipped (dependency unavailable) | Check test environment |
| ⏱️ TIMEOUT | Request took too long | Check server performance |

### Critical Findings

If any of the following tests fail, treat as **CRITICAL**:

1. **JWT 'none' algorithm accepted** - Authentication bypass vulnerability
2. **SQL injection successful** - Database compromise possible
3. **Stored XSS executed** - Session hijacking possible
4. **Privilege escalation works** - Unauthorized admin access
5. **Path traversal successful** - Server file system access
6. **Rate limiting bypassed** - DoS vulnerability

### Security Risk Matrix

| Category | Risk Level | Business Impact |
|----------|-----------|-----------------|
| Authentication Bypass | CRITICAL | Complete system compromise |
| SQL Injection | CRITICAL | Data breach, data loss |
| Privilege Escalation | CRITICAL | Unauthorized access |
| XSS | HIGH | Session theft, defacement |
| File Upload | HIGH | Server compromise |
| CSRF | MEDIUM | Unauthorized actions |
| Information Disclosure | MEDIUM | Information gathering |
| Rate Limiting | MEDIUM | DoS, brute force |
| Input Validation | LOW-MEDIUM | Various attacks |
| Business Logic | LOW-MEDIUM | Financial/grade manipulation |

## Test Categories Explained

### 🔐 Authentication Bypass Tests

**What we test:**
- JWT algorithm confusion attacks (`alg: none`)
- Token tampering and signature bypass
- Expired/invalid token handling
- Session fixation
- Cookie security flags (httpOnly, SameSite, Secure)

**Expected behavior:**
- All tokens with `alg: none` are rejected (401)
- Tampered tokens are rejected (401)
- Expired tokens are rejected (401)
- Cookies have httpOnly, SameSite=Strict flags

### 🔒 Authorization Tests

**What we test:**
- IDOR (Insecure Direct Object Reference) on all endpoints
- Horizontal privilege escalation (user A → user B data)
- Vertical privilege escalation (student → admin)
- Role-based access control enforcement

**Expected behavior:**
- Users can only access their own data
- Students cannot access admin endpoints (403)
- Teachers cannot access admin-only functions (403)
- UUID validation prevents injection attacks

### 💉 Injection Tests

**What we test:**
- SQL injection in search parameters
- NoSQL injection in MongoDB queries (if applicable)
- Command injection in file paths
- LDAP/XPath injection (if applicable)

**Expected behavior:**
- All injection payloads are sanitized or rejected
- No database errors exposed
- No command execution possible

### 🔴 XSS Tests

**What we test:**
- Stored XSS in messages, profiles, course descriptions
- Reflected XSS in error messages
- DOM-based XSS vectors
- SVG XSS in file uploads
- Template injection

**Expected behavior:**
- All HTML/JS is sanitized
- Script tags removed or encoded
- Event handlers stripped
- SVG scripts neutralized

### 📁 File Upload Security

**What we test:**
- MIME type spoofing
- Extension bypass (double extension, null byte)
- Path traversal in filenames
- Malicious file content (PHP, JSP)
- Large file DoS (>100MB)
- Upload rate limiting

**Expected behavior:**
- File type verified by content, not just extension
- Path traversal attempts blocked (400)
- Executable content rejected
- Size limits enforced

### 🛡️ CSRF Tests

**What we test:**
- Missing CSRF token rejection
- Origin header validation
- CORS preflight handling
- Cookie SameSite protection

**Expected behavior:**
- Cross-origin POST requests blocked (403)
- Cookies have SameSite=Strict
- Preflight requests handled correctly

### ⏱️ Rate Limiting Tests

**What we test:**
- Brute force login protection (>100 attempts)
- API endpoint hammering
- DDoS simulation
- Bypass attempts via headers (X-Forwarded-For)

**Expected behavior:**
- Rate limit exceeded returns 429
- Limits applied per IP/user
- Cannot bypass with header spoofing

### 🔍 Information Disclosure Tests

**What we test:**
- Error message detail leakage
- Stack trace exposure
- Sensitive data in responses
- API versioning exposure
- Debug endpoint access
- User enumeration

**Expected behavior:**
- Generic error messages in production
- No stack traces in responses
- No password hashes/tokens exposed
- Debug endpoints return 404

### ✅ Input Validation Tests

**What we test:**
- Boundary value analysis (min/max lengths)
- Type confusion attacks
- Unicode normalization attacks (homoglyphs)
- Null byte injection
- Maximum length violations
- Invalid UUID formats

**Expected behavior:**
- Type validation rejects invalid types (400)
- Length limits enforced
- Unicode normalized
- Null bytes rejected

### 💼 Business Logic Tests

**What we test:**
- Negative/zero payment amounts
- Duplicate invoice creation
- Grade manipulation (out of range, self-grading)
- Attendance backdating
- Conference scheduling conflicts
- Self-enrollment attempts

**Expected behavior:**
- Negative amounts rejected (400)
- Grades within valid range (0-100)
- Past dates handled appropriately
- Scheduling conflicts prevented

## Common Issues and Solutions

### Issue: Tests fail with 500 errors

**Solution:**
```bash
# Check database connection
npm run prisma:generate
npm run prisma:migrate

# Reset test database
docker-compose restart postgres
```

### Issue: JWT tests fail

**Solution:**
```bash
# Verify JWT secrets are set
export JWT_SECRET="test-jwt-secret-must-be-32-characters-long"
export JWT_REFRESH_SECRET="test-refresh-secret-must-be-32-characters"
```

### Issue: File upload tests fail

**Solution:**
```bash
# Create uploads directory
mkdir -p server/uploads-test
cd server && chmod 755 uploads-test
```

### Issue: Redis connection fails

**Solution:**
```bash
# Start Redis
docker-compose up -d redis

# Or use in-memory fallback for tests
export REDIS_URL="redis://localhost:6379"
```

## Security Test Checklist

Before deploying to production, verify:

- [ ] All authentication bypass tests pass
- [ ] All authorization tests pass
- [ ] All injection tests pass
- [ ] All XSS tests pass
- [ ] All file upload tests pass
- [ ] CSRF protection is enabled
- [ ] Rate limiting is configured
- [ ] No sensitive information disclosed
- [ ] Input validation works correctly
- [ ] Business logic is secure

## Continuous Security Testing

### Add to CI/CD Pipeline

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: sms_user
          POSTGRES_PASSWORD: sms_password_2026
          POSTGRES_DB: school_messaging_test
        ports:
          - 5433:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd server && npm ci
      
      - name: Run migrations
        run: cd server && npm run prisma:migrate
        env:
          DATABASE_URL: postgresql://sms_user:sms_password_2026@localhost:5433/school_messaging_test
      
      - name: Run security tests
        run: cd server && npm run test:e2e -- security.e2e-spec.ts
        env:
          NODE_ENV: test
          JWT_SECRET: test-jwt-secret-must-be-32-characters-long
          JWT_REFRESH_SECRET: test-refresh-secret-must-be-32-characters
          DATABASE_URL: postgresql://sms_user:sms_password_2026@localhost:5433/school_messaging_test
          REDIS_URL: redis://localhost:6379
```

## Reporting Security Issues

If security tests reveal vulnerabilities:

1. **Document the finding** with:
   - Test category
   - Steps to reproduce
   - Expected vs actual behavior
   - Severity assessment

2. **Create a ticket** with:
   - Title: `[SECURITY] Brief description`
   - Label: `security`, priority based on severity
   - Assign to security team lead

3. **Do NOT** create public issues for:
   - Authentication bypasses
   - SQL injection
   - Privilege escalation
   - Other critical vulnerabilities

## Additional Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)

## Contact

For security-related questions:
- Security Team: security@school-hub.com
- DevOps: devops@school-hub.com
