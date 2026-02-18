import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

interface RateLimitConfig {
  interval: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests allowed in the interval
}

interface UserRateLimit {
  requests: number[];  // Timestamps of requests
}

@Injectable()
export class WsRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(WsRateLimitGuard.name);
  private readonly userLimits = new Map<string, UserRateLimit>();
  private readonly cleanupInterval: NodeJS.Timeout;

  // Rate limits for different event types (requests per minute)
  private readonly rateLimits: Record<string, RateLimitConfig> = {
    'message:send': { interval: 60000, maxRequests: 30 },        // 30 messages per minute
    'message:edit': { interval: 60000, maxRequests: 20 },        // 20 edits per minute
    'message:delete': { interval: 60000, maxRequests: 10 },      // 10 deletes per minute
    'typing:start': { interval: 60000, maxRequests: 60 },        // 60 typing events per minute
    'channel:join': { interval: 60000, maxRequests: 20 },        // 20 channel joins per minute
    'default': { interval: 60000, maxRequests: 100 },            // 100 generic events per minute
  };

  constructor(private reflector: Reflector) {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const event = wsContext.getPattern();
    const userId = client.user?.sub;

    if (!userId) {
      this.logger.warn(`Rate limit check failed: no user ID for event ${event}`);
      return false;
    }

    const config = this.rateLimits[event] || this.rateLimits['default'];
    const now = Date.now();

    // Get or create user rate limit entry
    let userLimit = this.userLimits.get(userId);
    if (!userLimit) {
      userLimit = { requests: [] };
      this.userLimits.set(userId, userLimit);
    }

    // Remove old requests outside the time window
    const windowStart = now - config.interval;
    userLimit.requests = userLimit.requests.filter(timestamp => timestamp > windowStart);

    // Check if user has exceeded the limit
    if (userLimit.requests.length >= config.maxRequests) {
      const oldestRequest = userLimit.requests[0];
      const retryAfter = Math.ceil((oldestRequest + config.interval - now) / 1000);
      
      this.logger.warn(`Rate limit exceeded for user ${userId} on event ${event}. Retry after ${retryAfter}s`);
      
      // Send rate limit error to client
      if (client.emit) {
        client.emit('error:rate-limit', {
          event,
          retryAfter,
          limit: config.maxRequests,
          window: config.interval,
          message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
        });
      }
      
      return false;
    }

    // Add current request timestamp
    userLimit.requests.push(now);
    
    return true;
  }

  /**
   * Get current rate limit status for a user
   */
  getRateLimitStatus(userId: string, event: string = 'default'): {
    remaining: number;
    limit: number;
    resetAt: number;
    window: number;
  } {
    const config = this.rateLimits[event] || this.rateLimits['default'];
    const userLimit = this.userLimits.get(userId);
    const now = Date.now();
    
    if (!userLimit) {
      return {
        remaining: config.maxRequests,
        limit: config.maxRequests,
        resetAt: now + config.interval,
        window: config.interval,
      };
    }

    const windowStart = now - config.interval;
    const requestsInWindow = userLimit.requests.filter(timestamp => timestamp > windowStart);
    const oldestRequest = requestsInWindow[0] || now;
    
    return {
      remaining: Math.max(0, config.maxRequests - requestsInWindow.length),
      limit: config.maxRequests,
      resetAt: oldestRequest + config.interval,
      window: config.interval,
    };
  }

  /**
   * Clean up old rate limit entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const maxInterval = Math.max(...Object.values(this.rateLimits).map(c => c.interval));
    const cutoff = now - maxInterval * 2; // Keep entries for 2x the longest interval

    let cleanedCount = 0;
    for (const [userId, userLimit] of this.userLimits.entries()) {
      // Remove old requests
      userLimit.requests = userLimit.requests.filter(timestamp => timestamp > cutoff);
      
      // Remove user entry if no recent requests
      if (userLimit.requests.length === 0) {
        this.userLimits.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} inactive rate limit entries`);
    }
  }

  /**
   * Manually reset rate limit for a user (useful for admin actions)
   */
  resetRateLimit(userId: string): void {
    this.userLimits.delete(userId);
    this.logger.log(`Rate limit reset for user ${userId}`);
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    trackedUsers: number;
    totalRequests: number;
    events: Record<string, { limit: number; window: number }>;
  } {
    let totalRequests = 0;
    for (const userLimit of this.userLimits.values()) {
      totalRequests += userLimit.requests.length;
    }

    return {
      trackedUsers: this.userLimits.size,
      totalRequests,
      events: Object.entries(this.rateLimits).reduce((acc, [key, config]) => {
        acc[key] = { limit: config.maxRequests, window: config.interval };
        return acc;
      }, {}),
    };
  }

  /**
   * Cleanup on application shutdown
   */
  onApplicationShutdown() {
    clearInterval(this.cleanupInterval);
    this.userLimits.clear();
  }
}
