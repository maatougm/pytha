import { Controller, Get, Body, Post, Res, StreamableFile, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('App Updates')
@Controller('api/updates')
export class UpdateController {
    // Current app version - increment this when releasing new APK
    private readonly currentVersion = {
        versionCode: 2,        // Increment for each release - MUST match pubspec.yaml version
        versionName: '1.0.1',  // Human readable version
        forceUpdate: false,    // Set to true to force users to update immediately
        updateUrl: '',         // Will be constructed dynamically
        changelog: [
            'Bug fixes and performance improvements',
            'New messaging features',
            'Improved UI/UX',
        ],
        minVersionCode: 1,     // Minimum supported version - users below this must update
    };

    constructor() {
        // Construct update URL from environment or default
        const baseUrl = process.env.API_BASE_URL || '';
        this.currentVersion.updateUrl = baseUrl 
            ? `${baseUrl}/downloads/pythagore-latest.apk`
            : '/downloads/pythagore-latest.apk';
    }

    @Get('version')
    @ApiOperation({ summary: 'Get latest app version info' })
    async getVersion() {
        return {
            ...this.currentVersion,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('check')
    @ApiOperation({ summary: 'Check if update is required' })
    async checkUpdate(@Body() body: { versionCode: number; platform: string }) {
        const { versionCode, platform } = body;
        
        const needsUpdate = versionCode < this.currentVersion.versionCode;
        const forceUpdate = versionCode < this.currentVersion.minVersionCode || 
                           (needsUpdate && this.currentVersion.forceUpdate);
        
        return {
            hasUpdate: needsUpdate,
            forceUpdate,
            version: this.currentVersion.versionName,
            versionCode: this.currentVersion.versionCode,
            updateUrl: platform === 'android' ? this.currentVersion.updateUrl : null,
            changelog: this.currentVersion.changelog,
            message: needsUpdate 
                ? `New version ${this.currentVersion.versionName} is available!`
                : 'You are using the latest version.',
        };
    }

    @Get('download/latest')
    @ApiOperation({ summary: 'Get download URL for latest APK' })
    async getDownloadUrl() {
        return {
            url: this.currentVersion.updateUrl,
            version: this.currentVersion.versionName,
            versionCode: this.currentVersion.versionCode,
        };
    }

    @Get('download/file')
    @ApiOperation({ summary: 'Download the latest APK file' })
    async downloadApk(@Res({ passthrough: true }) res: Response) {
        const downloadsDir = join(process.cwd(), 'downloads');
        const filePath = join(downloadsDir, 'minivirson-latest.apk');

        // Check if file exists
        if (!existsSync(filePath)) {
            throw new NotFoundException('APK file not found. Please contact administrator.');
        }

        // Stream the file
        const file = createReadStream(filePath);
        
        res.set({
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Disposition': `attachment; filename="minivirson-${this.currentVersion.versionName}.apk"`,
        });

        return new StreamableFile(file);
    }
}
