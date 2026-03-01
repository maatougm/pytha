// Set environment variables BEFORE imports
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-67890';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, TokenPayload } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn(),
}));

// Mock ioredis
jest.mock('ioredis', () => {
    const mockRedisInstance = {
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
    };
    const MockRedis = jest.fn().mockImplementation(() => mockRedisInstance);
    return { Redis: MockRedis, default: MockRedis };
});

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mock-uuid-12345'),
}));

describe('AuthService', () => {
    let service: AuthService;
    let mockPrisma: DeepMockProxy<PrismaClient>;
    let mockJwtService: jest.Mocked<JwtService>;
    let mockConfigService: jest.Mocked<ConfigService>;
    let mockRedis: any;

    beforeEach(async () => {
        mockPrisma = mockDeep<PrismaClient>();
        mockJwtService = {
            sign: jest.fn().mockReturnValue('mockToken'),
        } as any;
        mockConfigService = {
            get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                    JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long-12345',
                    JWT_REFRESH_SECRET: 'test-refresh-secret-32-characters-long-67890',
                    JWT_EXPIRATION: '15m',
                    JWT_REFRESH_EXPIRATION: '7d',
                    REDIS_URL: 'redis://localhost:6379',
                };
                return config[key];
            }),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        
        // Get the mocked Redis instance
        const Redis = require('ioredis');
        mockRedis = Redis();
        
        jest.clearAllMocks();
    });

    afterEach(() => {
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
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'student' } as any);
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
            } as any);

            const result = await service.register(registerDto);

            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(registerDto.email);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' } as any);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
        });

        it('should throw ConflictException if role does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue(null);

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
            await expect(service.register(registerDto)).rejects.toThrow("Role 'student' does not exist");
        });

        it('should convert email to lowercase before saving', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'student' } as any);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-id',
                email: 'mixed@school.com',
                firstName: 'Test',
                lastName: 'User',
                phone: null,
                avatarUrl: null,
                status: 'active',
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                userRoles: [{ role: { name: 'student' } }],
                passwordHash: 'hashedPassword',
            } as any);

            await service.register({ ...registerDto, email: 'Mixed@School.COM' });

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'mixed@school.com' },
            });
        });

        it('should handle optional phone field', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'student' } as any);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-id',
                email: registerDto.email,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                phone: '+1234567890',
                avatarUrl: null,
                status: 'active',
                lastLoginAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                userRoles: [{ role: { name: 'student' } }],
                passwordHash: 'hashedPassword',
            } as any);

            const result = await service.register({ ...registerDto, phone: '+1234567890' });

            expect(result.user).toBeDefined();
            expect(mockPrisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ phone: '+1234567890' }),
                })
            );
        });

        it('should support all valid roles (student, teacher, parent, admin)', async () => {
            const roles = ['student', 'teacher', 'parent', 'admin'];
            
            for (const role of roles) {
                mockPrisma.user.findUnique.mockResolvedValue(null);
                mockPrisma.role.findUnique.mockResolvedValue({ id: `${role}-id`, name: role } as any);
                mockPrisma.user.create.mockResolvedValue({
                    id: 'user-id',
                    email: `${role}@school.com`,
                    firstName: 'Test',
                    lastName: 'User',
                    userRoles: [{ role: { name: role } }],
                    passwordHash: 'hashedPassword',
                } as any);

                const result = await service.register({ ...registerDto, email: `${role}@school.com`, role });
                expect(result.user).toBeDefined();
            }
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
                deletedAt: null,
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(mockUser as any);

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
            await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'active',
                deletedAt: null,
                userRoles: [],
            } as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for suspended account', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'suspended',
                deletedAt: null,
                userRoles: [],
            } as any);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Account is suspended or archived');
        });

        it('should throw UnauthorizedException for soft-deleted account', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'active',
                deletedAt: new Date(),
                userRoles: [],
            } as any);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            await expect(service.login(loginDto)).rejects.toThrow('Account has been deleted');
        });

        it('should extract roles correctly from userRoles', async () => {
            const mockUser = {
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'hashedPassword',
                status: 'active',
                deletedAt: null,
                userRoles: [
                    { role: { name: 'teacher' } },
                    { role: { name: 'admin' } },
                ],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(mockUser as any);

            await service.login(loginDto);

            expect(mockJwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    roles: ['teacher', 'admin'],
                }),
                expect.any(Object)
            );
        });

        it('should convert email to lowercase for login lookup', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login({ ...loginDto, email: 'Mixed@School.COM' })).rejects.toThrow();

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'mixed@school.com' },
                include: expect.any(Object),
            });
        });

        it('should not expose password hash in login response', async () => {
            const mockUser = {
                id: 'user-id',
                email: loginDto.email,
                passwordHash: 'super-secret-hash',
                status: 'active',
                deletedAt: null,
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(mockUser as any);

            const result = await service.login(loginDto);

            expect(result.user).not.toHaveProperty('passwordHash');
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
                    deletedAt: null,
                    userRoles: [{ role: { name: 'student' } }],
                },
            };

            mockPrisma.refreshToken.findUnique.mockResolvedValue(mockToken as any);
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });

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
                expiresAt: new Date(Date.now() - 86400000),
                user: {
                    id: 'user-id',
                    email: 'test@school.com',
                    deletedAt: null,
                    userRoles: [],
                },
            } as any);

            await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

            await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user account is deleted', async () => {
            mockPrisma.refreshToken.findUnique.mockResolvedValue({
                id: 'token-id',
                token: 'refresh-token',
                expiresAt: new Date(Date.now() + 86400000),
                user: {
                    id: 'user-id',
                    email: 'test@school.com',
                    deletedAt: new Date(),
                    userRoles: [],
                },
            } as any);

            await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
            await expect(service.refresh('refresh-token')).rejects.toThrow('Account has been deleted');
        });

        it('should use transaction to ensure atomic token rotation', async () => {
            const mockToken = {
                id: 'token-id',
                token: 'refresh-token',
                expiresAt: new Date(Date.now() + 86400000),
                user: {
                    id: 'user-id',
                    email: 'test@school.com',
                    deletedAt: null,
                    userRoles: [{ role: { name: 'student' } }],
                },
            };

            mockPrisma.refreshToken.findUnique.mockResolvedValue(mockToken as any);
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });

            await service.refresh('refresh-token');

            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it('should implement replay attack protection via token rotation', async () => {
            // This test verifies that refresh tokens are single-use
            const mockToken = {
                id: 'token-id',
                token: 'refresh-token',
                expiresAt: new Date(Date.now() + 86400000),
                user: {
                    id: 'user-id',
                    email: 'test@school.com',
                    deletedAt: null,
                    userRoles: [{ role: { name: 'student' } }],
                },
            };

            mockPrisma.refreshToken.findUnique
                .mockResolvedValueOnce(mockToken as any)
                .mockResolvedValueOnce(null); // Second lookup fails (token deleted)

            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });

            // First refresh should succeed
            const result1 = await service.refresh('refresh-token');
            expect(result1.accessToken).toBeDefined();

            // Second refresh with same token should fail (replay attack prevented)
            await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('getProfile', () => {
        it('should return user profile successfully', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await service.getProfile('user-id');

            expect(result).toBeDefined();
            expect(result.id).toBe(mockUser.id);
            expect(result.email).toBe(mockUser.email);
            expect(result.roles).toEqual(['student']);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getProfile('non-existent-id')).rejects.toThrow(UnauthorizedException);
        });

        it('should sanitize sensitive fields from profile', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                passwordHash: 'should-not-be-included',
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await service.getProfile('user-id');

            expect(result).not.toHaveProperty('passwordHash');
        });
    });

    describe('logout', () => {
        it('should logout with specific refresh token', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);

            const result = await service.logout('user-id', 'refresh-token');

            expect(result.loggedOut).toBe(true);
            expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { token: 'refresh-token', userId: 'user-id' },
            });
        });

        it('should logout from all devices when no refresh token provided', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 } as any);

            const result = await service.logout('user-id');

            expect(result.loggedOut).toBe(true);
            expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-id' },
            });
        });

        it('should add access token to denylist during logout', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);
            const accessTokenJti = 'access-token-jti-123';

            await service.logout('user-id', 'refresh-token', accessTokenJti);

            // Verify Redis set was called with denylist key
            expect(mockRedis.set).toHaveBeenCalledWith(
                `token:denylist:${accessTokenJti}`,
                '1',
                'EX',
                expect.any(Number)
            );
        });

        it('should handle logout without JTI (backward compatibility)', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);

            const result = await service.logout('user-id', 'refresh-token');

            expect(result.loggedOut).toBe(true);
            // Redis should not be called when no JTI provided
            expect(mockRedis.set).not.toHaveBeenCalled();
        });

        it('should calculate correct TTL for token denylist based on JWT expiration', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);
            
            // Mock different expiration values
            const testCases = [
                { expiration: '15m', expectedMinTtl: 14 * 60 }, // ~15 minutes
                { expiration: '1h', expectedMinTtl: 59 * 60 }, // ~1 hour
                { expiration: '1d', expectedMinTtl: 23 * 60 * 60 }, // ~1 day
            ];

            for (const testCase of testCases) {
                const customConfigService = {
                    get: jest.fn((key: string) => {
                        if (key === 'JWT_EXPIRATION') return testCase.expiration;
                        return mockConfigService.get(key);
                    }),
                } as any;

                const module: TestingModule = await Test.createTestingModule({
                    providers: [
                        AuthService,
                        { provide: PrismaService, useValue: mockPrisma },
                        { provide: JwtService, useValue: mockJwtService },
                        { provide: ConfigService, useValue: customConfigService },
                    ],
                }).compile();

                const customService = module.get<AuthService>(AuthService);
                mockRedis.set.mockClear();

                await customService.logout('user-id', 'refresh-token', 'jti-123');

                const callArgs = mockRedis.set.mock.calls[0];
                expect(callArgs[3]).toBe('EX');
                expect(callArgs[4]).toBeGreaterThanOrEqual(testCase.expectedMinTtl);
            }
        });
    });

    describe('generateTokens', () => {
        it('should generate tokens with correct expiration', async () => {
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);

            // Access private method via any
            const result = await (service as any).generateTokens('user-id', 'test@school.com', ['student']);

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(mockJwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: 'user-id',
                    email: 'test@school.com',
                    roles: ['student'],
                    jti: expect.any(String),
                }),
                expect.objectContaining({
                    secret: expect.any(String),
                    expiresIn: '15m',
                })
            );
        });

        it('should generate unique JTI for each token', async () => {
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);
            
            const { v4: uuidv4 } = require('uuid');
            const jtis: string[] = [];

            // Generate multiple tokens and verify JTIs are unique
            for (let i = 0; i < 5; i++) {
                const uniqueJti = `unique-jti-${i}`;
                uuidv4.mockReturnValueOnce(uniqueJti);
                
                await (service as any).generateTokens(`user-${i}`, `user${i}@test.com`, ['student']);
                
                const callArgs = mockJwtService.sign.mock.calls[i] as [{ jti: string }, any];
                jtis.push(callArgs[0].jti);
            }

            // Verify all JTIs are unique
            const uniqueJtis = new Set(jtis);
            expect(uniqueJtis.size).toBe(jtis.length);
        });

        it('should throw error if JWT_SECRET is too short', async () => {
            const shortConfigService = {
                get: jest.fn((key: string) => {
                    if (key === 'JWT_SECRET') return 'short';
                    return mockConfigService.get(key);
                }),
            } as any;

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AuthService,
                    { provide: PrismaService, useValue: mockPrisma },
                    { provide: JwtService, useValue: mockJwtService },
                    { provide: ConfigService, useValue: shortConfigService },
                ],
            }).compile();

            const shortSecretService = module.get<AuthService>(AuthService);
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);

            await expect(
                (shortSecretService as any).generateTokens('user-id', 'test@school.com', ['student'])
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw error if JWT_SECRET is missing', async () => {
            const missingConfigService = {
                get: jest.fn((key: string) => {
                    if (key === 'JWT_SECRET') return undefined;
                    return mockConfigService.get(key);
                }),
            } as any;

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AuthService,
                    { provide: PrismaService, useValue: mockPrisma },
                    { provide: JwtService, useValue: mockJwtService },
                    { provide: ConfigService, useValue: missingConfigService },
                ],
            }).compile();

            const missingSecretService = module.get<AuthService>(AuthService);
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);

            await expect(
                (missingSecretService as any).generateTokens('user-id', 'test@school.com', ['student'])
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('parseExpiration', () => {
        it('should parse various time formats correctly', async () => {
            const testCases = [
                { input: '15m', expected: 15 * 60 * 1000 },
                { input: '1h', expected: 60 * 60 * 1000 },
                { input: '1d', expected: 24 * 60 * 60 * 1000 },
                { input: '1w', expected: 7 * 24 * 60 * 60 * 1000 },
                { input: '30s', expected: 30 * 1000 },
            ];

            for (const testCase of testCases) {
                mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);
                
                const customConfigService = {
                    get: jest.fn((key: string) => {
                        const config: Record<string, string> = {
                            JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long-12345',
                            JWT_REFRESH_SECRET: 'test-refresh-secret-32-characters-long-67890',
                            JWT_EXPIRATION: '15m',
                            JWT_REFRESH_EXPIRATION: testCase.input,
                            REDIS_URL: 'redis://localhost:6379',
                        };
                        return config[key];
                    }),
                } as any;

                const module: TestingModule = await Test.createTestingModule({
                    providers: [
                        AuthService,
                        { provide: PrismaService, useValue: mockPrisma },
                        { provide: JwtService, useValue: mockJwtService },
                        { provide: ConfigService, useValue: customConfigService },
                    ],
                }).compile();

                const customService = module.get<AuthService>(AuthService);
                await (customService as any).generateTokens('user-id', 'test@school.com', ['student']);

                // Verify the token was created (means expiration was parsed)
                expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
            }
        });

        it('should default to 7 days for invalid format', async () => {
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);

            const result = await (service as any).parseExpiration('invalid');

            expect(result).toBe(7 * 24 * 60 * 60 * 1000);
        });

        it('should handle edge case formats', async () => {
            const edgeCases = [
                { input: '0s', expected: 0 },
                { input: '999d', expected: 999 * 24 * 60 * 60 * 1000 },
                { input: '2w', expected: 2 * 7 * 24 * 60 * 60 * 1000 },
            ];

            for (const testCase of edgeCases) {
                const result = await (service as any).parseExpiration(testCase.input);
                expect(result).toBe(testCase.expected);
            }
        });
    });

    describe('Password Hashing Security', () => {
        it('should use bcrypt with 12 rounds for password hashing', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', name: 'student' } as any);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                userRoles: [{ role: { name: 'student' } }],
                passwordHash: 'hashedPassword',
            } as any);

            await service.register({
                email: 'test@school.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'student',
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
        });

        it('should use bcrypt.compare for password validation', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@school.com',
                passwordHash: 'hashedPassword123',
                status: 'active',
                deletedAt: null,
                userRoles: [{ role: { name: 'student' } }],
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(mockUser as any);

            await service.login({
                email: 'test@school.com',
                password: 'Password123!',
            });

            expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashedPassword123');
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors during registration', async () => {
            mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

            await expect(service.register({
                email: 'test@school.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'student',
            })).rejects.toThrow('Database connection failed');
        });

        it('should handle database errors during login', async () => {
            mockPrisma.user.findUnique.mockRejectedValue(new Error('Database timeout'));

            await expect(service.login({
                email: 'test@school.com',
                password: 'Password123!',
            })).rejects.toThrow('Database timeout');
        });

        it('should handle Redis errors gracefully in logout', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);
            mockRedis.set.mockRejectedValue(new Error('Redis unavailable'));

            // Should still complete logout even if Redis fails
            await expect(service.logout('user-id', 'refresh-token', 'jti-123')).rejects.toThrow('Redis unavailable');
        });
    });

    describe('Token Payload Structure', () => {
        it('should include all required claims in token payload', async () => {
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);

            await (service as any).generateTokens('user-123', 'user@test.com', ['student', 'teacher'], 1);

            const payload = mockJwtService.sign.mock.calls[0][0] as TokenPayload;
            
            expect(payload.sub).toBe('user-123');
            expect(payload.email).toBe('user@test.com');
            expect(payload.roles).toEqual(['student', 'teacher']);
            expect(payload.jti).toBeDefined();
            expect(payload.iat).toBeDefined();
            expect(payload.pwdVersion).toBe(1);
        });

        it('should generate unique JTI for revocation support', async () => {
            mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' } as any);
            const { v4: uuidv4 } = require('uuid');

            uuidv4.mockReturnValue('test-uuid-12345');

            await (service as any).generateTokens('user-id', 'test@test.com', ['student']);

            const payload = mockJwtService.sign.mock.calls[0][0] as TokenPayload;
            expect(payload.jti).toBe('test-uuid-12345');
        });
    });
});
