import { IsString, IsUUID, IsOptional, IsArray, ArrayMaxSize } from 'class-validator';

/**
 * DTO for marking a message as read
 */
export class MarkMessageReadDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsOptional()
    @IsString({ message: 'Channel ID must be a string' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId?: string;
}

/**
 * DTO for marking multiple messages as read
 */
export class MarkMessagesReadDto {
    @IsArray({ message: 'Message IDs must be an array' })
    @ArrayMaxSize(100, { message: 'Cannot mark more than 100 messages as read at once' })
    @IsString({ each: true, message: 'Each message ID must be a string' })
    @IsUUID('4', { each: true, message: 'Invalid message ID in array' })
    messageIds: string[];

    @IsString({ message: 'Channel ID must be a string' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

/**
 * Response DTO for read receipt
 */
export class ReadReceiptResponseDto {
    messageId: string;
    channelId: string;
    readBy: {
        userId: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string | null;
        readAt: Date;
    }[];
    readCount: number;
    totalMembers: number;
}

/**
 * Response DTO for channel read status
 */
export class ChannelReadStatusDto {
    channelId: string;
    messages: {
        messageId: string;
        readBy: string[]; // Array of user IDs who read this message
        readCount: number;
    }[];
    unreadCount: number;
}

/**
 * Response DTO for typing indicator
 */
export class TypingIndicatorDto {
    channelId: string;
    users: {
        userId: string;
        userName: string;
    }[];
}

/**
 * WebSocket DTO for typing start/stop events
 */
export class TypingEventDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}
