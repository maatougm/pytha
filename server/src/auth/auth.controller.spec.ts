// Set environment variables BEFORE imports
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-67890';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MetricsService } from '../metrics/metrics.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ForbiddenException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';

// Mock AuthService
jest.mock('./auth.service');

// Mock MetricsService
jest.mock('../metrics/metrics.service');

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<AuthService>;
    let metricsService: jest.Mocked<MetricsService>;

    // Mock response object
    const mockResponse = () => {
        const res: any = {};
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.status = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                        refresh: jest.fn(),
                        logout: jest.fn(),
                        getProfile: jest.fn(),
                    },
                },
                {
                    provide: MetricsService,
                    useValue: {
                        recordUserRegistration: jest.fn(),
                        recordUserLogin: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get(AuthService) as jest.Mocked<AuthService>;
        metricsService = module.get(MetricsService) as jest.Mocked<MetricsService>;

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        const validRegisterDto: RegisterDto = {
            email: 'test@school.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'student',
        };

        const mockRegisterResponse = {
            user: {
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                roles: ['student'],
            },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        it('should return 201 and user data on successful registration', async () => {
            authService.register.mockResolvedValue(mockRegisterResponse);
            const res = mockResponse();

            const result = await controller.register(validRegisterDto, res);

            expect(result).toEqual({
                user: mockRegisterResponse.user,
                accessToken: mockRegisterResponse.accessToken,
            });
            expect(authService.register).toHaveBeenCalledWith(validRegisterDto);
            expect(res.cookie).toHaveBeenCalledWith(
                'sms_refresh_token',
                'mock-refresh-token',
                expect.objectContaining({
                    httpOnly: true,
                    secure: false,
                    sameSite: 'strict',
                    path: '/',
                })
            );
            expect(metricsService.recordUserRegistration).toHaveBeenCalledWith('student');
        });

        it('should return 201 for teacher registration', async () => {
            const teacherDto = { ...validRegisterDto, role: 'teacher' };
            authService.register.mockResolvedValue({
                ...mockRegisterResponse,
                user: { ...mockRegisterResponse.user, roles: ['teacher'] },
            });
            const res = mockResponse();

            const result = await controller.register(teacherDto, res);

            expect(result.user.roles).toContain('teacher');
            expect(metricsService.recordUserRegistration).toHaveBeenCalledWith('teacher');
        });

        it('should return 201 for parent registration', async () => {
            const parentDto = { ...validRegisterDto, role: 'parent' };
            authService.register.mockResolvedValue({
                ...mockRegisterResponse,
                user: { ...mockRegisterResponse.user, roles: ['parent'] },
            });
            const res = mockResponse();

            const result = await controller.register(parentDto, res);

            expect(result.user.roles).toContain('parent');
            expect(metricsService.recordUserRegistration).toHaveBeenCalledWith('parent');
        });

        it('should throw 403 Forbidden for admin self-registration', async () => {
            const adminDto = { ...validRegisterDto, role: 'admin' };

            await expect(controller.register(adminDto, mockResponse())).rejects.toThrow(
                ForbiddenException
            );
            expect(authService.register).not.toHaveBeenCalled();
        });

        it('should throw 409 Conflict for duplicate email', async () => {
            authService.register.mockRejectedValue(new Error('Email already registered'));
            const res = mockResponse();

            await expect(controller.register(validRegisterDto, res)).rejects.toThrow();
        });

        it('should handle missing required fields with validation error', async () => {
            const validationPipe = new ValidationPipe({ whitelist: true });
            const invalidDto = { email: 'test@school.com' }; // Missing required fields

            await expect(
                validationPipe.transform(invalidDto, {
                    type: 'body',
                    metatype: RegisterDto,
                })
            ).rejects.toThrow();
        });

        it('should reject weak passwords', async () => {
            const validationPipe = new ValidationPipe({ whitelist: true });
            const weakPasswordDto = {
                ...validRegisterDto,
                password: 'weak',
            };

            await expect(
                validationPipe.transform(weakPasswordDto, {
                    type: 'body',
                    metatype: RegisterDto,
                })
            ).rejects.toThrow();
        });

        it('should reject invalid email format', async () => {
            const validationPipe = new ValidationPipe({ whitelist: true });
            const invalidEmailDto = {
                ...validRegisterDto,
                email: 'invalid-email',
            };

            await expect(
                validationPipe.transform(invalidEmailDto, {
                    type: 'body',
                    metatype: RegisterDto,
                })
            ).rejects.toThrow();
        });

        it('should reject invalid role', async () => {
            const validationPipe = new ValidationPipe({ whitelist: true });
            const invalidRoleDto = {
                ...validRegisterDto,
                role: 'superuser',
            };

            await expect(
                validationPipe.transform(invalidRoleDto, {
                    type: 'body',
                    metatype: RegisterDto,
                })
            ).rejects.toThrow();
        });
    });

    describe('POST /auth/login', () => {
        const validLoginDto: LoginDto = {
            email: 'test@school.com',
            password: 'Password123!',
        };

        const mockLoginResponse = {
            user: {
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                roles: ['student'],
            },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        };

        it('should return 200 and tokens on successful login', async () => {
            authService.login.mockResolvedValue(mockLoginResponse);
            const res = mockResponse();

            const result = await controller.login(validLoginDto, res);

            expect(result).toEqual({
                user: mockLoginResponse.user,
                accessToken: mockLoginResponse.accessToken,
            });
            expect(authService.login).toHaveBeenCalledWith(validLoginDto);
            expect(res.cookie).toHaveBeenCalledWith(
                'sms_refresh_token',
                'mock-refresh-token',
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'strict',
                })
            );
            expect(metricsService.recordUserLogin).toHaveBeenCalledWith('student');
        });

        it('should return 200 for teacher login', async () => {
            authService.login.mockResolvedValue({
                ...mockLoginResponse,
                user: { ...mockLoginResponse.user, roles: ['teacher'] },
            });
            const res = mockResponse();

            const result = await controller.login(validLoginDto, res);

            expect(result.user.roles).toContain('teacher');
            expect(metricsService.recordUserLogin).toHaveBeenCalledWith('teacher');
        });

        it('should return 200 for admin login', async () => {
            authService.login.mockResolvedValue({
                ...mockLoginResponse,
                user: { ...mockLoginResponse.user, roles: ['admin'] },
            });
            const res = mockResponse();

            const result = await controller.login(validLoginDto, res);

            expect(result.user.roles).toContain('admin');
            expect(metricsService.recordUserLogin).toHaveBeenCalledWith('admin');
        });

        it('should throw 401 for invalid credentials', async () => {
            authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
            const res = mockResponse();

            await expect(controller.login(validLoginDto, res)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should throw 401 for non-existent user', async () => {
            authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
            const res = mockResponse();

            await expect(
                controller.login({ email: 'nonexistent@school.com', password: 'Password123!' }, res)
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should validate email format', async () => {
            const validationPipe = new ValidationPipe({ whitelist: true });

            await expect(
                validationPipe.transform(
                    { email: 'invalid', password: 'Password123!' },
                    { type: 'body', metatype: LoginDto }
                )
            ).rejects.toThrow();
        });
    });

    describe('POST /auth/refresh', () => {
        const mockRefreshResponse = {
            user: {
                id: 'user-id',
                email: 'test@school.com',
                roles: ['student'],
            },
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        };

        it('should return 200 with new tokens on valid refresh', async () => {
            authService.refresh.mockResolvedValue(mockRefreshResponse);
            const res = mockResponse();
            const req = { cookies: { sms_refresh_token: 'valid-refresh-token' } };
            const dto: RefreshDto = { refreshToken: '' };

            const result = await controller.refresh(req as any, dto, res);

            expect(result).toEqual({
                user: mockRefreshResponse.user,
                accessToken: mockRefreshResponse.accessToken,
            });
            expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
            expect(res.cookie).toHaveBeenCalledWith(
                'sms_refresh_token',
                'new-refresh-token',
                expect.any(Object)
            );
        });

        it('should accept refresh token from body as fallback', async () => {
            authService.refresh.mockResolvedValue(mockRefreshResponse);
            const res = mockResponse();
            const req = { cookies: {} };
            const dto: RefreshDto = { refreshToken: 'body-refresh-token' };

            await controller.refresh(req as any, dto, res);

            expect(authService.refresh).toHaveBeenCalledWith('body-refresh-token');
        });

        it('should throw 401 for expired refresh token', async () => {
            authService.refresh.mockRejectedValue(
                new UnauthorizedException('Invalid or expired refresh token')
            );
            const res = mockResponse();
            const req = { cookies: { sms_refresh_token: 'expired-token' } };
            const dto: RefreshDto = { refreshToken: '' };

            await expect(controller.refresh(req as any, dto, res)).rejects.toThrow(
                UnauthorizedException
            );
        });

        it('should throw 401 for revoked refresh token', async () => {
            authService.refresh.mockRejectedValue(
                new UnauthorizedException('Invalid or expired refresh token')
            );
            const res = mockResponse();
            const req = { cookies: { sms_refresh_token: 'revoked-token' } };
            const dto: RefreshDto = { refreshToken: '' };

            await expect(controller.refresh(req as any, dto, res)).rejects.toThrow();
        });

        it('should throw 403 when no refresh token provided', async () => {
            authService.refresh.mockResolvedValue(mockRefreshResponse);
            const res = mockResponse();
            const req = { cookies: {} };
            const dto: RefreshDto = { refreshToken: '' };

            await expect(controller.refresh(req as any, dto, res)).rejects.toThrow(
                ForbiddenException
            );
        });
    });

    describe('POST /auth/logout', () => {
        it('should return 200 on successful logout', async () => {
            authService.logout.mockResolvedValue({ loggedOut: true });
            const res = mockResponse();
            const req = {
                user: { sub: 'user-id', jti: 'token-jti' },
                cookies: { sms_refresh_token: 'refresh-token' },
            };

            const result = await controller.logout(req as any, undefined, res);

            expect(result).toEqual({ loggedOut: true });
            expect(authService.logout).toHaveBeenCalledWith('user-id', 'refresh-token', 'token-jti');
            expect(res.clearCookie).toHaveBeenCalledWith('sms_refresh_token', { path: '/' });
        });

        it('should accept refresh token from body', async () => {
            authService.logout.mockResolvedValue({ loggedOut: true });
            const res = mockResponse();
            const req = {
                user: { sub: 'user-id', jti: 'token-jti' },
                cookies: {},
            };

            await controller.logout(req as any, 'body-refresh-token', res);

            expect(authService.logout).toHaveBeenCalledWith(
                'user-id',
                'body-refresh-token',
                'token-jti'
            );
        });

        it('should clear cookie even when no JTI provided', async () => {
            authService.logout.mockResolvedValue({ loggedOut: true });
            const res = mockResponse();
            const req = {
                user: { sub: 'user-id' },
                cookies: { sms_refresh_token: 'refresh-token' },
            };

            await controller.logout(req as any, undefined, res);

            expect(authService.logout).toHaveBeenCalledWith('user-id', 'refresh-token', undefined);
            expect(res.clearCookie).toHaveBeenCalled();
        });

        it('should handle logout from all devices', async () => {
            authService.logout.mockResolvedValue({ loggedOut: true });
            const res = mockResponse();
            const req = {
                user: { sub: 'user-id', jti: 'token-jti' },
                cookies: {},
            };

            await controller.logout(req as any, undefined, res);

            expect(authService.logout).toHaveBeenCalledWith('user-id', undefined, 'token-jti');
        });
    });

    describe('GET /auth/profile', () => {
        it('should return user profile when authenticated', async () => {
            const mockProfile = {
                id: 'user-id',
                email: 'test@school.com',
                firstName: 'Test',
                lastName: 'User',
                roles: ['student'],
            };
            authService.getProfile.mockResolvedValue(mockProfile);
            const req = { user: { sub: 'user-id' } };

            const result = await controller.getProfile(req as any);

            expect(result).toEqual(mockProfile);
            expect(authService.getProfile).toHaveBeenCalledWith('user-id');
        });

        it('should throw 401 when not authenticated', async () => {
            authService.getProfile.mockRejectedValue(new UnauthorizedException('User not found'));
            const req = { user: { sub: 'invalid-id' } };

            await expect(controller.getProfile(req as any)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('POST /auth/admin/create-user', () => {
        const adminCreateDto: RegisterDto = {
            email: 'newadmin@school.com',
            password: 'Password123!',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
        };

        it('should allow admin to create admin users', async () => {
            const mockResponse = {
                user: { id: 'new-admin-id', email: 'newadmin@school.com', roles: ['admin'] },
                accessToken: 'token',
                refreshToken: 'refresh',
            };
            authService.register.mockResolvedValue(mockResponse);

            const result = await controller.adminCreateUser(adminCreateDto);

            expect(result).toEqual(mockResponse);
            expect(authService.register).toHaveBeenCalledWith(adminCreateDto);
        });

        it('should allow admin to create teacher users', async () => {
            const teacherDto = { ...adminCreateDto, role: 'teacher', email: 'teacher@school.com' };
            const mockResponse = {
                user: { id: 'teacher-id', email: 'teacher@school.com', roles: ['teacher'] },
                accessToken: 'token',
                refreshToken: 'refresh',
            };
            authService.register.mockResolvedValue(mockResponse);

            const result = await controller.adminCreateUser(teacherDto);

            expect(result.user.roles).toContain('teacher');
        });
    });

    describe('Cookie security', () => {
        it('should set httpOnly cookie on registration', async () => {
            authService.register.mockResolvedValue({
                user: { id: '1', roles: ['student'] },
                accessToken: 'access',
                refreshToken: 'refresh',
            });
            const res = mockResponse();

            await controller.register({
                email: 'test@school.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'student',
            }, res);

            expect(res.cookie).toHaveBeenCalledWith(
                'sms_refresh_token',
                'refresh',
                expect.objectContaining({ httpOnly: true })
            );
        });

        it('should set httpOnly cookie on login', async () => {
            authService.login.mockResolvedValue({
                user: { id: '1', roles: ['student'] },
                accessToken: 'access',
                refreshToken: 'refresh',
            });
            const res = mockResponse();

            await controller.login({
                email: 'test@school.com',
                password: 'Password123!',
            }, res);

            expect(res.cookie).toHaveBeenCalledWith(
                'sms_refresh_token',
                'refresh',
                expect.objectContaining({ httpOnly: true })
            );
        });
    });
});
