// Jest setup file

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
process.env.NODE_ENV = 'test';

// Mock console methods during tests to reduce noise
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);
