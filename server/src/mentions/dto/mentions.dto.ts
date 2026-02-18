import { IsOptional, IsBoolean, IsInt, Min, IsUUID, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

/**
 * DTO for creating a mention
 */
export class CreateMentionDto {
    @IsUUID()
    messageId: string;

    @IsUUID()
    mentionedUserId: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    mentionText?: string;
}

/**
 * DTO for getting user mentions with pagination and filters
 */
export class GetMentionsQueryDto {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    unreadOnly?: boolean = false;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 20;
}

/**
 * DTO for marking multiple mentions as read
 */
export class MarkMentionsAsReadDto {
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    mentionIds?: string[];
}

/**
 * Response DTO for a single mention
 */
export class MentionResponseDto {
    id: string;
    messageId: string;
    mentionedUserId: string;
    mentionText: string | null;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
    message?: {
        id: string;
        content: string;
        channelId: string;
        createdAt: Date;
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        channel: {
            id: string;
            name: string | null;
            type: string;
        };
    };
}

/**
 * Response DTO for paginated mentions list
 */
export class MentionsListResponseDto {
    mentions: MentionResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        unreadCount: number;
    };
}

/**
 * Response DTO for unread mention count
 */
export class UnreadMentionCountResponseDto {
    count: number;
}

/**
 * Response DTO for marking mentions as read
 */
export class MarkAsReadResponseDto {
    success: boolean;
    markedCount?: number;
    message?: string;
}

/**
 * Parsed mention data
 */
export interface ParsedMention {
    raw: string;
    username?: string;
    fullName?: string;
}
