import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly redis: Redis;

    constructor(private configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: false,
        });

        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is required');
        }
        this.redis = new Redis(redisUrl);
        this.redis.on('error', (err) => {
            // Log but don't crash — we fail-closed below if Redis is unavailable
            console.error('[JwtStrategy] Redis error:', err.message);
        });
    }

    async validate(payload: any) {
        // C6: Check if this token's jti has been revoked (e.g., user logged out)
        if (payload.jti) {
            try {
                const revoked = await this.redis.get(`token:denylist:${payload.jti}`);
                if (revoked) {
                    throw new UnauthorizedException('Token has been revoked');
                }
            } catch (err) {
                if (err instanceof UnauthorizedException) throw err;
                // Redis unavailable — fail closed: reject the request
                throw new UnauthorizedException('Authentication service temporarily unavailable');
            }
        }

        return {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            jti: payload.jti,
        };
    }
}
