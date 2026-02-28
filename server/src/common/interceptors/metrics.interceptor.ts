import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { MetricsService } from '../../metrics/metrics.service';

/**
 * Metrics Interceptor
 * 
 * Automatically records HTTP request metrics:
 * - Request duration
 * - Response status codes
 * - Request counts by method and route
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(MetricsInterceptor.name);

    constructor(private readonly metricsService: MetricsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse<Response>();

        const method = request.method;
        // Get route pattern if available, otherwise use path
        const route = this.getRoutePattern(request) || request.path || 'unknown';

        return next.handle().pipe(
            tap({
                next: () => {
                    this.recordMetrics(method, route, response.statusCode, start);
                },
                error: (error) => {
                    const statusCode = error.status || 500;
                    this.recordMetrics(method, route, statusCode, start);
                    // Record error in metrics
                    this.metricsService.recordError(
                        error.name || 'UnknownError',
                        `${method} ${route}`
                    );
                },
            })
        );
    }

    /**
     * Get the route pattern from the request
     * This provides cleaner metrics by using the route pattern instead of specific IDs
     */
    private getRoutePattern(request: any): string | undefined {
        // Try to get the route pattern from various sources
        if (request.route?.path) {
            return request.route.path;
        }

        // Fallback: construct from baseUrl and path
        const baseUrl = request.baseUrl || '';
        const path = request.path || '';

        if (baseUrl && path) {
            // Normalize IDs in path to reduce cardinality
            const normalizedPath = this.normalizePath(path);
            return `${baseUrl}${normalizedPath}`;
        }

        return undefined;
    }

    /**
     * Normalize path to reduce metric cardinality
     * Replace IDs and UUIDs with placeholders
     */
    private normalizePath(path: string): string {
        // Replace UUIDs
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        let normalized = path.replace(uuidRegex, ':id');

        // Replace numeric IDs (but not in API version numbers like /api/v1/)
        const numericIdRegex = /\/\d+(?=\/|$)/g;
        normalized = normalized.replace(numericIdRegex, '/:id');

        return normalized;
    }

    /**
     * Record metrics for the request
     */
    private recordMetrics(
        method: string,
        route: string,
        statusCode: number,
        startTime: number
    ): void {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds

        try {
            this.metricsService.recordHttpRequest(method, route, statusCode, duration);

            // Log slow requests (over 1 second)
            if (duration > 1) {
                this.logger.warn(
                    `Slow request detected: ${method} ${route} took ${duration.toFixed(3)}s`
                );
            }
        } catch (error) {
            // Don't let metrics recording break the request
            this.logger.error(`Failed to record metrics: ${error.message}`);
        }
    }
}
