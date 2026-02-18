import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.refreshToken.deleteMany();
        await prisma.user.deleteMany({
            where: { email: { contains: 'test' } },
        });
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/auth/register (POST)', () => {
        it('should register a new user', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test-register@school.com',
                    password: 'Password123!',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.user).toBeDefined();
                    expect(res.body.user.email).toBe('test-register@school.com');
                    expect(res.body.accessToken).toBeDefined();
                    expect(res.body.refreshToken).toBeDefined();
                    expect(res.body.user.passwordHash).toBeUndefined();
                });
        });

        it('should reject weak passwords', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@school.com',
                    password: 'weak',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                })
                .expect(400);
        });

        it('should reject invalid email', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'not-an-email',
                    password: 'Password123!',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                })
                .expect(400);
        });
    });

    describe('/auth/login (POST)', () => {
        beforeEach(async () => {
            // Create a test user
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test-login@school.com',
                    password: 'Password123!',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                });
        });

        it('should login with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test-login@school.com',
                    password: 'Password123!',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.user).toBeDefined();
                    expect(res.body.accessToken).toBeDefined();
                    expect(res.body.refreshToken).toBeDefined();
                });
        });

        it('should reject invalid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test-login@school.com',
                    password: 'WrongPassword123!',
                })
                .expect(401);
        });
    });

    describe('/auth/profile (GET)', () => {
        let accessToken: string;

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test-profile@school.com',
                    password: 'Password123!',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                });
            accessToken = res.body.accessToken;
        });

        it('should get profile with valid token', () => {
            return request(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe('test-profile@school.com');
                    expect(res.body.passwordHash).toBeUndefined();
                });
        });

        it('should reject without token', () => {
            return request(app.getHttpServer())
                .get('/api/auth/profile')
                .expect(401);
        });
    });

    describe('/health (GET)', () => {
        it('should return health status', () => {
            return request(app.getHttpServer())
                .get('/api/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBeDefined();
                    expect(res.body.checks).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();
                });
        });
    });
});
