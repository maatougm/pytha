import { IsString, IsNotEmpty, MaxLength, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export enum ReportStatus {
    PENDING = 'pending',
    INVESTIGATING = 'investigating',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}

export enum ReportReason {
    SPAM = 'spam',
    HARASSMENT = 'harassment',
    INAPPROPRIATE_CONTENT = 'inappropriate_content',
    IMPERSONATION = 'impersonation',
    OTHER = 'other',
}

export class ReportChannelDto {
    @IsString({ message: 'Reason must be a string' })
    @IsNotEmpty({ message: 'Reason is required' })
    @MaxLength(1000, { message: 'Reason cannot exceed 1000 characters' })
    @SanitizePlainText()
    reason: string;

    @IsOptional()
    @IsEnum(ReportReason, { message: 'Invalid report reason category' })
    category?: ReportReason;

    @IsOptional()
    @IsString({ message: 'Reported message ID must be a string' })
    @IsUUID('4', { message: 'Invalid message ID' })
    messageId?: string;
}

export class UpdateReportStatusDto {
    @IsString({ message: 'Status must be a string' })
    @IsNotEmpty({ message: 'Status is required' })
    @IsEnum(ReportStatus, { message: 'Status must be one of: pending, investigating, resolved, dismissed' })
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';

    @IsOptional()
    @IsString({ message: 'Resolution must be a string' })
    @MaxLength(2000, { message: 'Resolution cannot exceed 2000 characters' })
    @SanitizeHtml()
    resolution?: string;
}
