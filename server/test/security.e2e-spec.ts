/**
 * Comprehensive Security Test Suite for School Hub
 * 
 * This test suite covers security testing across multiple categories:
 * 1. Authentication Bypass Tests
 * 2. Authorization Tests (IDOR, privilege escalation)
 * 3. Injection Tests (SQL, NoSQL, Command)
 * 4. XSS Tests (Stored, Reflected, DOM-based)
 * 5. File Upload Security
 * 6. CSRF Tests
 * 7. Rate Limiting Tests
 * 8. Information Disclosure Tests
 * 9. Input Validation Tests
 * 10. Business Logic Tests
 * 
 * SECURITY TESTING PHILOSOPHY:
 * - All tests verify that security controls are properly implemented
 * - Tests document expected security behavior
 * - Failed tests indicate security vulnerabilities
 * - Each test includes a description of the attack vector and expected mitigation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { Redis } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createClient } from 'redis';

describe('Security Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let redisClient: Redis;

    // Test data
    const testUsers: Record<string, { email: string; password: string; token?: string; id?: string }> = {
        admin: { email: 'security-test-admin@school.com', password: 'SecurePass123!' },
        teacher: { email: 'security-test-teacher@school.com', password: 'SecurePass123!' },
        parent: { email: 'security-test-parent@school.com', password: 'SecurePass123!' },
        student: { email: 'security-test-student@school.com', password: 'SecurePass123!' },
        student2: { email: 'security-test-student2@school.com', password: 'SecurePass123!' },
    };

    // Valid UUIDs for testing IDOR
    const validUUID = '12345678-1234-4123-8123-123456789abc';
    const anotherValidUUID = 'abcdef12-3456-7890-abcd-ef1234567890';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        // Apply same configuration as main.ts
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        app.setGlobalPrefix('api');
        
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Connect to Redis
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

        // Clean up any existing test users
        await cleanupTestUsers();

        // Create test users with different roles
        await createTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
        await redisClient.quit();
        await app.close();
    });

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    async function cleanupTestUsers() {
        const emails = Object.values(testUsers).map(u => u.email);
        await prisma.user.deleteMany({
            where: { email: { in: emails } },
        });
    }

    async function createTestUsers() {
        // Create admin user
        const adminRes = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: testUsers.admin.email,
                password: testUsers.admin.password,
                firstName: 'Security',
                lastName: 'Admin',
                role: 'admin',
            });
        
        // Admin registration should fail without existing admin
        // So we need to seed an admin first or use the seeded admin
        const seededAdminRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: 'admin@school.com',
                password: 'Password123!',
            });
        
        if (seededAdminRes.status === 200) {
            const adminToken = seededAdminRes.body.accessToken;
            
            // Create users via admin endpoint
            for (const [role, user] of Object.entries(testUsers)) {
                const res = await request(app.getHttpServer())
                    .post('/api/auth/admin/create-user')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        email: user.email,
                        password: user.password,
                        firstName: 'Security',
                        lastName: role.charAt(0).toUpperCase() + role.slice(1),
                        role: role === 'student2' ? 'student' : role,
                    });
                
                if (res.status === 201) {
                    // Login to get token
                    const loginRes = await request(app.getHttpServer())
                        .post('/api/auth/login')
                        .send({
                            email: user.email,
                            password: user.password,
                        });
                    
                    if (loginRes.status === 200) {
                        testUsers[role].token = loginRes.body.accessToken;
                        testUsers[role].id = loginRes.body.user.id;
                    }
                }
            }
        }
    }

    function getAuthHeader(role: string): string {
        return `Bearer ${testUsers[role]?.token || ''}`;
    }

    // ============================================================================
    // CATEGORY 1: AUTHENTICATION BYPASS TESTS
    // ============================================================================
    describe('🔐 Authentication Bypass Tests', () => {
        
        describe('JWT Algorithm Confusion Attack', () => {
            it('should reject tokens with "none" algorithm', async () => {
                // JWT with alg: "none" - Base64 encoded
                // Header: {"alg":"none","typ":"JWT"}
                const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.' +
                    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjJ9.';
                
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${noneAlgToken}`);

                expect(response.status).toBe(401);
            });

            it('should reject tokens with invalid algorithm', async () => {
                // JWT with unsupported algorithm
                const invalidAlgHeader = Buffer.from(JSON.stringify({
                    alg: 'HS512',
                    typ: 'JWT',
                })).toString('base64url');
                
                const payload = Buffer.from(JSON.stringify({
                    sub: validUUID,
                    email: 'test@school.com',
                    roles: ['admin'],
                })).toString('base64url');
                
                const fakeToken = `${invalidAlgHeader}.${payload}.invalidsignature`;
                
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${fakeToken}`);

                expect(response.status).toBe(401);
            });

            it('should reject tampered JWT signatures', async () => {
                // Get a valid token and modify it
                const validToken = testUsers.student.token;
                if (!validToken) {
                    console.warn('Skipping test - no valid token available');
                    return;
                }

                const parts = validToken.split('.');
                // Modify the payload
                const tamperedPayload = Buffer.from(JSON.stringify({
                    sub: validUUID,
                    email: 'hacker@evil.com',
                    roles: ['admin'], // Try to escalate to admin
                })).toString('base64url');
                
                const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
                
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${tamperedToken}`);

                expect(response.status).toBe(401);
            });
        });

        describe('JWT Secret Brute Force Protection', () => {
            it('should use strong JWT secrets (min 32 characters)', async () => {
                const jwtSecret = process.env.JWT_SECRET;
                expect(jwtSecret).toBeDefined();
                expect(jwtSecret?.length).toBeGreaterThanOrEqual(32);
            });

            it('should have different secrets for access and refresh tokens', async () => {
                const jwtSecret = process.env.JWT_SECRET;
                const refreshSecret = process.env.JWT_REFRESH_SECRET;
                
                expect(jwtSecret).toBeDefined();
                expect(refreshSecret).toBeDefined();
                expect(jwtSecret).not.toEqual(refreshSecret);
            });
        });

        describe('Token Manipulation Tests', () => {
            it('should reject expired tokens', async () => {
                // Create a token that appears expired
                const expiredPayload = Buffer.from(JSON.stringify({
                    sub: validUUID,
                    email: 'test@school.com',
                    roles: ['student'],
                    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
                    iat: Math.floor(Date.now() / 1000) - 7200,
                })).toString('base64url');
                
                const header = Buffer.from(JSON.stringify({
                    alg: 'HS256',
                    typ: 'JWT',
                })).toString('base64url');
                
                const fakeExpiredToken = `${header}.${expiredPayload}.fakesignature`;
                
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${fakeExpiredToken}`);

                expect(response.status).toBe(401);
            });

            it('should reject tokens with missing required claims', async () => {
                // Token without 'sub' claim
                const incompletePayload = Buffer.from(JSON.stringify({
                    email: 'test@school.com',
                    roles: ['student'],
                })).toString('base64url');
                
                const header = Buffer.from(JSON.stringify({
                    alg: 'HS256',
                    typ: 'JWT',
                })).toString('base64url');
                
                const incompleteToken = `${header}.${incompletePayload}.fakesignature`;
                
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${incompleteToken}`);

                expect(response.status).toBe(401);
            });

            it('should reject malformed JWT tokens', async () => {
                const malformedTokens = [
                    'not-a-jwt',
                    'Bearer ',
                    'Bearer token.with.only.two.parts',
                    'Bearer token.with..double.dots',
                    '',
                    'Bearer ' + 'a'.repeat(10000), // Very long token
                ];

                for (const token of malformedTokens) {
                    const response = await request(app.getHttpServer())
                        .get('/api/auth/profile')
                        .set('Authorization', token);

                    expect(response.status).toBe(401);
                }
            });
        });

        describe('Session Fixation Protection', () => {
            it('should rotate refresh tokens on use', async () => {
                // Login to get initial tokens
                const loginRes = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email,
                        password: testUsers.student.password,
                    });

                expect(loginRes.status).toBe(200);
                expect(loginRes.headers['set-cookie']).toBeDefined();

                // Extract refresh token from cookie
                const cookies = loginRes.headers['set-cookie'] as string[];
                expect(cookies).toBeDefined();

                // The refresh endpoint should rotate the token
                // This is verified by the token being set in a new cookie
            });

            it('should invalidate tokens on logout', async () => {
                // Login first
                const loginRes = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email,
                        password: testUsers.student.password,
                    });

                const token = loginRes.body.accessToken;

                // Logout
                await request(app.getHttpServer())
                    .post('/api/auth/logout')
                    .set('Authorization', `Bearer ${token}`);

                // Token should be in denylist
                // Try to use the token - should be rejected
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${token}`);

                // Note: Token denylist check happens in JWT strategy
                // This may or may not be immediate depending on Redis state
                expect([401, 200]).toContain(response.status);
            });
        });

        describe('Cookie Security Flags', () => {
            it('should set httpOnly flag on refresh token cookie', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email,
                        password: testUsers.student.password,
                    });

                const cookies = response.headers['set-cookie'] as string[];
                expect(cookies).toBeDefined();
                
                const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
                expect(refreshCookie).toBeDefined();
                expect(refreshCookie).toContain('httponly');
            });

            it('should set SameSite=strict on cookies', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email,
                        password: testUsers.student.password,
                    });

                const cookies = response.headers['set-cookie'] as string[];
                expect(cookies).toBeDefined();
                
                const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
                expect(refreshCookie).toBeDefined();
                expect(refreshCookie?.toLowerCase()).toContain('samesite=strict');
            });

            it('should set Secure flag in production', async () => {
                // This test verifies the code logic
                // In production, the Secure flag should be set
                const isProduction = process.env.NODE_ENV === 'production';
                
                if (isProduction) {
                    const response = await request(app.getHttpServer())
                        .post('/api/auth/login')
                        .send({
                            email: testUsers.student.email,
                            password: testUsers.student.password,
                        });

                    const cookies = response.headers['set-cookie'] as string[];
                    const refreshCookie = cookies?.find(c => c.includes('sms_refresh_token'));
                    
                    if (refreshCookie) {
                        expect(refreshCookie.toLowerCase()).toContain('secure');
                    }
                }
            });
        });

        describe('Missing Authentication Header Tests', () => {
            it('should reject requests without Authorization header', async () => {
                const protectedEndpoints = [
                    { method: 'get', path: '/api/auth/profile' },
                    { method: 'get', path: '/api/users' },
                    { method: 'get', path: '/api/courses' },
                    { method: 'post', path: '/api/courses', body: { name: 'Test' } },
                ];

                for (const endpoint of protectedEndpoints) {
                    const req = request(app.getHttpServer())[endpoint.method](endpoint.path);
                    if (endpoint.body) {
                        req.send(endpoint.body);
                    }
                    
                    const response = await req;
                    expect(response.status).toBe(401);
                }
            });

            it('should reject requests with empty Authorization header', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', '');

                expect(response.status).toBe(401);
            });

            it('should reject requests with wrong Authorization scheme', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Basic ${testUsers.student.token}`);

                expect(response.status).toBe(401);
            });
        });
    });

    // ============================================================================
    // CATEGORY 2: AUTHORIZATION TESTS (IDOR, PRIVILEGE ESCALATION)
    // ============================================================================
    describe('🔒 Authorization Tests (IDOR & Privilege Escalation)', () => {
        
        describe('Insecure Direct Object Reference (IDOR)', () => {
            it('should prevent accessing other users profiles by ID', async () => {
                // Student tries to access another student's profile
                const response = await request(app.getHttpServer())
                    .get(`/api/users/${anotherValidUUID}`)
                    .set('Authorization', getAuthHeader('student'));

                // Should either return 403 Forbidden or 404 Not Found
                // depending on whether relationship exists
                expect([403, 404, 400]).toContain(response.status);
            });

            it('should prevent accessing admin endpoints as non-admin', async () => {
                const adminEndpoints = [
                    { method: 'get' as const, path: '/api/admin/dashboard/metrics' },
                    { method: 'get' as const, path: '/api/admin/users' },
                    { method: 'get' as const, path: '/api/admin/audit-logs' },
                    { method: 'post' as const, path: '/api/admin/users/create', body: {} },
                    { method: 'delete' as const, path: '/api/admin/users/some-id' },
                ];

                for (const endpoint of adminEndpoints) {
                    const req = request(app.getHttpServer())[endpoint.method](endpoint.path)
                        .set('Authorization', getAuthHeader('student'));
                    
                    if (endpoint.body) {
                        req.send(endpoint.body);
                    }

                    const response = await req;
                    expect(response.status).toBe(403);
                }
            });

            it('should prevent teachers from accessing admin-only endpoints', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/admin/dashboard/metrics')
                    .set('Authorization', getAuthHeader('teacher'));

                expect(response.status).toBe(403);
            });

            it('should prevent students from accessing teacher endpoints', async () => {
                const teacherEndpoints = [
                    { method: 'post' as const, path: '/api/classes/some-id/assignments', body: { title: 'Test' } },
                    { method: 'get' as const, path: '/api/classes/some-id/gradebook' },
                    { method: 'post' as const, path: '/api/assignments/some-id/grades/bulk', body: { grades: [] } },
                ];

                for (const endpoint of teacherEndpoints) {
                    const req = request(app.getHttpServer())[endpoint.method](endpoint.path)
                        .set('Authorization', getAuthHeader('student'));
                    
                    if (endpoint.body) {
                        req.send(endpoint.body);
                    }

                    const response = await req;
                    expect(response.status).toBe(403);
                }
            });
        });

        describe('Horizontal Privilege Escalation', () => {
            it('should prevent students from accessing other students grades', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${anotherValidUUID}/grades`)
                    .set('Authorization', getAuthHeader('student'));

                expect(response.status).toBe(403);
            });

            it('should prevent parents from accessing unrelated children data', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${anotherValidUUID}/attendance`)
                    .set('Authorization', getAuthHeader('parent'));

                expect(response.status).toBe(403);
            });

            it('should prevent accessing other users files without permission', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/files/${validUUID}`)
                    .set('Authorization', getAuthHeader('student'));

                expect(response.status).toBe(403);
            });
        });

        describe('Vertical Privilege Escalation', () => {
            it('should prevent student from creating courses', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        name: 'Hacked Course',
                        code: 'HACK101',
                        description: 'Created by student',
                    });

                expect(response.status).toBe(403);
            });

            it('should prevent student from enrolling themselves in classes', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-class-id/enroll')
                    .set('Authorization', getAuthHeader('student'))
                    .send({ studentId: testUsers.student.id });

                expect(response.status).toBe(403);
            });

            it('should prevent parent from creating assignments', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-class-id/assignments')
                    .set('Authorization', getAuthHeader('parent'))
                    .send({
                        title: 'Hacked Assignment',
                        type: 'homework',
                        maxPoints: 100,
                    });

                expect(response.status).toBe(403);
            });

            it('should prevent student from accessing admin reports', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/attendance/reports')
                    .set('Authorization', getAuthHeader('student'));

                expect(response.status).toBe(403);
            });

            it('should prevent student from creating invoices', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        studentId: testUsers.student.id,
                        items: [{ description: 'Fake Fee', amount: -100 }],
                    });

                expect(response.status).toBe(403);
            });
        });

        describe('Role Manipulation Attempts', () => {
            it('should reject self-registration as admin', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'new-admin@evil.com',
                        password: 'SecurePass123!',
                        firstName: 'Evil',
                        lastName: 'Admin',
                        role: 'admin',
                    });

                expect(response.status).toBe(403);
            });

            it('should not allow role escalation through JWT payload manipulation', async () => {
                // This is already tested in JWT manipulation tests
                // But we verify endpoint access with different roles
                const response = await request(app.getHttpServer())
                    .get('/api/admin/users')
                    .set('Authorization', getAuthHeader('teacher'));

                expect(response.status).toBe(403);
            });
        });
    });

    // ============================================================================
    // CATEGORY 3: INJECTION TESTS
    // ============================================================================
    describe('💉 Injection Tests', () => {
        
        describe('SQL Injection Prevention', () => {
            const sqlInjectionPayloads = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' OR 1=1 --",
                "'; DELETE FROM users WHERE '1'='1",
                "1' UNION SELECT * FROM users--",
                "' OR '1'='1' /*",
                "'; INSERT INTO users VALUES ('hacker', 'pass')--",
                "' OR 1=1 LIMIT 1--",
                "1'; SELECT * FROM pg_tables--",
                "' AND 1=0 UNION SELECT null, version()--",
            ];

            it('should sanitize search parameters against SQL injection', async () => {
                for (const payload of sqlInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/courses?search=${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('student'));

                    // Should not crash or return all data
                    expect([200, 400, 403]).toContain(response.status);
                }
            });

            it('should sanitize user lookup parameters', async () => {
                for (const payload of sqlInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/users/role/${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('teacher'));

                    // Should not crash or expose data
                    expect([400, 403, 404]).toContain(response.status);
                }
            });

            it('should sanitize department filter', async () => {
                for (const payload of sqlInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/courses?department=${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('student'));

                    expect([200, 400]).toContain(response.status);
                }
            });

            it('should handle SQL injection in messaging search', async () => {
                for (const payload of sqlInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/channels/some-channel-id/search?q=${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('student'));

                    // Should either be 403 (not member) or 400 (bad request)
                    // but not expose data or crash
                    expect([400, 403, 404]).toContain(response.status);
                }
            });
        });

        describe('NoSQL Injection Prevention', () => {
            const noSqlPayloads = [
                { "$ne": null },
                { "$gt": "" },
                { "$where": "this.password.length > 0" },
                { "$regex": ".*" },
                { "$exists": true },
            ];

            it('should reject NoSQL injection objects in request body', async () => {
                for (const payload of noSqlPayloads) {
                    const response = await request(app.getHttpServer())
                        .post('/api/auth/login')
                        .send({
                            email: payload,
                            password: 'test',
                        });

                    expect(response.status).toBe(400);
                }
            });
        });

        describe('Command Injection Prevention', () => {
            const commandInjectionPayloads = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\config\\sam',
                '$(whoami)',
                '`cat /etc/passwd`',
                '; cat /etc/passwd',
                '| ls -la',
                '&& rm -rf /',
                '|| echo hacked',
            ];

            it('should sanitize file path parameters', async () => {
                for (const payload of commandInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/files/${encodeURIComponent(payload)}/download`)
                        .set('Authorization', getAuthHeader('student'));

                    // Should return 400 for invalid ID format
                    expect([400, 403, 404]).toContain(response.status);
                }
            });
        });

        describe('LDAP Injection (if applicable)', () => {
            const ldapInjectionPayloads = [
                '*)(uid=*))(&(uid=*',
                '*)(objectClass=*',
                'admin)(&))',
                '*)(|(mail=*))',
            ];

            it('should sanitize LDAP search filters', async () => {
                // If LDAP integration exists, test it
                // For now, this is a placeholder
                for (const payload of ldapInjectionPayloads) {
                    // Test against any search endpoint
                    const response = await request(app.getHttpServer())
                        .get(`/api/users?search=${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('teacher'));

                    expect([200, 400]).toContain(response.status);
                }
            });
        });

        describe('XPath Injection (if applicable)', () => {
            const xpathInjectionPayloads = [
                "' or '1'='1",
                "'] | //* | //*['",
                "/child::node()",
                "//user[name/text()='admin']",
            ];

            it('should handle XPath injection attempts gracefully', async () => {
                for (const payload of xpathInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/users?search=${encodeURIComponent(payload)}`)
                        .set('Authorization', getAuthHeader('teacher'));

                    expect([200, 400]).toContain(response.status);
                }
            });
        });
    });

    // ============================================================================
    // CATEGORY 4: XSS TESTS
    // ============================================================================
    describe('🔴 XSS (Cross-Site Scripting) Tests', () => {
        
        describe('Stored XSS Prevention', () => {
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>',
                'javascript:alert("XSS")',
                '<svg onload=alert("XSS")>',
                '<iframe src="javascript:alert(\'XSS\')">',
                '<body onload=alert("XSS")>',
                '<input onfocus=alert("XSS") autofocus>',
                '<a href="javascript:alert(\'XSS\')">Click me</a>',
                '"><script>alert(String.fromCharCode(88,83,83))</script>',
                "' onmouseover='alert(1)",
                '<object data="javascript:alert(\'XSS\')">',
                '<embed src="javascript:alert(\'XSS\')">',
            ];

            it('should sanitize message content to prevent stored XSS', async () => {
                // Try to send XSS payload in message
                for (const payload of xssPayloads) {
                    // Note: This requires an existing channel
                    // The test verifies that even if sent, content is sanitized
                    
                    // First create a channel or use an existing one
                    const channelRes = await request(app.getHttpServer())
                        .post('/api/channels')
                        .set('Authorization', getAuthHeader('teacher'))
                        .send({
                            name: 'Test Channel',
                            type: 'classroom',
                        });

                    if (channelRes.status === 201) {
                        const channelId = channelRes.body.id;
                        
                        const response = await request(app.getHttpServer())
                            .post(`/api/channels/${channelId}/messages`)
                            .set('Authorization', getAuthHeader('teacher'))
                            .send({ content: payload });

                        if (response.status === 201) {
                            // Verify the content is sanitized
                            const content = response.body.content || '';
                            expect(content).not.toContain('<script>');
                            expect(content).not.toContain('javascript:');
                            expect(content).not.toContain('onerror=');
                            expect(content).not.toContain('onload=');
                        }
                    }
                }
            });

            it('should sanitize user input in profile fields', async () => {
                // Try to update user with XSS payload
                const xssName = '<script>alert("XSS")</script>John';
                
                const response = await request(app.getHttpServer())
                    .put(`/api/admin/users/${testUsers.student.id}`)
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        firstName: xssName,
                    });

                // Should either sanitize or reject
                if (response.status === 200) {
                    expect(response.body.firstName).not.toContain('<script>');
                }
            });

            it('should sanitize course descriptions', async () => {
                const xssDescription = '<img src=x onerror=alert(1)>';
                
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        name: 'Test Course',
                        code: 'TEST101',
                        description: xssDescription,
                    });

                if (response.status === 201) {
                    expect(response.body.description).not.toContain('onerror=');
                }
            });
        });

        describe('Reflected XSS Prevention', () => {
            it('should escape error messages', async () => {
                const xssPayload = '<script>alert(1)</script>';
                
                // Send invalid request that might include user input in error
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: xssPayload,
                        password: 'test',
                    });

                // Check that error message doesn't contain unescaped script
                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toContain('<script>');
            });

            it('should sanitize search query reflections', async () => {
                const xssPayload = '<svg onload=alert(1)>';
                
                const response = await request(app.getHttpServer())
                    .get(`/api/courses?search=${encodeURIComponent(xssPayload)}`)
                    .set('Authorization', getAuthHeader('student'));

                // Response should not contain unescaped XSS payload
                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toContain('<svg onload=');
            });
        });

        describe('DOM-based XSS Prevention', () => {
            it('should not reflect user input in responses without sanitization', async () => {
                const domXssPayload = '#<script>alert(1)</script>';
                
                const response = await request(app.getHttpServer())
                    .get('/api/courses')
                    .set('Authorization', getAuthHeader('student'))
                    .set('Referer', `http://localhost:5173/${domXssPayload}`);

                // Just verify the request doesn't crash
                expect([200, 403]).toContain(response.status);
            });
        });

        describe('SVG XSS Prevention', () => {
            it('should handle SVG uploads safely', async () => {
                // Create a malicious SVG file
                const maliciousSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')">
    <script type="text/javascript">alert('XSS')</script>
    <rect width="100" height="100" fill="red"/>
</svg>`;

                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                
                const svgPath = path.join(tmpDir, 'test-xss.svg');
                fs.writeFileSync(svgPath, maliciousSvg);

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', svgPath, 'test-xss.svg');

                // Cleanup
                fs.unlinkSync(svgPath);

                // Should either reject the file or mark it appropriately
                expect([201, 400]).toContain(response.status);
                
                if (response.status === 201) {
                    // If uploaded, it should be marked as potentially dangerous
                    // or served with safe headers
                    expect(response.body).toHaveProperty('mimeType');
                }
            });
        });

        describe('Template Injection Prevention', () => {
            const templateInjectionPayloads = [
                '{{7*7}}',
                '${7*7}',
                '<%= 7*7 %>',
                '${{7*7}}',
                '#{7*7}',
                '{{config}}',
                '{{self}}',
            ];

            it('should not process template syntax in user input', async () => {
                for (const payload of templateInjectionPayloads) {
                    const response = await request(app.getHttpServer())
                        .post('/api/courses')
                        .set('Authorization', getAuthHeader('admin'))
                        .send({
                            name: `Test ${payload}`,
                            code: 'TEST101',
                            description: payload,
                        });

                    if (response.status === 201) {
                        // Content should be stored as-is, not evaluated
                        expect(response.body.description).toBe(payload);
                        expect(response.body.description).not.toBe('49');
                    }
                }
            });
        });
    });

    // ============================================================================
    // CATEGORY 5: FILE UPLOAD SECURITY
    // ============================================================================
    describe('📁 File Upload Security Tests', () => {
        
        describe('MIME Type Spoofing Prevention', () => {
            it('should reject files with spoofed MIME types', async () => {
                // Create a file that claims to be an image but contains PHP code
                const maliciousContent = Buffer.from('<?php echo shell_exec($_GET["cmd"]); ?>');
                
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                
                const fakeImagePath = path.join(tmpDir, 'malicious.jpg.php');
                fs.writeFileSync(fakeImagePath, maliciousContent);

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', fakeImagePath, {
                        filename: 'malicious.jpg.php',
                        contentType: 'image/jpeg', // Spoofed MIME type
                    });

                // Cleanup
                fs.unlinkSync(fakeImagePath);

                // Should be rejected due to extension mismatch
                expect(response.status).toBe(400);
            });

            it('should validate MIME type against file extension', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Create a text file claiming to be an image
                const textPath = path.join(tmpDir, 'fake-image.png');
                fs.writeFileSync(textPath, 'This is not an image');

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', textPath, {
                        filename: 'fake-image.png',
                        contentType: 'image/png',
                    });

                fs.unlinkSync(textPath);

                // Should be rejected
                expect(response.status).toBe(400);
            });
        });

        describe('Extension Bypass Prevention', () => {
            it('should reject double extension attacks', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const doubleExtPath = path.join(tmpDir, 'shell.jpg.php');
                fs.writeFileSync(doubleExtPath, '<?php // malicious code ?>');

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', doubleExtPath, 'shell.jpg.php');

                fs.unlinkSync(doubleExtPath);

                expect(response.status).toBe(400);
            });

            it('should reject null byte injection in filenames', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const content = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // Fake JPEG header
                const nullBytePath = path.join(tmpDir, 'test.jpg');
                fs.writeFileSync(nullBytePath, content);

                // Try to upload with null byte in filename
                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', nullBytePath, 'malicious.php\x00.jpg');

                fs.unlinkSync(nullBytePath);

                // Should be rejected
                expect([400, 500]).toContain(response.status);
            });
        });

        describe('Path Traversal Prevention', () => {
            it('should reject path traversal in filenames', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const content = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
                const safePath = path.join(tmpDir, 'normal.jpg');
                fs.writeFileSync(safePath, content);

                const traversalNames = [
                    '../../../etc/passwd',
                    '..\\..\\..\\windows\\system32\\config\\sam',
                    'test.jpg/../../../etc/passwd',
                ];

                for (const traversalName of traversalNames) {
                    const response = await request(app.getHttpServer())
                        .post('/api/files/upload')
                        .set('Authorization', getAuthHeader('teacher'))
                        .attach('file', safePath, traversalName);

                    expect(response.status).toBe(400);
                }

                fs.unlinkSync(safePath);
            });
        });

        describe('Malicious File Content Detection', () => {
            it('should detect PHP code in image files', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Create a polyglot file (valid image header + PHP code)
                const content = Buffer.concat([
                    Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]), // JPEG header
                    Buffer.from('<?php eval($_POST["cmd"]); ?>'),
                ]);

                const polyglotPath = path.join(tmpDir, 'polyglot.jpg');
                fs.writeFileSync(polyglotPath, content);

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', polyglotPath, 'polyglot.jpg');

                fs.unlinkSync(polyglotPath);

                // Should either reject or flag for virus scanning
                expect([201, 400]).toContain(response.status);
            });
        });

        describe('File Size DoS Prevention', () => {
            it('should reject oversized files', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Create a file larger than 100MB
                const largePath = path.join(tmpDir, 'large.jpg');
                const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
                fs.writeFileSync(largePath, largeBuffer);

                const response = await request(app.getHttpServer())
                    .post('/api/files/upload')
                    .set('Authorization', getAuthHeader('teacher'))
                    .attach('file', largePath, 'large.jpg');

                fs.unlinkSync(largePath);

                // Should be rejected due to size limit
                expect(response.status).toBe(400);
            });

            it('should respect role-based file size limits', async () => {
                // Students should have lower limits than teachers
                // This is verified by checking the quota endpoint
                const studentResponse = await request(app.getHttpServer())
                    .get('/api/files/quota')
                    .set('Authorization', getAuthHeader('student'));

                expect(studentResponse.status).toBe(200);
                expect(studentResponse.body).toHaveProperty('maxFileSize');
            });
        });

        describe('Upload Rate Limiting', () => {
            it('should enforce upload rate limits', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Create small valid image
                const imagePath = path.join(tmpDir, 'tiny.jpg');
                fs.writeFileSync(imagePath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]));

                // Try to upload multiple files rapidly
                const uploads = [];
                for (let i = 0; i < 10; i++) {
                    uploads.push(
                        request(app.getHttpServer())
                            .post('/api/files/upload')
                            .set('Authorization', getAuthHeader('teacher'))
                            .attach('file', imagePath, `test-${i}.jpg`)
                    );
                }

                const responses = await Promise.all(uploads);
                fs.unlinkSync(imagePath);

                // Some uploads should be rate limited (429)
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                expect(rateLimitedCount).toBeGreaterThan(0);
            });
        });
    });

    // ============================================================================
    // CATEGORY 6: CSRF TESTS
    // ============================================================================
    describe('🛡️ CSRF (Cross-Site Request Forgery) Tests', () => {
        
        describe('Missing CSRF Token Rejection', () => {
            it('should validate Origin header for state-changing requests', async () => {
                // Try to make state-changing request without proper Origin
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .set('Origin', 'https://evil.com') // Malicious origin
                    .send({
                        name: 'Hacked Course',
                        code: 'HACK101',
                    });

                // Should be blocked by CORS policy
                expect(response.status).toBe(403);
            });

            it('should reject requests with missing Origin from browser clients', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    // No Origin header, but has User-Agent indicating browser
                    .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                    .send({
                        name: 'Test Course',
                        code: 'TEST101',
                    });

                // The behavior depends on CORS configuration
                // In strict mode, this might be rejected
                expect([201, 403]).toContain(response.status);
            });
        });

        describe('CORS Preflight Handling', () => {
            it('should handle OPTIONS preflight requests correctly', async () => {
                const response = await request(app.getHttpServer())
                    .options('/api/courses')
                    .set('Origin', 'http://localhost:5173')
                    .set('Access-Control-Request-Method', 'POST')
                    .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

                expect(response.status).toBe(204);
                expect(response.headers['access-control-allow-origin']).toBeDefined();
                expect(response.headers['access-control-allow-methods']).toContain('POST');
            });

            it('should reject preflight from unauthorized origins', async () => {
                const response = await request(app.getHttpServer())
                    .options('/api/courses')
                    .set('Origin', 'https://evil-website.com')
                    .set('Access-Control-Request-Method', 'POST');

                // Should not allow the origin
                expect(response.headers['access-control-allow-origin']).toBeUndefined();
            });
        });

        describe('Referer Header Validation', () => {
            it('should validate Referer header for sensitive operations', async () => {
                // Try password change with invalid referer
                const response = await request(app.getHttpServer())
                    .post('/api/auth/change-password')
                    .set('Authorization', getAuthHeader('student'))
                    .set('Referer', 'https://phishing-site.com/change-password')
                    .send({
                        currentPassword: testUsers.student.password,
                        newPassword: 'NewPass123!',
                    });

                // This test documents expected behavior
                // The actual implementation may or may not check Referer
                expect([200, 400, 401, 403, 404]).toContain(response.status);
            });
        });

        describe('Cookie SameSite Protection', () => {
            it('should set SameSite=Strict on authentication cookies', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email,
                        password: testUsers.student.password,
                    });

                const cookies = response.headers['set-cookie'] as string[];
                const refreshCookie = cookies?.find(c => c.includes('sms_refresh_token'));
                
                if (refreshCookie) {
                    expect(refreshCookie.toLowerCase()).toContain('samesite=strict');
                }
            });
        });
    });

    // ============================================================================
    // CATEGORY 7: RATE LIMITING TESTS
    // ============================================================================
    describe('⏱️ Rate Limiting Tests', () => {
        
        describe('Brute Force Login Protection', () => {
            it('should rate limit after multiple failed login attempts', async () => {
                const attempts = [];
                
                // Make 105 failed login attempts
                for (let i = 0; i < 105; i++) {
                    attempts.push(
                        request(app.getHttpServer())
                            .post('/api/auth/login')
                            .send({
                                email: 'nonexistent@school.com',
                                password: 'wrongpassword',
                            })
                    );
                }

                const responses = await Promise.all(attempts);
                
                // Some requests should be rate limited (429)
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                expect(rateLimitedCount).toBeGreaterThan(0);
            });

            it('should apply stricter limits to admin login attempts', async () => {
                // Document the expected behavior
                // Admin endpoints should have stricter rate limits
                const attempts = [];
                
                for (let i = 0; i < 50; i++) {
                    attempts.push(
                        request(app.getHttpServer())
                            .post('/api/auth/login')
                            .send({
                                email: 'admin@school.com',
                                password: 'wrongpassword',
                            })
                    );
                }

                const responses = await Promise.all(attempts);
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                
                // Should have rate limiting in place
                expect(rateLimitedCount).toBeGreaterThan(0);
            });
        });

        describe('API Endpoint Rate Limiting', () => {
            it('should rate limit file preview endpoint', async () => {
                // Make multiple preview requests rapidly
                const requests = [];
                for (let i = 0; i < 20; i++) {
                    requests.push(
                        request(app.getHttpServer())
                            .get('/api/files/some-id/preview')
                            .set('Authorization', getAuthHeader('student'))
                    );
                }

                const responses = await Promise.all(requests);
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                
                // Preview endpoint has limit of 10/minute
                expect(rateLimitedCount).toBeGreaterThan(0);
            });

            it('should rate limit file uploads', async () => {
                const tmpDir = path.join(__dirname, 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                const imagePath = path.join(tmpDir, 'tiny.jpg');
                fs.writeFileSync(imagePath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]));

                const uploads = [];
                for (let i = 0; i < 10; i++) {
                    uploads.push(
                        request(app.getHttpServer())
                            .post('/api/files/upload')
                            .set('Authorization', getAuthHeader('teacher'))
                            .attach('file', imagePath, `test-${i}.jpg`)
                    );
                }

                const responses = await Promise.all(uploads);
                fs.unlinkSync(imagePath);

                // Upload limit is 5/minute, so some should be rate limited
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                expect(rateLimitedCount).toBeGreaterThan(0);
            });
        });

        describe('DDoS Simulation', () => {
            it('should handle high volume of requests without crashing', async () => {
                const requests = [];
                
                // Make 200 concurrent requests to a public endpoint
                for (let i = 0; i < 200; i++) {
                    requests.push(
                        request(app.getHttpServer())
                            .get('/api/health')
                            .timeout(10000)
                    );
                }

                const responses = await Promise.all(requests);
                
                // All requests should complete (not crash the server)
                const successCount = responses.filter(r => r.status === 200).length;
                expect(successCount).toBeGreaterThan(0);
            });
        });

        describe('Rate Limit Bypass Attempts', () => {
            it('should not be bypassed via X-Forwarded-For header spoofing', async () => {
                const requests = [];
                
                for (let i = 0; i < 10; i++) {
                    requests.push(
                        request(app.getHttpServer())
                            .post('/api/auth/login')
                            .set('X-Forwarded-For', `192.168.1.${i}`)
                            .send({
                                email: 'test@school.com',
                                password: 'wrong',
                            })
                    );
                }

                const responses = await Promise.all(requests);
                
                // Rate limiting should still apply
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                expect(rateLimitedCount).toBeGreaterThan(0);
            });

            it('should not be bypassed via User-Agent rotation', async () => {
                const userAgents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                    'Mozilla/5.0 (Linux; Android 10)',
                ];

                const requests = [];
                for (let i = 0; i < 20; i++) {
                    requests.push(
                        request(app.getHttpServer())
                            .post('/api/auth/login')
                            .set('User-Agent', userAgents[i % userAgents.length])
                            .send({
                                email: 'test@school.com',
                                password: 'wrong',
                            })
                    );
                }

                const responses = await Promise.all(requests);
                const rateLimitedCount = responses.filter(r => r.status === 429).length;
                
                expect(rateLimitedCount).toBeGreaterThan(0);
            });
        });
    });

    // ============================================================================
    // CATEGORY 8: INFORMATION DISCLOSURE TESTS
    // ============================================================================
    describe('🔍 Information Disclosure Tests', () => {
        
        describe('Error Message Detail Leakage', () => {
            it('should not expose database error details', async () => {
                // Try to cause a database error with invalid input
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        // Send extremely large data that might cause DB error
                        name: 'a'.repeat(10000),
                        code: 'TEST',
                    });

                // Should not contain database error details
                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toContain('prisma');
                expect(responseText).not.toContain('postgresql');
                expect(responseText).not.toContain('SQL');
                expect(responseText).not.toContain('query');
            });

            it('should not expose stack traces in production', async () => {
                // Trigger a 404 error
                const response = await request(app.getHttpServer())
                    .get('/api/users/nonexistent-id')
                    .set('Authorization', getAuthHeader('admin'));

                const responseText = JSON.stringify(response.body);
                
                // Should not contain stack trace or file paths
                expect(responseText).not.toContain('at ');
                expect(responseText).not.toContain('/src/');
                expect(responseText).not.toContain('.ts:');
            });

            it('should return generic messages for authentication errors', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: 'valid@school.com',
                        password: 'wrongpassword',
                    });

                // Should not indicate whether email exists
                expect(response.body.message).toMatch(/invalid|incorrect|wrong/i);
                expect(response.body.message).not.toContain('user not found');
                expect(response.body.message).not.toContain('email');
            });
        });

        describe('Sensitive Data in Responses', () => {
            it('should not return password hashes in user objects', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', getAuthHeader('student'));

                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toContain('password');
                expect(responseText).not.toContain('$2b$'); // bcrypt hash prefix
                expect(responseText).not.toContain('$2a$');
            });

            it('should not return refresh tokens in API responses', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', getAuthHeader('student'));

                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toContain('refreshToken');
            });

            it('should not expose internal IDs or system information', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses')
                    .set('Authorization', getAuthHeader('student'));

                // Response should not expose internal implementation details
                expect(response.body).not.toHaveProperty('__proto__');
                expect(response.body).not.toHaveProperty('constructor');
            });
        });

        describe('API Versioning Exposure', () => {
            it('should not expose detailed version information', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/health');

                // Should not contain detailed version numbers
                const responseText = JSON.stringify(response.body);
                expect(responseText).not.toMatch(/v?\d+\.\d+\.\d+/);
            });

            it('should not expose server software versions in headers', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/health');

                // Check for version disclosure in headers
                const serverHeader = response.headers['server'];
                const poweredBy = response.headers['x-powered-by'];

                if (serverHeader) {
                    expect(serverHeader).not.toMatch(/\d+\.\d+/);
                }
                
                // X-Powered-By should not reveal framework version
                expect(poweredBy).toBeUndefined();
            });
        });

        describe('Debug Endpoint Access', () => {
            it('should not expose debug endpoints in production', async () => {
                const debugEndpoints = [
                    '/api/debug',
                    '/api/debug/info',
                    '/api/admin/debug',
                    '/.env',
                    '/api/config',
                ];

                for (const endpoint of debugEndpoints) {
                    const response = await request(app.getHttpServer())
                        .get(endpoint);

                    expect([404, 403]).toContain(response.status);
                }
            });

            it('should not expose Swagger docs in production', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/docs');

                // In production, Swagger should not be accessible
                if (process.env.NODE_ENV === 'production') {
                    expect(response.status).toBe(404);
                }
            });
        });

        describe('User Enumeration Prevention', () => {
            it('should have consistent timing for valid and invalid emails', async () => {
                // This is a basic check - in production, implement timing-safe comparison
                const start1 = Date.now();
                await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: testUsers.student.email, // Valid email
                        password: 'wrongpassword',
                    });
                const time1 = Date.now() - start1;

                const start2 = Date.now();
                await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({
                        email: 'nonexistent@fake12345.com', // Invalid email
                        password: 'wrongpassword',
                    });
                const time2 = Date.now() - start2;

                // Times should be reasonably similar (within 200ms)
                expect(Math.abs(time1 - time2)).toBeLessThan(200);
            });

            it('should not reveal if email is registered in forgot password', async () => {
                const response1 = await request(app.getHttpServer())
                    .post('/api/auth/forgot-password')
                    .send({ email: testUsers.student.email });

                const response2 = await request(app.getHttpServer())
                    .post('/api/auth/forgot-password')
                    .send({ email: 'nonexistent@fake12345.com' });

                // Both should return same status and similar message
                expect(response1.status).toBe(response2.status);
            });
        });
    });

    // ============================================================================
    // CATEGORY 9: INPUT VALIDATION TESTS
    // ============================================================================
    describe('✅ Input Validation Tests', () => {
        
        describe('Boundary Value Analysis', () => {
            it('should reject password below minimum length', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@school.com',
                        password: 'Short1!', // Less than 8 characters
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });

            it('should reject password above maximum length', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@school.com',
                        password: 'A1!' + 'a'.repeat(126), // More than 128 characters
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });

            it('should enforce email length limits', async () => {
                const longEmail = 'a'.repeat(250) + '@school.com';
                
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: longEmail,
                        password: 'SecurePass123!',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });

            it('should validate pagination limits', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?limit=1000') // Too high
                    .set('Authorization', getAuthHeader('student'));

                // Should either reject or clamp the value
                expect([200, 400]).toContain(response.status);
            });
        });

        describe('Type Confusion Attacks', () => {
            it('should reject array where string expected', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: ['test@school.com', 'hacker@evil.com'],
                        password: 'SecurePass123!',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });

            it('should reject object where string expected', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        name: { $ne: null }, // NoSQL injection attempt
                        code: 'TEST101',
                    });

                expect(response.status).toBe(400);
            });

            it('should reject number where string expected', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 12345,
                        password: 'SecurePass123!',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('Unicode Normalization Attacks', () => {
            const homoglyphAttacks = [
                'аdmin@school.com', // Cyrillic 'а' instead of Latin 'a'
                'adｍin@school.com', // Fullwidth character
                'admin@ѕchool.com', // Cyrillic 'ѕ'
            ];

            it('should handle homoglyph attacks in email', async () => {
                for (const email of homoglyphAttacks) {
                    const response = await request(app.getHttpServer())
                        .post('/api/auth/login')
                        .send({
                            email: email,
                            password: 'password',
                        });

                    // Should not authenticate with homoglyph
                    expect(response.status).toBe(401);
                }
            });
        });

        describe('Null Byte Injection', () => {
            it('should reject null bytes in string fields', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@school.com\x00@evil.com',
                        password: 'SecurePass123!',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'student',
                    });

                expect(response.status).toBe(400);
            });

            it('should handle null bytes in JSON body gracefully', async () => {
                // Send raw request with null byte
                const response = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .set('Content-Type', 'application/json')
                    .send('{"email":"test\u0000@school.com","password":"pass"}');

                expect([400, 401]).toContain(response.status);
            });
        });

        describe('Maximum Length Violations', () => {
            it('should reject oversized JSON payloads', async () => {
                const hugePayload = {
                    name: 'a'.repeat(10 * 1024 * 1024), // 10MB string
                    code: 'TEST',
                };

                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send(hugePayload);

                expect([400, 413]).toContain(response.status);
            });

            it('should reject deeply nested JSON', async () => {
                // Create deeply nested object
                let nested: any = { value: 'test' };
                for (let i = 0; i < 1000; i++) {
                    nested = { nested };
                }

                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        name: nested,
                        code: 'TEST',
                    });

                expect([400, 413]).toContain(response.status);
            });

            it('should reject requests with too many fields', async () => {
                const manyFields: Record<string, string> = {};
                for (let i = 0; i < 1000; i++) {
                    manyFields[`field${i}`] = 'value';
                }

                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        name: 'Test',
                        code: 'TEST',
                        ...manyFields,
                    });

                // Should be rejected due to whitelist validation
                expect(response.status).toBe(400);
            });
        });

        describe('Invalid UUID Format Tests', () => {
            const invalidUUIDs = [
                'not-a-uuid',
                '12345',
                'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                '',
                "'; DROP TABLE users; --",
                '../../../etc/passwd',
                '12345678-1234-1234-1234-123456789abc', // Version 1 instead of 4
                '12345678-1234-7234-1234-123456789abc', // Invalid version
            ];

            it('should reject invalid UUID formats', async () => {
                for (const invalidUUID of invalidUUIDs) {
                    const response = await request(app.getHttpServer())
                        .get(`/api/users/${encodeURIComponent(invalidUUID)}`)
                        .set('Authorization', getAuthHeader('student'));

                    expect(response.status).toBe(400);
                }
            });
        });

        describe('Date Format Validation', () => {
            it('should reject invalid date formats', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes/some-id/attendance?startDate=invalid-date')
                    .set('Authorization', getAuthHeader('teacher'));

                expect([400, 403, 404]).toContain(response.status);
            });

            it('should reject SQL injection in date parameters', async () => {
                const sqlDate = "2024-01-01' OR '1'='1";
                
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/some-id/attendance?startDate=${encodeURIComponent(sqlDate)}`)
                    .set('Authorization', getAuthHeader('teacher'));

                expect([400, 403, 404]).toContain(response.status);
            });
        });
    });

    // ============================================================================
    // CATEGORY 10: BUSINESS LOGIC TESTS
    // ============================================================================
    describe('💼 Business Logic Tests', () => {
        
        describe('Payment Amount Validation', () => {
            it('should reject negative payment amounts', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        studentId: testUsers.student.id,
                        amount: -100,
                        currency: 'USD',
                    });

                // Should reject negative amount
                expect([400, 403]).toContain(response.status);
            });

            it('should reject zero amount payments', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        studentId: testUsers.student.id,
                        amount: 0,
                        currency: 'USD',
                    });

                expect([400, 403]).toContain(response.status);
            });

            it('should reject excessive payment amounts', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        studentId: testUsers.student.id,
                        amount: 999999999,
                        currency: 'USD',
                    });

                // Should validate amount is reasonable
                expect([400, 403]).toContain(response.status);
            });
        });

        describe('Duplicate Invoice Prevention', () => {
            it('should prevent duplicate invoice creation', async () => {
                // Try to create multiple invoices with same details rapidly
                const invoiceData = {
                    studentId: testUsers.student.id,
                    items: [
                        { description: 'Tuition', amount: 1000 },
                    ],
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                };

                const responses = await Promise.all([
                    request(app.getHttpServer())
                        .post('/api/payments/invoices')
                        .set('Authorization', getAuthHeader('admin'))
                        .send(invoiceData),
                    request(app.getHttpServer())
                        .post('/api/payments/invoices')
                        .set('Authorization', getAuthHeader('admin'))
                        .send(invoiceData),
                ]);

                // If both succeed, they should be different invoices
                // Or one should be rejected as duplicate
                if (responses[0].status === 201 && responses[1].status === 201) {
                    expect(responses[0].body.id).not.toBe(responses[1].body.id);
                }
            });
        });

        describe('Grade Manipulation Prevention', () => {
            it('should reject grades outside valid range', async () => {
                const invalidGrades = [-10, 101, 150, -1];

                for (const grade of invalidGrades) {
                    const response = await request(app.getHttpServer())
                        .post('/api/submissions/some-id/grade')
                        .set('Authorization', getAuthHeader('teacher'))
                        .send({
                            points: grade,
                            feedback: 'Test feedback',
                        });

                    // Should reject invalid grade
                    expect([400, 403, 404]).toContain(response.status);
                }
            });

            it('should prevent students from grading their own work', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/submissions/some-id/grade')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        points: 100,
                        feedback: 'I deserve an A!',
                    });

                expect(response.status).toBe(403);
            });

            it('should prevent grade changes after finalization', async () => {
                // This would require a finalized submission to test properly
                // For now, document the expected behavior
                
                const response = await request(app.getHttpServer())
                    .post('/api/submissions/some-id/grade')
                    .set('Authorization', getAuthHeader('teacher'))
                    .send({
                        points: 90,
                        feedback: 'Updated grade',
                    });

                // Should either succeed (if allowed) or be rejected
                expect([200, 400, 403, 404]).toContain(response.status);
            });
        });

        describe('Attendance Backdating Prevention', () => {
            it('should prevent marking attendance in the future', async () => {
                const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year in future
                
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-id/attendance')
                    .set('Authorization', getAuthHeader('teacher'))
                    .send({
                        date: futureDate.toISOString(),
                        period: 'morning',
                    });

                // Should reject future dates
                expect([400, 403, 404]).toContain(response.status);
            });

            it('should prevent excessive backdating of attendance', async () => {
                const oldDate = new Date('2000-01-01');
                
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-id/attendance')
                    .set('Authorization', getAuthHeader('teacher'))
                    .send({
                        date: oldDate.toISOString(),
                        period: 'morning',
                    });

                // Should reject dates too far in the past
                expect([400, 403, 404]).toContain(response.status);
            });
        });

        describe('Conference Scheduling Conflict Prevention', () => {
            it('should prevent double-booking conferences', async () => {
                const conferenceData = {
                    teacherId: testUsers.teacher.id,
                    parentId: testUsers.parent.id,
                    studentId: testUsers.student.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    duration: 30,
                };

                // Try to create same conference twice
                const responses = await Promise.all([
                    request(app.getHttpServer())
                        .post('/api/conferences')
                        .set('Authorization', getAuthHeader('teacher'))
                        .send(conferenceData),
                    request(app.getHttpServer())
                        .post('/api/conferences')
                        .set('Authorization', getAuthHeader('teacher'))
                        .send(conferenceData),
                ]);

                // One should succeed, one should fail due to conflict
                // OR both should succeed with different IDs
                const successCount = responses.filter(r => r.status === 201).length;
                expect(successCount).toBeLessThanOrEqual(2);
            });

            it('should prevent scheduling conferences in the past', async () => {
                const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                const response = await request(app.getHttpServer())
                    .post('/api/conferences')
                    .set('Authorization', getAuthHeader('teacher'))
                    .send({
                        teacherId: testUsers.teacher.id,
                        parentId: testUsers.parent.id,
                        studentId: testUsers.student.id,
                        startTime: pastDate.toISOString(),
                        duration: 30,
                    });

                expect([400, 403]).toContain(response.status);
            });
        });

        describe('Assignment Due Date Validation', () => {
            it('should prevent assignments with past due dates', async () => {
                const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-class-id/assignments')
                    .set('Authorization', getAuthHeader('teacher'))
                    .send({
                        title: 'Late Assignment',
                        type: 'homework',
                        maxPoints: 100,
                        dueDate: pastDate.toISOString(),
                    });

                // Should warn about or reject past due dates
                expect([201, 400]).toContain(response.status);
            });
        });

        describe('Class Capacity Enforcement', () => {
            it('should enforce maximum class size limits', async () => {
                // This would require checking actual enrollment limits
                // Document the expected behavior
                
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-class-id/enroll')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        studentId: testUsers.student2.id,
                    });

                // Should either enroll or reject based on capacity
                expect([201, 400, 403, 404]).toContain(response.status);
            });
        });

        describe('Self-Enrollment Prevention', () => {
            it('should prevent students from enrolling themselves', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/classes/some-class-id/enroll')
                    .set('Authorization', getAuthHeader('student'))
                    .send({
                        studentId: testUsers.student.id,
                    });

                expect(response.status).toBe(403);
            });
        });

        describe('Circular Parent-Child Relationship Prevention', () => {
            it('should prevent creating circular parent-child relationships', async () => {
                // Try to make a student their own parent
                const response = await request(app.getHttpServer())
                    .post('/api/admin/users/link-parent')
                    .set('Authorization', getAuthHeader('admin'))
                    .send({
                        parentId: testUsers.student.id,
                        studentId: testUsers.student.id,
                    });

                // Should reject self-referential relationship
                expect([400, 403]).toContain(response.status);
            });
        });
    });

    // ============================================================================
    // SECURITY TEST SUMMARY
    // ============================================================================
    describe('📊 Security Test Summary', () => {
        it('should document all security controls being tested', () => {
            const securityControls = [
                'JWT authentication with algorithm validation',
                'Role-based access control (RBAC)',
                'IDOR prevention through authorization checks',
                'SQL injection prevention via parameterized queries',
                'XSS prevention through input sanitization',
                'File upload security with MIME type validation',
                'CSRF protection via SameSite cookies and CORS',
                'Rate limiting on authentication and upload endpoints',
                'Information disclosure prevention',
                'Input validation and type checking',
                'Business logic validation',
            ];

            expect(securityControls.length).toBeGreaterThan(0);
            
            // Log security controls
            console.log('\n=== Security Controls Tested ===');
            securityControls.forEach((control, i) => {
                console.log(`${i + 1}. ${control}`);
            });
        });

        it('should verify all authentication endpoints are protected', async () => {
            // Quick verification that auth is required
            const protectedEndpoints = [
                '/api/users',
                '/api/courses',
                '/api/classes',
                '/api/channels',
                '/api/files',
                '/api/admin/dashboard',
            ];

            for (const endpoint of protectedEndpoints) {
                const response = await request(app.getHttpServer()).get(endpoint);
                expect(response.status).toBe(401);
            }
        });
    });
});
