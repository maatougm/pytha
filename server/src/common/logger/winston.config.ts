import { WinstonModuleOptions, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

// Custom format for JSON logging with stack traces
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

// Custom format for console output in development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    nestWinstonModuleUtilities.format.nestLike('SMS', {
        colors: true,
        prettyPrint: true,
    }),
);

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Define log directory
const logDir = path.join(process.cwd(), 'logs');

// Configure transports based on environment
const transports: winston.transport[] = [];

if (isProduction) {
    // Production: File-based logging with JSON format
    transports.push(
        // Application logs (info level and above)
        new winston.transports.File({
            filename: path.join(logDir, 'app.log'),
            level: 'info',
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Error logs (error level only)
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    );
} else {
    // Development: Console logging with pretty format
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
        }),
    );
}

// Create Winston module options
export const winstonConfig: WinstonModuleOptions = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    level: isProduction ? 'info' : 'debug',
    defaultMeta: {
        service: 'school-messaging-system',
        environment: process.env.NODE_ENV || 'development',
    },
    transports,
    // Handle uncaught exceptions and rejections
    exceptionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join(logDir, 'exceptions.log'),
                format: jsonFormat,
                maxsize: 5242880,
                maxFiles: 5,
            }),
        ]
        : [new winston.transports.Console({ format: consoleFormat })],
    rejectionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join(logDir, 'rejections.log'),
                format: jsonFormat,
                maxsize: 5242880,
                maxFiles: 5,
            }),
        ]
        : [new winston.transports.Console({ format: consoleFormat })],
    exitOnError: false,
};

// Helper function to create a sanitized log message
export function sanitizeLogData(data: any, sensitiveFields: string[] = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey']): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeLogData(item, sensitiveFields));
    }

    const sanitized = { ...data };
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '***REDACTED***';
        }
    }
    return sanitized;
}

// Helper to create a child logger with request context
export function createRequestLogger(logger: winston.Logger, requestId: string, userId?: string) {
    return logger.child({
        requestId,
        userId: userId || 'anonymous',
    });
}
