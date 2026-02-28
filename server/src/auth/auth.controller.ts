import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MetricsService } from '../metrics/metrics.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

/** Roles that require an existing admin to create the account */
const PRIVILEGED_ROLES = ['admin'];

/** Cookie name for the httpOnly refresh token */
const REFRESH_COOKIE = 'sms_refresh_token';

/** Cookie options — httpOnly prevents JS access; Secure enforced in production */
const cookieOptions = (maxAgeMs: number) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: maxAgeMs,
    path: '/',
});

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private metricsService: MetricsService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user (non-admin roles only)' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 403, description: 'Admin accounts must be created by an existing admin' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        if (PRIVILEGED_ROLES.includes(dto.role?.toLowerCase())) {
            throw new ForbiddenException(
                'Admin accounts cannot be self-registered. Contact an existing administrator.',
            );
        }
        const result = await this.authService.register(dto);
        // Set refresh token as httpOnly cookie (C4)
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        // Record metrics
        this.metricsService.recordUserRegistration(result.user.roles?.[0]?.role?.name || 'user');
        return { user: result.user, accessToken: result.accessToken };
    }

    @Post('admin/create-user')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: create a user with any role' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async adminCreateUser(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(dto);
        // Set refresh token as httpOnly cookie (C4)
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        // Record metrics
        this.metricsService.recordUserLogin(result.user.roles?.[0]?.role?.name || 'user');
        // Return accessToken in body; refreshToken is now in the cookie only
        return { user: result.user, accessToken: result.accessToken };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refresh(
        @Request() req,
        @Body() dto: RefreshDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        // Prefer cookie; fall back to body for backward compatibility
        const token = req.cookies?.[REFRESH_COOKIE] || dto?.refreshToken;
        if (!token) {
            throw new ForbiddenException('Refresh token is required');
        }
        const result = await this.authService.refresh(token);
        // Rotate the cookie
        res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
        return { user: result.user, accessToken: result.accessToken };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate tokens' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout(
        @Request() req,
        @Body('refreshToken') bodyRefreshToken?: string,
        @Res({ passthrough: true }) res?: Response,
    ) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE] || bodyRefreshToken;
        const accessTokenJti = req.user?.jti;

        // Clear the httpOnly cookie
        res?.clearCookie(REFRESH_COOKIE, { path: '/' });

        return this.authService.logout(req.user.sub, refreshToken, accessTokenJti);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.sub);
    }
}
