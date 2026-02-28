import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateChannelDto, SendMessageDto, AddMemberDto } from './dto/create-message.dto';
import { AddReactionDto } from './dto/reaction.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { ReportChannelDto, UpdateReportStatusDto } from './dto/report-channel.dto';
import { MarkMessagesReadDto } from './dto/read-receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard)
export class MessagingController {
    constructor(private messagingService: MessagingService) { }

    @Post()
    async createChannel(@Body() dto: CreateChannelDto, @Request() req) {
        return this.messagingService.createChannel(dto, req.user.sub, req.user.roles);
    }

    @Get()
    async getUserChannels(@Request() req) {
        return this.messagingService.getUserChannels(req.user.sub);
    }

    @Get('my')
    async getMyChannels(@Request() req) {
        return this.messagingService.getUserChannelsWithUnread(req.user.sub);
    }

    @Get(':id')
    async getChannel(@Param('id') id: string, @Request() req) {
        return this.messagingService.getChannel(id, req.user.sub);
    }

    @Get(':id/members')
    async getChannelMembers(@Param('id') id: string, @Request() req) {
        return this.messagingService.getChannelMembers(id, req.user.sub);
    }

    @Post(':id/members')
    async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
        return this.messagingService.addMember(id, dto.userId, dto.role);
    }

    @Delete(':id/members/:userId')
    async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.messagingService.removeMember(id, userId);
    }

    @Get(':id/messages')
    async getMessages(
        @Param('id') id: string,
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagingService.getMessages(
            id,
            req.user.sub,
            cursor,
            limit ? parseInt(limit) : 50,
        );
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req) {
        return this.messagingService.markChannelAsRead(id, req.user.sub);
    }

    // ─── READ RECEIPTS ─────────────────────────────────────────

    @Post('messages/:messageId/read')
    @ApiOperation({ summary: 'Mark a specific message as read' })
    async markMessageAsRead(
        @Param('messageId') messageId: string,
        @Request() req,
    ) {
        return this.messagingService.markMessageAsRead(messageId, req.user.sub);
    }

    @Post(':id/messages/read')
    @ApiOperation({ summary: 'Mark multiple messages as read' })
    async markMessagesAsRead(
        @Param('id') id: string,
        @Body() dto: MarkMessagesReadDto,
        @Request() req,
    ) {
        return this.messagingService.markMessagesAsRead(dto.messageIds, id, req.user.sub);
    }

    @Get('messages/:messageId/read-receipts')
    @ApiOperation({ summary: 'Get read receipts for a message' })
    async getMessageReadReceipts(
        @Param('messageId') messageId: string,
        @Request() req,
    ) {
        return this.messagingService.getMessageReadReceipts(messageId, req.user.sub);
    }

    @Get(':id/read-status')
    @ApiOperation({ summary: 'Get read status for messages in a channel' })
    async getChannelReadStatus(
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.messagingService.getChannelReadStatus(id, req.user.sub);
    }

    @Get(':id/messages/with-receipts')
    @ApiOperation({ summary: 'Get messages with read receipts included' })
    async getMessagesWithReadReceipts(
        @Param('id') id: string,
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagingService.getMessagesWithReadReceipts(
            id,
            req.user.sub,
            cursor,
            limit ? parseInt(limit) : 50,
        );
    }

    @Post(':id/messages')
    async sendMessage(
        @Param('id') id: string,
        @Body() dto: SendMessageDto,
        @Request() req,
    ) {
        return this.messagingService.sendMessage(id, req.user.sub, dto);
    }

    @Patch('messages/:messageId')
    async editMessage(
        @Param('messageId') messageId: string,
        @Body('content') content: string,
        @Request() req,
    ) {
        return this.messagingService.editMessage(messageId, req.user.sub, content);
    }

    @Delete('messages/:messageId')
    async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
        return this.messagingService.deleteMessage(messageId, req.user.sub, req.user.roles);
    }

    // ─── REACTIONS ─────────────────────────────────────────────

    @Post('messages/:messageId/reactions')
    async addReaction(
        @Param('messageId') messageId: string,
        @Body() dto: AddReactionDto,
        @Request() req,
    ) {
        return this.messagingService.addReaction(messageId, req.user.sub, dto);
    }

    @Delete('messages/:messageId/reactions/:reaction')
    async removeReaction(
        @Param('messageId') messageId: string,
        @Param('reaction') reaction: string,
        @Request() req,
    ) {
        return this.messagingService.removeReaction(messageId, req.user.sub, reaction);
    }

    @Get('messages/:messageId/reactions')
    async getReactions(
        @Param('messageId') messageId: string,
        @Request() req,
    ) {
        return this.messagingService.getReactions(messageId, req.user.sub);
    }

    // ─── EDIT HISTORY ──────────────────────────────────────────

    @Get('messages/:messageId/history')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getEditHistory(
        @Param('messageId') messageId: string,
        @Request() req,
    ) {
        return this.messagingService.getEditHistory(messageId, req.user.sub);
    }

    @Get(':id/search')
    @ApiOperation({ summary: 'Search messages in a channel using full-text search' })
    async searchMessages(
        @Param('id') id: string,
        @Query() dto: SearchMessagesDto,
        @Request() req,
    ) {
        return this.messagingService.searchMessages(id, req.user.sub, dto);
    }

    // ─── REPORTS ───────────────────────────────────────────────

    @Post(':id/report')
    async reportChannel(
        @Param('id') id: string,
        @Body() dto: ReportChannelDto,
        @Request() req,
    ) {
        return this.messagingService.reportChannel(id, req.user.sub, dto.reason);
    }

    @Get(':id/full-history')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getChannelFullHistory(
        @Param('id') id: string,
        @Request() req,
    ) {
        return this.messagingService.getChannelFullHistory(id, req.user.sub);
    }

    @Get('admin/reports')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async getAllReports(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagingService.getAllReports(
            status,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Patch('admin/reports/:reportId')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async updateReportStatus(
        @Param('reportId') reportId: string,
        @Body() dto: UpdateReportStatusDto,
        @Request() req,
    ) {
        return this.messagingService.updateReportStatus(reportId, req.user.sub, dto);
    }
}
