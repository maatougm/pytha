import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

dotenv.config({ path: '../.env' });

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Ensure downloads directory exists
    const downloadsDir = join(__dirname, '..', 'downloads');
    if (!existsSync(downloadsDir)) {
        mkdirSync(downloadsDir, { recursive: true });
    }

    // Serve static files from downloads directory
    app.useStaticAssets(join(__dirname, '..', 'downloads'), {
        prefix: '/downloads/',
    });

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
            },
        },
        // HSTS: tell browsers to always use HTTPS for 1 year
        hsts: process.env.NODE_ENV === 'production'
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,
        crossOriginEmbedderPolicy: false, // Allow for development
    }));

    // Compression for responses
    app.use(compression());

    // Cookie parser — required for reading httpOnly refresh token cookie
    app.use(cookieParser());

    // CORS with explicit origins - SECURITY FIX: No localhost regex in production
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:4173',
    ];

    const isDevelopment = process.env.NODE_ENV !== 'production';

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) {
                callback(null, true);
                return;
            }

            // Check if origin is in allowed list
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            // DEVELOPMENT: Allow all origins for testing (Expo tunnel, ngrok, etc.)
            if (isDevelopment) {
                // Allow localhost, ngrok, and any origin in development
                callback(null, true);
                return;
            }

            logger.warn(`Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Sanitize pipe and validation pipe with strict settings
    // SanitizePipe sanitizes all incoming data to prevent XSS attacks
    app.useGlobalPipes(
        new SanitizePipe({
            transformOptions: { enableImplicitConversion: true },
        }),
        // SECURITY FIX: Add ValidationPipe with whitelist: true to strip unknown properties
        new ValidationPipe({
            whitelist: true, // Strip properties that don't have decorators
            forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
            transform: true, // Transform payloads to be objects typed according to their DTO classes
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    app.setGlobalPrefix('api');

    // Swagger API Documentation
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('School Messaging System API')
            .setDescription('API documentation for the School Messaging System')
            .setVersion('1.0.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    // Metrics interceptor - records HTTP request duration and counts
    const metricsService = app.get(MetricsService);
    app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
