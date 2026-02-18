import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries, continuing without cache');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.isAvailable = true;
        this.logger.log('Redis connection established');
      });

      this.client.on('error', (err) => {
        this.isAvailable = false;
        this.logger.warn(`Redis error: ${err.message}`);
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      this.logger.warn(`Redis not available, analytics will work without caching: ${error.message}`);
      this.isAvailable = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Silently fail - cache is not critical
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  async flushdb(): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      await this.client.flushdb();
    } catch {
      // Silently fail
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.isAvailable;
  }
}
