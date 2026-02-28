import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { MessagingService } from '../messaging.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WsReactionDto } from '../dto/ws-message.dto';

interface AuthenticatedSocket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

@Injectable()
export class ReactionHandler {
    private readonly logger = new Logger(ReactionHandler.name);

    constructor(
        private readonly messagingService: MessagingService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Handle adding a reaction to a message
     */
    async handleAddReaction(
        server: Server,
        client: AuthenticatedSocket,
        data: WsReactionDto,
    ): Promise<{ success: boolean; reaction?: any; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const reaction = await this.messagingService.addReaction(
                data.messageId,
                client.user.sub,
                { reaction: data.reaction },
            );

            // Get message info for channel broadcast
            const message = await this.prisma.message.findUnique({
                where: { id: data.messageId },
                select: { channelId: true },
            });

            if (message) {
                server.to(`channel:${message.channelId}`).emit('message:reaction_added', {
                    type: 'reaction_added',
                    messageId: data.messageId,
                    reaction: data.reaction,
                    userId: client.user.sub,
                    user: reaction.user,
                    createdAt: reaction.createdAt,
                });
            }

            return { success: true, reaction };
        } catch (err) {
            this.logger.error('Error adding reaction:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Handle removing a reaction from a message
     */
    async handleRemoveReaction(
        server: Server,
        client: AuthenticatedSocket,
        data: WsReactionDto,
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const result = await this.messagingService.removeReaction(
                data.messageId,
                client.user.sub,
                data.reaction,
            );

            // Get message info for channel broadcast
            const message = await this.prisma.message.findUnique({
                where: { id: data.messageId },
                select: { channelId: true },
            });

            if (message) {
                server.to(`channel:${message.channelId}`).emit('message:reaction_removed', {
                    type: 'reaction_removed',
                    messageId: data.messageId,
                    reaction: data.reaction,
                    userId: client.user.sub,
                });
            }

            return { success: true, result };
        } catch (err) {
            this.logger.error('Error removing reaction:', err.message);
            return { success: false, error: err.message };
        }
    }
}
