// E2E Test Setup
import { execSync } from 'child_process';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-e2e';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-e2e';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging_test';

// Global test timeout
jest.setTimeout(30000);

// Run migrations before all tests
beforeAll(async () => {
    try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (error) {
        console.warn('Migration failed, tests may not work correctly:', error.message);
    }
});

// Clean up after all tests
afterAll(async () => {
    // Cleanup logic if needed
});
