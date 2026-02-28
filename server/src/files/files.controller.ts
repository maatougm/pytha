import {
    Controller, Get, Post, Delete, Body, Param, Query,
    UseGuards, Request, Res, UseInterceptors, UploadedFile, ParseFilePipe,
    BadRequestException, Inject, LoggerService, Headers,
    HttpCode, HttpStatus, Patch, NotFoundException, ForbiddenException,
    DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { MetricsService } from '../metrics/metrics.service';
import { UploadFileDto, SetFilePermissionDto } from './dto/files.dto';
import { FileUploadDto, FileUploadResponseDto, UploadQuotaDto } from './dto/file-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import * as fs from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
    validateMimeType,
    validateFileExtension,
    getFileCategory,
    getMaxFileSize,
    formatFileSize,
    ALLOWED_MIME_TYPES,
    isPreviewableImage,
} from './files.validation';

/**
 * Maximum file size limits per category (in bytes)
 * Note: These are hard limits for the multer middleware
 * Role-based limits are enforced in the service
 */
const MAX_FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024,     // 5MB
    document: 10 * 1024 * 1024, // 10MB
    audio: 50 * 1024 * 1024,    // 50MB
    video: 100 * 1024 * 1024,   // 100MB
    archive: 50 * 1024 * 1024,  // 50MB
    default: 10 * 1024 * 1024,  // 10MB
};

/**
 * File upload configuration
 */
const UPLOAD_CONFIG = {
    tempDir: './uploads/temp',
    maxFiles: 1,
};

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(
        private filesService: FilesService,
        private storageService: StorageService,
        private metricsService: MetricsService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) { }

    // ─── UPLOAD ──────────────────────────────────────────────

    @Post('upload')
    @ApiOperation({
        summary: 'Upload a file',
        description: 'Upload a file with security validation including virus scanning, type verification, and rate limiting. Limited to 5 uploads per minute per user.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: FileUploadResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid file or validation failed' })
    @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: UPLOAD_CONFIG.tempDir,
            filename: (req, file, cb) => {
                // Generate secure temp filename
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                const ext = extname(file.originalname).toLowerCase();
                cb(null, `temp-${uniqueSuffix}${ext}`);
            }
        }),
        limits: {
            fileSize: MAX_FILE_SIZE_LIMITS.video, // Use largest limit for middleware, service enforces stricter
            files: UPLOAD_CONFIG.maxFiles,
        },
        fileFilter: (req, file, cb) => {
            // Basic MIME type check at middleware level
            if (!validateMimeType(file.mimetype)) {
                cb(new BadRequestException(
                    `File type '${file.mimetype}' is not allowed. Allowed types: images, documents, audio, video, archives.`
                ), false);
                return;
            }

            // Validate extension matches MIME type
            if (!validateFileExtension(file.mimetype, file.originalname)) {
                cb(new BadRequestException(
                    `File extension '${extname(file.originalname)}' does not match MIME type '${file.mimetype}'`
                ), false);
                return;
            }

            cb(null, true);
        },
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: FileUploadDto,
        @Request() req,
    ): Promise<FileUploadResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Check rate limiting at controller level (additional safety)
        const rateLimit = await this.filesService.getRateLimitStatus(req.user.sub);
        if (rateLimit.remaining <= 0) {
            const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            throw new BadRequestException(
                `Upload rate limit exceeded. Maximum 5 uploads per minute. Try again in ${resetSeconds} seconds.`
            );
        }

        try {
            // Determine user's primary role for size limits
            const userRoles = req.user.roles || [];
            const category = getFileCategory(file.mimetype);
            const maxSize = getMaxFileSize(category, userRoles[0]);

            // Quick size check before processing
            if (file.size > maxSize) {
                await this.cleanupTempFile(file.path);
                throw new BadRequestException(
                    `File size ${formatFileSize(file.size)} exceeds the limit of ${formatFileSize(maxSize)} ` +
                    `for ${category} files with your role.`
                );
            }

            // Use the service upload which handles full security validation
            const result = await this.filesService.uploadFile(
                file,
                req.user.sub,
                dto,
                userRoles,
            );

            // Also upload to configured storage (S3 or local)
            try {
                const storageResult = await this.storageService.uploadFile(
                    file,
                    category,
                    {
                        uploaderId: req.user.sub,
                        fileId: result.id,
                        originalName: file.originalname,
                    },
                );
                this.logger.log(`File stored to ${this.storageService.getProvider()}: ${storageResult.key}`);
                
                // Record file upload metrics
                this.metricsService.recordFileUpload(category, file.size, true);
            } catch (storageError) {
                this.logger.error(`Storage upload failed: ${storageError.message}`);
                this.metricsService.recordFileUploadError(category, storageError.message);
                // Don't fail the upload if storage fails - file is already in DB
            }

            // Clean up temp file (service should have moved it)
            await this.cleanupTempFile(file.path);

            return {
                id: result.id,
                originalName: result.originalName,
                mimeType: result.mimeType,
                size: result.size,
                category: result.category,
                createdAt: result.createdAt,
                thumbnailUrl: result.thumbnailUrl,
                virusScanStatus: result.virusScanStatus as any,
                warnings: result.warnings,
            };
        } catch (error) {
            // Clean up temp file on error
            await this.cleanupTempFile(file.path);
            throw error;
        }
    }

    // ─── QUOTA & RATE LIMIT INFO ─────────────────────────────

    @Get('quota')
    @ApiOperation({
        summary: 'Get upload quota information',
        description: 'Returns current storage quota, usage, and rate limit status for the authenticated user.',
    })
    @ApiResponse({ status: 200, description: 'Quota information', type: UploadQuotaDto })
    async getQuota(@Request() req): Promise<UploadQuotaDto> {
        const userRoles = req.user.roles || [];
        const quota = await this.filesService.getUserQuota(req.user.sub, userRoles);
        const rateLimit = await this.filesService.getRateLimitStatus(req.user.sub);

        // Determine max file size based on role
        const maxFileSize = Math.max(
            ...Object.values({
                image: getMaxFileSize(getFileCategory('image/jpeg'), userRoles[0]),
                document: getMaxFileSize(getFileCategory('application/pdf'), userRoles[0]),
                video: getMaxFileSize(getFileCategory('video/mp4'), userRoles[0]),
            })
        );

        return {
            totalQuota: quota.totalQuota,
            usedStorage: quota.usedStorage,
            availableStorage: quota.availableStorage,
            uploadsPerMinute: 5,
            currentUploads: 5 - rateLimit.remaining,
            maxFileSize,
        };
    }

    @Get('allowed-types')
    @ApiOperation({
        summary: 'Get allowed file types',
        description: 'Returns list of allowed MIME types and file extensions for upload.',
    })
    getAllowedTypes() {
        return {
            message: 'Allowed file types for upload',
            categories: {
                image: {
                    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
                    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif'],
                    maxSize: formatFileSize(MAX_FILE_SIZE_LIMITS.image),
                },
                document: {
                    mimeTypes: [
                        'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/rtf', 'application/json', 'application/xml', 'text/xml',
                    ],
                    extensions: ['.pdf', '.txt', '.csv', '.md', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.json', '.xml'],
                    maxSize: formatFileSize(MAX_FILE_SIZE_LIMITS.document),
                },
                audio: {
                    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac'],
                    extensions: ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'],
                    maxSize: formatFileSize(MAX_FILE_SIZE_LIMITS.audio),
                },
                video: {
                    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-flv'],
                    extensions: ['.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.mkv', '.webm', '.flv'],
                    maxSize: formatFileSize(MAX_FILE_SIZE_LIMITS.video),
                },
                archive: {
                    mimeTypes: ['application/zip', 'application/x-7z-compressed'],
                    extensions: ['.zip', '.7z'],
                    maxSize: formatFileSize(MAX_FILE_SIZE_LIMITS.archive),
                },
            },
            notes: [
                'File content is verified using magic numbers to prevent type spoofing',
                'All documents and archives are scanned for viruses when ClamAV is available',
                'Images are automatically processed for thumbnail generation',
                'File size limits may vary based on user role',
            ],
        };
    }

    // ─── LIST / GET ──────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List files (scoped to current user unless admin)' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by file category' })
    @ApiQuery({ name: 'uploaderId', required: false, description: 'Filter by uploader ID (admin only)' })
    @ApiQuery({ name: 'relatedId', required: false, description: 'Filter by related entity ID' })
    @ApiQuery({ name: 'relatedType', required: false, description: 'Filter by related entity type' })
    @ApiQuery({ name: 'search', required: false, description: 'Search in filename and description' })
    findAll(
        @Request() req,
        @Query('category') category?: string,
        @Query('uploaderId') uploaderId?: string,
        @Query('relatedId') relatedId?: string,
        @Query('relatedType') relatedType?: string,
        @Query('search') search?: string,
    ) {
        const isAdmin = req.user.roles?.includes('admin');
        // Non-admins can only see their own files; ignore any uploaderId they pass
        const scopedUploaderId = isAdmin ? uploaderId : req.user.sub;
        return this.filesService.findAll({ category, uploaderId: scopedUploaderId, relatedId, relatedType, search });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get storage statistics (own stats, or any user if admin)' })
    getStats(@Request() req, @Query('userId') userId?: string) {
        const isAdmin = req.user.roles?.includes('admin');
        // Non-admins can only see their own storage stats
        const scopedUserId = isAdmin ? userId : req.user.sub;
        return this.filesService.getStorageStats(scopedUserId);
    }

    @Get('my')
    @ApiOperation({ summary: 'Get current user\'s files' })
    getMyFiles(@Request() req) {
        return this.filesService.findAll({ uploaderId: req.user.sub });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get file metadata' })
    async findOne(@Param('id') id: string, @Request() req) {
        const file = await this.filesService.findById(id);
        if (!file) throw new NotFoundException('File not found');

        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');

        if (!isOwner && !isAdmin) {
            // Check if the user has an explicit view permission
            const permissions = await this.filesService.getPermissions(id);
            const hasPermission = permissions.some(
                (p) => p.userId === req.user.sub && p.canView,
            );
            if (!hasPermission) {
                throw new ForbiddenException('You do not have permission to view this file');
            }
        }

        return file;
    }

    // ─── DOWNLOAD & PREVIEW ──────────────────────────────────

    @Get(':id/download')
    @ApiOperation({ summary: 'Download a file' })
    async download(
        @Param('id') id: string,
        @Request() req,
        @Res() res: Response,
        @Headers('if-none-match') ifNoneMatch?: string,
    ) {
        const file = await this.filesService.getFileForDownload(id, req.user.sub, req.user.roles);

        // Check if file exists
        try {
            await fs.access(file.path);
        } catch {
            return res.status(404).json({ message: 'Physical file not found' });
        }

        // Set security headers for download
        // Force SVG to download as octet-stream to prevent browser XSS execution
        const contentType = file.mimeType === 'image/svg+xml'
            ? 'application/octet-stream'
            : file.mimeType;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Download-Options', 'noopen');

        // Stream file for better memory efficiency
        const stream = createReadStream(file.path);
        stream.on('error', (err) => {
            this.logger.error(`Error streaming file: ${err.message}`, err.stack);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading file' });
            }
        });
        stream.pipe(res);
    }

    @Get(':id/preview')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per user
    @ApiOperation({
        summary: 'Get file preview (for images)',
        description: 'Returns a preview image for supported file types (JPEG, PNG, GIF, WebP, BMP)',
    })
    async getPreview(
        @Param('id') id: string,
        @Request() req,
        @Res() res: Response,
        @Query('width', new DefaultValuePipe(200), ParseIntPipe) width?: number,
        @Query('height', new DefaultValuePipe(200), ParseIntPipe) height?: number,
    ) {
        // Validate dimensions to prevent DoS via resource exhaustion
        const MAX_DIMENSION = 2000;
        if (width && (width < 1 || width > MAX_DIMENSION)) {
            return res.status(400).json({ message: `Width must be between 1 and ${MAX_DIMENSION}px` });
        }
        if (height && (height < 1 || height > MAX_DIMENSION)) {
            return res.status(400).json({ message: `Height must be between 1 and ${MAX_DIMENSION}px` });
        }

        // CRIT-003 fix: check permissions FIRST before any file operations
        // This prevents probing file existence / mime type without authorization
        const file = await this.filesService.findById(id);

        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');

        if (!isOwner && !isAdmin) {
            const permissions = await this.filesService.getPermissions(id);
            const userPermission = permissions.find(p => p.userId === req.user.sub && p.canView);
            if (!userPermission) {
                return res.status(403).json({ message: 'You do not have permission to view this file' });
            }
        }

        // Only after auth passes, check if preview is available for this file type
        if (!isPreviewableImage(file.mimeType)) {
            return res.status(400).json({
                message: 'Preview not available for this file type',
                supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
            });
        }

        // Generate preview on-demand
        const filePath = file.path.startsWith('/')
            ? file.path
            : require('path').join(process.cwd(), file.path);

        const previewPath = await this.filesService.generatePreview(
            filePath,
            file.mimeType,
            { width, height }
        );

        if (!previewPath) {
            return res.status(500).json({ message: 'Failed to generate preview' });
        }

        // Stream preview
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = createReadStream(previewPath);
        stream.on('error', () => {
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading preview' });
            }
        });
        stream.pipe(res);
    }

    @Get(':id/thumbnail')
    @ApiOperation({
        summary: 'Get file thumbnail',
        description: 'Returns the thumbnail image for supported file types',
    })
    async getThumbnail(
        @Param('id') id: string,
        @Request() req,
        @Res() res: Response,
    ) {
        try {
            const thumbnail = await this.filesService.getFileThumbnail(
                id,
                req.user.sub,
                req.user.roles || []
            );

            res.setHeader('Content-Type', thumbnail.mimeType);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hour cache for thumbnails

            const stream = createReadStream(thumbnail.path);
            stream.on('error', () => {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error reading thumbnail' });
                }
            });
            stream.pipe(res);
        } catch (error) {
            if (error instanceof NotFoundException) {
                return res.status(404).json({ message: error.message });
            }
            if (error instanceof ForbiddenException) {
                return res.status(403).json({ message: error.message });
            }
            throw error;
        }
    }

    // ─── DELETE ──────────────────────────────────────────────

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a file' })
    deleteFile(@Param('id') id: string, @Request() req) {
        return this.filesService.deleteFile(id, req.user.sub, req.user.roles);
    }

    // ─── PERMISSIONS ─────────────────────────────────────────

    @Post(':id/permissions')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Set file permission' })
    setPermission(@Param('id') fileId: string, @Body() dto: SetFilePermissionDto) {
        return this.filesService.setPermission(fileId, dto);
    }

    @Get(':id/permissions')
    @ApiOperation({ summary: 'Get file permissions (owner or admin only)' })
    async getPermissions(@Param('id') fileId: string, @Request() req) {
        const file = await this.filesService.findById(fileId);
        if (!file) throw new NotFoundException('File not found');

        const isOwner = file.uploaderId === req.user.sub;
        const isAdmin = req.user.roles?.includes('admin');
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Only the file owner or an admin can view permissions');
        }

        return this.filesService.getPermissions(fileId);
    }

    @Delete('permissions/:permissionId')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Remove file permission' })
    removePermission(@Param('permissionId') permissionId: string) {
        return this.filesService.removePermission(permissionId);
    }

    // ─── VALIDATION & MAINTENANCE ────────────────────────────

    @Post(':id/validate')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({
        summary: 'Validate file integrity (admin only)',
        description: 'Validates file metadata, hash, and physical file integrity',
    })
    async validateFile(@Param('id') id: string) {
        return this.filesService.validateFileMetadata(id);
    }

    @Post('cleanup')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Clean up deleted files (admin only)',
        description: 'Permanently removes files soft-deleted more than specified days ago',
    })
    async cleanup(
        @Query('olderThanDays') olderThanDays?: string,
    ) {
        const days = olderThanDays ? parseInt(olderThanDays, 10) : 30;
        if (isNaN(days) || days < 1) {
            throw new BadRequestException('olderThanDays must be a positive number');
        }
        return this.filesService.cleanupDeletedFiles(days);
    }

    // ─── HELPER METHODS ──────────────────────────────────────

    private async cleanupTempFile(filePath: string): Promise<void> {
        if (!filePath) return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }
}
