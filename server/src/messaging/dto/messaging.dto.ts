import { IsString, IsOptional, IsIn, MaxLength, IsArray, ArrayMaxSize, IsUUID } from 'class-validator';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class CreateChannelDto {
    @IsString()
    @IsIn(['teacher_parent', 'teacher_admin', 'class_broadcast', 'admin_broadcast'])
    type: string;

    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Channel name cannot exceed 200 characters' })
    @SanitizePlainText()
    name?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    classId?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(100, { message: 'Cannot add more than 100 members at once' })
    @IsString({ each: true })
    memberIds?: string[];
}

export class SendMessageDto {
    @IsString()
    @MaxLength(4000, { message: 'Message cannot exceed 4000 characters' })
    @SanitizeHtml()
    content: string;

    @IsOptional()
    @IsString()
    @IsUUID('4', { message: 'Invalid reply message ID' })
    replyTo?: string;
}

export class AddMemberDto {
    @IsString()
    @IsUUID('4', { message: 'Invalid user ID' })
    userId: string;

    @IsOptional()
    @IsString()
    @IsIn(['owner', 'moderator', 'member'])
    role?: string;
}
