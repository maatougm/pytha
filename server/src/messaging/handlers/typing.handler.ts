import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TypingService } from '../typing.service';
import { WsGetTypingDto } from '../dto/ws-message.dto';

interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

@Injectable()
export class TypingHandler {
    private readonly logger = new Logger(TypingHandler.name);

    constructor(
        private readonly typingService: TypingService,
    ) { }

    /**
     * Handle typing start event
     */
    async handleTypingStart(
        client: AuthenticatedSocket,
        data: { channelId: string },
    ): Promise<void> {
        if (!client.user) return;

        const userName = client.user.email?.split('@')[0] || 'Someone';

        // Debounce typing events to prevent spam
        const shouldProcess = await this.typingService.shouldProcessTypingEvent(
            data.channelId,
            client.user.sub,
            2000, // 2 second debounce
        );

        if (!shouldProcess) {
            return; // Skip if within debounce window
        }

        // Record typing in Redis/memory
        await this.typingService.startTyping(data.channelId, client.user.sub, userName);

        // Emit to channel members
        client.to(`channel:${data.channelId}`).emit('typing:update', {
            type: 'start',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });

        // Also emit legacy event for backward compatibility
        client.to(`channel:${data.channelId}`).emit('user:typing', {
            type: 'start',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
    }

    /**
     * Handle typing stop event
     */
    async handleTypingStop(
        client: AuthenticatedSocket,
        data: { channelId: string },
    ): Promise<void> {
        if (!client.user) return;

        const userName = client.user.email?.split('@')[0] || 'Someone';

        // Remove typing indicator
        await this.typingService.stopTyping(data.channelId, client.user.sub);

        // Emit to channel members
        client.to(`channel:${data.channelId}`).emit('typing:update', {
            type: 'stop',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });

        // Also emit legacy event for backward compatibility
        client.to(`channel:${data.channelId}`).emit('user:typing', {
            type: 'stop',
            channelId: data.channelId,
            userId: client.user.sub,
            userName: userName,
        });
    }

    /**
     * Get currently typing users for a channel
     */
    async handleGetTypingUsers(
        client: AuthenticatedSocket,
        data: WsGetTypingDto,
    ): Promise<{ success: boolean; channelId?: string; users?: any[]; error?: string }> {
        if (!client.user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            // Get typing users from Redis/memory
            const typingUsers = await this.typingService.getTypingUsers(
                data.channelId,
                client.user.sub,
            );

            return {
                success: true,
                channelId: data.channelId,
                users: typingUsers,
            };
        } catch (err) {
            this.logger.error('Error getting typing users:', err.message);
            return { success: false, error: err.message };
        }
    }
}
