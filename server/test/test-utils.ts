/**
 * Test Utilities for School Hub Backend Tests
 * Provides mock helpers, test database setup, and common test fixtures
 */

import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Types for mock Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Create a mock Prisma client with all methods mocked
 */
export const createMockPrisma = (): MockPrismaClient => {
    return mockDeep<PrismaClient>();
};

/**
 * Mock Redis client for testing
 */
export const createMockRedis = () => {
    return {
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        ttl: jest.fn().mockResolvedValue(3600),
        ping: jest.fn().mockResolvedValue('PONG'),
        isReady: true,
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        keys: jest.fn().mockResolvedValue([]),
        mget: jest.fn().mockResolvedValue([]),
    };
};

/**
 * Mock S3 client for testing
 */
export const createMockS3Client = () => {
    return {
        send: jest.fn().mockResolvedValue({}),
        config: {},
    };
};

/**
 * Test fixtures for common entities
 */
export const fixtures = {
    user: {
        id: 'user-test-id',
        email: 'test@school.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        avatarUrl: null,
        status: 'active' as const,
        emailNotificationsEnabled: true,
        notificationPreferences: {},
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    admin: {
        id: 'admin-test-id',
        email: 'admin@school.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        avatarUrl: null,
        status: 'active' as const,
        emailNotificationsEnabled: true,
        notificationPreferences: {},
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    teacher: {
        id: 'teacher-test-id',
        email: 'teacher@school.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Teacher',
        lastName: 'User',
        phone: '+1234567890',
        avatarUrl: null,
        status: 'active' as const,
        emailNotificationsEnabled: true,
        notificationPreferences: {},
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    student: {
        id: 'student-test-id',
        email: 'student@school.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Student',
        lastName: 'User',
        phone: '+1234567890',
        avatarUrl: null,
        status: 'active' as const,
        emailNotificationsEnabled: true,
        notificationPreferences: {},
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    parent: {
        id: 'parent-test-id',
        email: 'parent@school.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Parent',
        lastName: 'User',
        phone: '+1234567890',
        avatarUrl: null,
        status: 'active' as const,
        emailNotificationsEnabled: true,
        notificationPreferences: {},
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    role: {
        admin: { id: 'role-admin', name: 'admin' },
        teacher: { id: 'role-teacher', name: 'teacher' },
        student: { id: 'role-student', name: 'student' },
        parent: { id: 'role-parent', name: 'parent' },
    },
    channel: {
        id: 'channel-test-id',
        name: 'Test Channel',
        type: 'direct_message' as const,
        createdBy: 'user-test-id',
        classId: null,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    message: {
        id: 'message-test-id',
        channelId: 'channel-test-id',
        senderId: 'user-test-id',
        content: 'Test message content',
        contentType: 'text',
        replyTo: null,
        isDeleted: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
    },
    course: {
        id: 'course-test-id',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic CS course',
        credits: 3,
        department: 'Computer Science',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    class: {
        id: 'class-test-id',
        courseId: 'course-test-id',
        teacherId: 'teacher-test-id',
        term: 'Fall 2026',
        section: 'A',
        room: '101',
        maxStudents: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
};

/**
 * Mock JWT tokens
 */
export const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
};

/**
 * Helper to create a mock Express request
 */
export const createMockRequest = (overrides: any = {}) => ({
    user: { userId: fixtures.user.id, email: fixtures.user.email, roles: ['student'] },
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
});

/**
 * Helper to create a mock Express response
 */
export const createMockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
};

/**
 * Helper to create mock file upload
 */
export const createMockFile = (overrides: any = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test-file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test file content'),
    stream: null as any,
    destination: '',
    filename: 'test-file.pdf',
    path: '/tmp/test-file.pdf',
    ...overrides,
});

/**
 * Mock bcrypt for testing
 */
export const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('hashedpassword123'),
    compare: jest.fn().mockResolvedValue(true),
};

/**
 * Helper to wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to flush promises
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
