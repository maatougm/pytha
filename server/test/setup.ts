// Jest setup file

// Set test environment variables - MUST be 32+ characters
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-67890';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Redis client for health checks
jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        ping: jest.fn().mockResolvedValue('PONG'),
        isReady: true,
    }),
}));

// Global test timeout
jest.setTimeout(10000);
