import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { MentionsService } from '../mentions/mentions.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock audit helper
jest.mock('../common/utils/audit-helper', () => ({
    createAuditLog: jest.fn().mockResolvedValue({}),
    AuditActions: {
        CREATE_CHANNEL: 'CREATE_CHANNEL',
        SEND_MESSAGE: 'SEND_MESSAGE',
    },
}));

describe('MessagingService - N+1 Query Prevention', () => {
    let service: MessagingService;
    let mockPrisma: DeepMockProxy<PrismaClient>;

    beforeEach(async () => {
        mockPrisma = mockDeep<PrismaClient>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EmailService, useValue: { queueEmail: jest.fn().mockResolvedValue({}) } },
                { provide: MentionsService, useValue: { deleteMessageMentions: jest.fn().mockResolvedValue({}) } },
            ],
        }).compile();

        service = module.get<MessagingService>(MessagingService);
        jest.clearAllMocks();
    });

    describe('getUserChannelsWithUnreadOptimized N+1 Prevention', () => {
        it('should execute only 1 query for unread counts (not N queries)', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([
                { id: 'ch-1', name: 'Channel 1', unreadCount: 5 },
                { id: 'ch-2', name: 'Channel 2', unreadCount: 3 },
                { id: 'ch-3', name: 'Channel 3', unreadCount: 0 },
            ] as any);

            await service.getUserChannelsWithUnreadOptimized('user-id');

            // Should execute only 1 query
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
        });

        it('should not use message.count in a loop', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([
                { id: 'ch-1', unreadCount: 5 },
            ] as any);

            await service.getUserChannelsWithUnreadOptimized('user-id');

            // Verify message.count was never called (the N+1 pattern)
            expect(mockPrisma.message.count).not.toHaveBeenCalled();
        });

        it('should handle user with no channels', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([] as any);

            const result = await service.getUserChannelsWithUnreadOptimized('user-id');

            expect(result).toEqual([]);
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
        });

        it('should handle channels with no messages', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([
                { id: 'ch-1', unreadCount: 0 },
                { id: 'ch-2', unreadCount: 0 },
            ] as any);

            const result = await service.getUserChannelsWithUnreadOptimized('user-id');

            expect(result).toHaveLength(2);
            expect((result as any)[0].unreadCount).toBe(0);
        });
    });
});
