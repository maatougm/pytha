import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn(),
}));

// Mock ioredis so AuthService constructor doesn't try to connect
jest.mock('ioredis', () => {
    const mockRedis = jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
    }));
    return { Redis: mockRedis, default: mockRedis };
});

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        role: {
            findUnique: jest.fn(),
        },
        refreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mockToken'),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRATION: '15m',
                JWT_REFRESH_EXPIRATION: '7d',
                REDIS_URL: 'redis://localhost:6379',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@school.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'student',
        };

        it('should register a new user successfully', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'student' });
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-id',
                email: registerDto.email,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                phone: null,
                avatarUrl: null,
                status: 'active',
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                userRoles: [{ role: { name: 'student' } }],
                passwordHash: 'hashedPassword',
            });

            const result = await service.register(registerDto);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(registerDto.email);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException if role does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue(null);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@school.com',
            password: 'Password123!',
        };

        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'active',
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(mockUser);

            const result = await service.login(loginDto);

            expect(result.user).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { lastLoginAt: expect.any(Date) },
            });
        });

        it('should throw UnauthorizedException for invalid email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'active',
                userRoles: [],
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for suspended account', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'suspended',
                userRoles: [],
            });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refresh', () => {
        it('should refresh tokens successfully', async () => {
            const mockToken = {
                id: 'token-id',
                token: 'refresh-token',
                expiresAt: new Date(Date.now() + 86400000),
                user: {
                    id: 'user-id',
                    email: 'test@school.com',
                    userRoles: [{ role: { name: 'student' } }],
                },
            };

            mockPrisma.refreshToken.findUnique.mockResolvedValue(mockToken);
            mockPrisma.refreshToken.delete.mockResolvedValue(mockToken);

            const result = await service.refresh('refresh-token');

            expect(result.user).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
                where: { id: mockToken.id },
            });
        });

        it('should throw UnauthorizedException for expired token', async () => {
            mockPrisma.refreshToken.findUnique.mockResolvedValue({
                id: 'token-id',
                token: 'refresh-token',
                expiresAt: new Date(Date.now() - 86400000), // Expired
            });

            await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

            await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
        });
    });
});
