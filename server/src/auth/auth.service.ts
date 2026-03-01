import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '../common/utils/user-sanitizer';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

export interface TokenPayload {
    iat?: number;
    pwdVersion?: number;
    sub: string;
    email: string;
    roles: string[];
    jti: string; // Unique token ID for revocation
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly redis: Redis;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }
        this.redis = new Redis(redisUrl);
        this.redis.on('error', (err) => {
            this.logger.error('AuthService Redis error:', err.message);
        });
    }

    async register(dto: RegisterDto) {
        // Check if user exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 14);

        // Find or validate role
        const role = await this.prisma.role.findUnique({
            where: { name: dto.role.toLowerCase() },
        });
        if (!role) {
            throw new ConflictException(`Role '${dto.role}' does not exist`);
        }

        // Create user with role
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                userRoles: {
                    create: { roleId: role.id },
                },
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        this.logger.log(`User registered: ${user.email} (${dto.role})`);

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, [dto.role], (user as any).passwordVersion);
        return {
            user: sanitizeUser(user),
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is soft deleted
        if (user.deletedAt) {
            throw new UnauthorizedException('Account has been deleted. Please contact an administrator to restore your account.');
        }

        if (user.status !== 'active') {
            throw new UnauthorizedException('Account is suspended or archived');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const roles = user.userRoles.map((ur) => ur.role.name);
        const tokens = await this.generateTokens(user.id, user.email, roles, (user as any).passwordVersion);

        this.logger.log(`User logged in: ${user.email}`);

        return {
            user: sanitizeUser(user),
            ...tokens,
        };
    }

    async refresh(refreshToken: string) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: { include: { userRoles: { include: { role: true } } } },
            },
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Check if user is soft deleted
        if (stored.user.deletedAt) {
            throw new UnauthorizedException('Account has been deleted');
        }

        const roles = stored.user.userRoles.map((ur) => ur.role.name);

        // HIGH-002 fix: use a transaction so the old token is only deleted
        // after the new one is successfully created. Prevents logout on failure.
        const tokens = await this.prisma.$transaction(async (tx) => {
            const newTokens = await this.generateTokens(stored.user.id, stored.user.email, roles, (stored.user as any).passwordVersion);
            await tx.refreshToken.delete({ where: { id: stored.id } });
            return newTokens;
        });

        this.logger.log(`Token refreshed for user: ${stored.user.email}`);

        return {
            user: sanitizeUser(stored.user),
            ...tokens,
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user) throw new UnauthorizedException('User not found');
        return sanitizeUser(user);
    }

    async logout(userId: string, refreshToken?: string, accessTokenJti?: string) {
        // Delete refresh token(s) from DB
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: { token: refreshToken, userId },
            });
        } else {
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }

        // C6: Revoke the current access token by adding its jti to the Redis denylist
        if (accessTokenJti) {
            const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '15m');
            const ttlSeconds = Math.ceil(this.parseExpiration(expiresIn) / 1000);
            await this.redis.set(
                `token:denylist:${accessTokenJti}`,
                '1',
                'EX',
                ttlSeconds,
            );
        }

        this.logger.log(`User logged out: ${userId}`);
        return { loggedOut: true };
    }

    private validateJwtSecrets() {
        const secret = this.configService.get<string>('JWT_SECRET');
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
        
        if (!secret || secret.length < 32) {
            throw new UnauthorizedException('JWT_SECRET must be at least 32 characters');
        }
        if (!refreshSecret || refreshSecret.length < 32) {
            throw new UnauthorizedException('JWT_REFRESH_SECRET must be at least 32 characters');
        }
        if (secret === refreshSecret) {
            throw new UnauthorizedException('JWT_SECRET and JWT_REFRESH_SECRET must be different');
        }
    }

    private async generateTokens(userId: string, email: string, roles: string[], pwdVersion?: number) {
        // Validate JWT secrets at the start of token generation
        this.validateJwtSecrets();

        const jti = uuidv4(); // Unique token ID for revocation
        const payload: TokenPayload = { sub: userId, email, roles, jti, pwdVersion, iat: Math.floor(Date.now() / 1000) };

        const secret = this.configService.get<string>('JWT_SECRET');
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
        const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '15m');
        const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

        // HIGH-001 fix: enforce minimum secret strength (32 chars) to prevent weak secrets
        if (!secret || secret.length < 32) {
            throw new UnauthorizedException(
                'JWT_SECRET must be configured and at least 32 characters long',
            );
        }

        const accessToken = this.jwtService.sign(payload, {
            secret,
            expiresIn,
        });

        const refreshToken = uuidv4();
        const expiresAt = new Date();
        // Parse refresh expiration (e.g., '7d', '24h', '30m', '2w')
        expiresAt.setTime(expiresAt.getTime() + this.parseExpiration(refreshExpiresIn));


        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }

    /**
     * Parses a time string like '7d', '24h', '30m', '2w' into milliseconds.
     * Defaults to 7 days if the format is unrecognized.
     */
    private parseExpiration(expiration: string): number {
        const match = expiration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            this.logger.warn(`Unrecognized expiration format '${expiration}', defaulting to 7 days`);
            return 7 * 24 * 60 * 60 * 1000;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        return value * multipliers[unit];
    }
}
