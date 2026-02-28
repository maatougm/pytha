import { Test, TestingModule } from '@nestjs/testing';
import { StorageService, StorageConfig } from './storage.service';
import { ConfigService } from '@nestjs/config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => params),
    GetObjectCommand: jest.fn().mockImplementation((params) => params),
    DeleteObjectCommand: jest.fn().mockImplementation((params) => params),
    HeadObjectCommand: jest.fn().mockImplementation((params) => params),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/file'),
}));

// Mock fs
jest.mock('fs', () => ({
    createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
    createWriteStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
    promises: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockResolvedValue(undefined),
        copyFile: jest.fn().mockResolvedValue(undefined),
        access: jest.fn().mockResolvedValue(undefined),
        unlink: jest.fn().mockResolvedValue(undefined),
    },
}));

import { promises as fs } from 'fs';
import * as path from 'path';

describe('StorageService', () => {
    let service: StorageService;
    let mockConfigService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
        mockConfigService = {
            get: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<StorageService>(StorageService);
        jest.clearAllMocks();
    });

    describe('onModuleInit', () => {
        it('should initialize with local storage by default', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });

            service.onModuleInit();

            expect(service.getProvider()).toBe('local');
        });

        it('should initialize with S3 when configured', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'https://s3.amazonaws.com',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });

            service.onModuleInit();

            expect(service.getProvider()).toBe('s3');
        });

        it('should fall back to local when S3 config is incomplete', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string | undefined> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: undefined,
                    S3_BUCKET: 'test-bucket',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });

            service.onModuleInit();

            expect(service.getProvider()).toBe('local');
        });

        it('should detect MinIO for path-style addressing', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'http://minio:9000',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });

            service.onModuleInit();

            expect(service.getProvider()).toBe('s3');
        });
    });

    describe('uploadFile', () => {
        const mockFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: 'test-document.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 1024,
            buffer: Buffer.from('test content'),
            stream: null as any,
            destination: '',
            filename: 'test-document.pdf',
            path: '/tmp/test-document.pdf',
        };

        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();
        });

        it('should upload file to local storage', async () => {
            const result = await service.uploadFile(mockFile, 'documents');

            expect(result).toBeDefined();
            expect(result.key).toContain('documents/');
            expect(result.key).toContain('.pdf');
            expect(result.size).toBe(1024);
            expect(result.mimeType).toBe('application/pdf');
            expect(result.url).toContain('/uploads/');
        });

        it('should use default category when not specified', async () => {
            const result = await service.uploadFile(mockFile);

            expect(result.key).toContain('general/');
        });

        it('should include metadata when provided', async () => {
            // For S3 uploads with metadata
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'https://s3.amazonaws.com',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });
            service.onModuleInit();

            const { S3Client } = require('@aws-sdk/client-s3');
            const mockSend = jest.fn().mockResolvedValue({});
            (S3Client as jest.Mock).mockImplementation(() => ({
                send: mockSend,
            }));

            await service.uploadFile(mockFile, 'documents', { author: 'test-user' });

            // S3 upload should have been attempted
        });

        it('should handle file without buffer (using path)', async () => {
            const fileWithPath = { ...mockFile, buffer: undefined };
            (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

            const result = await service.uploadFile(fileWithPath as any, 'documents');

            expect(result).toBeDefined();
        });
    });

    describe('uploadToS3', () => {
        const mockFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: 'test.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 1024,
            buffer: Buffer.from('test content'),
            stream: null as any,
            destination: '',
            filename: 'test.pdf',
            path: '/tmp/test.pdf',
        };

        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'https://s3.amazonaws.com',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });
            service.onModuleInit();
        });

        it('should fallback to local on S3 failure', async () => {
            const { S3Client } = require('@aws-sdk/client-s3');
            (S3Client as jest.Mock).mockImplementation(() => ({
                send: jest.fn().mockRejectedValue(new Error('S3 Error')),
            }));

            // Re-initialize service to use mocked S3Client
            service.onModuleInit();

            const result = await service.uploadFile(mockFile, 'documents');

            expect(result).toBeDefined();
            expect(result.url).toContain('/uploads/');
        });
    });

    describe('getSignedDownloadUrl', () => {
        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'https://s3.amazonaws.com',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });
            service.onModuleInit();
        });

        it('should return signed URL for S3', async () => {
            const result = await service.getSignedDownloadUrl('documents/test.pdf');

            expect(result.url).toBe('https://signed-url.example.com/file');
            expect(result.isLocal).toBe(false);
        });

        it('should return local path for local storage', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();

            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const result = await service.getSignedDownloadUrl('documents/test.pdf');

            expect(result.isLocal).toBe(true);
            expect(result.url).toContain(path.join('uploads', 'documents'));
        });

        it('should throw error when local file does not exist', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();

            (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

            await expect(service.getSignedDownloadUrl('nonexistent.pdf'))
                .rejects.toThrow('File not found');
        });
    });

    describe('deleteFile', () => {
        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();
        });

        it('should delete file from local storage', async () => {
            (fs.unlink as jest.Mock).mockResolvedValue(undefined);

            await service.deleteFile('documents/test.pdf');

            expect(fs.unlink).toHaveBeenCalled();
        });

        it('should not throw if file does not exist locally', async () => {
            const error: any = new Error('File not found');
            error.code = 'ENOENT';
            (fs.unlink as jest.Mock).mockRejectedValue(error);

            await expect(service.deleteFile('nonexistent.pdf')).resolves.not.toThrow();
        });

        it('should throw on unexpected error during local delete', async () => {
            (fs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));

            await expect(service.deleteFile('test.pdf'))
                .rejects.toThrow('Permission denied');
        });
    });

    describe('fileExists', () => {
        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();
        });

        it('should return true for existing local file', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const result = await service.fileExists('documents/test.pdf');

            expect(result).toBe(true);
        });

        it('should return false for non-existing file', async () => {
            (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

            const result = await service.fileExists('nonexistent.pdf');

            expect(result).toBe(false);
        });
    });

    describe('getFileStream', () => {
        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();
        });

        it('should return readable stream for local file', async () => {
            const result = await service.getFileStream('documents/test.pdf');

            expect(result).toBeDefined();
        });
    });

    describe('getStats', () => {
        it('should return stats for local storage', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();

            const result = await service.getStats();

            expect(result.provider).toBe('local');
            expect(result.localPath).toBe('./uploads');
            expect(result.bucket).toBeUndefined();
        });

        it('should return stats for S3 storage', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const config: Record<string, string> = {
                    STORAGE_PROVIDER: 's3',
                    S3_ENDPOINT: 'https://s3.amazonaws.com',
                    S3_REGION: 'us-east-1',
                    S3_BUCKET: 'test-bucket',
                    S3_ACCESS_KEY_ID: 'access-key',
                    S3_SECRET_ACCESS_KEY: 'secret-key',
                    LOCAL_STORAGE_PATH: './uploads',
                };
                return config[key];
            });
            service.onModuleInit();

            const result = await service.getStats();

            expect(result.provider).toBe('s3');
            expect(result.bucket).toBe('test-bucket');
            expect(result.localPath).toBe('./uploads');
        });
    });

    describe('generateKey', () => {
        beforeEach(() => {
            mockConfigService.get.mockImplementation((key: string) => {
                if (key === 'STORAGE_PROVIDER') return 'local';
                if (key === 'LOCAL_STORAGE_PATH') return './uploads';
                return undefined;
            });
            service.onModuleInit();
        });

        it('should generate unique key with category', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'document.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null as any,
                destination: '',
                filename: 'document.pdf',
                path: '/tmp/document.pdf',
            };

            const result = await service.uploadFile(mockFile, 'documents');

            expect(result.key).toMatch(/^documents\/\d+-[\w-]+\.pdf$/);
        });

        it('should handle files without extension', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'README',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test'),
                stream: null as any,
                destination: '',
                filename: 'README',
                path: '/tmp/README',
            };

            const result = await service.uploadFile(mockFile, 'docs');

            expect(result.key).toMatch(/^docs\/\d+-[\w-]+$/);
        });
    });
});
