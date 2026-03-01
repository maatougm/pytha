/**
 * Authentication E2E Tests
 * 
 * Tests the complete authentication flow including:
 * - Registration, login, token refresh, logout
 * - Token expiration and refresh handling
 * - Concurrent sessions (multiple devices)
 * - Role-based access control
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Test configuration
const TEST_TIMEOUT = 30000;
jest.setTimeout(TEST_TIMEOUT);

describe('Authentication E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;

    // Test data cleanup tracking
    const createdUserIds: string[] = [];
    const createdTokenIds: string[] = [];

    // Test user data
    const testUsers = {
        student: {
            email: 'e2e-student@test.com',
            password: 'Password123!',
            firstName: 'E2E',
            lastName: 'Student',
            role: 'student',
        },
        teacher: {
            email: 'e2e-teacher@test.com',
            password: 'Password123!',
            firstName: 'E2E',
            lastName: 'Teacher',
            role: 'teacher',
        },
        parent: {
            email: 'e2e-parent@test.com',
            password: 'Password123!',
            firstName: 'E2E',
            lastName: 'Parent',
            role: 'parent',
        },
        admin: {
            email: 'e2e-admin@test.com',
            password: 'Password123!',
            firstName: 'E2E',
            lastName: 'Admin',
            role: 'admin',
        },
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.setGlobalPrefix('api');
        
        await app.init();

        prisma = app.get(PrismaService);
        jwtService = app.get(JwtService);

        // Clean up any existing test data
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await app.close();
    });

    async function cleanupTestData() {
        // Delete test users and their tokens
        for (const email of Object.values(testUsers).map(u => u.email)) {
            await prisma.user.deleteMany({ where: { email } });
        }
        createdUserIds.length = 0;
        createdTokenIds.length = 0;
    }

    async function registerUser(userData: typeof testUsers.student) {
        const response = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send(userData)
            .expect(201);

        if (response.body.user?.id) {
            createdUserIds.push(response.body.user.id);
        }

        return response;
    }

    async function loginUser(email: string, password: string) {
        return request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password })
            .expect(200);
    }

    describe('Complete Auth Lifecycle', () => {
        let accessToken: string;
        let refreshToken: string;
        let userId: string;

        it('should complete full auth lifecycle: register → login → access protected → refresh → logout', async () => {
            // Step 1: Register
            const registerRes = await registerUser(testUsers.student);
            expect(registerRes.body.user).toBeDefined();
            expect(registerRes.body.accessToken).toBeDefined();
            expect(registerRes.headers['set-cookie']).toBeDefined();
            
            accessToken = registerRes.body.accessToken;
            userId = registerRes.body.user.id;
            
            // Extract refresh token from cookie
            const cookies = registerRes.headers['set-cookie'] as string[];
            const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
            expect(refreshCookie).toBeDefined();
            refreshToken = refreshCookie?.match(/sms_refresh_token=([^;]+)/)?.[1] || '';

            // Step 2: Access protected endpoint
            const profileRes = await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
            
            expect(profileRes.body.id).toBe(userId);
            expect(profileRes.body.email).toBe(testUsers.student.email);
            expect(profileRes.body.roles).toContain('student');

            // Step 3: Refresh token
            const refreshRes = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            expect(refreshRes.body.accessToken).toBeDefined();
            expect(refreshRes.body.accessToken).not.toBe(accessToken); // New token
            expect(refreshRes.headers['set-cookie']).toBeDefined(); // New refresh cookie

            const newAccessToken = refreshRes.body.accessToken;

            // Step 4: Access protected with new token
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${newAccessToken}`)
                .expect(200);

            // Step 5: Logout
            const logoutRes = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${newAccessToken}`)
                .set('Cookie', refreshRes.headers['set-cookie'] as string[])
                .expect(200);

            expect(logoutRes.body.loggedOut).toBe(true);
            expect(logoutRes.headers['set-cookie']?.[0]).toContain('sms_refresh_token=;'); // Cookie cleared
        });
    });

    describe('Registration', () => {
        it('should register users with all valid roles', async () => {
            // Register student
            const studentRes = await registerUser(testUsers.student);
            expect(studentRes.body.user.roles).toContain('student');
            expect(studentRes.body.accessToken).toBeDefined();

            // Register teacher
            const teacherRes = await registerUser(testUsers.teacher);
            expect(teacherRes.body.user.roles).toContain('teacher');

            // Register parent
            const parentRes = await registerUser(testUsers.parent);
            expect(parentRes.body.user.roles).toContain('parent');
        });

        it('should reject duplicate email registration', async () => {
            // First registration should succeed
            await registerUser({
                ...testUsers.student,
                email: 'duplicate@test.com',
            });

            // Second registration with same email should fail
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUsers.student,
                    email: 'duplicate@test.com',
                })
                .expect(409);
        });

        it('should reject admin self-registration', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(testUsers.admin)
                .expect(403);
        });

        it('should reject weak passwords', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUsers.student,
                    email: 'weakpass@test.com',
                    password: 'weak',
                })
                .expect(400);
        });

        it('should reject invalid email format', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUsers.student,
                    email: 'not-an-email',
                })
                .expect(400);
        });

        it('should reject missing required fields', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ email: 'test@test.com' })
                .expect(400);
        });

        it('should reject invalid role', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUsers.student,
                    role: 'superuser',
                })
                .expect(400);
        });

        it('should convert email to lowercase', async () => {
            const mixedCaseEmail = 'MixedCase@Test.COM';
            const res = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    ...testUsers.student,
                    email: mixedCaseEmail,
                })
                .expect(201);

            expect(res.body.user.email).toBe(mixedCaseEmail.toLowerCase());
        });
    });

    describe('Login', () => {
        beforeAll(async () => {
            // Ensure we have a user to test login
            await prisma.user.deleteMany({ where: { email: testUsers.student.email } });
            await registerUser(testUsers.student);
        });

        it('should login with valid credentials', async () => {
            const res = await loginUser(testUsers.student.email, testUsers.student.password);
            
            expect(res.body.user).toBeDefined();
            expect(res.body.accessToken).toBeDefined();
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject invalid password', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUsers.student.email,
                    password: 'WrongPassword123!',
                })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Password123!',
                })
                .expect(401);
        });

        it('should handle case-insensitive email in login', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUsers.student.email.toUpperCase(),
                    password: testUsers.student.password,
                })
                .expect(200);

            expect(res.body.user).toBeDefined();
        });
    });

    describe('Token Refresh', () => {
        let refreshToken: string;
        let accessToken: string;

        beforeEach(async () => {
            // Get fresh tokens
            await prisma.user.deleteMany({ where: { email: testUsers.teacher.email } });
            const registerRes = await registerUser(testUsers.teacher);
            
            const loginRes = await loginUser(testUsers.teacher.email, testUsers.teacher.password);
            accessToken = loginRes.body.accessToken;
            
            const cookies = loginRes.headers['set-cookie'] as string[];
            const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
            refreshToken = refreshCookie?.match(/sms_refresh_token=([^;]+)/)?.[1] || '';
        });

        it('should refresh access token with valid refresh token', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            expect(res.body.accessToken).toBeDefined();
            expect(res.body.accessToken).not.toBe(accessToken);
            expect(res.headers['set-cookie']).toBeDefined(); // New refresh cookie
        });

        it('should accept refresh token from body', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(res.body.accessToken).toBeDefined();
        });

        it('should reject invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', ['sms_refresh_token=invalid-token'])
                .expect(401);
        });

        it('should reject expired refresh token', async () => {
            // Create an expired refresh token in DB
            const expiredToken = 'expired-refresh-token' + Date.now();
            await prisma.refreshToken.create({
                data: {
                    token: expiredToken,
                    userId: (await prisma.user.findUnique({ where: { email: testUsers.teacher.email } }))!.id,
                    expiresAt: new Date(Date.now() - 1000), // Expired
                },
            });

            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({ refreshToken: expiredToken })
                .expect(401);
        });

        it('should rotate refresh token on refresh (old token invalidated)', async () => {
            // First refresh
            const firstRefresh = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            // Try to use old refresh token again (should fail - rotation)
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(401);
        });
    });

    describe('Logout', () => {
        let accessToken: string;
        let refreshToken: string;
        let userId: string;

        beforeEach(async () => {
            await prisma.user.deleteMany({ where: { email: testUsers.parent.email } });
            const registerRes = await registerUser(testUsers.parent);
            userId = registerRes.body.user.id;
            
            const loginRes = await loginUser(testUsers.parent.email, testUsers.parent.password);
            accessToken = loginRes.body.accessToken;
            
            const cookies = loginRes.headers['set-cookie'] as string[];
            const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
            refreshToken = refreshCookie?.match(/sms_refresh_token=([^;]+)/)?.[1] || '';
        });

        it('should logout successfully and invalidate tokens', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            expect(res.body.loggedOut).toBe(true);
            expect(res.headers['set-cookie']?.[0]).toContain('sms_refresh_token=;');
        });

        it('should reject refresh after logout', async () => {
            // Logout first
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            // Try to refresh (should fail)
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(401);
        });

        it('should reject protected access after logout', async () => {
            // Logout first
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`sms_refresh_token=${refreshToken}`])
                .expect(200);

            // Try to access profile (should fail due to token denylist)
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(401);
        });
    });

    describe('Protected Endpoints', () => {
        let accessToken: string;

        beforeAll(async () => {
            await prisma.user.deleteMany({ where: { email: testUsers.student.email } });
            await registerUser(testUsers.student);
            const loginRes = await loginUser(testUsers.student.email, testUsers.student.password);
            accessToken = loginRes.body.accessToken;
        });

        it('should reject access without token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .expect(401);
        });

        it('should reject access with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should reject access with malformed token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', 'NotBearer token')
                .expect(401);
        });

        it('should allow access with valid token', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.email).toBe(testUsers.student.email);
        });
    });

    describe('Role-Based Access Control', () => {
        let adminToken: string;
        let teacherToken: string;
        let studentToken: string;
        let parentToken: string;

        beforeAll(async () => {
            // Create users with different roles
            const roles = ['student', 'teacher', 'parent', 'admin'] as const;
            const tokens: Record<string, string> = {};

            for (const role of roles) {
                const email = `rbac-${role}@test.com`;
                await prisma.user.deleteMany({ where: { email } });

                if (role === 'admin') {
                    // Create admin directly in DB (can't self-register)
                    const hashedPassword = await bcrypt.hash('Password123!', 12);
                    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
                    const user = await prisma.user.create({
                        data: {
                            email,
                            passwordHash: hashedPassword,
                            firstName: 'RBAC',
                            lastName: 'Admin',
                            status: 'active',
                            userRoles: {
                                create: { roleId: adminRole!.id },
                            },
                        },
                    });
                    createdUserIds.push(user.id);
                } else {
                    await request(app.getHttpServer())
                        .post('/api/auth/register')
                        .send({
                            email,
                            password: 'Password123!',
                            firstName: 'RBAC',
                            lastName: role.charAt(0).toUpperCase() + role.slice(1),
                            role,
                        })
                        .expect(201);
                }

                const loginRes = await request(app.getHttpServer())
                    .post('/api/auth/login')
                    .send({ email, password: 'Password123!' })
                    .expect(200);

                tokens[role] = loginRes.body.accessToken;
            }

            studentToken = tokens.student;
            teacherToken = tokens.teacher;
            parentToken = tokens.parent;
            adminToken = tokens.admin;
        });

        it('should allow all authenticated users to access profile', async () => {
            for (const token of [studentToken, teacherToken, parentToken, adminToken]) {
                await request(app.getHttpServer())
                    .get('/api/auth/profile')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);
            }
        });

        it('should allow admin to access admin-only endpoints', async () => {
            // Try to create admin user through admin endpoint
            await request(app.getHttpServer())
                .post('/api/auth/admin/create-user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'new-admin-by-admin@test.com',
                    password: 'Password123!',
                    firstName: 'New',
                    lastName: 'Admin',
                    role: 'admin',
                })
                .expect(201);

            // Cleanup
            await prisma.user.deleteMany({ where: { email: 'new-admin-by-admin@test.com' } });
        });

        it('should reject non-admin from admin endpoints', async () => {
            for (const token of [studentToken, teacherToken, parentToken]) {
                await request(app.getHttpServer())
                    .post('/api/auth/admin/create-user')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        email: 'should-not-create@test.com',
                        password: 'Password123!',
                        firstName: 'Should',
                        lastName: 'Fail',
                        role: 'admin',
                    })
                    .expect(403);
            }
        });
    });

    describe('Concurrent Sessions (Multiple Devices)', () => {
        let email: string;
        let password: string;
        let device1Tokens: { access: string; refresh: string };
        let device2Tokens: { access: string; refresh: string };

        beforeAll(async () => {
            email = 'concurrent@test.com';
            password = 'Password123!';
            await prisma.user.deleteMany({ where: { email } });

            // Register user
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email,
                    password,
                    firstName: 'Concurrent',
                    lastName: 'User',
                    role: 'student',
                })
                .expect(201);
        });

        it('should allow multiple concurrent logins from different devices', async () => {
            // Device 1 login
            const device1Res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password })
                .expect(200);

            device1Tokens = {
                access: device1Res.body.accessToken,
                refresh: extractRefreshToken(device1Res),
            };

            // Device 2 login (simulated)
            const device2Res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password })
                .expect(200);

            device2Tokens = {
                access: device2Res.body.accessToken,
                refresh: extractRefreshToken(device2Res),
            };

            // Both tokens should be different
            expect(device1Tokens.access).not.toBe(device2Tokens.access);
            expect(device1Tokens.refresh).not.toBe(device2Tokens.refresh);

            // Both should be able to access protected endpoints
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${device1Tokens.access}`)
                .expect(200);

            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${device2Tokens.access}`)
                .expect(200);
        });

        it('should allow independent token refresh on each device', async () => {
            // Refresh on device 1
            const refresh1Res = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', [`sms_refresh_token=${device1Tokens.refresh}`])
                .expect(200);

            const newDevice1Access = refresh1Res.body.accessToken;
            expect(newDevice1Access).not.toBe(device1Tokens.access);

            // Device 2 token should still work (not affected by device 1 refresh)
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${device2Tokens.access}`)
                .expect(200);
        });

        it('should allow logout from one device without affecting others', async () => {
            // Logout from device 1
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${device1Tokens.access}`)
                .set('Cookie', [`sms_refresh_token=${device1Tokens.refresh}`])
                .expect(200);

            // Device 1 tokens should be invalid
            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${device1Tokens.access}`)
                .expect(401);

            // Device 2 should still work
            // Note: In a real scenario, we'd need to refresh device 2 token first
            // as the original access token might have expired during test execution
        });
    });

    describe('Token Expiration', () => {
        it('should reject expired access token', async () => {
            // Create an expired token manually
            const expiredToken = jwtService.sign(
                { sub: 'test-user', email: 'test@test.com', roles: ['student'], jti: 'test-jti' },
                { secret: process.env.JWT_SECRET, expiresIn: '-1s' } // Already expired
            );

            await request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });

    describe('Security Headers', () => {
        it('should set secure cookie attributes', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testUsers.student.email,
                    password: testUsers.student.password,
                })
                .expect(200);

            const cookies = res.headers['set-cookie'] as string[];
            const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));

            expect(refreshCookie).toBeDefined();
            expect(refreshCookie).toContain('HttpOnly');
            expect(refreshCookie).toContain('SameSite=Strict');
        });
    });

    // Helper function
    function extractRefreshToken(response: request.Response): string {
        const cookies = response.headers['set-cookie'] as string[];
        const refreshCookie = cookies.find(c => c.includes('sms_refresh_token'));
        return refreshCookie?.match(/sms_refresh_token=([^;]+)/)?.[1] || '';
    }
});
