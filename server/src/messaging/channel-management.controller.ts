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
import { ChannelManagementService } from './channel-management.service';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
    CreateChannelDto,
    ChannelRequestDto,
    MuteUserDto,
    ApproveChannelDto,
    RejectChannelDto,
    GetConversationsQueryDto,
} from './dto/create-message.dto';

@ApiTags('Channel Management')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelManagementController {
    constructor(
        private channelManagementService: ChannelManagementService,
        private messagingService: MessagingService,
    ) {}

    // ─── CHANNEL CREATION ───────────────────────────────────────────────

    @Post()
    @ApiOperation({ summary: 'Create a new channel' })
    async createChannel(@Body() dto: CreateChannelDto, @Request() req) {
        return this.channelManagementService.createChannel(
            dto,
            req.user.sub,
            req.user.roles,
        );
    }

    @Post('request')
    @ApiOperation({ summary: 'Request a new conversation (requires admin approval)' })
    async requestChannel(@Body() dto: ChannelRequestDto, @Request() req) {
        return this.channelManagementService.createDirectMessage(
            {
                type: dto.type,
                name: dto.name,
                description: dto.description,
                memberIds: dto.memberIds,
            },
            req.user.sub,
            req.user.roles,
        );
    }

    @Post('podcast')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Create a podcast channel (admin only)' })
    async createPodcastChannel(
        @Body() dto: { name: string; description?: string },
        @Request() req,
    ) {
        return this.channelManagementService.createPodcastChannel(
            dto.name,
            dto.description || '',
            req.user.sub,
        );
    }

    @Post('classroom')
    @ApiOperation({ summary: 'Create a classroom channel' })
    async createClassroomChannel(
        @Body() dto: { name: string; description?: string; classId: string; maxStudents?: number },
        @Request() req,
    ) {
        return this.channelManagementService.createClassroomChannel(
            dto.name,
            dto.description || '',
            dto.classId,
            req.user.sub,
            dto.maxStudents || 30,
        );
    }

    // ─── CHANNEL APPROVAL (ADMIN) ───────────────────────────────────────

    @Get('pending')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Get all pending channel requests (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'type', required: false })
    async getPendingChannels(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
        @Query('type') type?: string,
    ) {
        return this.channelManagementService.getPendingChannels({ page, limit, type });
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Approve a channel request (admin only)' })
    async approveChannel(@Param('id') channelId: string, @Request() req) {
        return this.channelManagementService.approveChannel(channelId, req.user.sub);
    }

    @Post(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Reject a channel request (admin only)' })
    async rejectChannel(
        @Param('id') channelId: string,
        @Body() dto: { reason: string },
        @Request() req,
    ) {
        return this.channelManagementService.rejectChannel(channelId, req.user.sub, dto.reason);
    }

    // ─── MUTE FUNCTIONALITY ─────────────────────────────────────────────

    @Post(':id/mute')
    @ApiOperation({ summary: 'Mute a user in this channel' })
    async muteUser(
        @Param('id') channelId: string,
        @Body() dto: MuteUserDto,
        @Request() req,
    ) {
        return this.channelManagementService.muteUser(
            channelId,
            dto,
            req.user.sub,
            req.user.roles,
        );
    }

    @Post(':id/mute-all')
    @ApiOperation({ summary: 'Mute all students in this classroom channel' })
    async muteAllStudents(
        @Param('id') channelId: string,
        @Body() dto: { duration?: number; reason?: string },
        @Request() req,
    ) {
        return this.channelManagementService.muteAllStudents(
            channelId,
            req.user.sub,
            req.user.roles,
            dto.duration,
            dto.reason,
        );
    }

    @Post(':id/unmute/:userId')
    @ApiOperation({ summary: 'Unmute a user' })
    async unmuteUser(
        @Param('id') channelId: string,
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.channelManagementService.unmuteUser(
            channelId,
            userId,
            req.user.sub,
            req.user.roles,
        );
    }

    @Post(':id/unmute-all')
    @ApiOperation({ summary: 'Unmute all students' })
    async unmuteAllStudents(@Param('id') channelId: string, @Request() req) {
        return this.channelManagementService.unmuteAllStudents(
            channelId,
            req.user.sub,
            req.user.roles,
        );
    }

    @Get(':id/mutes')
    @ApiOperation({ summary: 'Get list of muted users in this channel' })
    async getChannelMutes(@Param('id') channelId: string) {
        return this.channelManagementService.getChannelMutes(channelId);
    }

    // ─── ADMIN CONVERSATION MONITORING ──────────────────────────────────

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Get all conversations with filters (admin only)' })
    async getAllConversations(
        @Query() query: GetConversationsQueryDto,
        @Request() req,
    ) {
        return this.channelManagementService.getAllConversations({
            page: query.page,
            limit: query.limit,
            type: query.type,
            status: query.status,
            search: query.search,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        });
    }

    @Get('admin/:id/details')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Get detailed conversation view with messages (admin only)' })
    async getConversationDetails(@Param('id') channelId: string) {
        return this.channelManagementService.getConversationDetails(channelId);
    }

    // ─── REGULAR CHANNEL OPERATIONS ─────────────────────────────────────

    @Get('my/pending')
    @ApiOperation({ summary: 'Get my pending channel requests' })
    async getMyPendingRequests(@Request() req) {
        return this.channelManagementService.getAllConversations({
            status: 'pending',
        }).then(result => ({
            channels: result.channels.filter(c => 
                c.createdBy === req.user.sub || c.requestedBy === req.user.sub
            ),
            total: result.channels.filter(c => 
                c.createdBy === req.user.sub || c.requestedBy === req.user.sub
            ).length,
        }));
    }
}
