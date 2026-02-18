import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength, IsEnum } from 'class-validator';

/**
 * @deprecated Use FileUploadDto from file-upload.dto.ts instead
 */
export class UploadFileDto {
    @IsString()
    @MaxLength(255, { message: 'Original name cannot exceed 255 characters' })
    originalName: string;

    @IsString()
    @MaxLength(100, { message: 'MIME type cannot exceed 100 characters' })
    mimeType: string;

    @IsString()
    @MaxLength(50, { message: 'Category cannot exceed 50 characters' })
    category: string;

    @IsOptional()
    @IsString()
    @IsUUID('4', { message: 'Invalid related ID' })
    relatedId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Related type cannot exceed 50 characters' })
    relatedType?: string;
}

export class SetFilePermissionDto {
    @IsOptional()
    @IsUUID('4', { message: 'Invalid user ID' })
    userId?: string;

    @IsOptional()
    @IsUUID('4', { message: 'Invalid role ID' })
    roleId?: string;

    @IsOptional()
    @IsBoolean()
    canView?: boolean;

    @IsOptional()
    @IsBoolean()
    canEdit?: boolean;

    @IsOptional()
    @IsBoolean()
    canDelete?: boolean;
}

// Re-export new DTOs
export { 
    FileUploadDto, 
    FileUploadCategory, 
    FileVisibility, 
    UpdateFileMetadataDto,
    BatchFileOperationDto,
    FileUploadResponseDto,
    UploadQuotaDto,
    FilePreviewDto
} from './file-upload.dto';
