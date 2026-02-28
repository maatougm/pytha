import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { register } from 'prom-client';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Metrics Controller
 * 
 * Exposes Prometheus metrics endpoint for scraping.
 * Also provides a human-readable dashboard for administrators.
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    /**
     * Prometheus metrics endpoint
     * Returns metrics in Prometheus exposition format
     */
    @Get()
    @ApiOperation({
        summary: 'Get Prometheus metrics',
        description: 'Returns metrics in Prometheus exposition format for scraping by Prometheus server',
    })
    async getPrometheusMetrics(@Res() res: Response) {
        const metrics = await register.metrics();
        res.set('Content-Type', register.contentType);
        res.end(metrics);
    }

    /**
     * Human-readable metrics dashboard (admin only)
     */
    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get metrics dashboard',
        description: 'Returns a human-readable JSON view of current metrics (admin only)',
    })
    async getDashboard() {
        const metrics = await register.getMetricsAsJSON();

        // Format metrics for easier reading
        const dashboard: Record<string, any> = {
            timestamp: new Date().toISOString(),
            metrics: {},
        };

        for (const metric of metrics) {
            dashboard.metrics[metric.name] = {
                help: metric.help,
                type: metric.type,
                values: metric.values.map(v => ({
                    labels: v.labels,
                    value: v.value,
                })),
            };
        }

        return dashboard;
    }

    /**
     * Get active users count (admin only)
     */
    @Get('active-users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get active users count',
        description: 'Returns current active users by role (admin only)',
    })
    async getActiveUsers() {
        return {
            timestamp: new Date().toISOString(),
            activeUsers: 'See school_active_users gauge in Prometheus metrics',
            message: 'Use /metrics endpoint for Prometheus-compatible data',
        };
    }

    /**
     * Get WebSocket connections count (admin only)
     */
    @Get('websocket-connections')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get WebSocket connections count',
        description: 'Returns current WebSocket connection count (admin only)',
    })
    async getWebsocketConnections() {
        return {
            timestamp: new Date().toISOString(),
            websocketConnections: 'See school_websocket_connections gauge in Prometheus metrics',
            message: 'Use /metrics endpoint for Prometheus-compatible data',
        };
    }
}
