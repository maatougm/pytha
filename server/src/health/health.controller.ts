import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResponse } from './health.interface';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);
    private readonly startTime = Date.now();

    constructor(private prisma: PrismaService) {}

    @Get()
    @ApiOperation({ summary: 'Check API health status' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    @ApiResponse({ status: 503, description: 'Service is unhealthy' })
    async check(): Promise<HealthCheckResponse> {
        const checks: HealthCheckResponse['checks'] = {};
        let status: 'ok' | 'degraded' | 'error' = 'ok';

        // Check database connectivity
        try {
            const dbStart = Date.now();
            await this.prisma.$queryRaw`SELECT 1`;
            checks.database = {
                status: 'ok',
                responseTime: Date.now() - dbStart,
            };
        } catch (error) {
            this.logger.error('Database health check failed:', error.message);
            checks.database = {
                status: 'error',
                message: 'Database connection failed',
            };
            status = 'error';
        }

        // Check memory usage
        const memUsage = process.memoryUsage();
        const maxMemory = 2 * 1024 * 1024 * 1024; // 2GB threshold
        if (memUsage.heapUsed > maxMemory * 0.9) {
            checks.memory = {
                status: 'warning',
                message: `Memory usage is high: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            };
            if (status === 'ok') status = 'degraded';
        } else {
            checks.memory = {
                status: 'ok',
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
            };
        }

        const response: HealthCheckResponse = {
            status,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            version: process.env.npm_package_version || '1.0.0',
            checks,
        };

        return response;
    }

    @Get('ready')
    @ApiOperation({ summary: 'Check if service is ready to accept traffic' })
    async readiness(): Promise<{ ready: boolean }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { ready: true };
        } catch {
            return { ready: false };
        }
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    liveness(): { alive: boolean } {
        return { alive: true };
    }
}
