import {
    Controller,
    Patch,
    Delete,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ModerationController {
    constructor(private moderationService: ModerationService) { }

    // ─── CHANNEL REPORTS ─────────────────────────────────────────
    @Get('reports')
    @ApiOperation({ summary: 'Get channel reports' })
    async getReports(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.moderationService.getReports({
            status,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }

    @Get('reports/stats')
    @ApiOperation({ summary: 'Get report statistics' })
    async getReportStats() {
        return this.moderationService.getReportStats();
    }

    @Patch('reports/:id')
    @ApiOperation({ summary: 'Update report status' })
    async updateReportStatus(
        @Param('id') reportId: string,
        @Body() body: { status: string; resolution?: string },
        @Request() req,
    ) {
        return this.moderationService.updateReportStatus(reportId, body, req.user.sub);
    }

    // ─── EXISTING MODERATION ─────────────────────────────────────
    @Patch('channels/:channelId/mute/:userId')
    async muteUser(
        @Param('channelId') channelId: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.moderationService.muteUser(channelId, userId, req.user.sub);
    }

    @Patch('channels/:channelId/unmute/:userId')
    async unmuteUser(
        @Param('channelId') channelId: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.moderationService.unmuteUser(channelId, userId, req.user.sub);
    }

    @Patch('channels/:channelId/ban/:userId')
    async banUser(
        @Param('channelId') channelId: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.moderationService.banUser(channelId, userId, req.user.sub);
    }

    @Patch('channels/:channelId/unban/:userId')
    async unbanUser(
        @Param('channelId') channelId: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.moderationService.unbanUser(channelId, userId, req.user.sub);
    }

    @Delete('messages/:messageId')
    async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
        return this.moderationService.deleteMessage(messageId, req.user.sub);
    }

    @Patch('channels/:channelId/archive')
    async archiveChannel(@Param('channelId') channelId: string, @Request() req) {
        return this.moderationService.archiveChannel(channelId, req.user.sub);
    }

    @Patch('channels/:channelId/unarchive')
    async unarchiveChannel(@Param('channelId') channelId: string, @Request() req) {
        return this.moderationService.unarchiveChannel(channelId, req.user.sub);
    }

    @Get('channels/:channelId/members')
    async getChannelMembers(@Param('channelId') channelId: string) {
        return this.moderationService.getChannelMembers(channelId);
    }

    @Get('audit-log')
    async getAuditLog(
        @Query('channelId') channelId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.moderationService.getAuditLog(
            channelId,
            limit ? (Number.isNaN(parseInt(limit, 10)) ? 100 : parseInt(limit, 10)) : 100,
            offset ? (Number.isNaN(parseInt(offset, 10)) ? 0 : parseInt(offset, 10)) : 0,
        );
    }
}
