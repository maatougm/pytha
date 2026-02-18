import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { TypingService, TypingUser } from './typing.service';
import { PrismaService } from '../prisma/prisma.service';
import { WsRateLimitGuard } from '../common/guards/ws-rate-limit.guard';
import {
    WsSendMessageDto,
    WsEditMessageDto,
    WsDeleteMessageDto,
    WsJoinChannelDto,
    WsTypingDto,
    WsReactionDto,
    WsReadReceiptDto,
    WsReadBulkDto,
} from './dto/ws-message.dto';

interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

@WebSocketGateway({
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:5173',
                'http://localhost:4173',
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
    },
    namespace: '/messaging',
    // Connection limits to prevent DoS
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessagingGateway.name);
    private pubClient: RedisClientType;
    private subClient: RedisClientType;

    // In-memory rate limiting per socket (clears on disconnect)
    private rateLimits = new Map<string, Map<string, RateLimitEntry>>();

    // Rate limit configuration
    private readonly RATE_LIMITS = {
        'message:send': { max: 30, windowMs: 60000 },     // 30 messages per minute
        'message:edit': { max: 20, windowMs: 60000 },     // 20 edits per minute
        'message:delete': { max: 10, windowMs: 60000 },   // 10 deletes per minute
        'typing:start': { max: 60, windowMs: 60000 },     // 60 typing events per minute
        'typing:stop': { max: 60, windowMs: 60000 },
        'channel:join': { max: 10, windowMs: 60000 },
        'reaction:add': { max: 30, windowMs: 60000 },     // 30 reactions per minute
        'reaction:remove': { max: 20, windowMs: 60000 },  // 20 reaction removals per minute
    };

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private messagingService: MessagingService,
        private typingService: TypingService,
        private prisma: PrismaService,
    ) { }

    async afterInit(server: Server) {
        // Setup Redis adapter for horizontal scaling
        try {
            const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

            this.pubClient = createClient({ url: redisUrl });
            this.subClient = this.pubClient.duplicate();

            await Promise.all([
                this.pubClient.connect(),
                this.subClient.connect(),
            ]);

            server.adapter(createAdapter(this.pubClient, this.subClient));
            this.logger.log('✅ Redis adapter configured for WebSocket scaling');
        } catch (error) {
            this.logger.warn('⚠️ Redis adapter not configured - WebSocket scaling will be limited:', error.message);
        }
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.query?.token as string;

            if (!token) {
                this.logger.warn(`Connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            if (!secret) {
                throw new UnauthorizedException('JWT_SECRET not configured');
            }

            const payload = this.jwtService.verify(token, { secret });
            client.user = payload;

            // Initialize rate limit tracking for this socket
            this.rateLimits.set(client.id, new Map());

            // ADMIN: Join global admin room to see everyone
            if (payload.roles.includes('admin')) {
                client.join('admin-global');
            }

            // Get User's Channels
            const channels = await this.prisma.channelMember.findMany({
                where: { userId: payload.sub, isBanned: false },
                select: { channelId: true },
            });

            const channelRooms = channels.map(c => `channel:${c.channelId}`);

            // Join rooms
            for (const room of channelRooms) {
                client.join(room);
            }

            // Broadcast online status
            if (channelRooms.length > 0) {
                this.server.to(channelRooms).to('admin-global').emit('user:online', { userId: payload.sub });
            } else {
                this.server.to('admin-global').emit('user:online', { userId: payload.sub });
            }

            this.logger.log(`🟢 ${payload.email} connected (${client.id})`);
        } catch (err) {
            this.logger.warn(`❌ WS auth failed for ${client.id}:`, err.message);
            client.disconnect();
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        // Clean up rate limit tracking
        this.rateLimits.delete(client.id);

        if (client.user) {
            try {
                // Fetch channels to notify neighbors
                const channels = await this.prisma.channelMember.findMany({
                    where: { userId: client.user.sub },
                    select: { channelId: true },
                });

                const rooms = channels.map(c => `channel:${c.channelId}`);

                if (rooms.length > 0) {
                    this.server.to(rooms).to('admin-global').emit('user:offline', { userId: client.user.sub });
                } else {
                    this.server.to('admin-global').emit('user:offline', { userId: client.user.sub });
                }

                this.logger.log(`🔴 ${client.user.email} disconnected`);
            } catch (error) {
                this.logger.error('Error during disconnect:', error.message);
            }
        }
    }

    /**
     * Check rate limit for a socket event
     */
    private checkRateLimit(socketId: string, event: string): boolean {
        const limits = this.rateLimits.get(socketId);
        if (!limits) return false;

        const config = this.RATE_LIMITS[event];
        if (!config) return true; // No limit defined, allow

        const now = Date.now();
        const entry = limits.get(event);

        if (!entry || now > entry.resetTime) {
            // First request or window expired
            limits.set(event, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            return true;
        }

        if (entry.count >= config.max) {
            return false; // Rate limit exceeded
        }

        entry.count++;
        return true;
    }

    @UseGuards(WsRateLimitGuard)
    @SubscribeMessage('message:send')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleSendMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsSendMessageDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        // Additional per-socket rate limiting as backup
        if (!this.checkRateLimit(client.id, 'message:send')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        try {
            const message = await this.messagingService.sendMessage(
                data.channelId,
                client.user.sub,
                { content: data.content, replyTo: data.replyTo },
            );

            this.server.to(`channel:${data.channelId}`).emit('message:new', message);
            return { success: true, message };
        } catch (err) {
            this.logger.error('Error sending message:', err.message);
            return { success: false, error: err.message };
        }
    }

    @UseGuards(WsRateLimitGuard)
    @SubscribeMessage('message:edit')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleEditMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsEditMessageDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        if (!this.checkRateLimit(client.id, 'message:edit')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        try {
            const message = await this.messagingService.editMessage(
                data.messageId,
                client.user.sub,
                data.content,
            );

            // Emit with type field for frontend compatibility
            this.server.to(`channel:${message.channelId}`).emit('message:updated', {
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

    @UseGuards(WsRateLimitGuard)
    @SubscribeMessage('message:delete')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleDeleteMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsDeleteMessageDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        if (!this.checkRateLimit(client.id, 'message:delete')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
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
            this.server
                .to(`channel:${original.channelId}`)
                .emit('message:deleted', {
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

    @SubscribeMessage('typing:start')
    async handleTypingStart(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { channelId: string },
    ) {
        if (!client.user) return;

        if (!this.checkRateLimit(client.id, 'typing:start')) {
            return;
        }

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

        // Persist to database for cross-instance sync (TODO: implement in messaging service)
        // await this.messagingService.startTyping(data.channelId, client.user.sub);

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

    @SubscribeMessage('typing:stop')
    async handleTypingStop(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { channelId: string },
    ) {
        if (!client.user) return;

        if (!this.checkRateLimit(client.id, 'typing:stop')) {
            return;
        }

        const userName = client.user.email?.split('@')[0] || 'Someone';

        // Remove typing indicator
        await this.typingService.stopTyping(data.channelId, client.user.sub);
        // await this.messagingService.stopTyping(data.channelId, client.user.sub);

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

    @SubscribeMessage('typing:get')
    async handleGetTypingUsers(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { channelId: string },
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

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

    @SubscribeMessage('message:read')
    async handleMessageRead(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { messageId: string; channelId: string },
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        try {
            // Persist the read receipt to the database
            await this.prisma.messageRead.upsert({
                where: {
                    messageId_userId: {
                        messageId: data.messageId,
                        userId: client.user!.sub,
                    },
                },
                create: {
                    messageId: data.messageId,
                    userId: client.user!.sub,
                    readAt: new Date(),
                },
                update: { readAt: new Date() },
            });

            // Broadcast to channel members
            this.server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                messageId: data.messageId,
                channelId: data.channelId,
                readBy: { userId: client.user!.sub, readAt: new Date() },
            });

            return { success: true };
        } catch (err) {
            this.logger.error('Error marking message as read:', err.message);
            return { success: false, error: err.message };
        }
    }

    @SubscribeMessage('message:read_bulk')
    async handleMessagesReadBulk(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { messageIds: string[]; channelId: string },
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        try {
            const now = new Date();
            // Persist all read receipts in a single transaction
            await this.prisma.$transaction(
                data.messageIds.map((messageId) =>
                    this.prisma.messageRead.upsert({
                        where: { messageId_userId: { messageId, userId: client.user!.sub } },
                        create: { messageId, userId: client.user!.sub, readAt: now },
                        update: { readAt: now },
                    }),
                ),
            );

            // Broadcast read receipts to channel members
            for (const messageId of data.messageIds) {
                this.server.to(`channel:${data.channelId}`).emit('message:read_receipt', {
                    messageId,
                    channelId: data.channelId,
                    readBy: { userId: client.user!.sub, readAt: now },
                });
            }

            return { success: true, count: data.messageIds.length };
        } catch (err) {
            this.logger.error('Error marking messages as read:', err.message);
            return { success: false, error: err.message };
        }
    }

    @SubscribeMessage('channel:join')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleJoinChannel(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsJoinChannelDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        if (!this.checkRateLimit(client.id, 'channel:join')) {
            return { success: false, error: 'Rate limit exceeded' };
        }

        // Verify the user is actually a member of this channel
        const membership = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId: data.channelId,
                    userId: client.user.sub,
                },
            },
        });

        if (!membership || membership.isBanned) {
            return { success: false, error: 'Not a member of this channel' };
        }

        client.join(`channel:${data.channelId}`);
        return { success: true };
    }

    @UseGuards(WsRateLimitGuard)
    @SubscribeMessage('reaction:add')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleAddReaction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReactionDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        if (!this.checkRateLimit(client.id, 'reaction:add')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
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
                this.server.to(`channel:${message.channelId}`).emit('message:reaction_added', {
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

    @UseGuards(WsRateLimitGuard)
    @SubscribeMessage('reaction:remove')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleRemoveReaction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReactionDto,
    ) {
        if (!client.user) return { success: false, error: 'Not authenticated' };

        if (!this.checkRateLimit(client.id, 'reaction:remove')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
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
                this.server.to(`channel:${message.channelId}`).emit('message:reaction_removed', {
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

    // ─── Methods called from controllers ────────────────────

    emitToChannel(channelId: string, event: string, data: any) {
        this.server.to(`channel:${channelId}`).emit(event, data);
    }

    getOnlineUsers(): string[] {
        // Note: With Redis adapter, this returns users connected to this instance only
        // For cluster-wide online users, use Redis pub/sub
        return Array.from(this.server.sockets.sockets.keys());
    }
}
