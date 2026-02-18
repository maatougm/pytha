import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { createReadStream } from 'fs';
import { ReadStream } from 'fs';

/**
 * File validation utilities for secure file uploads
 * Implements MIME type whitelist, magic number validation, and size limits per category
 */

// Allowed MIME types with their corresponding extensions
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
    // Documents
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'text/markdown': ['.md'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/rtf': ['.rtf'],
    'application/json': ['.json'],
    'application/xml': ['.xml'],
    'text/xml': ['.xml'],
    // Audio
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/aac': ['.aac'],
    'audio/m4a': ['.m4a'],
    'audio/flac': ['.flac'],
    // Video
    'video/mp4': ['.mp4'],
    'video/mpeg': ['.mpeg', '.mpg'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/x-matroska': ['.mkv'],
    'video/webm': ['.webm'],
    'video/x-flv': ['.flv'],
    // Archives (limited)
    'application/zip': ['.zip'],
    'application/x-7z-compressed': ['.7z'],
};

// File categories for organization and limits
export enum FileCategory {
    IMAGE = 'image',
    DOCUMENT = 'document',
    AUDIO = 'audio',
    VIDEO = 'video',
    ARCHIVE = 'archive',
    UNKNOWN = 'unknown',
}

// MIME type to category mapping
export const MIME_TO_CATEGORY: Record<string, FileCategory> = {
    // Images
    'image/jpeg': FileCategory.IMAGE,
    'image/png': FileCategory.IMAGE,
    'image/gif': FileCategory.IMAGE,
    'image/webp': FileCategory.IMAGE,
    'image/svg+xml': FileCategory.IMAGE,
    'image/bmp': FileCategory.IMAGE,
    'image/tiff': FileCategory.IMAGE,
    // Documents
    'application/pdf': FileCategory.DOCUMENT,
    'text/plain': FileCategory.DOCUMENT,
    'text/csv': FileCategory.DOCUMENT,
    'text/markdown': FileCategory.DOCUMENT,
    'application/msword': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileCategory.DOCUMENT,
    'application/vnd.ms-excel': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileCategory.DOCUMENT,
    'application/vnd.ms-powerpoint': FileCategory.DOCUMENT,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileCategory.DOCUMENT,
    'application/rtf': FileCategory.DOCUMENT,
    'application/json': FileCategory.DOCUMENT,
    'application/xml': FileCategory.DOCUMENT,
    'text/xml': FileCategory.DOCUMENT,
    // Audio
    'audio/mpeg': FileCategory.AUDIO,
    'audio/wav': FileCategory.AUDIO,
    'audio/ogg': FileCategory.AUDIO,
    'audio/aac': FileCategory.AUDIO,
    'audio/m4a': FileCategory.AUDIO,
    'audio/flac': FileCategory.AUDIO,
    // Video
    'video/mp4': FileCategory.VIDEO,
    'video/mpeg': FileCategory.VIDEO,
    'video/quicktime': FileCategory.VIDEO,
    'video/x-msvideo': FileCategory.VIDEO,
    'video/x-matroska': FileCategory.VIDEO,
    'video/webm': FileCategory.VIDEO,
    'video/x-flv': FileCategory.VIDEO,
    // Archives
    'application/zip': FileCategory.ARCHIVE,
    'application/x-7z-compressed': FileCategory.ARCHIVE,
};

// Maximum file sizes per category (in bytes)
export const MAX_FILE_SIZES: Record<FileCategory, number> = {
    [FileCategory.IMAGE]: 5 * 1024 * 1024,      // 5MB
    [FileCategory.DOCUMENT]: 10 * 1024 * 1024,  // 10MB
    [FileCategory.AUDIO]: 50 * 1024 * 1024,     // 50MB
    [FileCategory.VIDEO]: 100 * 1024 * 1024,    // 100MB
    [FileCategory.ARCHIVE]: 50 * 1024 * 1024,   // 50MB
    [FileCategory.UNKNOWN]: 10 * 1024 * 1024,   // 10MB default
};

// Default max file size (10MB)
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

// Role-based file size multipliers
export const ROLE_SIZE_MULTIPLIERS: Record<string, number> = {
    'admin': 2.0,      // 2x size limits
    'teacher': 1.5,    // 1.5x size limits
    'parent': 1.0,     // Default
    'student': 1.0,    // Default
};

// Magic numbers for file type verification (first bytes)
const MAGIC_NUMBERS: Record<string, Buffer[]> = {
    // Images
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
    'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF header
    'image/bmp': [Buffer.from([0x42, 0x4D])],
    'image/tiff': [Buffer.from([0x49, 0x49, 0x2A, 0x00]), Buffer.from([0x4D, 0x4D, 0x00, 0x2A])],
    // Documents
    'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
    // Archives
    'application/zip': [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]),
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // Empty archive
        Buffer.from([0x50, 0x4B, 0x07, 0x08]), // Spanned archive
    ],
    'application/x-7z-compressed': [Buffer.from([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])],
};

// SVG detection patterns (for security)
const SVG_PATTERNS = [
    /<svg/i,
    /<\?xml[^>]*>\s*<svg/i,
];

// Dangerous patterns to check in SVG files
const DANGEROUS_SVG_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,      // onclick, onload, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /xlink:href/i,     // legacy external reference
    /\shref\s*=/i,     // modern href attribute (e.g. on <use>, <a>)
    /<use[\s>]/i,      // <use> element can load external SVG fragments
    /data:/i,          // data: URIs can embed executable content
    /foreignObject/i,  // allows embedding arbitrary HTML inside SVG
    /\.xml/i,          // external XML entity references
];

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
    return MIME_TO_CATEGORY[mimeType] || FileCategory.UNKNOWN;
}

/**
 * Get max file size for a category, optionally adjusted by role
 */
export function getMaxFileSize(category: FileCategory, role?: string): number {
    const baseSize = MAX_FILE_SIZES[category] || DEFAULT_MAX_FILE_SIZE;
    const multiplier = role ? (ROLE_SIZE_MULTIPLIERS[role] || 1.0) : 1.0;
    return Math.floor(baseSize * multiplier);
}

/**
 * Validate file extension matches MIME type
 */
export function validateFileExtension(mimeType: string, filename: string): boolean {
    const allowedExts = ALLOWED_MIME_TYPES[mimeType];
    if (!allowedExts) {
        return false;
    }
    const ext = extname(filename).toLowerCase();
    return allowedExts.includes(ext);
}

/**
 * Validate MIME type is in whitelist
 */
export function validateMimeType(mimeType: string): boolean {
    return mimeType in ALLOWED_MIME_TYPES;
}

/**
 * Read magic bytes from file for validation
 */
export async function readMagicBytes(filePath: string, bytesToRead: number = 8): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath, { start: 0, end: bytesToRead - 1 });
        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

/**
 * Validate file using magic number detection
 */
export async function validateMagicNumber(filePath: string, mimeType: string): Promise<boolean> {
    // SVG files need special handling (text-based)
    if (mimeType === 'image/svg+xml') {
        return validateSvgFile(filePath);
    }

    const magicNumbers = MAGIC_NUMBERS[mimeType];
    if (!magicNumbers || magicNumbers.length === 0) {
        // No magic number validation available for this type, skip
        return true;
    }

    try {
        const fileHeader = await readMagicBytes(filePath, Math.max(...magicNumbers.map(m => m.length)));

        return magicNumbers.some(magic => {
            return fileHeader.slice(0, magic.length).equals(magic);
        });
    } catch (error) {
        return false;
    }
}

/**
 * Validate SVG file for security (no scripts, safe content)
 */
export async function validateSvgFile(filePath: string): Promise<boolean> {
    try {
        const content = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });

            stream.on('data', (chunk: string | Buffer) => chunks.push(Buffer.from(chunk)));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            stream.on('error', reject);
        });

        // Check if it's actually an SVG
        const isSvg = SVG_PATTERNS.some(pattern => pattern.test(content));
        if (!isSvg) {
            return false;
        }

        // Check for dangerous patterns
        const hasDangerousContent = DANGEROUS_SVG_PATTERNS.some(pattern => pattern.test(content));
        if (hasDangerousContent) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate file size against category limit
 */
export function validateFileSize(size: number, category: FileCategory, role?: string): boolean {
    const maxSize = getMaxFileSize(category, role);
    return size <= maxSize;
}

/**
 * Comprehensive file validation result
 */
export interface FileValidationResult {
    valid: boolean;
    errors: string[];
    category: FileCategory;
    maxSize: number;
}

/**
 * Perform comprehensive file validation
 */
export async function validateFile(
    file: Express.Multer.File,
    userRole?: string,
): Promise<FileValidationResult> {
    const errors: string[] = [];

    // Validate MIME type is in whitelist
    if (!validateMimeType(file.mimetype)) {
        errors.push(`File type '${file.mimetype}' is not allowed`);
        return {
            valid: false,
            errors,
            category: FileCategory.UNKNOWN,
            maxSize: DEFAULT_MAX_FILE_SIZE,
        };
    }

    const category = getFileCategory(file.mimetype);

    // Validate extension matches MIME type
    if (!validateFileExtension(file.mimetype, file.originalname)) {
        errors.push(`File extension does not match MIME type '${file.mimetype}'`);
    }

    // Validate file size
    const maxSize = getMaxFileSize(category, userRole);
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        errors.push(`File size exceeds limit of ${maxSizeMB}MB for ${category} files`);
    }

    // Validate magic number (file signature)
    const magicValid = await validateMagicNumber(file.path, file.mimetype);
    if (!magicValid) {
        errors.push('File content does not match the declared file type');
    }

    return {
        valid: errors.length === 0,
        errors,
        category,
        maxSize,
    };
}

/**
 * Check if file is previewable (image types that can generate previews)
 */
export function isPreviewableImage(mimeType: string): boolean {
    return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
    ].includes(mimeType);
}

/**
 * Check if file type requires virus scanning
 */
export function requiresVirusScan(mimeType: string): boolean {
    // All files should be scanned, but these are higher priority
    const highRiskTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-7z-compressed',
        'application/json',
        'application/xml',
        'text/plain',
        'text/csv',
    ];
    return highRiskTypes.includes(mimeType);
}

/**
 * Get safe filename for storage
 */
export function getSafeFilename(originalName: string): string {
    // Remove path traversal attempts and dangerous characters
    return originalName
        .replace(/\\/g, '/')  // Normalize slashes
        .replace(/\.\.\//g, '')  // Remove path traversal
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars
        .substring(0, 255);  // Limit length
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
