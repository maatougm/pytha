import { IsBoolean, IsNumber, IsOptional, IsArray, IsString, MaxLength } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class SystemSettingsDto {
    @IsOptional()
    @IsBoolean()
    maintenanceMode?: boolean;

    @IsOptional()
    @IsBoolean()
    allowRegistration?: boolean;

    @IsOptional()
    @IsBoolean()
    requireApproval?: boolean;

    @IsOptional()
    @IsNumber()
    maxFileSize?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @MaxLength(50, { each: true })
    // Array items will be sanitized individually via class-transformer
    allowedFileTypes?: string[];

    @IsOptional()
    @IsNumber()
    maxStoragePerUser?: number;
}
