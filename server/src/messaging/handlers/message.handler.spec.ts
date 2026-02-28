import { Test, TestingModule } from '@nestjs/testing';
import { MessageHandler } from './message.handler';
import { MessagingService } from '../messaging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

describe('MessageHandler', () => {
    let handler: MessageHandler;
    let mockMessagingService: jest.Mocked<MessagingService>;
    let mockPrisma: DeepMockProxy<PrismaClient>;
    let mockServer: jest.Mocked<Server>;

    const mockClient = {
        user: {
            sub: 'user-id',
            email: 'test@school.com',
            roles: ['student'],
        },
    };

    const mockUnauthenticatedClient = {
        user: undefined,
    };

    beforeEach(async () => {
        mockMessagingService = {
            sendMessage: jest.fn(),
            editMessage: jest.fn(),
            deleteMessage: jest.fn(),
        } as any;

        mockPrisma = mockDeep<PrismaClient>();

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn().mockReturnThis(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessageHandler,
                { provide: MessagingService, useValue: mockMessagingService },
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        handler = module.get<MessageHandler>(MessageHandler);
        jest.clearAllMocks();
    });

    describe('handleSendMessage', () => {
        const sendMessageData = {
            channelId: 'channel-1',
            content: 'Hello, world!',
            replyTo: undefined,
        };

        it('should send message successfully', async () => {
            const mockMessage = {
                id: 'msg-1',
                channelId: 'channel-1',
                content: 'Hello, world!',
                sender: { id: 'user-id', firstName: 'Test', lastName: 'User' },
            };

            mockMessagingService.sendMessage.mockResolvedValue(mockMessage as any);

            const result = await handler.handleSendMessage(mockServer, mockClient as any, sendMessageData);

            expect(result.success).toBe(true);
            expect(result.message).toEqual(mockMessage);
            expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
                'channel-1',
                'user-id',
                { content: 'Hello, world!', replyTo: undefined }
            );
            expect(mockServer.to).toHaveBeenCalledWith('channel:channel-1');
            expect(mockServer.emit).toHaveBeenCalledWith('message:new', mockMessage);
        });

        it('should return error when not authenticated', async () => {
            const result = await handler.handleSendMessage(mockServer, mockUnauthenticatedClient as any, sendMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
            expect(mockMessagingService.sendMessage).not.toHaveBeenCalled();
        });

        it('should handle reply to message', async () => {
            const replyData = {
                channelId: 'channel-1',
                content: 'This is a reply',
                replyTo: 'parent-msg-id',
            };

            const mockMessage = {
                id: 'msg-2',
                content: 'This is a reply',
                parent: { id: 'parent-msg-id', content: 'Parent message' },
            };

            mockMessagingService.sendMessage.mockResolvedValue(mockMessage as any);

            const result = await handler.handleSendMessage(mockServer, mockClient as any, replyData);

            expect(result.success).toBe(true);
            expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
                'channel-1',
                'user-id',
                { content: 'This is a reply', replyTo: 'parent-msg-id' }
            );
        });

        it('should handle service errors', async () => {
            mockMessagingService.sendMessage.mockRejectedValue(new Error('Channel not found'));

            const result = await handler.handleSendMessage(mockServer, mockClient as any, sendMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Channel not found');
        });
    });

    describe('handleEditMessage', () => {
        const editMessageData = {
            messageId: 'msg-1',
            content: 'Updated content',
        };

        it('should edit message successfully', async () => {
            const mockMessage = {
                id: 'msg-1',
                channelId: 'channel-1',
                content: 'Updated content',
                editedAt: new Date(),
            };

            mockMessagingService.editMessage.mockResolvedValue(mockMessage as any);

            const result = await handler.handleEditMessage(mockServer, mockClient as any, editMessageData);

            expect(result.success).toBe(true);
            expect(result.message).toEqual(mockMessage);
            expect(mockMessagingService.editMessage).toHaveBeenCalledWith(
                'msg-1',
                'user-id',
                'Updated content'
            );
            expect(mockServer.to).toHaveBeenCalledWith('channel:channel-1');
            expect(mockServer.emit).toHaveBeenCalledWith('message:updated', {
                type: 'updated',
                messageId: 'msg-1',
                content: 'Updated content',
                editedAt: mockMessage.editedAt,
                channelId: 'channel-1',
            });
        });

        it('should return error when not authenticated', async () => {
            const result = await handler.handleEditMessage(mockServer, mockUnauthenticatedClient as any, editMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should handle edit errors', async () => {
            mockMessagingService.editMessage.mockRejectedValue(new Error('Cannot edit another user\'s message'));

            const result = await handler.handleEditMessage(mockServer, mockClient as any, editMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot edit another user\'s message');
        });
    });

    describe('handleDeleteMessage', () => {
        const deleteMessageData = {
            messageId: 'msg-1',
        };

        it('should delete message successfully', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                channelId: 'channel-1',
            } as any);

            mockMessagingService.deleteMessage.mockResolvedValue({ deleted: true, softDelete: true } as any);

            const result = await handler.handleDeleteMessage(mockServer, mockClient as any, deleteMessageData);

            expect(result.success).toBe(true);
            expect(mockMessagingService.deleteMessage).toHaveBeenCalledWith(
                'msg-1',
                'user-id',
                ['student']
            );
            expect(mockServer.to).toHaveBeenCalledWith('channel:channel-1');
            expect(mockServer.emit).toHaveBeenCalledWith('message:deleted', {
                type: 'deleted',
                messageId: 'msg-1',
                channelId: 'channel-1',
            });
        });

        it('should return error when not authenticated', async () => {
            const result = await handler.handleDeleteMessage(mockServer, mockUnauthenticatedClient as any, deleteMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return error when message not found', async () => {
            mockPrisma.message.findUnique.mockResolvedValue(null);

            const result = await handler.handleDeleteMessage(mockServer, mockClient as any, deleteMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Message not found');
            expect(mockMessagingService.deleteMessage).not.toHaveBeenCalled();
        });

        it('should handle delete errors', async () => {
            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                channelId: 'channel-1',
            } as any);

            mockMessagingService.deleteMessage.mockRejectedValue(new Error('Permission denied'));

            const result = await handler.handleDeleteMessage(mockServer, mockClient as any, deleteMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });

        it('should allow admin to delete any message', async () => {
            const adminClient = {
                user: {
                    sub: 'admin-id',
                    email: 'admin@school.com',
                    roles: ['admin'],
                },
            };

            mockPrisma.message.findUnique.mockResolvedValue({
                id: 'msg-1',
                channelId: 'channel-1',
            } as any);

            mockMessagingService.deleteMessage.mockResolvedValue({ deleted: true, softDelete: true } as any);

            const result = await handler.handleDeleteMessage(mockServer, adminClient as any, deleteMessageData);

            expect(result.success).toBe(true);
            expect(mockMessagingService.deleteMessage).toHaveBeenCalledWith(
                'msg-1',
                'admin-id',
                ['admin']
            );
        });
    });

    describe('handleMessageRead', () => {
        const readReceiptData = {
            messageId: 'msg-1',
            channelId: 'channel-1',
        };

        it('should mark message as read successfully', async () => {
            mockPrisma.messageRead.upsert.mockResolvedValue({
                messageId: 'msg-1',
                userId: 'user-id',
                readAt: new Date(),
            } as any);

            const result = await handler.handleMessageRead(mockServer, mockClient as any, readReceiptData);

            expect(result.success).toBe(true);
            expect(mockPrisma.messageRead.upsert).toHaveBeenCalledWith({
                where: {
                    messageId_userId: {
                        messageId: 'msg-1',
                        userId: 'user-id',
                    },
                },
                create: {
                    messageId: 'msg-1',
                    userId: 'user-id',
                    readAt: expect.any(Date),
                },
                update: { readAt: expect.any(Date) },
            });
            expect(mockServer.to).toHaveBeenCalledWith('channel:channel-1');
            expect(mockServer.emit).toHaveBeenCalledWith('message:read_receipt', {
                messageId: 'msg-1',
                channelId: 'channel-1',
                readBy: { userId: 'user-id', readAt: expect.any(Date) },
            });
        });

        it('should return error when not authenticated', async () => {
            const result = await handler.handleMessageRead(mockServer, mockUnauthenticatedClient as any, readReceiptData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should handle database errors', async () => {
            mockPrisma.messageRead.upsert.mockRejectedValue(new Error('Database error'));

            const result = await handler.handleMessageRead(mockServer, mockClient as any, readReceiptData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
        });
    });

    describe('handleMessagesReadBulk', () => {
        const readBulkData = {
            messageIds: ['msg-1', 'msg-2', 'msg-3'],
            channelId: 'channel-1',
        };

        it('should mark multiple messages as read', async () => {
            mockPrisma.$transaction.mockImplementation(async (operations: any) => {
                return operations.map(() => ({ success: true }));
            });

            const result = await handler.handleMessagesReadBulk(mockServer, mockClient as any, readBulkData);

            expect(result.success).toBe(true);
            expect(result.count).toBe(3);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it('should return error when not authenticated', async () => {
            const result = await handler.handleMessagesReadBulk(mockServer, mockUnauthenticatedClient as any, readBulkData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should handle empty message list', async () => {
            mockPrisma.$transaction.mockResolvedValue([]);

            const result = await handler.handleMessagesReadBulk(mockServer, mockClient as any, {
                messageIds: [],
                channelId: 'channel-1',
            });

            expect(result.success).toBe(true);
            expect(result.count).toBe(0);
        });

        it('should broadcast read receipts for each message', async () => {
            mockPrisma.$transaction.mockImplementation(async (operations: any) => {
                return operations.map(() => ({ success: true }));
            });

            await handler.handleMessagesReadBulk(mockServer, mockClient as any, readBulkData);

            expect(mockServer.to).toHaveBeenCalledTimes(3);
            expect(mockServer.emit).toHaveBeenCalledTimes(3);
        });

        it('should handle transaction errors', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

            const result = await handler.handleMessagesReadBulk(mockServer, mockClient as any, readBulkData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Transaction failed');
        });
    });
});
