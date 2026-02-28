import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID, IsInt, Min, Max, IsNotEmpty, MaxLength, ArrayMaxSize, IsIn } from 'class-validator';
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
    @IsString({ message: 'File name must be a string' })
    @IsNotEmpty({ message: 'File name is required' })
    @MaxLength(255, { message: 'File name cannot exceed 255 characters' })
    @SanitizePlainText()
    fileName: string;

    @IsString({ message: 'File type must be a string' })
    @IsNotEmpty({ message: 'File type is required' })
    @MaxLength(100, { message: 'File type cannot exceed 100 characters' })
    @SanitizePlainText()
    fileType: string;

    @IsString({ message: 'File path must be a string' })
    @IsNotEmpty({ message: 'File path is required' })
    @MaxLength(500, { message: 'File path cannot exceed 500 characters' })
    @SanitizePlainText()
    filePath: string;

    @IsOptional()
    @IsString({ message: 'URL must be a string' })
    @MaxLength(1000, { message: 'URL cannot exceed 1000 characters' })
    @SanitizePlainText()
    url?: string;

    @IsOptional()
    @IsInt({ message: 'Duration must be an integer' })
    @Min(0, { message: 'Duration cannot be negative' })
    @Max(3600, { message: 'Duration cannot exceed 3600 seconds' })
    duration?: number; // For voice messages

    @IsOptional()
    @IsInt({ message: 'Width must be an integer' })
    @Min(1, { message: 'Width must be at least 1' })
    @Max(10000, { message: 'Width cannot exceed 10000' })
    width?: number; // For images

    @IsOptional()
    @IsInt({ message: 'Height must be an integer' })
    @Min(1, { message: 'Height must be at least 1' })
    @Max(10000, { message: 'Height cannot exceed 10000' })
    height?: number; // For images
}

export class CreateMessageDto {
    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(4000, { message: 'Message cannot exceed 4000 characters' })
    @SanitizeHtml()
    content: string;

    @IsOptional()
    @IsEnum(ContentType, { message: 'Invalid content type' })
    contentType?: ContentType = ContentType.TEXT;

    @IsOptional()
    @IsUUID('4', { message: 'Invalid reply message ID' })
    replyTo?: string;

    @IsOptional()
    @IsArray({ message: 'Attachments must be an array' })
    @ArrayMaxSize(10, { message: 'Cannot attach more than 10 files' })
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    attachments?: AttachmentDto[];
}

export class CreateChannelDto {
    @IsString({ message: 'Channel type must be a string' })
    @IsIn(['podcast', 'classroom', 'class_broadcast', 'direct_message', 'teacher_parent', 'teacher_student', 'admin_broadcast', 'group'], 
        { message: 'Invalid channel type' })
    type: 'podcast' | 'classroom' | 'class_broadcast' | 'direct_message' | 'teacher_parent' | 'teacher_student' | 'admin_broadcast' | 'group';

    @IsString({ message: 'Channel name must be a string' })
    @IsNotEmpty({ message: 'Channel name is required' })
    @MaxLength(200, { message: 'Channel name cannot exceed 200 characters' })
    @SanitizePlainText()
    name: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsOptional()
    @IsArray({ message: 'Member IDs must be an array' })
    @ArrayMaxSize(500, { message: 'Cannot add more than 500 members at once' })
    @IsUUID('4', { each: true, message: 'Invalid member ID in array' })
    memberIds?: string[];

    @IsOptional()
    @IsUUID('4', { message: 'Invalid class ID' })
    classId?: string;

    @IsOptional()
    @IsInt({ message: 'Max members must be an integer' })
    @Min(2, { message: 'Max members must be at least 2' })
    @Max(1000, { message: 'Max members cannot exceed 1000' })
    maxMembers?: number;
}

export class ChannelRequestDto {
    @IsString({ message: 'Type must be a string' })
    @IsEnum(ContentType, { message: 'Invalid type' })
    type: 'teacher_parent' | 'teacher_student' | 'group';

    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(200, { message: 'Name cannot exceed 200 characters' })
    @SanitizePlainText()
    name: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsArray({ message: 'Member IDs must be an array' })
    @ArrayMaxSize(100, { message: 'Cannot add more than 100 members at once' })
    @IsUUID('4', { each: true, message: 'Invalid member ID in array' })
    memberIds: string[];

    @IsOptional()
    @IsString({ message: 'Reason must be a string' })
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    @SanitizePlainText()
    reason?: string;
}

export class MuteUserDto {
    @IsUUID('4', { message: 'Invalid user ID' })
    userId: string;

    @IsOptional()
    @IsInt({ message: 'Duration must be an integer' })
    @Min(1, { message: 'Duration must be at least 1 minute' })
    @Max(10080, { message: 'Duration cannot exceed 1 week (10080 minutes)' })
    duration?: number; // minutes

    @IsOptional()
    @IsString({ message: 'Reason must be a string' })
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    @SanitizePlainText()
    reason?: string;
}

export class ApproveChannelDto {
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;
}

export class RejectChannelDto {
    @IsUUID('4', { message: 'Invalid channel ID' })
    channelId: string;

    @IsString({ message: 'Reason must be a string' })
    @IsNotEmpty({ message: 'Reason is required' })
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    @SanitizePlainText()
    reason: string;
}

export class SendMessageDto {
    @IsString({ message: 'Content must be a string' })
    @IsNotEmpty({ message: 'Content is required' })
    @MaxLength(4000, { message: 'Message cannot exceed 4000 characters' })
    @SanitizeHtml()
    content: string;

    @IsOptional()
    @IsString({ message: 'Reply to must be a string' })
    @IsUUID('4', { message: 'Invalid reply message ID' })
    replyTo?: string;
}

export class AddMemberDto {
    @IsString({ message: 'User ID must be a string' })
    @IsNotEmpty({ message: 'User ID is required' })
    @IsUUID('4', { message: 'Invalid user ID' })
    userId: string;

    @IsOptional()
    @IsString({ message: 'Role must be a string' })
    @IsIn(['owner', 'moderator', 'member'], { message: 'Role must be one of: owner, moderator, member' })
    role?: string;
}

export class GetConversationsQueryDto {
    @IsOptional()
    @IsInt({ message: 'Page must be an integer' })
    @Min(1, { message: 'Page must be at least 1' })
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1, { message: 'Limit must be at least 1' })
    @Max(200, { message: 'Limit cannot exceed 200' })
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsString({ message: 'Type must be a string' })
    @MaxLength(50, { message: 'Type cannot exceed 50 characters' })
    @SanitizePlainText()
    type?: string;

    @IsOptional()
    @IsString({ message: 'Status must be a string' })
    @MaxLength(50, { message: 'Status cannot exceed 50 characters' })
    @SanitizePlainText()
    status?: string;

    @IsOptional()
    @IsString({ message: 'Search must be a string' })
    @MaxLength(200, { message: 'Search cannot exceed 200 characters' })
    @SanitizePlainText()
    search?: string;

    @IsOptional()
    @IsString({ message: 'Date from must be a string' })
    dateFrom?: string;

    @IsOptional()
    @IsString({ message: 'Date to must be a string' })
    dateTo?: string;
}
