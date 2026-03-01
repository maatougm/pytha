/**
 * Performance Interceptor
 * 
 * Tracks request performance metrics including:
 * - Response time
 * - Database query count
 * - Cache hit/miss
 * - Memory usage
 * 
 * Integrates with Prometheus metrics for monitoring
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { performance } from 'perf_hooks';
import { MetricsService } from '../../metrics/metrics.service';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  memoryDelta: number;
  timestamp: Date;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second
  private readonly excessiveQueryThreshold = 20; // queries per request

  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    // Attach request tracking to the request object
    request.performanceMetrics = {
      requestId,
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(
            request,
            response,
            startTime,
            startMemory,
            requestId,
          );
        },
        error: (error) => {
          this.recordMetrics(
            request,
            response,
            startTime,
            startMemory,
            requestId,
            error,
          );
        },
      }),
    );
  }

  private recordMetrics(
    request: any,
    response: any,
    startTime: number,
    startMemory: NodeJS.MemoryUsage,
    requestId: string,
    error?: Error,
  ): void {
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage();
    const statusCode = error ? ((error as any).status || 500) : (response.statusCode || 200);
    const method = request.method;
    const path = request.route?.path || request.url;

    const metrics: PerformanceMetrics = {
      requestId,
      method,
      path,
      statusCode,
      duration,
      queryCount: request.performanceMetrics?.queryCount || 0,
      cacheHits: request.performanceMetrics?.cacheHits || 0,
      cacheMisses: request.performanceMetrics?.cacheMisses || 0,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      timestamp: new Date(),
    };

    // Record Prometheus metrics
    this.metricsService.recordHttpRequest(method, path, statusCode, duration / 1000);

    // Log slow requests
    if (duration > this.slowRequestThreshold) {
      this.logger.warn(
        `Slow request detected: ${method} ${path} - ${duration.toFixed(2)}ms (Request ID: ${requestId})`,
      );
    }

    // Log excessive database queries
    if (metrics.queryCount > this.excessiveQueryThreshold) {
      this.logger.warn(
        `Excessive queries detected: ${metrics.queryCount} queries in ${method} ${path} (Request ID: ${requestId})`,
      );
    }

    // Log performance metrics in debug mode
    this.logger.debug({
      message: 'Request performance metrics',
      ...metrics,
    });

    // Store metrics for potential analysis
    this.storeMetrics(metrics);
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeMetrics(metrics: PerformanceMetrics): void {
    // In production, these could be sent to a time-series database
    // or stored for periodic analysis
    // For now, we just keep the last 1000 metrics in memory
    PerformanceMetricsStore.add(metrics);
  }
}

/**
 * In-memory store for recent performance metrics
 * Used for real-time analysis and debugging
 */
export class PerformanceMetricsStore {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly maxSize = 1000;

  static add(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  static getRecent(count: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  static getSlowRequests(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  static getAverageResponseTime(path?: string, duration: number = 60000): number {
    const cutoff = Date.now() - duration;
    const relevant = this.metrics.filter(
      m => m.timestamp.getTime() > cutoff && (!path || m.path === path),
    );
    
    if (relevant.length === 0) return 0;
    
    return relevant.reduce((sum, m) => sum + m.duration, 0) / relevant.length;
  }

  static getPercentileResponseTime(
    percentile: number,
    path?: string,
    duration: number = 60000,
  ): number {
    const cutoff = Date.now() - duration;
    const relevant = this.metrics
      .filter(m => m.timestamp.getTime() > cutoff && (!path || m.path === path))
      .map(m => m.duration)
      .sort((a, b) => a - b);
    
    if (relevant.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * relevant.length) - 1;
    return relevant[Math.max(0, index)];
  }

  static getTopSlowPaths(limit: number = 10, duration: number = 60000): Array<{ path: string; avgDuration: number }> {
    const cutoff = Date.now() - duration;
    const pathMetrics = new Map<string, number[]>();

    this.metrics
      .filter(m => m.timestamp.getTime() > cutoff)
      .forEach(m => {
        const existing = pathMetrics.get(m.path) || [];
        existing.push(m.duration);
        pathMetrics.set(m.path, existing);
      });

    return Array.from(pathMetrics.entries())
      .map(([path, durations]) => ({
        path,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  static getCacheHitRate(duration: number = 60000): number {
    const cutoff = Date.now() - duration;
    const relevant = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (relevant.length === 0) return 0;
    
    const totalCacheOps = relevant.reduce(
      (sum, m) => sum + m.cacheHits + m.cacheMisses,
      0,
    );
    
    if (totalCacheOps === 0) return 0;
    
    const totalHits = relevant.reduce((sum, m) => sum + m.cacheHits, 0);
    return totalHits / totalCacheOps;
  }

  static clear(): void {
    this.metrics = [];
  }
}

/**
 * Decorator to track query count for N+1 detection
 */
export function TrackQuery(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const request = args[0]?.req || args[0]?.request;
    
    if (request?.performanceMetrics) {
      request.performanceMetrics.queryCount++;
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/**
 * Decorator to track cache operations
 */
export function TrackCache(operation: 'hit' | 'miss') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0]?.req || args[0]?.request;
      
      if (request?.performanceMetrics) {
        if (operation === 'hit') {
          request.performanceMetrics.cacheHits++;
        } else {
          request.performanceMetrics.cacheMisses++;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
