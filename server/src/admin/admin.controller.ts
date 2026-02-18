import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
    DashboardStatsQueryDto,
    UserManagementQueryDto,
    UpdateUserStatusDto,
    BulkActionDto,
    SystemSettingsDto,
    TimeRange,
} from './dto/admin.dto';
import { InviteUserDto, BulkInviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private adminService: AdminService) { }

    // ─── DASHBOARD STATISTICS ───────────────────────────────────────────

    @Get('dashboard/metrics')
    @ApiOperation({ summary: 'Get system-wide metrics for dashboard' })
    @ApiQuery({ name: 'range', required: false, enum: TimeRange })
    async getMetrics(@Query('range') range: TimeRange = TimeRange.WEEK): Promise<any> {
        return this.adminService.getSystemMetrics();
    }

    @Get('dashboard/timeline')
    @ApiOperation({ summary: 'Get activity timeline data for charts' })
    @ApiQuery({ name: 'range', required: false, enum: TimeRange })
    async getTimeline(@Query('range') range: TimeRange = TimeRange.WEEK): Promise<any> {
        return this.adminService.getActivityTimeline(range);
    }

    @Get('dashboard/realtime')
    @ApiOperation({ summary: 'Get real-time statistics' })
    async getRealTimeStats(): Promise<any> {
        return this.adminService.getRealTimeStats();
    }

    // ─── USER MANAGEMENT ────────────────────────────────────────────────

    @Get('users')
    @ApiOperation({ summary: 'Get all users with filtering and pagination' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'role', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUsers(
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
        return this.adminService.getUsers({ search, role, status, page, limit });
    }

    @Put('users/:id/status')
    @ApiOperation({ summary: 'Update user status (activate, suspend, archive, delete)' })
    async updateUserStatus(
        @Param('id') userId: string,
        @Body() dto: UpdateUserStatusDto,
        @Request() req,
    ) {
        return this.adminService.updateUserStatus(userId, dto, req.user.sub);
    }

    @Post('users/bulk-action')
    @ApiOperation({ summary: 'Perform bulk action on multiple users' })
    async bulkAction(@Body() dto: BulkActionDto, @Request() req) {
        return this.adminService.bulkAction(dto, req.user.sub);
    }

    @Post('users/invite')
    @ApiOperation({ summary: 'Invite a new user' })
    async inviteUser(@Body() dto: InviteUserDto, @Request() req) {
        return this.adminService.inviteUser(dto, req.user.sub);
    }

    @Post('users/bulk-invite')
    @ApiOperation({ summary: 'Bulk invite multiple users' })
    async bulkInviteUsers(@Body() dto: BulkInviteUserDto, @Request() req) {
        return this.adminService.bulkInviteUsers(dto, req.user.sub);
    }

    @Put('users/:id')
    @ApiOperation({ summary: 'Update user details' })
    async updateUser(
        @Param('id') userId: string,
        @Body() dto: UpdateUserDto,
        @Request() req,
    ) {
        return this.adminService.updateUser(userId, dto, req.user.sub);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete a user permanently' })
    async deleteUser(@Param('id') userId: string, @Request() req) {
        return this.adminService.deleteUser(userId, req.user.sub);
    }

    @Post('users/:id/reset-password')
    @ApiOperation({ summary: 'Reset user password' })
    async resetPassword(@Param('id') userId: string, @Request() req) {
        return this.adminService.resetPassword(userId, req.user.sub);
    }

    // ─── CONTENT MODERATION ─────────────────────────────────────────────

    @Get('moderation/queue')
    @ApiOperation({ summary: 'Get content moderation queue' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getModerationQueue(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
        return this.adminService.getModerationQueue(page, limit);
    }

    // ─── SYSTEM SETTINGS ────────────────────────────────────────────────

    @Get('settings')
    @ApiOperation({ summary: 'Get current system settings' })
    async getSystemSettings() {
        return this.adminService.getSystemSettings();
    }

    @Put('settings')
    @ApiOperation({ summary: 'Update system settings' })
    async updateSystemSettings(@Body() dto: SystemSettingsDto, @Request() req) {
        return this.adminService.updateSystemSettings(dto, req.user.sub);
    }

    // ─── AUDIT LOGS ─────────────────────────────────────────────────────

    @Get('audit-logs')
    @ApiOperation({ summary: 'Get system audit logs' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'actorId', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getAuditLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
        @Query('action') action?: string,
        @Query('actorId') actorId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.adminService.getAuditLogs(page, limit, { action, actorId, startDate, endDate });
    }

    // ─── BACKGROUND TASKS ───────────────────────────────────────────────

    @Post('tasks/cleanup')
    @ApiOperation({ summary: 'Trigger manual cleanup of old data' })
    async triggerCleanup(@Request() req) {
        await this.adminService.cleanupOldData();
        return { message: 'Cleanup job triggered successfully' };
    }

    // ─── TEACHER-CLASS ALLOCATION ───────────────────────────────────────

    @Get('teacher-class-allocations')
    @ApiOperation({ summary: 'Get all teacher-class allocations' })
    async getTeacherClassAllocations(
        @Query('teacherId') teacherId?: string,
        @Query('classId') classId?: string,
    ) {
        return this.adminService.getTeacherClassAllocations(teacherId, classId);
    }

    @Post('teacher-class-allocations')
    @ApiOperation({ summary: 'Assign a teacher to a class' })
    async assignTeacherToClass(
        @Body() dto: { teacherId: string; classId: string; isPrimary?: boolean },
        @Request() req,
    ) {
        return this.adminService.assignTeacherToClass(dto, req.user.sub);
    }

    @Delete('teacher-class-allocations/:id')
    @ApiOperation({ summary: 'Remove a teacher from a class' })
    async removeTeacherFromClass(@Param('id') id: string) {
        return this.adminService.removeTeacherFromClass(id);
    }

    @Get('teachers/available')
    @ApiOperation({ summary: 'Get all teachers with their class assignments' })
    async getTeachersWithClasses() {
        return this.adminService.getTeachersWithClasses();
    }

    @Get('classes/with-teachers')
    @ApiOperation({ summary: 'Get all classes with their assigned teachers' })
    async getClassesWithTeachers() {
        return this.adminService.getClassesWithTeachers();
    }
}
