import {
    Controller,
    Get,
    Patch,
    Body,
    Query,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MentionsService } from './mentions.service';
import { GetMentionsQueryDto, MarkMentionsAsReadDto } from './dto/mentions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Mentions')
@ApiBearerAuth()
@Controller('mentions')
@UseGuards(JwtAuthGuard)
export class MentionsController {
    constructor(private mentionsService: MentionsService) { }

    @Get()
    @ApiOperation({ summary: 'Get current user\'s mentions' })
    @ApiResponse({ status: 200, description: 'Returns paginated list of mentions' })
    async getUserMentions(
        @Request() req,
        @Query() query: GetMentionsQueryDto,
    ) {
        return this.mentionsService.getUserMentions(req.user.sub, {
            unreadOnly: query.unreadOnly,
            page: query.page,
            limit: query.limit,
        });
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get count of unread mentions for current user' })
    @ApiResponse({ status: 200, description: 'Returns unread mention count' })
    async getUnreadCount(@Request() req) {
        const count = await this.mentionsService.getUnreadMentionCount(req.user.sub);
        return { count };
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark a specific mention as read' })
    @ApiResponse({ status: 200, description: 'Mention marked as read' })
    @ApiResponse({ status: 404, description: 'Mention not found' })
    async markMentionAsRead(
        @Param('id') mentionId: string,
        @Request() req,
    ) {
        return this.mentionsService.markMentionAsRead(mentionId, req.user.sub);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all mentions as read for current user' })
    @ApiResponse({ status: 200, description: 'All mentions marked as read' })
    async markAllMentionsAsRead(@Request() req) {
        return this.mentionsService.markAllMentionsAsRead(req.user.sub);
    }

    @Patch('bulk-read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark specific mentions as read' })
    @ApiResponse({ status: 200, description: 'Specified mentions marked as read' })
    async markMentionsAsRead(
        @Body() dto: MarkMentionsAsReadDto,
        @Request() req,
    ) {
        if (!dto.mentionIds || dto.mentionIds.length === 0) {
            return { success: true, markedCount: 0 };
        }
        return this.mentionsService.markMentionsAsRead(req.user.sub, dto.mentionIds);
    }
}
