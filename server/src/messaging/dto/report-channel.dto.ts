import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export class ReportChannelDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    @SanitizePlainText()
    reason: string;
}

export class UpdateReportStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';

    @IsString()
    @MaxLength(2000)
    @SanitizeHtml()
    resolution?: string;
}
