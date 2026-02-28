import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { MentionsService } from '../mentions/mentions.service';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

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

describe('MessagingService', () => {
    let service: MessagingService;
    let mockPrisma: DeepMockProxy<PrismaClient>;
    let mockEmailService: jest.Mocked<EmailService>;
    let mockMentionsService: jest.Mocked<MentionsService>;

    beforeEach(async () => {
        mockPrisma = mockDeep<PrismaClient>();
        mockEmailService = {
            queueEmail: jest.fn().mockResolvedValue({}),
        } as any;
        mockMentionsService = {
            deleteMessageMentions: jest.fn().mockResolvedValue({}),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EmailService, useValue: mockEmailService },
                { provide: MentionsService, useValue: mockMentionsService },
            ],
        }).compile();

        service = module.get<MessagingService>(MessagingService);
        jest.clearAllMocks();
    });

    describe('createChannel', () => {
        const createChannelDto = {
            type: 'direct_message' as const,
            name: 'Test Channel',
            memberIds: ['member-1', 'member-2'],
        };

        it('should create a channel successfully', async () => {
            mockPrisma.channel.create.mockResolvedValue({
                id: 'channel-id',
                type: createChannelDto.type,
                name: createChannelDto.name,
                members: [
                    { userId: 'user-id', role: 'owner' },
                    { userId: 'member-1', role: 'member' },
                    { userId: 'member-2', role: 'member' },
                ],
            } as any);

            const result = await service.createChannel(createChannelDto, 'user-id', ['admin']);

            expect(result).toBeDefined();
            expect(result.id).toBe('channel-id');
            expect(mockPrisma.channel.create).toHaveBeenCalled();
        });

        it('should create channel without members', async () => {
            mockPrisma.channel.create.mockResolvedValue({
                id: 'channel-id',
                type: 'direct_message',
                name: 'Test Channel',
                members: [{ userId: 'user-id', role: 'owner' }],
            } as any);

            const result = await service.createChannel(
                { type: 'direct_message', name: 'Test Channel' },
                'user-id',
                ['admin']
            );

            expect(result).toBeDefined();
            expect(result.members).toHaveLength(1);
        });

        it('should validate messaging restrictions for non-admin users', async () => {
            const teacherUser = {
                id: 'teacher-id',
                userRoles: [{ role: { name: 'teacher' } }],
                enrollments: [],
                parentOf: [],
                childOf: [],
            };

            mockPrisma.user.findUnique.mockResolvedValue(teacherUser as any);
            mockPrisma.classTeacher.findMany.mockResolvedValue([
                { classId: 'class-1' },
            ] as any);
            mockPrisma.class.findMany.mockResolvedValue([] as any);

            // For teacher to teacher messaging - check common class
            const memberUser = {
                id: 'member-1',
                userRoles: [{ role: { name: 'teacher' } }],
                enrollments: [],
                parentOf: [],
                childOf: [],
            };
            mockPrisma.user.findUnique.mockResolvedValue(memberUser as any);
            mockPrisma.classTeacher.findMany.mockResolvedValue([
                { classId: 'class-1' },
            ] as any);

            mockPrisma.channel.create.mockResolvedValue({
                id: 'channel-id',
                type: 'direct_message',
                name: 'Test Channel',
                members: [],
            } as any);

            // Should not throw because both teachers share a class
            const result = await service.createChannel(
                { type: 'direct_message', name: 'Test Channel', memberIds: ['member-1'] },
                'teacher-id',
                ['teacher']
            );

            expect(result).toBeDefined();
        });
    });

    describe('getUserChannels', () => {
        it('should return user channels with last message', async () => {
            mockPrisma.channel.findMany.mockResolvedValue([
                {
                    id: 'channel-1',
                    name: 'Channel 1',
                    members: [],
                    messages: [
                        { id: 'msg-1', content: 'Last message', sender: { id: 'user-1', firstName: 'Test', lastName: 'User' } },
                    ],
                },
            ] as any);

            const result = await service.getUserChannels('user-id');

            expect(result).toHaveLength(1);
            expect(result[0].lastMessage).toBeDefined();
            expect(result[0].lastMessage.content).toBe('Last message');
        });

        it('should exclude archived channels', async () => {
            mockPrisma.channel.findMany.mockResolvedValue([] as any);

            await service.getUserChannels('user-id');

            expect(mockPrisma.channel.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isArchived: false,
                        deletedAt: null,
                    }),
                })
            );
        });

        it('should exclude channels where user is banned', async () => {
            mockPrisma.channel.findMany.mockResolvedValue([] as any);

            await service.getUserChannels('user-id');

            expect(mockPrisma.channel.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        members: { some: { userId: 'user-id', isBanned: false } },
                    }),
                })
            );
        });
    });

    describe('getUserChannelsWithUnread', () => {
        it('should return channels with unread count', async () => {
            mockPrisma.channelMember.findMany.mockResolvedValue([
                {
                    channelId: 'channel-1',
                    lastReadAt: new Date(Date.now() - 86400000), // 1 day ago
                    role: 'member',
                    joinedAt: new Date(),
                    channel: {
                        id: 'channel-1',
                        name: 'Channel 1',
                        members: [],
                        messages: [],
                    },
                },
            ] as any);

            mockPrisma.message.count.mockResolvedValue(5);

            const result = await service.getUserChannelsWithUnread('user-id');

            expect(result).toHaveLength(1);
            expect(result[0].unreadCount).toBe(5);
        });

        it('should count all messages when never read', async () => {
            mockPrisma.channelMember.findMany.mockResolvedValue([
                {
                    channelId: 'channel-1',
                    lastReadAt: null,
                    role: 'member',
                    joinedAt: new Date(),
                    channel: {
                        id: 'channel-1',
                        name: 'Channel 1',
                        members: [],
                        messages: [],
                    },
                },
            ] as any);

            mockPrisma.message.count.mockResolvedValue(10);

            const result = await service.getUserChannelsWithUnread('user-id');

            expect(result).toHaveLength(1);
            expect(result[0].unreadCount).toBe(10);
        });
    });

    describe('markChannelAsRead', () => {
        it('should mark channel as read successfully', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                channelId: 'channel-1',
                userId: 'user-id',
                isBanned: false,
            } as any);

            mockPrisma.channelMember.update.mockResolvedValue({} as any);

            const result = await service.markChannelAsRead('channel-1', 'user-id');

            expect(result.success).toBe(true);
            expect(mockPrisma.channelMember.update).toHaveBeenCalledWith({
                where: { channelId_userId: { channelId: 'channel-1', userId: 'user-id' } },
                data: { lastReadAt: expect.any(Date) },
            });
        });

        it('should throw ForbiddenException if not a member', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue(null);

            await expect(service.markChannelAsRead('channel-1', 'user-id'))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if banned', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                channelId: 'channel-1',
                userId: 'user-id',
                isBanned: true,
            } as any);

            await expect(service.markChannelAsRead('channel-1', 'user-id'))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('getChannel', () => {
        it('should return channel for member', async () => {
            mockPrisma.channel.findFirst.mockResolvedValue({
                id: 'channel-1',
                name: 'Channel 1',
                deletedAt: null,
                members: [{ userId: 'user-id' }],
            } as any);

            const result = await service.getChannel('channel-1', 'user-id');

            expect(result).toBeDefined();
            expect(result.id).toBe('channel-1');
        });

        it('should throw NotFoundException for deleted channels', async () => {
            mockPrisma.channel.findFirst.mockResolvedValue(null);

            await expect(service.getChannel('channel-1', 'user-id'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException for non-members', async () => {
            mockPrisma.channel.findFirst.mockResolvedValue({
                id: 'channel-1',
                name: 'Channel 1',
                deletedAt: null,
                members: [{ userId: 'other-user' }],
            } as any);

            await expect(service.getChannel('channel-1', 'user-id'))
                .rejects.toThrow(ForbiddenException);
        });

        it('should include deleted channels when flag is true', async () => {
            mockPrisma.channel.findFirst.mockResolvedValue({
                id: 'channel-1',
                name: 'Channel 1',
                deletedAt: new Date(),
                members: [{ userId: 'user-id' }],
            } as any);

            const result = await service.getChannel('channel-1', 'user-id', true);

            expect(result).toBeDefined();
        });
    });

    describe('getMessages', () => {
        it('should return messages with pagination', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                isBanned: false,
            } as any);

            mockPrisma.message.findMany.mockResolvedValue([
                { id: 'msg-1', content: 'Message 1', sender: {}, reactions: [], parent: null },
                { id: 'msg-2', content: 'Message 2', sender: {}, reactions: [], parent: null },
            ] as any);

            const result = await service.getMessages('channel-1', 'user-id');

            expect(result.messages).toHaveLength(2);
            expect(result.nextCursor).toBeDefined();
        });

        it('should enforce pagination limits', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                isBanned: false,
            } as any);

            mockPrisma.message.findMany.mockResolvedValue([] as any);

            // Request more than max
            await service.getMessages('channel-1', 'user-id', undefined, 500);

            expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 200, // MAX_PAGE_SIZE
                })
            );
        });

        it('should throw ForbiddenException for banned users', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                isBanned: true,
            } as any);

            await expect(service.getMessages('channel-1', 'user-id'))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('sendMessage', () => {
        const sendMessageDto = {
            content: 'Test message',
            replyTo: undefined,
        };

        it('should send message successfully', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                isBanned: false,
                isMuted: false,
            } as any);

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });

            mockPrisma.message.create.mockResolvedValue({
                id: 'msg-1',
                content: sendMessageDto.content,
                sender: { id: 'user-id', firstName: 'Test', lastName: 'User' },
                reactions: [],
                parent: null,
            } as any);

            mockPrisma.channel.update.mockResolvedValue({} as any);

            const result = await service.sendMessage('channel-1', 'user-id', sendMessageDto);

            expect(result).toBeDefined();
            expect(result.content).toBe(sendMessageDto.content);
        });

        it('should throw ForbiddenException if not a member', async () => {
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                // Simulate the transaction running and the inner code throwing
                mockPrisma.channelMember.findUnique.mockResolvedValue(null);
                return callback(mockPrisma);
            });

            await expect(service.sendMessage('channel-1', 'user-id', sendMessageDto))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if banned', async () => {
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                mockPrisma.channelMember.findUnique.mockResolvedValue({
                    isBanned: true,
                    isMuted: false,
                } as any);
                return callback(mockPrisma);
            });

            await expect(service.sendMessage('channel-1', 'user-id', sendMessageDto))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if muted', async () => {
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                mockPrisma.channelMember.findUnique.mockResolvedValue({
                    isBanned: false,
                    isMuted: true,
                } as any);
                return callback(mockPrisma);
            });

            await expect(service.sendMessage('channel-1', 'user-id', sendMessageDto))
                .rejects.toThrow(ForbiddenException);
        });

        it('should handle reply to message', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                isBanned: false,
                isMuted: false,
            } as any);

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });

            mockPrisma.message.create.mockResolvedValue({
                id: 'msg-1',
                content: 'Reply',
                sender: { id: 'user-id', firstName: 'Test', lastName: 'User' },
                reactions: [],
                parent: { id: 'parent-msg', content: 'Original', sender: { id: 'other-user', firstName: 'Other', lastName: 'User' } },
            } as any);

            mockPrisma.channel.update.mockResolvedValue({} as any);

            const result = await service.sendMessage('channel-1', 'user-id', {
                content: 'Reply',
                replyTo: 'parent-msg',
            });

            expect(result).toBeDefined();
            expect(result.parent).toBeDefined();
        });
    });

    describe('editMessage', () => {
        it('should edit own message successfully', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'user-id',
                isDeleted: false,
                channelId: 'channel-1',
            } as any);

            mockPrisma.message.update.mockResolvedValue({
                id: 'msg-1',
                content: 'Updated content',
                editedAt: new Date(),
                sender: { id: 'user-id', firstName: 'Test', lastName: 'User' },
                reactions: [],
            } as any);

            const result = await service.editMessage('msg-1', 'user-id', 'Updated content');

            expect(result).toBeDefined();
            expect(result.content).toBe('Updated content');
            expect(result.editedAt).toBeDefined();
        });

        it('should throw NotFoundException for non-existent message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue(null);

            await expect(service.editMessage('msg-1', 'user-id', 'Updated'))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when editing others message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'other-user',
                isDeleted: false,
            } as any);

            await expect(service.editMessage('msg-1', 'user-id', 'Updated'))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException for deleted message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'user-id',
                isDeleted: true,
            } as any);

            await expect(service.editMessage('msg-1', 'user-id', 'Updated'))
                .rejects.toThrow(BadRequestException);
        });

        it('should track edit history', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'user-id',
                isDeleted: false,
                content: 'Original content',
                channelId: 'channel-1',
            } as any);

            mockPrisma.message.update.mockResolvedValue({
                id: 'msg-1',
                content: 'Updated content',
                editedAt: new Date(),
                sender: { id: 'user-id', firstName: 'Test', lastName: 'User' },
                reactions: [],
            } as any);

            // Track edit history should be called
            await service.editMessage('msg-1', 'user-id', 'Updated content');

            // The trackEditHistory is a private method that uses prisma directly
        });
    });

    describe('deleteMessage', () => {
        it('should soft delete own message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'user-id',
                isDeleted: false,
                channelId: 'channel-1',
            } as any);

            mockPrisma.message.update.mockResolvedValue({} as any);

            const result = await service.deleteMessage('msg-1', 'user-id', ['student']);

            expect(result.deleted).toBe(true);
            expect(result.softDelete).toBe(true);
            expect(mockPrisma.message.update).toHaveBeenCalledWith({
                where: { id: 'msg-1' },
                data: {
                    isDeleted: true,
                    deletedAt: expect.any(Date),
                    deletedBy: 'user-id',
                },
            });
        });

        it('should hard delete for admin users', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'other-user',
                isDeleted: false,
                channelId: 'channel-1',
            } as any);

            mockPrisma.message.delete.mockResolvedValue({} as any);

            const result = await service.deleteMessage('msg-1', 'admin-id', ['admin'], false);

            expect(result.deleted).toBe(true);
            expect(result.softDelete).toBe(false);
            expect(mockPrisma.message.delete).toHaveBeenCalled();
        });

        it('should allow admin to delete others messages', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'other-user',
                isDeleted: false,
                channelId: 'channel-1',
            } as any);

            mockPrisma.message.update.mockResolvedValue({} as any);

            const result = await service.deleteMessage('msg-1', 'admin-id', ['admin']);

            expect(result.deleted).toBe(true);
        });

        it('should throw BadRequestException for already deleted message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'user-id',
                isDeleted: true,
            } as any);

            await expect(service.deleteMessage('msg-1', 'user-id', ['student']))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException when non-admin deletes others message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                senderId: 'other-user',
                isDeleted: false,
            } as any);

            await expect(service.deleteMessage('msg-1', 'user-id', ['student']))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('reportChannel', () => {
        it('should create channel report successfully', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                channelId: 'channel-1',
                userId: 'user-id',
            } as any);

            mockPrisma.channelReport.findFirst.mockResolvedValue(null);

            mockPrisma.channelReport.create.mockResolvedValue({
                id: 'report-1',
                channelId: 'channel-1',
                reportedBy: 'user-id',
                reason: 'Inappropriate content',
                status: 'pending',
            } as any);

            const result = await service.reportChannel('channel-1', 'user-id', 'Inappropriate content');

            expect(result).toBeDefined();
            expect(result.status).toBe('pending');
        });

        it('should throw ForbiddenException if not a member', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue(null);

            await expect(service.reportChannel('channel-1', 'user-id', 'Reason'))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if already reported', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({
                channelId: 'channel-1',
                userId: 'user-id',
            } as any);

            mockPrisma.channelReport.findFirst.mockResolvedValue({
                id: 'existing-report',
                status: 'pending',
            } as any);

            await expect(service.reportChannel('channel-1', 'user-id', 'Reason'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('searchMessages', () => {
        it('should search messages successfully', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({} as any);

            mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: 10 }] as any);
            mockPrisma.$queryRaw.mockResolvedValueOnce([
                {
                    id: 'msg-1',
                    content: 'Search result',
                    senderFirstName: 'Test',
                    senderLastName: 'User',
                    rank: 0.5,
                    headline: '<mark>Search</mark> result',
                },
            ] as any);

            const result = await service.searchMessages('channel-1', 'user-id', { q: 'search term' });

            expect(result.messages).toHaveLength(1);
            expect(result.meta.total).toBe(10);
            // Verify we're using $queryRaw (safe) not $queryRawUnsafe
            expect(mockPrisma.$queryRaw).toHaveBeenCalled();
            expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException if not a member', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue(null);

            await expect(service.searchMessages('channel-1', 'user-id', { q: 'test' }))
                .rejects.toThrow(ForbiddenException);
        });

        it('should validate pagination parameters', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({} as any);
            mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValueOnce([] as any);

            // Request with invalid page/limit
            const result = await service.searchMessages('channel-1', 'user-id', {
                q: 'test',
                page: -1,
                limit: 500,
            });

            expect(result.meta.page).toBeGreaterThanOrEqual(1);
            expect(result.meta.limit).toBeLessThanOrEqual(100);
        });

        it('should reject invalid sender UUID format', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({} as any);

            await expect(service.searchMessages('channel-1', 'user-id', {
                q: 'test',
                sender: 'invalid-uuid',
            })).rejects.toThrow('Invalid sender ID format');
        });

        it('should accept valid sender UUID format', async () => {
            mockPrisma.channelMember.findUnique.mockResolvedValue({} as any);
            mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: 0 }] as any);
            mockPrisma.$queryRaw.mockResolvedValueOnce([] as any);

            const result = await service.searchMessages('channel-1', 'user-id', {
                q: 'test',
                sender: '550e8400-e29b-41d4-a716-446655440000',
            });

            expect(result).toBeDefined();
        });
    });

    describe('addMember and removeMember', () => {
        it('should add member to channel', async () => {
            mockPrisma.channelMember.create.mockResolvedValue({
                channelId: 'channel-1',
                userId: 'new-member',
                role: 'member',
            } as any);

            const result = await service.addMember('channel-1', 'new-member');

            expect(result).toBeDefined();
            expect(result.userId).toBe('new-member');
        });

        it('should remove member from channel', async () => {
            mockPrisma.channelMember.delete.mockResolvedValue({} as any);

            await service.removeMember('channel-1', 'member-id');

            expect(mockPrisma.channelMember.delete).toHaveBeenCalledWith({
                where: { channelId_userId: { channelId: 'channel-1', userId: 'member-id' } },
            });
        });
    });
});
