import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
    let controller: HealthController;
    let prisma: PrismaService;

    const mockPrisma = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('should return healthy status when database is ok', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([1]);

            const result = await controller.check();

            expect(result.status).toBe('ok');
            expect(result.checks.database!.status).toBe('ok');
            expect(result.checks.memory!.status).toBe('ok');
            expect(result.uptime).toBeGreaterThanOrEqual(0);
            expect(result.version).toBeDefined();
        });

        it('should return error status when database fails', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

            const result = await controller.check();

            expect(result.status).toBe('error');
            expect(result.checks.database!.status).toBe('error');
            expect(result.checks.database!.message).toBe('Database connection failed');
        });
    });

    describe('readiness', () => {
        it('should return ready when database is accessible', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([1]);

            const result = await controller.readiness();

            expect(result.ready).toBe(true);
        });

        it('should return not ready when database is inaccessible', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

            const result = await controller.readiness();

            expect(result.ready).toBe(false);
        });
    });

    describe('liveness', () => {
        it('should always return alive', () => {
            const result = controller.liveness();

            expect(result.alive).toBe(true);
        });
    });
});
