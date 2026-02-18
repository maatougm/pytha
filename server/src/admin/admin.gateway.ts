import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { AdminService } from './admin.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';

interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
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
    namespace: '/admin',
})
export class AdminGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AdminGateway.name);
    private adminSockets: Map<string, AuthenticatedSocket> = new Map();
    private redisClient: RedisClientType;

    // Redis client for rate limiting (ioredis — already a project dependency)
    private rateLimitRedis: Redis;

    // Rate limit configuration
    private readonly RATE_LIMITS = {
        'dashboard:refresh': { max: 30, windowMs: 60 },
        'dashboard:subscribe': { max: 10, windowMs: 60 },
        'users:subscribe': { max: 10, windowMs: 60 },
        'moderation:subscribe': { max: 10, windowMs: 60 },
    };

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private adminService: AdminService,
    ) { }

    async afterInit(server: Server) {
        this.logger.log('Admin WebSocket Gateway initializing...');

        const redisUrl = this.configService.get<string>('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }

        // Setup Redis adapter for horizontal scaling
        try {
            this.redisClient = createClient({ url: redisUrl }) as RedisClientType;
            const pubClient = this.redisClient;
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);
            server.adapter(createAdapter(pubClient, subClient));

            this.logger.log('✅ Redis adapter configured for admin broadcasts');
        } catch (error) {
            this.logger.error('❌ Failed to configure Redis adapter:', error.message);
            throw error; // Fail fast — Redis is required for multi-instance correctness
        }

        // Separate ioredis client for rate limiting
        this.rateLimitRedis = new Redis(redisUrl);
        this.rateLimitRedis.on('error', (err) => {
            this.logger.error('Rate-limit Redis error:', err.message);
        });
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token as string;

            if (!token) {
                this.logger.warn(`Connection rejected: No token provided (${client.id})`);
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }

            const payload = this.jwtService.verify(token, { secret });

            // Only allow admin connections
            if (!payload.roles?.includes('admin')) {
                this.logger.warn(`Non-admin user ${payload.sub} tried to connect to admin namespace`);
                client.disconnect();
                return;
            }

            client.user = payload;
            this.adminSockets.set(client.id, client);

            // Send initial dashboard data
            const metrics = await this.adminService.getSystemMetrics();
            client.emit('dashboard:metrics', metrics);

            // Join admin room for broadcasts
            client.join('admin-dashboard');

            this.logger.log(`Admin ${payload.email} connected to dashboard (${client.id})`);
        } catch (err) {
            this.logger.error('Admin WS auth failed:', err.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        this.adminSockets.delete(client.id);
        if (client.user) {
            this.logger.log(`Admin ${client.user.email} disconnected from dashboard`);
        }
    }

    // ─── RATE LIMITING (Redis-backed, survives restarts and scales horizontally) ──

    private async checkRateLimit(userId: string, event: string): Promise<boolean> {
        const limits = this.RATE_LIMITS[event];
        if (!limits) return true; // No limit defined, allow

        const key = `admin:rl:${userId}:${event}`;
        try {
            const current = await this.rateLimitRedis.incr(key);
            if (current === 1) {
                // First request in this window — set expiry
                await this.rateLimitRedis.expire(key, limits.windowMs);
            }
            return current <= limits.max;
        } catch (err) {
            // If Redis is unavailable, fail open (allow the request) to avoid DoS
            this.logger.warn(`Rate limit Redis unavailable for ${event}: ${err.message}`);
            return true;
        }
    }

    // ─── CLEANUP: Remove stale disconnected sockets from the map ────────────

    @Cron(CronExpression.EVERY_MINUTE)
    cleanupDisconnectedSockets() {
        let removed = 0;
        for (const [id, socket] of this.adminSockets.entries()) {
            if (!socket.connected) {
                this.adminSockets.delete(id);
                removed++;
            }
        }
        if (removed > 0) {
            this.logger.debug(`Cleaned up ${removed} stale admin socket(s)`);
        }
    }

    // ─── CLIENT EVENTS ──────────────────────────────────────────────────

    @SubscribeMessage('dashboard:subscribe')
    async handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.user) return { error: 'Not authenticated' };

        if (!await this.checkRateLimit(client.user.sub, 'dashboard:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }

        // Send current metrics immediately
        const metrics = await this.adminService.getSystemMetrics();
        client.emit('dashboard:metrics', metrics);

        return { success: true };
    }

    @SubscribeMessage('dashboard:refresh')
    async handleRefresh(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.user) return { error: 'Not authenticated' };

        if (!await this.checkRateLimit(client.user.sub, 'dashboard:refresh')) {
            return { error: 'Rate limit exceeded. Please wait before refreshing.' };
        }

        try {
            const [metrics, realtime] = await Promise.all([
                this.adminService.getSystemMetrics(),
                this.adminService.getRealTimeStats(),
            ]);

            client.emit('dashboard:metrics', metrics);
            client.emit('dashboard:realtime', realtime);

            return { success: true };
        } catch (error) {
            this.logger.error('Failed to refresh dashboard:', error.message);
            return { error: 'Failed to refresh data' };
        }
    }

    @SubscribeMessage('users:subscribe')
    async handleUsersSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.user) return { error: 'Not authenticated' };

        if (!await this.checkRateLimit(client.user.sub, 'users:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }

        client.join('admin-users');
        return { success: true };
    }

    @SubscribeMessage('moderation:subscribe')
    async handleModerationSubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.user) return { error: 'Not authenticated' };

        if (!await this.checkRateLimit(client.user.sub, 'moderation:subscribe')) {
            return { error: 'Rate limit exceeded' };
        }

        client.join('admin-moderation');
        return { success: true };
    }

    // ─── BROADCAST METHODS ──────────────────────────────────────────────

    async broadcastMetrics() {
        try {
            const metrics = await this.adminService.getSystemMetrics();
            this.server.to('admin-dashboard').emit('dashboard:metrics', metrics);
        } catch (error) {
            this.logger.error('Failed to broadcast metrics:', error.message);
        }
    }

    async broadcastRealTimeStats() {
        try {
            const stats = await this.adminService.getRealTimeStats();
            this.server.to('admin-dashboard').emit('dashboard:realtime', stats);
        } catch (error) {
            this.logger.error('Failed to broadcast realtime stats:', error.message);
        }
    }

    broadcastNewUser(user: any) {
        this.server.to('admin-dashboard').emit('user:new', {
            user,
            timestamp: new Date().toISOString(),
        });
    }

    broadcastUserStatusChange(userId: string, status: string, actorId: string) {
        this.server.to('admin-dashboard').emit('user:status-change', {
            userId,
            status,
            actorId,
            timestamp: new Date().toISOString(),
        });
    }

    broadcastNewMessage(message: any) {
        this.server.to('admin-moderation').emit('message:new', {
            message,
            timestamp: new Date().toISOString(),
        });
    }

    broadcastFlaggedContent(content: any) {
        this.server.to('admin-moderation').emit('content:flagged', {
            content,
            timestamp: new Date().toISOString(),
        });
    }

    broadcastSystemAlert(alert: { type: string; message: string; severity: 'info' | 'warning' | 'error' }) {
        this.server.to('admin-dashboard').emit('system:alert', {
            ...alert,
            timestamp: new Date().toISOString(),
        });
    }

    // ─── SCHEDULED BROADCASTS ───────────────────────────────────────────

    @Cron(CronExpression.EVERY_30_SECONDS)
    async scheduledRealTimeUpdate() {
        if (this.adminSockets.size > 0) {
            await this.broadcastRealTimeStats();
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async scheduledMetricsUpdate() {
        if (this.adminSockets.size > 0) {
            await this.broadcastMetrics();
        }
    }

    // ─── UTILITY ────────────────────────────────────────────────────────

    getConnectedAdminCount(): number {
        return this.adminSockets.size;
    }

    getConnectedAdmins(): Array<{ id: string; email: string }> {
        return Array.from(this.adminSockets.values()).map(socket => ({
            id: socket.user!.sub,
            email: socket.user!.email,
        }));
    }
}
