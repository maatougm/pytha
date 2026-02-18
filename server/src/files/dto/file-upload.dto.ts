import { IsString, IsOptional, IsEnum, IsUUID, MaxLength, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * File upload categories for organization and access control
 */
export enum FileUploadCategory {
    ASSIGNMENT_SUBMISSION = 'assignment_submission',
    COURSE_MATERIAL = 'course_material',
    SHARED_DOCUMENT = 'shared_document',
    PROFILE_PICTURE = 'profile_picture',
    ANNOUNCEMENT_ATTACHMENT = 'announcement_attachment',
    MESSAGE_ATTACHMENT = 'message_attachment',
    GENERAL = 'general',
}

/**
 * File visibility settings
 */
export enum FileVisibility {
    PRIVATE = 'private',
    PUBLIC = 'public',
    RESTRICTED = 'restricted',
}

/**
 * DTO for file upload requests
 */
export class FileUploadDto {
    @ApiProperty({
        description: 'Original filename',
        example: 'homework.pdf',
        maxLength: 255,
    })
    @IsString()
    @MaxLength(255, { message: 'Original name cannot exceed 255 characters' })
    originalName: string;

    @ApiProperty({
        description: 'MIME type of the file',
        example: 'application/pdf',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100, { message: 'MIME type cannot exceed 100 characters' })
    mimeType: string;

    @ApiProperty({
        description: 'File category for organization',
        enum: FileUploadCategory,
        example: FileUploadCategory.ASSIGNMENT_SUBMISSION,
    })
    @IsEnum(FileUploadCategory, { 
        message: `Category must be one of: ${Object.values(FileUploadCategory).join(', ')}` 
    })
    category: FileUploadCategory;

    @ApiPropertyOptional({
        description: 'Visibility level for the file',
        enum: FileVisibility,
        default: FileVisibility.PRIVATE,
    })
    @IsOptional()
    @IsEnum(FileVisibility, { 
        message: `Visibility must be one of: ${Object.values(FileVisibility).join(', ')}` 
    })
    visibility?: FileVisibility = FileVisibility.PRIVATE;

    @ApiPropertyOptional({
        description: 'ID of related entity (assignment, course, etc.)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsString()
    @IsUUID('4', { message: 'Invalid related ID format' })
    relatedId?: string;

    @ApiPropertyOptional({
        description: 'Type of related entity',
        example: 'assignment',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Related type cannot exceed 50 characters' })
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'Description or notes about the file',
        example: 'Student assignment submission for Week 3',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    description?: string;

    @ApiPropertyOptional({
        description: 'Whether to generate a thumbnail for this file (images only)',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    generateThumbnail?: boolean = true;

    @ApiPropertyOptional({
        description: 'Custom thumbnail dimensions (width)',
        minimum: 50,
        maximum: 1024,
        default: 200,
    })
    @IsOptional()
    @IsInt()
    @Min(50, { message: 'Thumbnail width must be at least 50px' })
    @Max(1024, { message: 'Thumbnail width cannot exceed 1024px' })
    thumbnailWidth?: number = 200;

    @ApiPropertyOptional({
        description: 'Custom thumbnail dimensions (height)',
        minimum: 50,
        maximum: 1024,
        default: 200,
    })
    @IsOptional()
    @IsInt()
    @Min(50, { message: 'Thumbnail height must be at least 50px' })
    @Max(1024, { message: 'Thumbnail height cannot exceed 1024px' })
    thumbnailHeight?: number = 200;

    @ApiPropertyOptional({
        description: 'Whether to skip virus scanning (admin only)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    skipVirusScan?: boolean = false;

    @ApiPropertyOptional({
        description: 'Tags for file organization (comma-separated)',
        example: 'math, homework, grade-5',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Tags cannot exceed 500 characters' })
    tags?: string;
}

/**
 * DTO for file metadata updates
 */
export class UpdateFileMetadataDto {
    @ApiPropertyOptional({
        description: 'Updated filename',
        example: 'renamed-document.pdf',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Original name cannot exceed 255 characters' })
    originalName?: string;

    @ApiPropertyOptional({
        description: 'Updated file category',
        enum: FileUploadCategory,
    })
    @IsOptional()
    @IsEnum(FileUploadCategory, { 
        message: `Category must be one of: ${Object.values(FileUploadCategory).join(', ')}` 
    })
    category?: FileUploadCategory;

    @ApiPropertyOptional({
        description: 'Updated visibility level',
        enum: FileVisibility,
    })
    @IsOptional()
    @IsEnum(FileVisibility, { 
        message: `Visibility must be one of: ${Object.values(FileVisibility).join(', ')}` 
    })
    visibility?: FileVisibility;

    @ApiPropertyOptional({
        description: 'Updated description',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    description?: string;

    @ApiPropertyOptional({
        description: 'Updated tags',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Tags cannot exceed 500 characters' })
    tags?: string;
}

/**
 * DTO for batch file operations
 */
export class BatchFileOperationDto {
    @ApiProperty({
        description: 'Array of file IDs to operate on',
        type: [String],
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsUUID('4', { each: true, message: 'Invalid file ID format' })
    fileIds: string[];

    @ApiPropertyOptional({
        description: 'Target category for batch move operation',
        enum: FileUploadCategory,
    })
    @IsOptional()
    @IsEnum(FileUploadCategory)
    targetCategory?: FileUploadCategory;

    @ApiPropertyOptional({
        description: 'New visibility for batch update',
        enum: FileVisibility,
    })
    @IsOptional()
    @IsEnum(FileVisibility)
    visibility?: FileVisibility;
}

/**
 * DTO for file upload response
 */
export class FileUploadResponseDto {
    @ApiProperty({ description: 'File ID' })
    id: string;

    @ApiProperty({ description: 'Original filename' })
    originalName: string;

    @ApiProperty({ description: 'MIME type' })
    mimeType: string;

    @ApiProperty({ description: 'File size in bytes' })
    size: number;

    @ApiProperty({ description: 'File category' })
    category: string;

    @ApiProperty({ description: 'Upload timestamp' })
    createdAt: Date;

    @ApiPropertyOptional({ description: 'Thumbnail URL if generated' })
    thumbnailUrl?: string;

    @ApiProperty({ description: 'Virus scan status' })
    virusScanStatus: 'pending' | 'clean' | 'infected' | 'error';

    @ApiPropertyOptional({ description: 'Warning messages if any' })
    warnings?: string[];
}

/**
 * DTO for upload quota information
 */
export class UploadQuotaDto {
    @ApiProperty({ description: 'Total storage quota in bytes' })
    totalQuota: number;

    @ApiProperty({ description: 'Used storage in bytes' })
    usedStorage: number;

    @ApiProperty({ description: 'Available storage in bytes' })
    availableStorage: number;

    @ApiProperty({ description: 'Uploads allowed per minute' })
    uploadsPerMinute: number;

    @ApiProperty({ description: 'Current uploads in last minute' })
    currentUploads: number;

    @ApiProperty({ description: 'Maximum file size allowed in bytes' })
    maxFileSize: number;
}

/**
 * DTO for file preview request
 */
export class FilePreviewDto {
    @ApiPropertyOptional({
        description: 'Preview width in pixels',
        minimum: 50,
        maximum: 2048,
        default: 800,
    })
    @IsOptional()
    @IsInt()
    @Min(50)
    @Max(2048)
    width?: number = 800;

    @ApiPropertyOptional({
        description: 'Preview height in pixels',
        minimum: 50,
        maximum: 2048,
        default: 600,
    })
    @IsOptional()
    @IsInt()
    @Min(50)
    @Max(2048)
    height?: number = 600;

    @ApiPropertyOptional({
        description: 'Output format for image previews',
        enum: ['jpeg', 'png', 'webp'],
        default: 'jpeg',
    })
    @IsOptional()
    @IsEnum(['jpeg', 'png', 'webp'])
    format?: 'jpeg' | 'png' | 'webp' = 'jpeg';
}
