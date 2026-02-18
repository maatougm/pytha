import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config({ path: '../.env' });

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

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

    // CORS with explicit origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:4173',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked CORS request from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
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

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
