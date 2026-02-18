import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { sanitizeLogData } from '../logger/winston.config';

interface RequestWithUser extends Request {
    user?: {
        sub: string;
        email: string;
        roles: string[];
    };
    requestId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const { method, url, body, query, user } = request;
        const now = Date.now();

        // Generate a unique request ID if not already set
        const requestId = request.requestId || this.generateRequestId();
        request.requestId = requestId;

        // Sanitize body to remove sensitive fields
        const sanitizedBody = sanitizeLogData(body);
        const sanitizedQuery = sanitizeLogData(query);

        // Create a child logger with request context
        const requestLogger = this.logger.child({
            requestId,
            userId: user?.sub || 'anonymous',
            userEmail: user?.email,
            userRoles: user?.roles,
        });

        // Log incoming request
        requestLogger.debug('Incoming request', {
            method,
            url,
            query: sanitizedQuery,
            body: process.env.NODE_ENV === 'development' ? sanitizedBody : undefined,
        });

        return next.handle().pipe(
            tap({
                next: (responseBody) => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    const delay = Date.now() - now;

                    const logData = {
                        method,
                        url,
                        statusCode,
                        delayMs: delay,
                        requestId,
                    };

                    if (statusCode >= 400) {
                        requestLogger.warn('Request completed with warning status', logData);
                    } else {
                        requestLogger.info('Request completed successfully', logData);
                    }
                },
                error: (error) => {
                    const delay = Date.now() - now;
                    const statusCode = error.status || 500;

                    const logData = {
                        method,
                        url,
                        statusCode,
                        delayMs: delay,
                        requestId,
                        error: {
                            message: error.message,
                            name: error.name,
                            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                        },
                    };

                    if (statusCode >= 500) {
                        requestLogger.error('Request failed with server error', logData);
                    } else {
                        requestLogger.warn('Request failed with client error', logData);
                    }
                },
            }),
        );
    }

    private generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
