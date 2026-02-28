import { IsString, IsUUID, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, Min, Max, IsNotEmpty, MaxLength, ArrayMaxSize } from 'class-validator';
import { ContentType } from './create-message.dto';

/**
 * C7: Typed DTOs for all WebSocket message events.
 * Applied via @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
 * on the gateway class to strip unknown fields and reject malformed payloads.
 */

export class WsSendMessageDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;

    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(4000, { message: 'Message cannot exceed 4000 characters' })
    content: string;

    @IsOptional()
    @IsString({ message: 'Reply to must be a string' })
    @IsUUID('4', { message: 'Invalid reply message ID' })
    replyTo?: string;

    @IsOptional()
    @IsEnum(ContentType, { message: 'Invalid content type' })
    contentType?: ContentType;
}

export class WsEditMessageDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsNotEmpty({ message: 'Message ID is required' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(4000, { message: 'Message cannot exceed 4000 characters' })
    content: string;
}

export class WsDeleteMessageDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsNotEmpty({ message: 'Message ID is required' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsOptional()
    @IsBoolean({ message: 'Soft delete must be a boolean' })
    softDelete?: boolean = true;
}

export class WsJoinChannelDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

export class WsLeaveChannelDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

export class WsTypingDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

export class WsReactionDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsNotEmpty({ message: 'Message ID is required' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsString({ message: 'Reaction must be a string' })
    @IsNotEmpty({ message: 'Reaction is required' })
    @MaxLength(50, { message: 'Reaction cannot exceed 50 characters' })
    reaction: string;
}

export class WsRemoveReactionDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsNotEmpty({ message: 'Message ID is required' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsString({ message: 'Reaction must be a string' })
    @IsNotEmpty({ message: 'Reaction is required' })
    @MaxLength(50, { message: 'Reaction cannot exceed 50 characters' })
    reaction: string;
}

export class WsReadReceiptDto {
    @IsString({ message: 'Message ID must be a string' })
    @IsNotEmpty({ message: 'Message ID is required' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId: string;

    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

export class WsReadBulkDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;

    @IsArray({ message: 'Message IDs must be an array' })
    @ArrayMaxSize(100, { message: 'Cannot mark more than 100 messages as read at once' })
    @IsUUID('4', { each: true, message: 'Invalid message ID in array' })
    messageIds: string[];
}

export class WsGetTypingDto {
    @IsString({ message: 'Channel ID must be a string' })
    @IsNotEmpty({ message: 'Channel ID is required' })
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}
