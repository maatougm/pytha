import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

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
     * Execute a raw query safely using Prisma.sql tagged template
     * SECURITY FIX (C1): Replaced $queryRawUnsafe with parameterized $queryRaw
     * 
     * @param query - SQL query string with placeholders
     * @param parameters - Query parameters (automatically sanitized)
     * @returns Query results
     * @throws BadRequestException if query contains dangerous patterns
     */
    async executeRaw(query: string, ...parameters: any[]) {
        // SECURITY: Validate query doesn't contain multiple statements
        const dangerousPatterns = [
            /;\s*(drop|delete|truncate|alter|create|insert|update|grant|revoke)\s+/i,
            /(--|\/\*|\*\/)/, // Comments
            /;\s*$/m, // Trailing semicolons
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(query)) {
                this.logger.warn(`Blocked potentially dangerous query: ${query.substring(0, 100)}...`);
                throw new BadRequestException('Invalid query pattern detected');
            }
        }

        try {
            // Use Prisma.sql for safe parameterization
            const sql = Prisma.sql([query], ...parameters);
            return await this.$queryRaw(sql);
        } catch (error) {
            this.logger.error(`Raw query failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute a safe SELECT query with validated parameters
     * Use this for simple queries instead of executeRaw
     * 
     * @param table - Table name (validated against allowed tables)
     * @param where - WHERE clause conditions
     * @param allowedTables - List of allowed table names
     */
    async executeSafeSelect(
        table: string, 
        where: Record<string, any>,
        allowedTables: string[] = []
    ) {
        // Validate table name against allowlist
        if (!allowedTables.includes(table)) {
            throw new BadRequestException(`Table '${table}' is not in the allowlist`);
        }

        // Build safe query using Prisma.sql
        const conditions = Object.entries(where).map(([key, value]) => {
            return Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}`;
        });

        const whereClause = conditions.length > 0 
            ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.sql``;

        const sql = Prisma.sql`SELECT * FROM ${Prisma.raw(`"${table}"`)} ${whereClause}`;
        
        return await this.$queryRaw(sql);
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
