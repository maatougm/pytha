import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { File as FileEntity, Prisma } from '@prisma/client';
import { SetFilePermissionDto } from './dto/files.dto';
import { FileUploadDto, FileUploadCategory, FileVisibility } from './dto/file-upload.dto';
import { extname, join, resolve } from 'path';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import {
    validateFile,
    getFileCategory,
    getMaxFileSize,
    FileCategory,
    isPreviewableImage,
    requiresVirusScan,
    getSafeFilename,
    formatFileSize,
    ALLOWED_MIME_TYPES,
} from './files.validation';

// Upload quota configuration per role (in bytes)
const UPLOAD_QUOTAS: Record<string, number> = {
    'admin': 50 * 1024 * 1024 * 1024,      // 50GB
    'teacher': 10 * 1024 * 1024 * 1024,    // 10GB
    'parent': 2 * 1024 * 1024 * 1024,      // 2GB
    'student': 1 * 1024 * 1024 * 1024,     // 1GB
};

// Default quota
const DEFAULT_QUOTA = 1 * 1024 * 1024 * 1024; // 1GB

// Rate limiting: uploads per minute per user
const UPLOAD_RATE_LIMIT = 5;

// Virus scan timeout (ms)
const VIRUS_SCAN_TIMEOUT = 60000;

// Thumbnail dimensions
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

// Preview dimensions
const PREVIEW_MAX_WIDTH = 1200;
const PREVIEW_MAX_HEIGHT = 800;

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);
    private readonly uploadsDir: string;
    private readonly thumbnailsDir: string;
    private readonly previewsDir: string;

    // Redis-based rate limiting for distributed deployments
    private redis: Redis;

    constructor(
        private prisma: PrismaService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly winstonLogger: LoggerService,
    ) {
        // Initialize Redis client for rate limiting
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(redisUrl);
        // Use absolute paths for directories
        this.uploadsDir = path.resolve(process.cwd(), 'uploads');
        this.thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
        this.previewsDir = path.join(this.uploadsDir, 'previews');

        // Ensure directories exist
        this.ensureDirectories();
    }

    private async ensureDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.thumbnailsDir, { recursive: true });
            await fs.mkdir(this.previewsDir, { recursive: true });
        } catch (error) {
            this.logger.error('Failed to create upload directories:', error.message);
        }
    }

    // ─── RATE LIMITING ───────────────────────────────────────────────────

    /**
     * Check if user has exceeded upload rate limit (Redis-based for distributed deployments)
     */
    async checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        const key = `ratelimit:upload:${userId}`;
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        
        const pipeline = this.redis.pipeline();
        pipeline.get(key);
        pipeline.pttl(key);
        
        const results = await pipeline.exec();
        
        if (!results || results[0][0]) {
            // Error or no data - treat as new window
            await this.redis.setex(key, Math.ceil(windowMs / 1000), '1');
            return { allowed: true, remaining: UPLOAD_RATE_LIMIT - 1, resetTime: now + windowMs };
        }
        
        const current = results[0][1] as string | null;
        const ttl = results[1][1] as number;
        
        if (!current) {
            // New window
            await this.redis.setex(key, Math.ceil(windowMs / 1000), '1');
            return { allowed: true, remaining: UPLOAD_RATE_LIMIT - 1, resetTime: now + windowMs };
        }
        
        const count = parseInt(current, 10);
        if (count >= UPLOAD_RATE_LIMIT) {
            return { allowed: false, remaining: 0, resetTime: now + (ttl || windowMs) };
        }
        
        await this.redis.incr(key);
        return { allowed: true, remaining: UPLOAD_RATE_LIMIT - count - 1, resetTime: now + (ttl || windowMs) };
    }

    /**
     * Get current rate limit status for user
     */
    async getRateLimitStatus(userId: string): Promise<{ remaining: number; resetTime: number }> {
        const key = `ratelimit:upload:${userId}`;
        
        const pipeline = this.redis.pipeline();
        pipeline.get(key);
        pipeline.pttl(key);
        
        const results = await pipeline.exec();
        
        if (!results || results[0][0]) {
            return { remaining: UPLOAD_RATE_LIMIT, resetTime: Date.now() + 60000 };
        }
        
        const current = results[0][1] as string | null;
        const ttl = results[1][1] as number;
        
        if (!current) {
            return { remaining: UPLOAD_RATE_LIMIT, resetTime: Date.now() + 60000 };
        }
        
        const count = parseInt(current, 10);
        return {
            remaining: Math.max(0, UPLOAD_RATE_LIMIT - count),
            resetTime: Date.now() + (ttl || 60000)
        };
    }

    // ─── VIRUS SCANNING ──────────────────────────────────────────────────

    /**
     * Scan file for viruses using ClamAV
     * Returns scan result with status and any findings
     */
    async scanFile(filePath: string): Promise<{
        clean: boolean;
        status: 'clean' | 'infected' | 'error' | 'skipped';
        message?: string;
        threats?: string[];
    }> {
        // Check if ClamAV is available
        const isClamAvAvailable = await this.isClamAvAvailable();

        if (!isClamAvAvailable) {
            this.logger.warn('ClamAV not available, skipping virus scan');
            return { clean: true, status: 'skipped', message: 'Virus scanning not available' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    clean: false,
                    status: 'error',
                    message: 'Virus scan timeout'
                });
            }, VIRUS_SCAN_TIMEOUT);

            try {
                // Try clamdscan first (daemon mode - faster), fallback to clamscan
                const scanner = spawn('clamdscan', ['--fdpass', '--no-summary', filePath]);

                let stdout = '';
                let stderr = '';

                scanner.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                scanner.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                scanner.on('close', (code) => {
                    clearTimeout(timeout);

                    if (code === 0) {
                        // Clean
                        resolve({ clean: true, status: 'clean' });
                    } else if (code === 1) {
                        // Infected
                        const threats = this.parseThreats(stdout);
                        resolve({
                            clean: false,
                            status: 'infected',
                            message: 'File contains malware',
                            threats
                        });
                    } else {
                        // Error
                        resolve({
                            clean: false,
                            status: 'error',
                            message: stderr || 'Scan failed'
                        });
                    }
                });

                scanner.on('error', (error) => {
                    clearTimeout(timeout);
                    // Try fallback to clamscan
                    this.scanWithClamscan(filePath).then(resolve);
                });
            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    clean: false,
                    status: 'error',
                    message: error.message
                });
            }
        });
    }

    /**
     * Fallback virus scan using clamscan (standalone)
     */
    private async scanWithClamscan(filePath: string): Promise<{
        clean: boolean;
        status: 'clean' | 'infected' | 'error' | 'skipped';
        message?: string;
        threats?: string[];
    }> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    clean: false,
                    status: 'error',
                    message: 'Virus scan timeout'
                });
            }, VIRUS_SCAN_TIMEOUT);

            try {
                const scanner = spawn('clamscan', ['--no-summary', filePath]);

                let stdout = '';
                let stderr = '';

                scanner.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                scanner.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                scanner.on('close', (code) => {
                    clearTimeout(timeout);

                    if (code === 0) {
                        resolve({ clean: true, status: 'clean' });
                    } else if (code === 1) {
                        const threats = this.parseThreats(stdout);
                        resolve({
                            clean: false,
                            status: 'infected',
                            message: 'File contains malware',
                            threats
                        });
                    } else {
                        resolve({
                            clean: false,
                            status: 'error',
                            message: stderr || 'Scan failed'
                        });
                    }
                });

                scanner.on('error', () => {
                    clearTimeout(timeout);
                    resolve({
                        clean: true,
                        status: 'skipped',
                        message: 'Virus scanner not available'
                    });
                });
            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    clean: true,
                    status: 'skipped',
                    message: 'Virus scanner not available'
                });
            }
        });
    }

    /**
     * Check if ClamAV is available
     */
    private async isClamAvAvailable(): Promise<boolean> {
        return new Promise((resolve) => {
            const check = spawn('which', ['clamdscan']);
            check.on('close', (code) => resolve(code === 0));
            check.on('error', () => resolve(false));
        });
    }

    /**
     * Parse threat names from scan output
     */
    private parseThreats(output: string): string[] {
        const threats: string[] = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('FOUND')) {
                const match = line.match(/: ([^:]+) FOUND/);
                if (match) {
                    threats.push(match[1]);
                }
            }
        }

        return threats;
    }

    // ─── THUMBNAIL GENERATION ────────────────────────────────────────────

    /**
     * Generate thumbnail for image files
     * Uses ImageMagick if available, otherwise returns null
     */
    async generateThumbnail(
        filePath: string,
        mimeType: string,
        width: number = THUMBNAIL_WIDTH,
        height: number = THUMBNAIL_HEIGHT,
    ): Promise<string | null> {
        if (!isPreviewableImage(mimeType)) {
            return null;
        }

        const thumbnailId = uuidv4();
        const thumbnailName = `thumb-${thumbnailId}.jpg`;
        const thumbnailPath = path.join(this.thumbnailsDir, thumbnailName);

        return new Promise((resolve) => {
            // Use ImageMagick's convert command
            const convert = spawn('convert', [
                filePath,
                '-resize', `${width}x${height}>`,
                '-background', 'white',
                '-flatten',
                '-quality', '85',
                thumbnailPath
            ]);

            convert.on('close', (code) => {
                if (code === 0) {
                    resolve(thumbnailPath);
                } else {
                    this.logger.warn(`Thumbnail generation failed for ${filePath}`);
                    resolve(null);
                }
            });

            convert.on('error', () => {
                // ImageMagick not available
                resolve(null);
            });
        });
    }

    /**
     * Generate preview image
     */
    async generatePreview(
        filePath: string,
        mimeType: string,
        options: { width?: number; height?: number; format?: string } = {},
    ): Promise<string | null> {
        if (!isPreviewableImage(mimeType)) {
            return null;
        }

        const width = options.width || PREVIEW_MAX_WIDTH;
        const height = options.height || PREVIEW_MAX_HEIGHT;
        const format = options.format || 'jpeg';

        const previewId = uuidv4();
        const previewName = `preview-${previewId}.${format}`;
        const previewPath = path.join(this.previewsDir, previewName);

        return new Promise((resolve) => {
            const convert = spawn('convert', [
                filePath,
                '-resize', `${width}x${height}>`,
                '-quality', '90',
                previewPath
            ]);

            convert.on('close', (code) => {
                if (code === 0) {
                    resolve(previewPath);
                } else {
                    resolve(null);
                }
            });

            convert.on('error', () => {
                resolve(null);
            });
        });
    }

    // ─── UPLOAD QUOTA MANAGEMENT ─────────────────────────────────────────

    /**
     * Get user's upload quota information
     */
    async getUserQuota(userId: string, userRoles: string[]): Promise<{
        totalQuota: number;
        usedStorage: number;
        availableStorage: number;
        fileCount: number;
    }> {
        // Determine quota based on highest role
        let quota = DEFAULT_QUOTA;
        for (const role of userRoles) {
            const roleQuota = UPLOAD_QUOTAS[role];
            if (roleQuota && roleQuota > quota) {
                quota = roleQuota;
            }
        }

        // Calculate used storage
        const userFiles = await this.prisma.file.findMany({
            where: {
                uploaderId: userId,
                isDeleted: false
            },
            select: { size: true },
        });

        const usedStorage = userFiles.reduce((sum, file) => sum + file.size, 0);

        return {
            totalQuota: quota,
            usedStorage,
            availableStorage: quota - usedStorage,
            fileCount: userFiles.length,
        };
    }

    /**
     * Check if user has available quota for upload
     */
    async checkUploadQuota(userId: string, userRoles: string[], fileSize: number): Promise<{
        allowed: boolean;
        quota: { totalQuota: number; usedStorage: number; availableStorage: number };
        message?: string;
    }> {
        const quota = await this.getUserQuota(userId, userRoles);

        if (fileSize > quota.availableStorage) {
            return {
                allowed: false,
                quota,
                message: `Insufficient storage. Available: ${formatFileSize(quota.availableStorage)}, ` +
                    `Required: ${formatFileSize(fileSize)}`,
            };
        }

        return { allowed: true, quota };
    }

    // ─── FILE UPLOAD ─────────────────────────────────────────────────────

    /**
     * Upload file with full security validation
     */
    async uploadFile(
        file: Express.Multer.File,
        uploaderId: string,
        metadata: FileUploadDto,
        userRoles: string[] = [],
    ): Promise<FileEntity & { thumbnailUrl?: string; warnings?: string[]; virusScanStatus?: string }> {
        const warnings: string[] = [];

        // Validate file exists
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Check rate limit
        const rateLimit = await this.checkRateLimit(uploaderId);
        if (!rateLimit.allowed) {
            const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            throw new BadRequestException(
                `Upload rate limit exceeded. Try again in ${resetSeconds} seconds.`
            );
        }

        // Determine primary role for size limits
        const primaryRole = userRoles.find(r => ['admin', 'teacher', 'parent', 'student'].includes(r)) || 'student';

        // Validate file using comprehensive validation
        const validation = await validateFile(file, primaryRole);
        if (!validation.valid) {
            await this.cleanupTempFile(file.path);
            throw new BadRequestException(validation.errors.join('; '));
        }

        // Check upload quota
        const quotaCheck = await this.checkUploadQuota(uploaderId, userRoles, file.size);
        if (!quotaCheck.allowed) {
            await this.cleanupTempFile(file.path);
            throw new BadRequestException(quotaCheck.message);
        }

        // Virus scan (unless skipped by admin)
        let virusScanStatus: 'pending' | 'clean' | 'infected' | 'error' | 'skipped' = 'pending';

        if (!metadata.skipVirusScan || !userRoles.includes('admin')) {
            if (requiresVirusScan(file.mimetype)) {
                const scanResult = await this.scanFile(file.path);
                virusScanStatus = scanResult.status;

                if (scanResult.status === 'infected') {
                    await this.cleanupTempFile(file.path);
                    this.logger.warn(`Malware detected in upload by ${uploaderId}: ${scanResult.threats?.join(', ')}`);
                    throw new BadRequestException(
                        `File rejected: ${scanResult.message}. Threats: ${scanResult.threats?.join(', ')}`
                    );
                }

                if (scanResult.status === 'error' || scanResult.status === 'skipped') {
                    warnings.push(`Virus scan: ${scanResult.message}`);
                }
            } else {
                virusScanStatus = 'skipped';
            }
        } else {
            virusScanStatus = 'skipped';
            warnings.push('Virus scan skipped (admin override)');
        }

        // Generate secure filename
        const ext = extname(file.originalname).toLowerCase();
        const secureFilename = `${uuidv4()}${ext}`;
        const rawCategory = metadata.category || FileUploadCategory.GENERAL;

        // HIGH-006 fix: validate category against the enum allowlist even if DTO validation
        // was bypassed (e.g. direct service call). Prevents path traversal via category.
        const allowedCategories = Object.values(FileUploadCategory) as string[];
        if (!allowedCategories.includes(rawCategory)) {
            throw new BadRequestException(`Invalid file category: ${rawCategory}`);
        }
        const category = rawCategory as FileUploadCategory;

        const sanitizedCategory = path.basename(category);
        const categoryDir = path.join(this.uploadsDir, sanitizedCategory);
        const finalPath = path.join(categoryDir, secureFilename);
        const relativePath = path.join('uploads', sanitizedCategory, secureFilename);

        let thumbnailPath: string | null = null;

        try {
            // Ensure category directory exists
            await fs.mkdir(categoryDir, { recursive: true });

            // Move file from temp to final location
            await fs.rename(file.path, finalPath);

            // Generate thumbnail for images if requested
            if (metadata.generateThumbnail !== false && isPreviewableImage(file.mimetype)) {
                thumbnailPath = await this.generateThumbnail(
                    finalPath,
                    file.mimetype,
                    metadata.thumbnailWidth,
                    metadata.thumbnailHeight,
                );
            }

            // Create database record - using only fields that exist in the schema
            const fileRecord = await this.prisma.file.create({
                data: {
                    filename: secureFilename,
                    originalName: getSafeFilename(metadata.originalName || file.originalname),
                    mimeType: file.mimetype,
                    size: file.size,
                    path: relativePath,
                    category: category.toString(),
                    uploaderId,
                    relatedId: metadata.relatedId,
                    relatedType: metadata.relatedType,
                },
            });

            this.logger.log(`File uploaded: ${fileRecord.id} (${file.originalname}) by ${uploaderId}`);

            // Add permission for uploader
            await this.prisma.filePermission.create({
                data: {
                    fileId: fileRecord.id,
                    userId: uploaderId,
                    canView: true,
                    canEdit: true,
                    canDelete: true,
                },
            });

            const result: FileEntity & { thumbnailUrl?: string; warnings?: string[]; virusScanStatus?: string } = {
                ...fileRecord,
                virusScanStatus,
                warnings: warnings.length > 0 ? warnings : undefined,
            };

            if (thumbnailPath) {
                result.thumbnailUrl = `/files/${fileRecord.id}/thumbnail`;
                // Store thumbnail path in a sidecar file for now (until schema is updated)
                await this.storeThumbnailMetadata(fileRecord.id, thumbnailPath);
            }

            return result;
        } catch (error) {
            // Cleanup on error
            await this.cleanupTempFile(file.path);
            await this.cleanupFinalFile(finalPath);
            if (thumbnailPath) {
                await this.cleanupFinalFile(thumbnailPath);
            }
            throw error;
        }
    }

    /**
     * Store thumbnail metadata in a sidecar file (until schema supports it)
     */
    private async storeThumbnailMetadata(fileId: string, thumbnailPath: string): Promise<void> {
        try {
            const metadataPath = path.join(this.thumbnailsDir, `${fileId}.meta.json`);
            await fs.writeFile(metadataPath, JSON.stringify({ thumbnailPath, createdAt: new Date() }));
        } catch (error) {
            this.logger.warn(`Failed to store thumbnail metadata for ${fileId}`);
        }
    }

    /**
     * Get thumbnail path from metadata
     */
    private async getThumbnailMetadata(fileId: string): Promise<string | null> {
        try {
            const metadataPath = path.join(this.thumbnailsDir, `${fileId}.meta.json`);
            const content = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(content);
            return metadata.thumbnailPath;
        } catch {
            return null;
        }
    }

    /**
     * Calculate SHA-256 hash of file for integrity verification
     */
    private async calculateFileHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(filePath);

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    private async cleanupTempFile(filePath: string): Promise<void> {
        if (!filePath) return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }

    private async cleanupFinalFile(filePath: string): Promise<void> {
        if (!filePath) return;
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }

    // ─── FILE RETRIEVAL ─────────────────────────────────────────────────

    async findAll(params: {
        category?: string;
        uploaderId?: string;
        relatedId?: string;
        relatedType?: string;
        search?: string;
        visibility?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: FileEntity[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }> {
        const { category, uploaderId, relatedId, relatedType, search, visibility } = params;

        // Validate and normalize pagination
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;

        const where: Prisma.FileWhereInput = {
            isDeleted: false,
        };

        if (category) where.category = category;
        if (uploaderId) where.uploaderId = uploaderId;
        if (relatedId) where.relatedId = relatedId;
        if (relatedType) where.relatedType = relatedType;
        if (search) {
            where.OR = [
                { originalName: { contains: search, mode: 'insensitive' } },
                { filename: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [files, total] = await Promise.all([
            this.prisma.file.findMany({
                where,
                include: {
                    uploader: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { permissions: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.file.count({ where }),
        ]);

        return {
            data: files,
            meta: {
                total,
                page,
                pageSize: limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string): Promise<FileEntity & { uploader: any }> {
        const file = await this.prisma.file.findUnique({
            where: { id, isDeleted: false },
            include: {
                uploader: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                permissions: {
                    include: {
                        user: {
                            select: { id: true, email: true },
                        },
                    },
                },
            },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    async getFileForDownload(
        id: string,
        userId: string,
        userRoles: string[],
    ): Promise<FileEntity> {
        const file = await this.findById(id);

        // Check permissions
        const hasAccess =
            file.uploaderId === userId ||
            userRoles.includes('admin') ||
            (await this.prisma.filePermission.findFirst({
                where: {
                    fileId: id,
                    userId,
                    canView: true,
                },
            }));

        if (!hasAccess) {
            throw new ForbiddenException('You do not have permission to download this file');
        }

        // Construct absolute path
        const absolutePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);

        // Check if file exists
        try {
            await fs.access(absolutePath);
        } catch {
            throw new NotFoundException('Physical file not found');
        }

        return { ...file, path: absolutePath };
    }

    async getFileThumbnail(
        id: string,
        userId: string,
        userRoles: string[],
    ): Promise<{ path: string; mimeType: string }> {
        const file = await this.findById(id);

        // Check permissions
        const hasAccess =
            file.uploaderId === userId ||
            userRoles.includes('admin') ||
            (await this.prisma.filePermission.findFirst({
                where: { fileId: id, userId, canView: true },
            }));

        if (!hasAccess) {
            throw new ForbiddenException('You do not have permission to view this file');
        }

        // Get thumbnail path from metadata
        const thumbnailPath = await this.getThumbnailMetadata(id);

        if (!thumbnailPath) {
            throw new NotFoundException('Thumbnail not available for this file');
        }

        const absoluteThumbPath = path.isAbsolute(thumbnailPath)
            ? thumbnailPath
            : path.join(process.cwd(), thumbnailPath);

        try {
            await fs.access(absoluteThumbPath);
        } catch {
            throw new NotFoundException('Thumbnail file not found');
        }

        return { path: absoluteThumbPath, mimeType: 'image/jpeg' };
    }

    async streamFile(
        file: FileEntity,
        res: Response,
    ): Promise<void> {
        const absolutePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);

        const stream = createReadStream(absolutePath);

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                this.logger.error(`Error streaming file ${file.id}:`, err.message);
                reject(new Error('Error reading file'));
            });

            stream.on('end', () => {
                resolve();
            });

            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Security-Policy', "default-src 'none'");

            stream.pipe(res);
        });
    }

    // ─── FILE DELETION ──────────────────────────────────────────────────

    async deleteFile(
        id: string,
        userId: string,
        userRoles: string[],
    ): Promise<{ message: string }> {
        const file = await this.findById(id);

        // Check permissions
        const canDelete =
            file.uploaderId === userId || userRoles.includes('admin');

        if (!canDelete) {
            const hasDeletePermission = await this.prisma.filePermission.findFirst({
                where: { fileId: id, userId, canDelete: true },
            });
            if (!hasDeletePermission) {
                throw new ForbiddenException('You do not have permission to delete this file');
            }
        }

        // Soft delete
        await this.prisma.file.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        this.logger.log(`File soft deleted: ${id} by ${userId}`);

        return { message: 'File deleted successfully' };
    }

    // ─── PERMISSIONS ─────────────────────────────────────────────────────

    async setPermission(fileId: string, dto: SetFilePermissionDto): Promise<any> {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) throw new NotFoundException('File not found');

        return this.prisma.filePermission.create({
            data: {
                fileId,
                userId: dto.userId,
                roleId: dto.roleId,
                canView: dto.canView ?? true,
                canEdit: dto.canEdit ?? false,
                canDelete: dto.canDelete ?? false,
            },
        });
    }

    async getPermissions(fileId: string): Promise<any[]> {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) throw new NotFoundException('File not found');

        return this.prisma.filePermission.findMany({
            where: { fileId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async removePermission(permissionId: string): Promise<void> {
        const permission = await this.prisma.filePermission.findUnique({
            where: { id: permissionId },
        });
        if (!permission) throw new NotFoundException('Permission not found');

        await this.prisma.filePermission.delete({
            where: { id: permissionId },
        });
    }

    // ─── STORAGE STATS ──────────────────────────────────────────────────

    async getStorageStats(userId?: string): Promise<{
        totalFiles: number;
        totalSize: number;
        byCategory: Record<string, { count: number; size: number }>;
    }> {
        const where: Prisma.FileWhereInput = { isDeleted: false };
        if (userId) where.uploaderId = userId;

        const files = await this.prisma.file.findMany({
            where,
            select: {
                category: true,
                size: true,
            },
        });

        const byCategory: Record<string, { count: number; size: number }> = {};
        let totalSize = 0;

        for (const file of files) {
            if (!byCategory[file.category]) {
                byCategory[file.category] = { count: 0, size: 0 };
            }
            byCategory[file.category].count++;
            byCategory[file.category].size += file.size;
            totalSize += file.size;
        }

        return {
            totalFiles: files.length,
            totalSize,
            byCategory,
        };
    }

    // ─── BULK OPERATIONS ─────────────────────────────────────────────────

    async deleteFilesByRelatedEntity(
        relatedType: string,
        relatedId: string,
    ): Promise<{ deleted: number }> {
        const files = await this.prisma.file.findMany({
            where: { relatedType, relatedId },
        });

        await this.prisma.file.updateMany({
            where: { relatedType, relatedId },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        return { deleted: files.length };
    }

    // ─── MAINTENANCE ─────────────────────────────────────────────────────

    async cleanupDeletedFiles(olderThanDays: number = 30): Promise<{
        cleaned: number;
        freedSpace: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const deletedFiles = await this.prisma.file.findMany({
            where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
            },
        });

        let freedSpace = 0;

        for (const file of deletedFiles) {
            const filePath = path.isAbsolute(file.path)
                ? file.path
                : path.join(process.cwd(), file.path);

            try {
                await fs.unlink(filePath);
                freedSpace += file.size;
            } catch (err) {
                this.logger.warn(`Failed to delete physical file: ${filePath}`);
            }

            // Also delete thumbnail if exists
            const thumbnailPath = await this.getThumbnailMetadata(file.id);
            if (thumbnailPath) {
                try {
                    await fs.unlink(thumbnailPath);
                } catch {
                    // Ignore thumbnail cleanup errors
                }
                // Delete metadata file
                try {
                    const metadataPath = path.join(this.thumbnailsDir, `${file.id}.meta.json`);
                    await fs.unlink(metadataPath);
                } catch {
                    // Ignore
                }
            }
        }

        // Permanently delete from database
        await this.prisma.file.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: { lt: cutoffDate },
            },
        });

        this.logger.log(`Cleaned up ${deletedFiles.length} deleted files, freed ${freedSpace} bytes`);

        return {
            cleaned: deletedFiles.length,
            freedSpace,
        };
    }

    // ─── FILE METADATA VALIDATION ────────────────────────────────────────

    /**
     * Validate file metadata for integrity
     */
    async validateFileMetadata(fileId: string): Promise<{
        valid: boolean;
        fileExists: boolean;
        hashValid: boolean;
        sizeValid: boolean;
        issues: string[];
    }> {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            return {
                valid: false,
                fileExists: false,
                hashValid: false,
                sizeValid: false,
                issues: ['File record not found']
            };
        }

        const issues: string[] = [];
        const filePath = path.isAbsolute(file.path)
            ? file.path
            : path.join(process.cwd(), file.path);

        // Check physical file exists
        let fileExists = false;
        try {
            await fs.access(filePath);
            fileExists = true;
        } catch {
            issues.push('Physical file not found');
        }

        // Validate size
        let sizeValid = true;
        if (fileExists) {
            try {
                const stats = await fs.stat(filePath);
                if (stats.size !== file.size) {
                    sizeValid = false;
                    issues.push(`Size mismatch: expected ${file.size}, got ${stats.size}`);
                }
            } catch {
                sizeValid = false;
            }
        }

        return {
            valid: fileExists && sizeValid,
            fileExists,
            hashValid: true, // Hash not stored in current schema
            sizeValid,
            issues,
        };
    }
}
