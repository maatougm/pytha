import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { MentionsService } from '../mentions/mentions.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

// Mock audit helper
jest.mock('../common/utils/audit-helper', () => ({
    createAuditLog: jest.fn().mockResolvedValue({}),
    AuditActions: {
        CREATE_CHANNEL: 'CREATE_CHANNEL',
        SEND_MESSAGE: 'SEND_MESSAGE',
        EDIT_MESSAGE: 'EDIT_MESSAGE',
        DELETE_MESSAGE: 'DELETE_MESSAGE',
    },
}));

describe('MessagingService - SQL Injection Prevention', () => {
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

    describe('searchMessages SQL Injection Prevention', () => {
        beforeEach(() => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({} as any);
        });

        it('should use $queryRaw (safe) instead of $queryRawUnsafe for search queries', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValue([] as any);

            await service.searchMessages('channel-1', 'user-id', { q: 'test' });

            // Verify $queryRaw was called (safe) and $queryRawUnsafe was NOT called
            expect(mockPrisma.$queryRaw).toHaveBeenCalled();
            expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
        });

        it('should sanitize search query input to prevent SQL injection', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValue([] as any);

            // Attempt SQL injection through search query
            const maliciousQuery = "test'; DROP TABLE messages; --";
            await service.searchMessages('channel-1', 'user-id', { q: maliciousQuery });

            // Get the actual query that was executed
            const executedQuery = mockPrisma.$queryRaw.mock.calls[0][0];
            const queryString = typeof executedQuery === 'object' && 'sql' in executedQuery 
                ? (executedQuery as any).sql 
                : executedQuery.toString();

            // Verify the malicious payload is properly escaped/parameterized
            // The raw SQL injection string should NOT appear in the query
            expect(queryString).not.toContain("DROP TABLE");
            expect(queryString).not.toContain("; --");
        });

        it('should reject invalid sender ID format (prevents SQL injection)', async () => {
            // Attempt SQL injection through sender filter with invalid UUID
            const maliciousSenderId = "user-id'; DROP TABLE users; --";
            
            // Should throw BadRequestException due to invalid UUID format
            await expect(service.searchMessages('channel-1', 'user-id', {
                q: 'test',
                sender: maliciousSenderId,
            })).rejects.toThrow(BadRequestException);

            // No database queries should be executed
            expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
        });

        it('should accept valid UUID sender ID and use parameterized queries', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValue([] as any);

            const validSenderId = '550e8400-e29b-41d4-a716-446655440000';
            await service.searchMessages('channel-1', 'user-id', {
                q: 'test query',
                sender: validSenderId,
                from: '2024-01-01T00:00:00Z',
                to: '2024-12-31T23:59:59Z',
            });

            // All calls should use $queryRaw (safe), never $queryRawUnsafe
            expect(mockPrisma.$queryRaw).toHaveBeenCalled();
            expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();

            // Verify the query was constructed with proper parameterization
            const executedQuery = mockPrisma.$queryRaw.mock.calls[0][0];
            const queryString = typeof executedQuery === 'object' && 'sql' in executedQuery 
                ? (executedQuery as any).sql 
                : executedQuery.toString();
            
            // Should use parameter placeholders (?), not embedded values
            expect(queryString).toContain('?');
            // Should NOT contain raw UUID in the query string (would indicate unsafe interpolation)
            expect(queryString).not.toContain(validSenderId);
        });

        it('should use parameterized queries without sender filter', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValue([] as any);

            await service.searchMessages('channel-1', 'user-id', {
                q: 'test query',
                from: '2024-01-01T00:00:00Z',
                to: '2024-12-31T23:59:59Z',
            });

            // All calls should use $queryRaw (safe), never $queryRawUnsafe
            expect(mockPrisma.$queryRaw).toHaveBeenCalled();
            expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
        });
    });
});
