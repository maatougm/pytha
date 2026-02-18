import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        // Configure connection pooling for production
        const databaseUrl = process.env.DATABASE_URL;
        
        super({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
            // Log queries in development
            log: process.env.NODE_ENV === 'development' 
                ? ['query', 'info', 'warn', 'error']
                : ['error', 'warn'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected');
        
        // Log connection pool info
        if (process.env.NODE_ENV !== 'production') {
            this.logger.log('Database URL configured (redacted)');
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }

    /**
     * Execute a raw query with error handling
     */
    async executeRaw(query: string, ...parameters: any[]) {
        try {
            return await this.$queryRawUnsafe(query, ...parameters);
        } catch (error) {
            this.logger.error(`Raw query failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Health check query
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }
}
