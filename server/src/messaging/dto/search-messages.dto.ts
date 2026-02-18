import { IsString, IsOptional, IsDateString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
    /**
     * Search query string supporting phrase matching and boolean operators
     * Examples:
     *   - "homework assignment" (phrase)
     *   - math OR algebra (boolean OR)
     *   - exam -midterm (exclude midterm)
     *   - "final exam" AND grade (combined)
     */
    @IsString()
    q: string;

    /**
     * Filter messages sent after this date (ISO 8601 format)
     * @example "2026-01-01T00:00:00Z"
     */
    @IsOptional()
    @IsDateString()
    from?: string;

    /**
     * Filter messages sent before this date (ISO 8601 format)
     * @example "2026-12-31T23:59:59Z"
     */
    @IsOptional()
    @IsDateString()
    to?: string;

    /**
     * Filter by sender user ID (UUID format)
     */
    @IsOptional()
    @IsUUID('4', { message: 'Invalid sender user ID format' })
    sender?: string;

    /**
     * Page number for pagination (1-based)
     * @default 1
     */
    @IsOptional()
    @IsInt({ message: 'Page must be an integer' })
    @Min(1, { message: 'Page must be at least 1' })
    @Type(() => Number)
    page?: number = 1;

    /**
     * Number of results per page (max 100)
     * @default 20
     */
    @IsOptional()
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1, { message: 'Limit must be at least 1' })
    @Type(() => Number)
    limit?: number = 20;
}

export interface SearchResultMessage {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    contentType: string;
    replyTo: string | null;
    isDeleted: boolean;
    editedAt: Date | null;
    createdAt: Date;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    };
    highlights: string[];
    rank: number;
}

export interface SearchMessagesResponse {
    messages: SearchResultMessage[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        query: string;
    };
}
