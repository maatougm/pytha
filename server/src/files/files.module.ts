import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

/**
 * Files Module
 * 
 * Provides secure file upload and management capabilities including:
 * - File type validation (whitelist with magic number verification)
 * - File size limits per category and role
 * - Virus scanning integration (ClamAV)
 * - Rate limiting (5 uploads per minute per user)
 * - Thumbnail and preview generation
 * - Upload quota management per user
 * - File integrity validation
 */
@Module({
    controllers: [FilesController],
    providers: [
        FilesService,
        // Apply rate limiting to file upload endpoints
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
    exports: [FilesService],
})
export class FilesModule { }
