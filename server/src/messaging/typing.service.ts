import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisClientType } from 'redis';

export interface TypingUser {
    userId: string;
    userName: string;
    startedAt: number;
}

@Injectable()
export class TypingService implements OnModuleDestroy {
    private readonly logger = new Logger(TypingService.name);
    private readonly TYPING_TTL_SECONDS = 5; // Auto-expire after 5 seconds
    private readonly TYPING_PREFIX = 'typing:';
    private cleanupInterval: NodeJS.Timeout;

    // In-memory fallback when Redis is not available
    private memoryTypingStore = new Map<string, Map<string, TypingUser>>();

    constructor(
        @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
        private readonly configService: ConfigService,
    ) {
        // Start periodic cleanup for memory fallback
        this.cleanupInterval = setInterval(() => this.cleanupExpiredTyping(), 10000);
    }

    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    /**
     * Generate Redis key for typing indicators in a channel
     */
    private getTypingKey(channelId: string): string {
        return `${this.TYPING_PREFIX}${channelId}`;
    }

    /**
     * Check if Redis is available
     */
    private isRedisAvailable(): boolean {
        return this.redisClient?.isReady || false;
    }

    /**
     * Record that a user started typing in a channel
     */
    async startTyping(channelId: string, userId: string, userName: string): Promise<void> {
        const key = this.getTypingKey(channelId);
        const typingData: TypingUser = {
            userId,
            userName,
            startedAt: Date.now(),
        };

        try {
            if (this.isRedisAvailable()) {
                // Use Redis Hash to store typing users with expiration
                await this.redisClient.hSet(key, userId, JSON.stringify(typingData));
                // Set expiration on the hash key
                await this.redisClient.expire(key, this.TYPING_TTL_SECONDS);
            } else {
                // Fallback to in-memory storage
                if (!this.memoryTypingStore.has(channelId)) {
                    this.memoryTypingStore.set(channelId, new Map());
                }
                this.memoryTypingStore.get(channelId)!.set(userId, typingData);
            }
        } catch (error) {
            this.logger.error(`Error recording typing start for user ${userId}:`, error.message);
            // Fallback to memory on Redis error
            if (!this.memoryTypingStore.has(channelId)) {
                this.memoryTypingStore.set(channelId, new Map());
            }
            this.memoryTypingStore.get(channelId)!.set(userId, typingData);
        }
    }

    /**
     * Remove typing indicator when user stops typing
     */
    async stopTyping(channelId: string, userId: string): Promise<void> {
        const key = this.getTypingKey(channelId);

        try {
            if (this.isRedisAvailable()) {
                await this.redisClient.hDel(key, userId);
            }

            // Also clean up from memory fallback
            const channelTyping = this.memoryTypingStore.get(channelId);
            if (channelTyping) {
                channelTyping.delete(userId);
                if (channelTyping.size === 0) {
                    this.memoryTypingStore.delete(channelId);
                }
            }
        } catch (error) {
            this.logger.error(`Error recording typing stop for user ${userId}:`, error.message);
        }
    }

    /**
     * Get list of users currently typing in a channel (excluding the requesting user)
     */
    async getTypingUsers(channelId: string, excludeUserId?: string): Promise<TypingUser[]> {
        const key = this.getTypingKey(channelId);
        const now = Date.now();
        const validTypingUsers: TypingUser[] = [];

        try {
            if (this.isRedisAvailable()) {
                // Get all typing users from Redis
                const typingData = await this.redisClient.hGetAll(key);

                for (const [userId, dataStr] of Object.entries(typingData)) {
                    if (userId === excludeUserId) continue;

                    try {
                        const data: TypingUser = JSON.parse(dataStr);
                        // Check if still valid (within TTL)
                        if (now - data.startedAt < this.TYPING_TTL_SECONDS * 1000) {
                            validTypingUsers.push(data);
                        }
                    } catch (e) {
                        // Invalid data, skip
                    }
                }
            }

            // Also check memory fallback (for users tracked in-memory)
            const memoryChannel = this.memoryTypingStore.get(channelId);
            if (memoryChannel) {
                for (const [userId, data] of memoryChannel.entries()) {
                    if (userId === excludeUserId) continue;

                    // Check if already added from Redis and if still valid
                    if (!validTypingUsers.find(u => u.userId === userId) &&
                        now - data.startedAt < this.TYPING_TTL_SECONDS * 1000) {
                        validTypingUsers.push(data);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error getting typing users for channel ${channelId}:`, error.message);
        }

        return validTypingUsers;
    }

    /**
     * Clean up expired typing indicators from memory fallback
     */
    private cleanupExpiredTyping(): void {
        const now = Date.now();

        for (const [channelId, users] of this.memoryTypingStore.entries()) {
            for (const [userId, data] of users.entries()) {
                if (now - data.startedAt > this.TYPING_TTL_SECONDS * 1000) {
                    users.delete(userId);
                }
            }

            if (users.size === 0) {
                this.memoryTypingStore.delete(channelId);
            }
        }
    }

    /**
     * Debounce typing events - check if we should process a new typing event
     * Returns true if the event should be processed (debounce window passed)
     */
    async shouldProcessTypingEvent(channelId: string, userId: string, debounceMs: number = 2000): Promise<boolean> {
        const key = `typing:debounce:${channelId}:${userId}`;

        try {
            if (this.isRedisAvailable()) {
                // Try to set a temporary key with NX (only if not exists)
                const result = await this.redisClient.set(key, '1', {
                    NX: true,
                    EX: Math.ceil(debounceMs / 1000),
                });
                return result === 'OK';
            } else {
                // In-memory debounce
                const debounceKey = `${channelId}:${userId}`;
                const lastTyped = this.getMemoryDebounce(debounceKey);
                const now = Date.now();

                if (!lastTyped || now - lastTyped > debounceMs) {
                    this.setMemoryDebounce(debounceKey, now);
                    return true;
                }
                return false;
            }
        } catch (error) {
            // On error, allow the event through
            return true;
        }
    }

    // In-memory debounce tracking
    private memoryDebounceStore = new Map<string, number>();

    private getMemoryDebounce(key: string): number | undefined {
        return this.memoryDebounceStore.get(key);
    }

    private setMemoryDebounce(key: string, timestamp: number): void {
        this.memoryDebounceStore.set(key, timestamp);
        // Clean up old entries periodically
        if (this.memoryDebounceStore.size > 1000) {
            const now = Date.now();
            for (const [k, v] of this.memoryDebounceStore.entries()) {
                if (now - v > 10000) {
                    this.memoryDebounceStore.delete(k);
                }
            }
        }
    }
}
