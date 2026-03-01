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
import { PrismaService } from '../prisma/prisma.service';
import { WsRateLimitGuard } from '../common/guards/ws-rate-limit.guard';
import { ChannelMembershipGuard } from './guards/channel-membership.guard';
import { RedisService } from '../common/redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';
import {
    MessageHandler,
    ReactionHandler,
    TypingHandler,
    ChannelHandler,
} from './handlers';
import {
    WsSendMessageDto,
    WsEditMessageDto,
    WsDeleteMessageDto,
    WsJoinChannelDto,
    WsReactionDto,
    WsReadReceiptDto,
    WsReadBulkDto,
    WsGetTypingDto,
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
            const isLocalhost = origin && /^http:\/\/localhost:\d+$/.test(origin);
            if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
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
        private prisma: PrismaService,
        private messageHandler: MessageHandler,
        private reactionHandler: ReactionHandler,
        private typingHandler: TypingHandler,
        private channelHandler: ChannelHandler,
        private metricsService: MetricsService,
        private redisService: RedisService,
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

            (server.adapter as any) = createAdapter(this.pubClient, this.subClient);
            this.logger.log('✅ Redis adapter configured for WebSocket scaling');
        } catch (error) {
            this.logger.warn('⚠️ Redis adapter not configured - WebSocket scaling will be limited:', error.message);
        }
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token as string;

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

            // Check if token is in denylist
            const jti = payload.jti;
            if (jti) {
                const isDenied = await this.redisService.get(`denylist:${jti}`);
                if (isDenied) {
                    this.logger.warn(`Denied token attempted WebSocket connection: ${jti}`);
                    client.disconnect();
                    return;
                }
            }

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

            // Record metrics
            this.metricsService.recordWsConnection(payload.sub);
            const primaryRole = payload.roles[0] || 'unknown';
            this.metricsService.recordWsEvent('connection');

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

                // Record metrics
                this.metricsService.recordWsDisconnection(client.user.sub);
                this.metricsService.recordWsEvent('disconnection');

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

    // ═══════════════════════════════════════════════════════════════
    // Message Handlers
    // ═══════════════════════════════════════════════════════════════

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('message:send')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleSendMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsSendMessageDto,
    ) {
        // Additional per-socket rate limiting as backup
        if (!this.checkRateLimit(client.id, 'message:send')) {
            this.metricsService.recordRateLimit('message:send', client.user?.roles?.[0] || 'unknown');
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        // Record metrics
        const result = await this.messageHandler.handleSendMessage(this.server, client, data);
        if (result.success) {
            const senderRole = client.user?.roles?.[0] || 'unknown';
            this.metricsService.recordMessageSent(data.channelId ? 'channel' : 'direct', senderRole);
            this.metricsService.recordWsEvent('message:send');
        }
        return result;
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('message:edit')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleEditMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsEditMessageDto,
    ) {
        if (!this.checkRateLimit(client.id, 'message:edit')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        return this.messageHandler.handleEditMessage(this.server, client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('message:delete')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleDeleteMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsDeleteMessageDto,
    ) {
        if (!this.checkRateLimit(client.id, 'message:delete')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        return this.messageHandler.handleDeleteMessage(this.server, client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('message:read')
    async handleMessageRead(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReadReceiptDto,
    ) {
        return this.messageHandler.handleMessageRead(this.server, client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('message:read_bulk')
    async handleMessagesReadBulk(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReadBulkDto,
    ) {
        return this.messageHandler.handleMessagesReadBulk(this.server, client, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // Typing Handlers
    // ═══════════════════════════════════════════════════════════════

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('typing:start')
    async handleTypingStart(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { channelId: string },
    ) {
        if (!this.checkRateLimit(client.id, 'typing:start')) {
            return;
        }

        return this.typingHandler.handleTypingStart(client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('typing:stop')
    async handleTypingStop(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { channelId: string },
    ) {
        if (!this.checkRateLimit(client.id, 'typing:stop')) {
            return;
        }

        return this.typingHandler.handleTypingStop(client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('typing:get')
    async handleGetTypingUsers(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsGetTypingDto,
    ) {
        return this.typingHandler.handleGetTypingUsers(client, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // Channel Handlers
    // ═══════════════════════════════════════════════════════════════

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('channel:join')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleJoinChannel(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsJoinChannelDto,
    ) {
        if (!this.checkRateLimit(client.id, 'channel:join')) {
            return { success: false, error: 'Rate limit exceeded' };
        }

        return this.channelHandler.handleJoinChannel(client, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // Reaction Handlers
    // ═══════════════════════════════════════════════════════════════

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('reaction:add')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleAddReaction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReactionDto,
    ) {
        if (!this.checkRateLimit(client.id, 'reaction:add')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        return this.reactionHandler.handleAddReaction(this.server, client, data);
    }

    @UseGuards(WsRateLimitGuard, ChannelMembershipGuard)
    @SubscribeMessage('reaction:remove')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async handleRemoveReaction(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: WsReactionDto,
    ) {
        if (!this.checkRateLimit(client.id, 'reaction:remove')) {
            return { success: false, error: 'Rate limit exceeded. Please slow down.' };
        }

        return this.reactionHandler.handleRemoveReaction(this.server, client, data);
    }

    // ═══════════════════════════════════════════════════════════════
    // Public Methods (called from controllers)
    // ═══════════════════════════════════════════════════════════════

    emitToChannel(channelId: string, event: string, data: any) {
        this.server.to(`channel:${channelId}`).emit(event, data);
    }

    getOnlineUsers(): string[] {
        // Note: With Redis adapter, this returns users connected to this instance only
        // For cluster-wide online users, use Redis pub/sub
        return Array.from(this.server.sockets.sockets.keys());
    }
}
