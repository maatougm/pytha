import { Module, Global } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * Metrics Module
 * 
 * Provides Prometheus metrics collection and exposure:
 * - HTTP request duration histogram
 * - Message sent counter
 * - Active users gauge
 * - WebSocket connections gauge
 */
@Global()
@Module({
    imports: [
        PrometheusModule.register({
            path: '/metrics',
            defaultMetrics: {
                enabled: true,
            },
        }),
    ],
    controllers: [MetricsController],
    providers: [MetricsService],
    exports: [MetricsService],
})
export class MetricsModule { }
