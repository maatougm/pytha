import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, validateSync } from 'class-validator';
import * as winston from 'winston';

// Create a simple logger for environment validation (runs before NestJS app)
const validationLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
    ),
    transports: [new winston.transports.Console()],
});

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    @IsOptional()
    NODE_ENV: Environment = Environment.Development;

    @IsNumber()
    @Min(1)
    @IsOptional()
    PORT: number = 3000;

    @IsString()
    @IsNotEmpty()
    DATABASE_URL: string;

    @IsUrl({ protocols: ['redis', 'rediss'] })
    @IsOptional()
    REDIS_URL: string = 'redis://localhost:6379';

    @IsString()
    @IsNotEmpty()
    JWT_SECRET: string;

    @IsString()
    @IsNotEmpty()
    JWT_REFRESH_SECRET: string;

    @IsString()
    @IsOptional()
    JWT_EXPIRATION: string = '15m';

    @IsString()
    @IsOptional()
    JWT_REFRESH_EXPIRATION: string = '7d';

    @IsString()
    @IsOptional()
    ALLOWED_ORIGINS: string = 'http://localhost:5173,http://localhost:4173';

    @IsNumber()
    @Min(1)
    @IsOptional()
    RATE_LIMIT_TTL: number = 60000;

    @IsNumber()
    @Min(1)
    @IsOptional()
    RATE_LIMIT_MAX: number = 100;

    @IsNumber()
    @Min(1)
    @IsOptional()
    MAX_FILE_SIZE: number = 10 * 1024 * 1024; // 10MB
}

export function validateEnv(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const errorMessages = errors.map(error => {
            const constraints = Object.values(error.constraints || {}).join(', ');
            return `${error.property}: ${constraints}`;
        });

        throw new Error(
            `Environment validation failed:\n${errorMessages.join('\n')}`,
        );
    }

    return validatedConfig;
}

// Validate critical security settings
export function validateSecuritySettings() {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check JWT secrets in production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            errors.push('JWT_SECRET must be at least 32 characters in production');
        }

        if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
            errors.push('JWT_REFRESH_SECRET must be at least 32 characters in production');
        }

        if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
            errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
        }

        // Check database URL uses SSL in production
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sslmode=')) {
            warnings.push('DATABASE_URL should use SSL in production');
        }
    }

    // Log warnings
    if (warnings.length > 0) {
        validationLogger.warn('⚠️  Security Warnings:');
        warnings.forEach(w => validationLogger.warn(`  - ${w}`));
    }

    // Throw errors
    if (errors.length > 0) {
        throw new Error(
            `\n❌ Security Validation Failed:\n${errors.map(e => `  - ${e}`).join('\n')}`,
        );
    }
}
