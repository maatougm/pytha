import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export enum ContentType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    VOICE = 'voice',
    MIXED = 'mixed',
}

export class AttachmentDto {
    @IsString()
    @SanitizePlainText()
    fileName: string;

    @IsString()
    @SanitizePlainText()
    fileType: string;

    @IsString()
    @SanitizePlainText()
    filePath: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    url?: string;

    @IsOptional()
    duration?: number; // For voice messages

    @IsOptional()
    width?: number; // For images

    @IsOptional()
    height?: number; // For images
}

export class CreateMessageDto {
    @IsString()
    @SanitizeHtml()
    content: string;

    @IsOptional()
    @IsEnum(ContentType)
    contentType?: ContentType = ContentType.TEXT;

    @IsOptional()
    @IsUUID()
    replyTo?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    attachments?: AttachmentDto[];
}

export class CreateChannelDto {
    @IsString()
    type: 'podcast' | 'classroom' | 'direct_message' | 'teacher_parent' | 'teacher_student' | 'group';

    @IsString()
    @SanitizePlainText()
    name: string;

    @IsOptional()
    @IsString()
    @SanitizeHtml()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    memberIds?: string[];

    @IsOptional()
    @IsUUID()
    @SanitizePlainText()
    classId?: string;

    @IsOptional()
    maxMembers?: number;
}

export class ChannelRequestDto {
    @IsString()
    type: 'teacher_parent' | 'teacher_student' | 'group';

    @IsString()
    @SanitizePlainText()
    name: string;

    @IsOptional()
    @IsString()
    @SanitizeHtml()
    description?: string;

    @IsArray()
    @IsUUID('4', { each: true })
    memberIds: string[];

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}

export class MuteUserDto {
    @IsUUID()
    userId: string;

    @IsOptional()
    duration?: number; // minutes

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}

export class ApproveChannelDto {
    @IsUUID()
    channelId: string;
}

export class RejectChannelDto {
    @IsUUID()
    channelId: string;

    @IsString()
    @SanitizePlainText()
    reason: string;
}

export class GetConversationsQueryDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    type?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    status?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    search?: string;

    @IsOptional()
    dateFrom?: string;

    @IsOptional()
    dateTo?: string;
}
