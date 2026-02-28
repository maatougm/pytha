import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
    provider: 'local' | 's3';
    localPath?: string;
    s3?: {
        endpoint: string;
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKey: string;
        forcePathStyle?: boolean;
    };
}

export interface UploadResult {
    key: string;
    url: string;
    size: number;
    mimeType: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private s3Client: S3Client | null = null;
    private config: StorageConfig;
    private localStoragePath: string;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.initializeConfig();
        if (this.config.provider === 's3') {
            this.initializeS3Client();
        }
        this.ensureLocalDirectory();
    }

    private initializeConfig(): void {
        const provider = this.configService.get<StorageConfig['provider']>('STORAGE_PROVIDER', 'local');
        
        if (provider === 's3') {
            const endpoint = this.configService.get<string>('S3_ENDPOINT');
            const region = this.configService.get<string>('S3_REGION', 'us-east-1');
            const bucket = this.configService.get<string>('S3_BUCKET');
            const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
            const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

            if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
                this.logger.warn('S3 configuration incomplete, falling back to local storage');
                this.config = { provider: 'local' };
            } else {
                // Detect if using MinIO (path-style addressing)
                const isMinIO = endpoint.includes('minio') || endpoint.includes(':9000');
                
                this.config = {
                    provider: 's3',
                    s3: {
                        endpoint,
                        region,
                        bucket,
                        accessKeyId,
                        secretAccessKey,
                        forcePathStyle: isMinIO || endpoint.includes('localhost') || endpoint.includes('127.0.0.1'),
                    },
                };
                this.logger.log(`S3 storage configured: ${endpoint}, bucket: ${bucket}`);
            }
        } else {
            this.config = { provider: 'local' };
            this.logger.log('Local storage configured');
        }

        this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH', './uploads');
    }

    private initializeS3Client(): void {
        if (!this.config.s3) return;

        const { endpoint, region, accessKeyId, secretAccessKey, forcePathStyle } = this.config.s3;

        this.s3Client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle,
        });

        this.logger.log(`S3 client initialized with endpoint: ${endpoint}`);
    }

    private async ensureLocalDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.localStoragePath, { recursive: true });
        } catch (error) {
            this.logger.error(`Failed to create local storage directory: ${error.message}`);
        }
    }

    /**
     * Upload a file to storage
     * Supports both S3 and local storage based on configuration
     */
    async uploadFile(
        file: Express.Multer.File,
        category: string = 'general',
        metadata?: Record<string, string>,
    ): Promise<UploadResult> {
        const key = this.generateKey(category, file.originalname);
        
        if (this.config.provider === 's3' && this.s3Client) {
            return this.uploadToS3(file, key, metadata);
        }
        
        return this.uploadToLocal(file, key);
    }

    /**
     * Upload file to S3-compatible storage (AWS, MinIO, DigitalOcean Spaces)
     */
    private async uploadToS3(
        file: Express.Multer.File,
        key: string,
        metadata?: Record<string, string>,
    ): Promise<UploadResult> {
        const bucket = this.config.s3!.bucket;

        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file.buffer || createReadStream(file.path),
                ContentType: file.mimetype,
                Metadata: metadata,
            });

            await this.s3Client!.send(command);

            this.logger.log(`File uploaded to S3: ${key}`);

            return {
                key,
                url: `${this.config.s3!.endpoint}/${bucket}/${key}`,
                size: file.size,
                mimeType: file.mimetype,
            };
        } catch (error) {
            this.logger.error(`S3 upload failed: ${error.message}`);
            // Fallback to local storage on S3 failure
            this.logger.warn('Falling back to local storage');
            return this.uploadToLocal(file, key);
        }
    }

    /**
     * Upload file to local filesystem
     */
    private async uploadToLocal(
        file: Express.Multer.File,
        key: string,
    ): Promise<UploadResult> {
        const filePath = path.join(this.localStoragePath, key);
        const dir = path.dirname(filePath);

        try {
            await fs.mkdir(dir, { recursive: true });

            if (file.buffer) {
                await fs.writeFile(filePath, file.buffer);
            } else if (file.path) {
                await fs.copyFile(file.path, filePath);
            } else {
                throw new Error('No file content available');
            }

            this.logger.log(`File uploaded to local storage: ${filePath}`);

            return {
                key,
                url: `/uploads/${key}`,
                size: file.size,
                mimeType: file.mimetype,
            };
        } catch (error) {
            this.logger.error(`Local upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a signed URL for downloading a file
     * For S3: returns a pre-signed URL
     * For local: returns the local path
     */
    async getSignedDownloadUrl(
        key: string,
        expiresIn: number = 3600,
    ): Promise<{ url: string; isLocal: boolean }> {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new GetObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });

                const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
                return { url: signedUrl, isLocal: false };
            } catch (error) {
                this.logger.error(`Failed to generate S3 signed URL: ${error.message}`);
                // Fall through to local fallback
            }
        }

        // Local storage fallback
        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs.access(filePath);
            return { url: filePath, isLocal: true };
        } catch {
            throw new Error(`File not found: ${key}`);
        }
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(key: string): Promise<void> {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new DeleteObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });

                await this.s3Client.send(command);
                this.logger.log(`File deleted from S3: ${key}`);
                return;
            } catch (error) {
                this.logger.error(`S3 delete failed: ${error.message}`);
                // Continue to delete from local as fallback
            }
        }

        // Delete from local storage
        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs.unlink(filePath);
            this.logger.log(`File deleted from local storage: ${filePath}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                this.logger.error(`Failed to delete local file: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * Check if a file exists in storage
     */
    async fileExists(key: string): Promise<boolean> {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new HeadObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });

                await this.s3Client.send(command);
                return true;
            } catch {
                return false;
            }
        }

        const filePath = path.join(this.localStoragePath, key);
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Stream a file from storage
     * Returns a readable stream
     */
    async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
        if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
            try {
                const command = new GetObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });

                const response = await this.s3Client.send(command);
                return response.Body as NodeJS.ReadableStream;
            } catch (error) {
                this.logger.error(`S3 stream failed: ${error.message}`);
                throw error;
            }
        }

        const filePath = path.join(this.localStoragePath, key);
        return createReadStream(filePath);
    }

    /**
     * Generate a unique storage key
     */
    private generateKey(category: string, originalName: string): string {
        const ext = path.extname(originalName);
        const timestamp = Date.now();
        const uuid = uuidv4();
        return `${category}/${timestamp}-${uuid}${ext}`;
    }

    /**
     * Get the current storage provider
     */
    getProvider(): StorageConfig['provider'] {
        return this.config.provider;
    }

    /**
     * Get storage statistics
     */
    async getStats(): Promise<{
        provider: StorageConfig['provider'];
        localPath?: string;
        bucket?: string;
    }> {
        return {
            provider: this.config.provider,
            localPath: this.localStoragePath,
            bucket: this.config.s3?.bucket,
        };
    }
}
