import { Controller, Get, Param, UseGuards, Query, ParseIntPipe, DefaultValuePipe, Body, Put, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationPreferencesDto } from '../notifications/dto/notification-preferences.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get all users with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    ) {
        return this.usersService.findAll(page, limit);
    }

    @Get('role/:roleName')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get users by role' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    async findByRole(
        @Param('roleName') roleName: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    ) {
        return this.usersService.findByRole(roleName, page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    async findById(@Param('id') id: string, @Req() req: any) {
        const requesterId: string = req.user.sub;
        const requesterRoles: string[] = req.user.roles || [];
        const isAdminOrTeacher = requesterRoles.includes('admin') || requesterRoles.includes('teacher');

        // Self or admin/teacher can see full profile
        if (requesterId === id || isAdminOrTeacher) {
            return this.usersService.findById(id);
        }

        // Everyone else gets a limited public profile (name + avatar only)
        return this.usersService.findPublicProfile(id);
    }

    @Get(':id/children')
    @ApiOperation({ summary: 'Get children for a parent user' })
    async getChildren(@Param('id') id: string, @Req() req: any) {
        const requesterId: string = req.user.sub;
        const requesterRoles: string[] = req.user.roles || [];
        const isAdminOrTeacher = requesterRoles.includes('admin') || requesterRoles.includes('teacher');

        // Only the parent themselves, admins, or teachers may view a parent's children
        if (requesterId !== id && !isAdminOrTeacher) {
            throw new ForbiddenException('You do not have permission to view this user\'s children');
        }

        return this.usersService.getParentChildren(id);
    }

    // ─── NOTIFICATION PREFERENCES ──────────────────────────────

    @Get('me/notifications')
    @ApiOperation({ summary: 'Get current user notification preferences' })
    async getMyNotificationPreferences(@Req() req: any) {
        return this.usersService.getNotificationPreferences(req.user.sub);
    }

    @Put('me/notifications')
    @ApiOperation({ summary: 'Update current user notification preferences' })
    async updateMyNotificationPreferences(
        @Req() req: any,
        @Body() dto: NotificationPreferencesDto,
    ) {
        return this.usersService.updateNotificationPreferences(req.user.sub, dto);
    }
}
