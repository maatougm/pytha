import { Test, TestingModule } from '@nestjs/testing';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessagingController', () => {
    let controller: MessagingController;
    let service: MessagingService;

    const mockMessagingService = {
        createChannel: jest.fn(),
        getUserChannels: jest.fn(),
        getChannel: jest.fn(),
        addMember: jest.fn(),
        removeMember: jest.fn(),
        getMessages: jest.fn(),
        sendMessage: jest.fn(),
        editMessage: jest.fn(),
        deleteMessage: jest.fn(),
    };

    const mockRequest = {
        user: {
            sub: 'user-1',
            email: 'test@school.com',
            roles: ['student'],
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MessagingController],
            providers: [
                {
                    provide: MessagingService,
                    useValue: mockMessagingService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<MessagingController>(MessagingController);
        service = module.get<MessagingService>(MessagingService);
        jest.clearAllMocks();
    });

    describe('createChannel', () => {
        it('should create a channel', async () => {
            const dto = {
                type: 'class_broadcast' as const,
                name: 'Test Channel',
                memberIds: ['user-2', 'user-3'],
            };
            const expected = { id: 'channel-1', ...dto };
            mockMessagingService.createChannel.mockResolvedValue(expected);

            const result = await controller.createChannel(dto, mockRequest);

            expect(result).toEqual(expected);
            expect(service.createChannel).toHaveBeenCalledWith(dto, 'user-1');
        });
    });

    describe('getUserChannels', () => {
        it('should return user channels', async () => {
            const expected = [
                { id: 'channel-1', name: 'Channel 1' },
                { id: 'channel-2', name: 'Channel 2' },
            ];
            mockMessagingService.getUserChannels.mockResolvedValue(expected);

            const result = await controller.getUserChannels(mockRequest);

            expect(result).toEqual(expected);
            expect(service.getUserChannels).toHaveBeenCalledWith('user-1');
        });
    });

    describe('getMessages', () => {
        it('should return messages with default limit', async () => {
            const expected = {
                messages: [{ id: 'msg-1', content: 'Hello' }],
                nextCursor: null,
            };
            mockMessagingService.getMessages.mockResolvedValue(expected);

            const result = await controller.getMessages('channel-1', mockRequest);

            expect(result).toEqual(expected);
            expect(service.getMessages).toHaveBeenCalledWith('channel-1', 'user-1', undefined, 50);
        });

        it('should respect custom limit', async () => {
            const expected = { messages: [], nextCursor: null };
            mockMessagingService.getMessages.mockResolvedValue(expected);

            await controller.getMessages('channel-1', mockRequest, undefined, '100');

            expect(service.getMessages).toHaveBeenCalledWith('channel-1', 'user-1', undefined, 100);
        });
    });

    describe('sendMessage', () => {
        it('should send a message', async () => {
            const dto = { content: 'Hello world' };
            const expected = { id: 'msg-1', ...dto, senderId: 'user-1' };
            mockMessagingService.sendMessage.mockResolvedValue(expected);

            const result = await controller.sendMessage('channel-1', dto, mockRequest);

            expect(result).toEqual(expected);
            expect(service.sendMessage).toHaveBeenCalledWith('channel-1', 'user-1', dto);
        });

        it('should handle message with reply', async () => {
            const dto = { content: 'Reply', replyTo: 'msg-1' };
            mockMessagingService.sendMessage.mockResolvedValue({ id: 'msg-2', ...dto });

            await controller.sendMessage('channel-1', dto, mockRequest);

            expect(service.sendMessage).toHaveBeenCalledWith('channel-1', 'user-1', dto);
        });
    });

    describe('deleteMessage', () => {
        it('should delete own message', async () => {
            mockMessagingService.deleteMessage.mockResolvedValue({ deleted: true });

            const result = await controller.deleteMessage('msg-1', mockRequest);

            expect(result).toEqual({ deleted: true });
            expect(service.deleteMessage).toHaveBeenCalledWith('msg-1', 'user-1', ['student']);
        });

        it('should allow admin to delete any message', async () => {
            const adminRequest = { ...mockRequest, user: { ...mockRequest.user, roles: ['admin'] } };
            mockMessagingService.deleteMessage.mockResolvedValue({ deleted: true });

            await controller.deleteMessage('msg-1', adminRequest);

            expect(service.deleteMessage).toHaveBeenCalledWith('msg-1', 'user-1', ['admin']);
        });
    });
});
