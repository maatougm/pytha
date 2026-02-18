import { IsString, IsUUID, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ContentType } from './create-message.dto';

/**
 * C7: Typed DTOs for all WebSocket message events.
 * Applied via @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
 * on the gateway class to strip unknown fields and reject malformed payloads.
 */

export class WsSendMessageDto {
    @IsUUID()
    channelId: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsUUID()
    replyTo?: string;

    @IsOptional()
    @IsEnum(ContentType)
    contentType?: ContentType;
}

export class WsEditMessageDto {
    @IsUUID()
    messageId: string;

    @IsString()
    content: string;
}

export class WsDeleteMessageDto {
    @IsUUID()
    messageId: string;
}

export class WsJoinChannelDto {
    @IsUUID()
    channelId: string;
}

export class WsTypingDto {
    @IsUUID()
    channelId: string;
}

export class WsReactionDto {
    @IsUUID()
    messageId: string;

    @IsString()
    reaction: string;
}

export class WsReadReceiptDto {
    @IsUUID()
    messageId: string;

    @IsUUID()
    channelId: string;
}

export class WsReadBulkDto {
    @IsUUID()
    channelId: string;

    @IsArray()
    @IsUUID('4', { each: true })
    messageIds: string[];
}
