import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { MessagingService } from '../messaging.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
    WsSendMessageDto,
    WsEditMessageDto,
    WsDeleteMessageDto,
    WsReadReceiptDto,
    WsReadBulkDto,
} from '../dto/ws-message.dto';

interface AuthenticatedSocket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

@Injectable()
export class MessageHandler {
    private readonly logger = new Logger(MessageHandler.name);

    constructor(
        private readonly messagingService: MessagingService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Handle sending a new message
     */
    async handleSendMessage(
        server: Server,
        client: AuthenticatedSocket,
        data: WsSendMessageDto,
    ): Promise<{ success: boolean; message?: any; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const message = await this.messagingService.sendMessage(
                data.channelId,
                client.user.sub,
                { content: data.content, replyTo: data.replyTo },
            );

            server.to(`channel:${data.channelId}`).emit('message:new', message);
            return { success: true, message };
        } catch (err) {
            this.logger.error('Error sending message:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Handle editing an existing message
     */
    async handleEditMessage(
        server: Server,
        client: AuthenticatedSocket,
        data: WsEditMessageDto,
    ): Promise<{ success: boolean; message?: any; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const message = await this.messagingService.editMessage(
                data.messageId,
                client.user.sub,
                data.content,
            );

            // Emit with type field for frontend compatibility
            server.to(`channel:${message.channelId}`).emit('message:updated', {
                type: 'updated',
                messageId: message.id,
                content: message.content,
                editedAt: message.editedAt,
                channelId: message.channelId,
            });
            return { success: true, message };
        } catch (err) {
            this.logger.error('Error editing message:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Handle deleting a message
     */
    async handleDeleteMessage(
        server: Server,
        client: AuthenticatedSocket,
        data: WsDeleteMessageDto,
    ): Promise<{ success: boolean; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const original = await this.prisma.message.findUnique({
                where: { id: data.messageId },
            });

            if (!original) {
                return { success: false, error: 'Message not found' };
            }

            await this.messagingService.deleteMessage(
                data.messageId,
                client.user.sub,
                client.user.roles,
            );

            // Emit with type field for frontend compatibility
            server.to(`channel:${original.channelId}`).emit('message:deleted', {
                type: 'deleted',
                messageId: data.messageId,
                channelId: original.channelId,
            });

            return { success: true };
        } catch (err) {
            this.logger.error('Error deleting message:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Handle marking a single message as read
     */
    async handleMessageRead(
        server: Server,
        client: AuthenticatedSocket,
        data: WsReadReceiptDto,
    ): Promise<{ success: boolean; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            // Persist the read receipt to the database
            await this.prisma.messageRead.upsert({
                where: {
                    messageId_userId: {
                        messageId: data.messageId,
                        userId: client.user.sub,
                    },
                },
                create: {
                    messageId: data.messageId,
                    userId: client.user.sub,
                    readAt: new Date(),
                },
                update: { readAt: new Date() },
            });

            // Broadcast to channel members
            server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                messageId: data.messageId,
                channelId: data.channelId,
                readBy: { userId: client.user.sub, readAt: new Date() },
            });

            return { success: true };
        } catch (err) {
            this.logger.error('Error marking message as read:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Handle marking multiple messages as read in bulk
     */
    async handleMessagesReadBulk(
        server: Server,
        client: AuthenticatedSocket,
        data: WsReadBulkDto,
    ): Promise<{ success: boolean; count?: number; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        const userId = client.user.sub;

        try {
            const now = new Date();
            // Persist all read receipts in a single transaction
            await this.prisma.$transaction(
                data.messageIds.map((messageId) =>
                    this.prisma.messageRead.upsert({
                        where: { messageId_userId: { messageId, userId } },
                        create: { messageId, userId, readAt: now },
                        update: { readAt: now },
                    }),
                ),
            );

            // Broadcast read receipts to channel members
            for (const messageId of data.messageIds) {
                server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                    messageId,
                    channelId: data.channelId,
                    readBy: { userId, readAt: now },
                });
            }

            return { success: true, count: data.messageIds.length };
        } catch (err) {
            this.logger.error('Error marking messages as read:', err.message);
            return { success: false, error: err.message };
        }
    }
}
