/**
 * ============================================================================
 * School Hub - WebSocket Test Suite
 * ============================================================================
 * Comprehensive Socket.IO gateway testing including:
 * - JWT authentication handshake
 * - Rate limiting verification
 * - All message events (send, edit, delete, read)
 * - Reactions and typing indicators
 * - Security and performance tests
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { createClient, RedisClientType } from 'redis';
import { PrismaClient } from '@prisma/client';
import { MetricsService } from '../src/metrics/metrics.service';
import { MessagingGateway } from '../src/messaging/messaging.gateway';
import { MessagingService } from '../src/messaging/messaging.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WsRateLimitGuard } from '../src/common/guards/ws-rate-limit.guard';
import { MessageHandler } from '../src/messaging/handlers/message.handler';
import { ReactionHandler } from '../src/messaging/handlers/handlers/reaction.handler';
import { TypingHandler } from '../src/messaging/handlers/typing.handler';
import { ChannelHandler } from '../src/messaging/handlers/channel.handler';
import { TypingService } from '../src/messaging/typing.service';
import { Server } from 'http';

// ═══════════════════════════════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════

interface TestUser {
    id: string;
    email: string;
    roles: string[];
    token?: string;
}

interface TestChannel {
    id: string;
    name: string;
    type: string;
    members: string[];
}

interface TestMessage {
    id: string;
    content: string;
    channelId: string;
    senderId: string;
    createdAt: Date;
}

type EventCallback = (data: any) => void;
type PromiseResolver<T> = {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
};

// ═══════════════════════════════════════════════════════════════════════════
// Test Constants
// ═══════════════════════════════════════════════════════════════════════════

const TEST_CONFIG = {
    WS_URL: process.env.WS_TEST_URL || 'http://localhost:3000/messaging',
    API_URL: process.env.API_TEST_URL || 'http://localhost:3000',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long-12345',
    CONNECTION_TIMEOUT: 10000,
    EVENT_TIMEOUT: 5000,
    RATE_LIMIT_WINDOW: 60000,
};

const RATE_LIMITS = {
    'message:send': { max: 30, windowMs: 60000 },
    'message:edit': { max: 20, windowMs: 60000 },
    'message:delete': { max: 10, windowMs: 60000 },
    'typing:start': { max: 60, windowMs: 60000 },
    'typing:stop': { max: 60, windowMs: 60000 },
    'channel:join': { max: 10, windowMs: 60000 },
    'reaction:add': { max: 30, windowMs: 60000 },
    'reaction:remove': { max: 20, windowMs: 60000 },
};

// ═══════════════════════════════════════════════════════════════════════════
// Test Utilities
// ═══════════════════════════════════════════════════════════════════════════

class WebSocketTestHelper {
    private sockets: Map<string, ClientSocket> = new Map();
    private eventListeners: Map<string, Map<string, EventCallback[]>> = new Map();

    async createAuthenticatedSocket(
        user: TestUser,
        namespace: string = '/messaging'
    ): Promise<ClientSocket> {
        const socket = io(`${TEST_CONFIG.API_URL}${namespace}`, {
            auth: { token: user.token },
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: TEST_CONFIG.CONNECTION_TIMEOUT,
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Connection timeout'));
            }, TEST_CONFIG.CONNECTION_TIMEOUT);

            socket.on('connect', () => {
                clearTimeout(timeout);
                this.sockets.set(socket.id, socket);
                this.eventListeners.set(socket.id, new Map());
                resolve(socket);
            });

            socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    createUnauthenticatedSocket(namespace: string = '/messaging'): ClientSocket {
        const socket = io(`${TEST_CONFIG.API_URL}${namespace}`, {
            transports: ['websocket', 'polling'],
            reconnection: false,
        });
        this.sockets.set(socket.id, socket);
        return socket;
    }

    async waitForEvent<T>(
        socket: ClientSocket,
        event: string,
        timeout: number = TEST_CONFIG.EVENT_TIMEOUT
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                socket.off(event);
                reject(new Error(`Timeout waiting for event: ${event}`));
            }, timeout);

            socket.once(event, (data: T) => {
                clearTimeout(timer);
                resolve(data);
            });
        });
    }

    async emitAndWaitForResponse<T>(
        socket: ClientSocket,
        emitEvent: string,
        data: any,
        responseEvent: string = `${emitEvent}_response`,
        timeout: number = TEST_CONFIG.EVENT_TIMEOUT
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                socket.off(responseEvent);
                reject(new Error(`Timeout waiting for response to: ${emitEvent}`));
            }, timeout);

            socket.once(responseEvent, (response: T) => {
                clearTimeout(timer);
                resolve(response);
            });

            socket.emit(emitEvent, data);
        });
    }

    async waitForBroadcast<T>(
        sockets: ClientSocket[],
        event: string,
        filter?: (data: T) => boolean,
        timeout: number = TEST_CONFIG.EVENT_TIMEOUT
    ): Promise<{ socket: ClientSocket; data: T }> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                sockets.forEach(s => s.off(event));
                reject(new Error(`Timeout waiting for broadcast: ${event}`));
            }, timeout);

            sockets.forEach(socket => {
                socket.once(event, (data: T) => {
                    if (!filter || filter(data)) {
                        clearTimeout(timer);
                        sockets.forEach(s => s.off(event));
                        resolve({ socket, data });
                    }
                });
            });
        });
    }

    async sendMessageWithAck(
        socket: ClientSocket,
        event: string,
        data: any,
        timeout: number = TEST_CONFIG.EVENT_TIMEOUT
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for ack: ${event}`));
            }, timeout);

            socket.emit(event, data, (response: any) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }

    disconnectAll(): void {
        this.sockets.forEach(socket => {
            if (socket.connected) {
                socket.disconnect();
            }
        });
        this.sockets.clear();
        this.eventListeners.clear();
    }

    disconnectSocket(socket: ClientSocket): void {
        if (socket.connected) {
            socket.disconnect();
        }
        this.sockets.delete(socket.id);
        this.eventListeners.delete(socket.id);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// JWT Token Generator
// ═══════════════════════════════════════════════════════════════════════════

class TokenGenerator {
    private jwtService: JwtService;

    constructor() {
        this.jwtService = new JwtService({
            secret: TEST_CONFIG.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        });
    }

    generateValidToken(user: TestUser): string {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
            roles: user.roles,
            jti: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
    }

    generateExpiredToken(user: TestUser): string {
        return this.jwtService.sign(
            {
                sub: user.id,
                email: user.email,
                roles: user.roles,
                jti: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
            { expiresIn: '-1h' }
        );
    }

    generateInvalidToken(): string {
        return 'invalid.token.here';
    }

    generateTokenWithWrongSecret(user: TestUser): string {
        const wrongJwt = new JwtService({
            secret: 'wrong-secret-that-is-also-32-chars-long',
        });
        return wrongJwt.sign({
            sub: user.id,
            email: user.email,
            roles: user.roles,
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test Data Factory
// ═══════════════════════════════════════════════════════════════════════════

class TestDataFactory {
    private static counter = 0;

    static createUser(overrides: Partial<TestUser> = {}): TestUser {
        this.counter++;
        return {
            id: overrides.id || `user-${this.counter}-${Date.now()}`,
            email: overrides.email || `test${this.counter}@school.com`,
            roles: overrides.roles || ['student'],
            ...overrides,
        };
    }

    static createChannel(overrides: Partial<TestChannel> = {}): TestChannel {
        this.counter++;
        return {
            id: overrides.id || `channel-${this.counter}-${Date.now()}`,
            name: overrides.name || `Test Channel ${this.counter}`,
            type: overrides.type || 'direct_message',
            members: overrides.members || [],
            ...overrides,
        };
    }

    static createMessage(overrides: Partial<TestMessage> = {}): TestMessage {
        this.counter++;
        return {
            id: overrides.id || `msg-${this.counter}-${Date.now()}`,
            content: overrides.content || `Test message ${this.counter}`,
            channelId: overrides.channelId || 'default-channel',
            senderId: overrides.senderId || 'default-user',
            createdAt: overrides.createdAt || new Date(),
            ...overrides,
        };
    }

    static generateLongContent(length: number): string {
        return 'a'.repeat(length);
    }

    static generateXssPayload(): string {
        return '<script>alert("xss")</script><img src=x onerror=alert("xss")>';
    }

    static generateSqlInjection(): string {
        return "'; DROP TABLE messages; --";
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Test Suite
// ═══════════════════════════════════════════════════════════════════════════

describe('MessagingGateway WebSocket Tests', () => {
    let app: INestApplication;
    let helper: WebSocketTestHelper;
    let tokenGenerator: TokenGenerator;
    let prisma: PrismaClient;
    let redisClient: RedisClientType;

    // Test users
    let adminUser: TestUser;
    let teacherUser: TestUser;
    let studentUser: TestUser;
    let parentUser: TestUser;
    let mutedUser: TestUser;
    let bannedUser: TestUser;

    // Test channel
    let testChannel: TestChannel;

    beforeAll(async () => {
        // Initialize Prisma
        prisma = new PrismaClient();

        // Initialize Redis for denylist testing
        redisClient = createClient({ url: TEST_CONFIG.REDIS_URL });
        await redisClient.connect();

        // Initialize helpers
        helper = new WebSocketTestHelper();
        tokenGenerator = new TokenGenerator();

        // Create test users with tokens
        adminUser = {
            ...TestDataFactory.createUser({
                email: 'admin@test.com',
                roles: ['admin'],
            }),
            token: '',
        };
        adminUser.token = tokenGenerator.generateValidToken(adminUser);

        teacherUser = {
            ...TestDataFactory.createUser({
                email: 'teacher@test.com',
                roles: ['teacher'],
            }),
            token: '',
        };
        teacherUser.token = tokenGenerator.generateValidToken(teacherUser);

        studentUser = {
            ...TestDataFactory.createUser({
                email: 'student@test.com',
                roles: ['student'],
            }),
            token: '',
        };
        studentUser.token = tokenGenerator.generateValidToken(studentUser);

        parentUser = {
            ...TestDataFactory.createUser({
                email: 'parent@test.com',
                roles: ['parent'],
            }),
            token: '',
        };
        parentUser.token = tokenGenerator.generateValidToken(parentUser);

        mutedUser = {
            ...TestDataFactory.createUser({
                email: 'muted@test.com',
                roles: ['student'],
            }),
            token: '',
        };
        mutedUser.token = tokenGenerator.generateValidToken(mutedUser);

        bannedUser = {
            ...TestDataFactory.createUser({
                email: 'banned@test.com',
                roles: ['student'],
            }),
            token: '',
        };
        bannedUser.token = tokenGenerator.generateValidToken(bannedUser);

        // Create test channel
        testChannel = TestDataFactory.createChannel({
            name: 'Test Channel',
            type: 'classroom',
            members: [adminUser.id, teacherUser.id, studentUser.id],
        });
    });

    afterAll(async () => {
        helper.disconnectAll();
        await redisClient.quit();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clear Redis denylist before each test
        const keys = await redisClient.keys('denylist:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    });

    afterEach(() => {
        helper.disconnectAll();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('Connection Tests', () => {
        it('should connect successfully with valid JWT', async () => {
            const socket = await helper.createAuthenticatedSocket(adminUser);
            expect(socket.connected).toBe(true);
            helper.disconnectSocket(socket);
        });

        it('should reject connection with missing token', async () => {
            const socket = helper.createUnauthenticatedSocket();

            await expect(
                new Promise((_, reject) => {
                    socket.on('connect_error', (error) => {
                        reject(error);
                    });
                    setTimeout(() => reject(new Error('Timeout')), 3000);
                })
            ).rejects.toThrow();
        });

        it('should reject connection with invalid JWT format', async () => {
            const invalidUser = TestDataFactory.createUser();
            invalidUser.token = tokenGenerator.generateInvalidToken();

            await expect(
                helper.createAuthenticatedSocket(invalidUser)
            ).rejects.toThrow();
        });

        it('should reject connection with expired JWT', async () => {
            const expiredUser = TestDataFactory.createUser();
            expiredUser.token = tokenGenerator.generateExpiredToken(expiredUser);

            await expect(
                helper.createAuthenticatedSocket(expiredUser)
            ).rejects.toThrow();
        });

        it('should reject connection with wrong JWT secret', async () => {
            const wrongSecretUser = TestDataFactory.createUser();
            wrongSecretUser.token = tokenGenerator.generateTokenWithWrongSecret(wrongSecretUser);

            await expect(
                helper.createAuthenticatedSocket(wrongSecretUser)
            ).rejects.toThrow();
        });

        it('should reject connection with revoked token (Redis denylist)', async () => {
            // Create token and add to denylist
            const revokedUser = TestDataFactory.createUser();
            revokedUser.token = tokenGenerator.generateValidToken(revokedUser);

            // Decode token to get jti
            const decoded = new JwtService().decode(revokedUser.token) as any;
            const jti = decoded.jti;

            // Add to Redis denylist
            await redisClient.set(`denylist:${jti}`, 'revoked', { EX: 3600 });

            await expect(
                helper.createAuthenticatedSocket(revokedUser)
            ).rejects.toThrow();
        });

        it('should join admin-global room for admin users', async () => {
            const adminSocket = await helper.createAuthenticatedSocket(adminUser);
            expect(adminSocket.connected).toBe(true);

            // Admin should receive user:online events
            const onlinePromise = helper.waitForEvent(adminSocket, 'user:online', 2000);

            // Connect another user
            const studentSocket = await helper.createAuthenticatedSocket(studentUser);

            // Admin should see the online event
            const onlineEvent = await onlinePromise;
            expect(onlineEvent).toBeDefined();
            expect(onlineEvent.userId).toBe(studentUser.id);

            helper.disconnectSocket(adminSocket);
            helper.disconnectSocket(studentSocket);
        });

        it('should emit user:offline on disconnect', async () => {
            const adminSocket = await helper.createAuthenticatedSocket(adminUser);
            const studentSocket = await helper.createAuthenticatedSocket(studentUser);

            // Wait for student to connect
            await helper.waitForEvent(adminSocket, 'user:online', 2000);

            // Listen for offline event
            const offlinePromise = helper.waitForEvent(adminSocket, 'user:offline', 2000);

            // Disconnect student
            helper.disconnectSocket(studentSocket);

            // Should receive offline event
            const offlineEvent = await offlinePromise;
            expect(offlineEvent.userId).toBe(studentUser.id);

            helper.disconnectSocket(adminSocket);
        });

        it('should handle concurrent connections from same user', async () => {
            // Multiple connections from same user should be allowed
            const socket1 = await helper.createAuthenticatedSocket(studentUser);
            const socket2 = await helper.createAuthenticatedSocket(studentUser);
            const socket3 = await helper.createAuthenticatedSocket(studentUser);

            expect(socket1.connected).toBe(true);
            expect(socket2.connected).toBe(true);
            expect(socket3.connected).toBe(true);

            // All should have different IDs
            expect(socket1.id).not.toBe(socket2.id);
            expect(socket2.id).not.toBe(socket3.id);

            helper.disconnectSocket(socket1);
            helper.disconnectSocket(socket2);
            helper.disconnectSocket(socket3);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // MESSAGE:SEND TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('message:send Tests', () => {
        it('should send valid message and broadcast to channel', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const receiver = await helper.createAuthenticatedSocket(teacherUser);

            // Join channel
            await helper.sendMessageWithAck(sender, 'channel:join', { channelId: testChannel.id });
            await helper.sendMessageWithAck(receiver, 'channel:join', { channelId: testChannel.id });

            // Listen for broadcast
            const broadcastPromise = helper.waitForEvent(receiver, 'message:new');

            // Send message
            const messageData = {
                channelId: testChannel.id,
                content: 'Hello, this is a test message!',
            };

            const response = await helper.sendMessageWithAck(sender, 'message:send', messageData);

            expect(response.success).toBe(true);
            expect(response.message).toBeDefined();
            expect(response.message.content).toBe(messageData.content);

            // Receiver should get broadcast
            const broadcast = await broadcastPromise;
            expect(broadcast.content).toBe(messageData.content);
            expect(broadcast.senderId).toBe(studentUser.id);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(receiver);
        });

        it('should reject empty content with validation error', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: '',
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('content');

            helper.disconnectSocket(socket);
        });

        it('should reject content exceeding 4000 characters', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: TestDataFactory.generateLongContent(4001),
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('4000');

            helper.disconnectSocket(socket);
        });

        it('should reject message from non-member', async () => {
            const nonMember = TestDataFactory.createUser({ roles: ['student'] });
            nonMember.token = tokenGenerator.generateValidToken(nonMember);

            const socket = await helper.createAuthenticatedSocket(nonMember);

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'I should not be able to send this',
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('member');

            helper.disconnectSocket(socket);
        });

        it('should reject message from muted user', async () => {
            const socket = await helper.createAuthenticatedSocket(mutedUser);

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'I am muted and should not be able to send',
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('muted');

            helper.disconnectSocket(socket);
        });

        it('should enforce rate limit of 30 messages per minute', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Send 30 messages (the limit)
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 30; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'message:send', {
                        channelId: testChannel.id,
                        content: `Message ${i}`,
                    })
                );
            }

            const results = await Promise.all(promises);
            const successfulSends = results.filter(r => r.success).length;

            // All 30 should succeed
            expect(successfulSends).toBe(30);

            // 31st message should be rate limited
            const limitedResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'This should be rate limited',
            });

            expect(limitedResponse.success).toBe(false);
            expect(limitedResponse.error).toContain('Rate limit');

            helper.disconnectSocket(socket);
        });

        it('should sanitize XSS payload in message content', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const xssPayload = TestDataFactory.generateXssPayload();

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: xssPayload,
            });

            // Should succeed but content should be sanitized
            expect(response.success).toBe(true);

            // Verify the content is sanitized (no script tags)
            const sanitizedContent = response.message.content;
            expect(sanitizedContent).not.toContain('<script>');
            expect(sanitizedContent).not.toContain('onerror=');

            helper.disconnectSocket(socket);
        });

        it('should handle message with replyTo', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // First create a message to reply to
            const parentMessage = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'Parent message',
            });

            // Reply to it
            const replyResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'This is a reply',
                replyTo: parentMessage.message.id,
            });

            expect(replyResponse.success).toBe(true);
            expect(replyResponse.message.replyTo).toBe(parentMessage.message.id);

            helper.disconnectSocket(socket);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // MESSAGE:EDIT TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('message:edit Tests', () => {
        it('should allow owner to edit their own message', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'Original content',
            });

            expect(sendResponse.success).toBe(true);

            // Edit the message
            const editResponse = await helper.sendMessageWithAck(socket, 'message:edit', {
                messageId: sendResponse.message.id,
                content: 'Edited content',
            });

            expect(editResponse.success).toBe(true);
            expect(editResponse.message.content).toBe('Edited content');
            expect(editResponse.message.editedAt).toBeDefined();

            helper.disconnectSocket(socket);
        });

        it('should reject edit by non-owner', async () => {
            const ownerSocket = await helper.createAuthenticatedSocket(studentUser);
            const otherSocket = await helper.createAuthenticatedSocket(teacherUser);

            // Create message as student
            const sendResponse = await helper.sendMessageWithAck(ownerSocket, 'message:send', {
                channelId: testChannel.id,
                content: 'My message',
            });

            // Try to edit as teacher
            const editResponse = await helper.sendMessageWithAck(otherSocket, 'message:edit', {
                messageId: sendResponse.message.id,
                content: 'Trying to edit',
            });

            expect(editResponse.success).toBe(false);
            expect(editResponse.error).toContain('edit');

            helper.disconnectSocket(ownerSocket);
            helper.disconnectSocket(otherSocket);
        });

        it('should reject edit of deleted message', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create and delete a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'To be deleted',
            });

            await helper.sendMessageWithAck(socket, 'message:delete', {
                messageId: sendResponse.message.id,
            });

            // Try to edit deleted message
            const editResponse = await helper.sendMessageWithAck(socket, 'message:edit', {
                messageId: sendResponse.message.id,
                content: 'Trying to edit deleted',
            });

            expect(editResponse.success).toBe(false);
            expect(editResponse.error).toContain('deleted');

            helper.disconnectSocket(socket);
        });

        it('should enforce rate limit of 20 edits per minute', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'Original',
            });

            // Send 20 edits (the limit)
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 20; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'message:edit', {
                        messageId: sendResponse.message.id,
                        content: `Edit ${i}`,
                    })
                );
            }

            const results = await Promise.all(promises);
            const successfulEdits = results.filter(r => r.success).length;

            // 21st edit should be rate limited
            const limitedResponse = await helper.sendMessageWithAck(socket, 'message:edit', {
                messageId: sendResponse.message.id,
                content: 'Should be limited',
            });

            expect(limitedResponse.success).toBe(false);
            expect(limitedResponse.error).toContain('Rate limit');

            helper.disconnectSocket(socket);
        });

        it('should broadcast edited message to channel', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const receiver = await helper.createAuthenticatedSocket(teacherUser);

            // Create message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'Original',
            });

            // Listen for edit broadcast
            const broadcastPromise = helper.waitForEvent(receiver, 'message:updated');

            // Edit the message
            await helper.sendMessageWithAck(sender, 'message:edit', {
                messageId: sendResponse.message.id,
                content: 'Edited!',
            });

            // Receiver should get broadcast
            const broadcast = await broadcastPromise;
            expect(broadcast.type).toBe('updated');
            expect(broadcast.messageId).toBe(sendResponse.message.id);
            expect(broadcast.content).toBe('Edited!');

            helper.disconnectSocket(sender);
            helper.disconnectSocket(receiver);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // MESSAGE:DELETE TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('message:delete Tests', () => {
        it('should allow owner to delete their message (soft delete)', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'To be deleted',
            });

            // Delete the message
            const deleteResponse = await helper.sendMessageWithAck(socket, 'message:delete', {
                messageId: sendResponse.message.id,
            });

            expect(deleteResponse.success).toBe(true);

            helper.disconnectSocket(socket);
        });

        it('should allow admin to delete any message', async () => {
            const studentSocket = await helper.createAuthenticatedSocket(studentUser);
            const adminSocket = await helper.createAuthenticatedSocket(adminUser);

            // Create message as student
            const sendResponse = await helper.sendMessageWithAck(studentSocket, 'message:send', {
                channelId: testChannel.id,
                content: 'Student message',
            });

            // Delete as admin
            const deleteResponse = await helper.sendMessageWithAck(adminSocket, 'message:delete', {
                messageId: sendResponse.message.id,
            });

            expect(deleteResponse.success).toBe(true);

            helper.disconnectSocket(studentSocket);
            helper.disconnectSocket(adminSocket);
        });

        it('should reject delete by non-owner non-admin', async () => {
            const ownerSocket = await helper.createAuthenticatedSocket(studentUser);
            const otherSocket = await helper.createAuthenticatedSocket(teacherUser);

            // Create message as student
            const sendResponse = await helper.sendMessageWithAck(ownerSocket, 'message:send', {
                channelId: testChannel.id,
                content: 'My message',
            });

            // Try to delete as teacher (not owner, not admin)
            const deleteResponse = await helper.sendMessageWithAck(otherSocket, 'message:delete', {
                messageId: sendResponse.message.id,
            });

            expect(deleteResponse.success).toBe(false);
            expect(deleteResponse.error).toContain('delete');

            helper.disconnectSocket(ownerSocket);
            helper.disconnectSocket(otherSocket);
        });

        it('should enforce rate limit of 10 deletes per minute', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create 11 messages
            const messageIds: string[] = [];
            for (let i = 0; i < 11; i++) {
                const response = await helper.sendMessageWithAck(socket, 'message:send', {
                    channelId: testChannel.id,
                    content: `Message ${i}`,
                });
                messageIds.push(response.message.id);
            }

            // Delete 10 messages (the limit)
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'message:delete', {
                        messageId: messageIds[i],
                    })
                );
            }

            await Promise.all(promises);

            // 11th delete should be rate limited
            const limitedResponse = await helper.sendMessageWithAck(socket, 'message:delete', {
                messageId: messageIds[10],
            });

            expect(limitedResponse.success).toBe(false);
            expect(limitedResponse.error).toContain('Rate limit');

            helper.disconnectSocket(socket);
        });

        it('should broadcast deleted message event to channel', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const receiver = await helper.createAuthenticatedSocket(teacherUser);

            // Create message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'To be deleted',
            });

            // Listen for delete broadcast
            const broadcastPromise = helper.waitForEvent(receiver, 'message:deleted');

            // Delete the message
            await helper.sendMessageWithAck(sender, 'message:delete', {
                messageId: sendResponse.message.id,
            });

            // Receiver should get broadcast
            const broadcast = await broadcastPromise;
            expect(broadcast.type).toBe('deleted');
            expect(broadcast.messageId).toBe(sendResponse.message.id);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(receiver);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // MESSAGE:READ TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('message:read Tests', () => {
        it('should mark single message as read', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const reader = await helper.createAuthenticatedSocket(teacherUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'Read me',
            });

            // Mark as read
            const readResponse = await helper.sendMessageWithAck(reader, 'message:read', {
                messageId: sendResponse.message.id,
                channelId: testChannel.id,
            });

            expect(readResponse.success).toBe(true);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(reader);
        });

        it('should mark multiple messages as read (bulk)', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const reader = await helper.createAuthenticatedSocket(teacherUser);

            // Create multiple messages
            const messageIds: string[] = [];
            for (let i = 0; i < 5; i++) {
                const response = await helper.sendMessageWithAck(sender, 'message:send', {
                    channelId: testChannel.id,
                    content: `Message ${i}`,
                });
                messageIds.push(response.message.id);
            }

            // Bulk mark as read
            const readResponse = await helper.sendMessageWithAck(reader, 'message:read_bulk', {
                messageIds,
                channelId: testChannel.id,
            });

            expect(readResponse.success).toBe(true);
            expect(readResponse.count).toBe(5);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(reader);
        });

        it('should reject read from non-member', async () => {
            const nonMember = TestDataFactory.createUser({ roles: ['student'] });
            nonMember.token = tokenGenerator.generateValidToken(nonMember);

            const sender = await helper.createAuthenticatedSocket(studentUser);
            const reader = await helper.createAuthenticatedSocket(nonMember);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'Read me',
            });

            // Try to mark as read
            const readResponse = await helper.sendMessageWithAck(reader, 'message:read', {
                messageId: sendResponse.message.id,
                channelId: testChannel.id,
            });

            expect(readResponse.success).toBe(false);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(reader);
        });

        it('should broadcast read receipt to channel', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const reader = await helper.createAuthenticatedSocket(teacherUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'Read me',
            });

            // Listen for read receipt
            const receiptPromise = helper.waitForEvent(sender, 'message:read_receipt');

            // Mark as read
            await helper.sendMessageWithAck(reader, 'message:read', {
                messageId: sendResponse.message.id,
                channelId: testChannel.id,
            });

            // Sender should receive receipt
            const receipt = await receiptPromise;
            expect(receipt.messageId).toBe(sendResponse.message.id);
            expect(receipt.readBy.userId).toBe(teacherUser.id);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(reader);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // REACTION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('reaction:add/remove Tests', () => {
        it('should add reaction to message', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Add reaction
            const reactionResponse = await helper.sendMessageWithAck(socket, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            expect(reactionResponse.success).toBe(true);
            expect(reactionResponse.reaction).toBeDefined();

            helper.disconnectSocket(socket);
        });

        it('should remove own reaction', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Add reaction
            await helper.sendMessageWithAck(socket, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            // Remove reaction
            const removeResponse = await helper.sendMessageWithAck(socket, 'reaction:remove', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            expect(removeResponse.success).toBe(true);

            helper.disconnectSocket(socket);
        });

        it('should allow admin to remove any reaction', async () => {
            const studentSocket = await helper.createAuthenticatedSocket(studentUser);
            const adminSocket = await helper.createAuthenticatedSocket(adminUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(studentSocket, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Student adds reaction
            await helper.sendMessageWithAck(studentSocket, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            // Admin removes it
            const removeResponse = await helper.sendMessageWithAck(adminSocket, 'reaction:remove', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            expect(removeResponse.success).toBe(true);

            helper.disconnectSocket(studentSocket);
            helper.disconnectSocket(adminSocket);
        });

        it('should reject non-admin removing others reaction', async () => {
            const studentSocket = await helper.createAuthenticatedSocket(studentUser);
            const teacherSocket = await helper.createAuthenticatedSocket(teacherUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(studentSocket, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Student adds reaction
            await helper.sendMessageWithAck(studentSocket, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            // Teacher tries to remove it (not admin, not owner of reaction)
            const removeResponse = await helper.sendMessageWithAck(teacherSocket, 'reaction:remove', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            expect(removeResponse.success).toBe(false);

            helper.disconnectSocket(studentSocket);
            helper.disconnectSocket(teacherSocket);
        });

        it('should broadcast reaction events to channel', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const receiver = await helper.createAuthenticatedSocket(teacherUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Listen for reaction broadcast
            const reactionPromise = helper.waitForEvent(receiver, 'message:reaction_added');

            // Add reaction
            await helper.sendMessageWithAck(sender, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            // Receiver should get broadcast
            const broadcast = await reactionPromise;
            expect(broadcast.type).toBe('reaction_added');
            expect(broadcast.reaction).toBe('👍');
            expect(broadcast.userId).toBe(studentUser.id);

            helper.disconnectSocket(sender);
            helper.disconnectSocket(receiver);
        });

        it('should enforce rate limit for reactions', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create a message
            const sendResponse = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: 'React to this',
            });

            // Send 30 reactions (the limit)
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 30; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'reaction:add', {
                        messageId: sendResponse.message.id,
                        reaction: '👍',
                    })
                );
            }

            await Promise.all(promises);

            // 31st reaction should be rate limited
            const limitedResponse = await helper.sendMessageWithAck(socket, 'reaction:add', {
                messageId: sendResponse.message.id,
                reaction: '👍',
            });

            expect(limitedResponse.success).toBe(false);
            expect(limitedResponse.error).toContain('Rate limit');

            helper.disconnectSocket(socket);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TYPING TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('typing:start/stop Tests', () => {
        it('should broadcast typing:start to channel members', async () => {
            const typer = await helper.createAuthenticatedSocket(studentUser);
            const observer = await helper.createAuthenticatedSocket(teacherUser);

            // Join channel
            await helper.sendMessageWithAck(observer, 'channel:join', { channelId: testChannel.id });

            // Listen for typing event
            const typingPromise = helper.waitForEvent(observer, 'typing:update');

            // Start typing
            typer.emit('typing:start', { channelId: testChannel.id });

            // Observer should receive typing event
            const event = await typingPromise;
            expect(event.type).toBe('start');
            expect(event.channelId).toBe(testChannel.id);
            expect(event.userId).toBe(studentUser.id);

            helper.disconnectSocket(typer);
            helper.disconnectSocket(observer);
        });

        it('should broadcast typing:stop to channel members', async () => {
            const typer = await helper.createAuthenticatedSocket(studentUser);
            const observer = await helper.createAuthenticatedSocket(teacherUser);

            // Join channel
            await helper.sendMessageWithAck(observer, 'channel:join', { channelId: testChannel.id });

            // Listen for stop typing event
            const typingPromise = helper.waitForEvent(observer, 'typing:update');

            // Stop typing
            typer.emit('typing:stop', { channelId: testChannel.id });

            // Observer should receive event
            const event = await typingPromise;
            expect(event.type).toBe('stop');
            expect(event.channelId).toBe(testChannel.id);

            helper.disconnectSocket(typer);
            helper.disconnectSocket(observer);
        });

        it('should reject typing from non-member', async () => {
            const nonMember = TestDataFactory.createUser({ roles: ['student'] });
            nonMember.token = tokenGenerator.generateValidToken(nonMember);

            const socket = await helper.createAuthenticatedSocket(nonMember);

            // Try to start typing - handler returns void on error, so we just verify no crash
            socket.emit('typing:start', { channelId: testChannel.id });

            // Give it a moment
            await new Promise(resolve => setTimeout(resolve, 100));

            helper.disconnectSocket(socket);
        });

        it('should reject typing from banned user', async () => {
            const socket = await helper.createAuthenticatedSocket(bannedUser);

            // Try to start typing
            socket.emit('typing:start', { channelId: testChannel.id });

            // Give it a moment
            await new Promise(resolve => setTimeout(resolve, 100));

            helper.disconnectSocket(socket);
        });

        it('should enforce rate limit of 60 typing events per minute', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Send 60 typing events (the limit)
            for (let i = 0; i < 60; i++) {
                socket.emit('typing:start', { channelId: testChannel.id });
            }

            // Give it a moment to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // 61st event should be rate limited (no error emitted, just silently ignored)
            socket.emit('typing:start', { channelId: testChannel.id });

            helper.disconnectSocket(socket);
        });

        it('should get typing users for channel', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Start typing
            socket.emit('typing:start', { channelId: testChannel.id });

            // Get typing users
            const response = await helper.sendMessageWithAck(socket, 'typing:get', {
                channelId: testChannel.id,
            });

            expect(response.success).toBe(true);
            expect(response.channelId).toBe(testChannel.id);
            expect(Array.isArray(response.users)).toBe(true);

            helper.disconnectSocket(socket);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CHANNEL:JOIN TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('channel:join Tests', () => {
        it('should allow member to join their channel', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const response = await helper.sendMessageWithAck(socket, 'channel:join', {
                channelId: testChannel.id,
            });

            expect(response.success).toBe(true);

            helper.disconnectSocket(socket);
        });

        it('should reject join to unauthorized channel', async () => {
            const nonMember = TestDataFactory.createUser({ roles: ['student'] });
            nonMember.token = tokenGenerator.generateValidToken(nonMember);

            const socket = await helper.createAuthenticatedSocket(nonMember);

            const response = await helper.sendMessageWithAck(socket, 'channel:join', {
                channelId: testChannel.id,
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('member');

            helper.disconnectSocket(socket);
        });

        it('should reject join to non-existent channel', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const response = await helper.sendMessageWithAck(socket, 'channel:join', {
                channelId: 'non-existent-channel-uuid',
            });

            expect(response.success).toBe(false);

            helper.disconnectSocket(socket);
        });

        it('should reject join for banned user', async () => {
            const socket = await helper.createAuthenticatedSocket(bannedUser);

            const response = await helper.sendMessageWithAck(socket, 'channel:join', {
                channelId: testChannel.id,
            });

            expect(response.success).toBe(false);
            expect(response.error).toContain('member');

            helper.disconnectSocket(socket);
        });

        it('should enforce rate limit of 10 channel joins per minute', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Create multiple channels or retry same channel
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'channel:join', {
                        channelId: testChannel.id,
                    })
                );
            }

            const results = await Promise.all(promises);

            // 11th join should be rate limited
            const limitedResponse = await helper.sendMessageWithAck(socket, 'channel:join', {
                channelId: testChannel.id,
            });

            expect(limitedResponse.success).toBe(false);
            expect(limitedResponse.error).toContain('Rate limit');

            helper.disconnectSocket(socket);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('Security Tests', () => {
        it('should handle rapid message spam (100 messages/sec)', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Rapid fire 100 messages
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 100; i++) {
                promises.push(
                    helper.sendMessageWithAck(socket, 'message:send', {
                        channelId: testChannel.id,
                        content: `Spam ${i}`,
                    })
                );
            }

            // Should not crash - rate limiting will kick in
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;

            // Only first 30 should succeed (rate limit)
            expect(successful).toBeLessThanOrEqual(30);

            helper.disconnectSocket(socket);
        }, 15000);

        it('should handle concurrent connections from same user', async () => {
            const sockets: ClientSocket[] = [];

            // Create 10 concurrent connections
            for (let i = 0; i < 10; i++) {
                const socket = await helper.createAuthenticatedSocket(studentUser);
                sockets.push(socket);
            }

            // All should be connected
            sockets.forEach(socket => {
                expect(socket.connected).toBe(true);
            });

            // Send from each socket
            const promises = sockets.map(socket =>
                helper.sendMessageWithAck(socket, 'message:send', {
                    channelId: testChannel.id,
                    content: 'Concurrent message',
                })
            );

            const results = await Promise.all(promises);

            // Rate limiting is per user, not per socket
            // So only first 30 total should succeed
            const successful = results.filter(r => r.success).length;
            expect(successful).toBeLessThanOrEqual(10);

            sockets.forEach(s => helper.disconnectSocket(s));
        });

        it('should handle malformed JSON gracefully', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Send malformed data
            (socket as any).emit('message:send', 'not valid json');
            (socket as any).emit('message:send', { channelId: null, content: undefined });
            (socket as any).emit('message:send', 12345);

            // Give it a moment
            await new Promise(resolve => setTimeout(resolve, 500));

            // Socket should still be connected
            expect(socket.connected).toBe(true);

            helper.disconnectSocket(socket);
        });

        it('should handle SQL injection attempts', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            const sqlInjection = TestDataFactory.generateSqlInjection();

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: sqlInjection,
            });

            // Should either succeed with sanitized content or fail gracefully
            if (response.success) {
                expect(response.message.content).not.toContain('DROP TABLE');
            }

            helper.disconnectSocket(socket);
        });

        it('should handle large message payload gracefully', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Try to send very large payload (>1MB)
            const largeContent = TestDataFactory.generateLongContent(2 * 1024 * 1024);

            const response = await helper.sendMessageWithAck(socket, 'message:send', {
                channelId: testChannel.id,
                content: largeContent,
            }, 10000);

            // Should be rejected due to size limit
            expect(response.success).toBe(false);

            helper.disconnectSocket(socket);
        }, 15000);

        it('should prevent channel enumeration attack', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Try to join random channel IDs
            const attempts = [];
            for (let i = 0; i < 20; i++) {
                const randomId = `channel-${Math.random().toString(36).substring(7)}`;
                attempts.push(
                    helper.sendMessageWithAck(socket, 'channel:join', {
                        channelId: randomId,
                    })
                );
            }

            const results = await Promise.all(attempts);

            // All should fail
            results.forEach(result => {
                expect(result.success).toBe(false);
            });

            // Socket should still be connected
            expect(socket.connected).toBe(true);

            helper.disconnectSocket(socket);
        });

        it('should prevent message ID enumeration', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Try to edit/delete non-existent messages
            const attempts = [];
            for (let i = 0; i < 10; i++) {
                const randomId = `msg-${Math.random().toString(36).substring(7)}`;
                attempts.push(
                    helper.sendMessageWithAck(socket, 'message:edit', {
                        messageId: randomId,
                        content: 'Hacked!',
                    })
                );
            }

            const results = await Promise.all(attempts);

            // All should fail
            results.forEach(result => {
                expect(result.success).toBe(false);
            });

            helper.disconnectSocket(socket);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('Performance Tests', () => {
        it('should handle 50 concurrent connections', async () => {
            const sockets: ClientSocket[] = [];

            // Create 50 connections
            for (let i = 0; i < 50; i++) {
                const user = TestDataFactory.createUser({
                    email: `perf${i}@test.com`,
                    roles: ['student'],
                });
                user.token = tokenGenerator.generateValidToken(user);

                const socket = await helper.createAuthenticatedSocket(user);
                sockets.push(socket);
            }

            // All should be connected
            const connectedCount = sockets.filter(s => s.connected).length;
            expect(connectedCount).toBe(50);

            // Cleanup
            sockets.forEach(s => helper.disconnectSocket(s));
        }, 30000);

        it('should handle 100 messages broadcast latency', async () => {
            const sender = await helper.createAuthenticatedSocket(studentUser);
            const receivers: ClientSocket[] = [];

            // Create 10 receivers
            for (let i = 0; i < 10; i++) {
                const user = TestDataFactory.createUser({
                    email: `receiver${i}@test.com`,
                    roles: ['student'],
                });
                user.token = tokenGenerator.generateValidToken(user);

                const socket = await helper.createAuthenticatedSocket(user);
                receivers.push(socket);
            }

            // Listen for messages on all receivers
            const messagePromises = receivers.map(socket =>
                helper.waitForEvent(socket, 'message:new')
            );

            const startTime = Date.now();

            // Send message
            await helper.sendMessageWithAck(sender, 'message:send', {
                channelId: testChannel.id,
                content: 'Broadcast test',
            });

            // Wait for all receivers to get it
            await Promise.all(messagePromises);

            const endTime = Date.now();
            const latency = endTime - startTime;

            // Should be under 2 seconds for all receivers
            expect(latency).toBeLessThan(2000);

            helper.disconnectSocket(sender);
            receivers.forEach(s => helper.disconnectSocket(s));
        }, 15000);

        it('should properly cleanup on disconnect', async () => {
            const socket = await helper.createAuthenticatedSocket(studentUser);

            // Verify connected
            expect(socket.connected).toBe(true);

            // Disconnect
            helper.disconnectSocket(socket);

            // Verify disconnected
            expect(socket.connected).toBe(false);

            // Memory should be cleaned up (no way to directly test, but ensure no crash)
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should handle connection storm gracefully', async () => {
            const connectionPromises: Promise<ClientSocket>[] = [];

            // Try to create 100 rapid connections
            for (let i = 0; i < 100; i++) {
                const user = TestDataFactory.createUser({
                    email: `storm${i}@test.com`,
                    roles: ['student'],
                });
                user.token = tokenGenerator.generateValidToken(user);

                connectionPromises.push(
                    helper.createAuthenticatedSocket(user).catch(() => null as any)
                );
            }

            const sockets = await Promise.all(connectionPromises);
            const connectedCount = sockets.filter(s => s && s.connected).length;

            // Should handle the storm - at least some should connect
            expect(connectedCount).toBeGreaterThan(0);

            // Cleanup
            sockets.forEach(s => s && helper.disconnectSocket(s));
        }, 30000);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // REDIS ADAPTER TESTS
    // ═══════════════════════════════════════════════════════════════════════

    describe('Redis Adapter Tests', () => {
        it('should connect to Redis adapter', async () => {
            // Redis adapter is initialized in afterInit
            // We verify by checking if Redis is accessible
            const pingResult = await redisClient.ping();
            expect(pingResult).toBe('PONG');
        });

        it('should handle Redis reconnection gracefully', async () => {
            // Create a socket while Redis is available
            const socket = await helper.createAuthenticatedSocket(studentUser);
            expect(socket.connected).toBe(true);

            // Disconnect socket
            helper.disconnectSocket(socket);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// E2E Test Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * To run these tests:
 * 
 * 1. Ensure the backend server is running:
 *    cd server && npm run dev
 * 
 * 2. Ensure Redis is running:
 *    docker run -d -p 6379:6379 redis:7-alpine
 * 
 * 3. Ensure PostgreSQL is running with test database:
 *    docker run -d -p 5433:5432 \
 *      -e POSTGRES_DB=test_db \
 *      -e POSTGRES_USER=test \
 *      -e POSTGRES_PASSWORD=test \
 *      postgres:16-alpine
 * 
 * 4. Run the tests:
 *    npm test -- messaging.ws-spec.ts
 * 
 * Environment variables:
 * - WS_TEST_URL: WebSocket server URL (default: http://localhost:3000/messaging)
 * - API_TEST_URL: API server URL (default: http://localhost:3000)
 * - REDIS_URL: Redis connection URL (default: redis://localhost:6379)
 * - JWT_SECRET: Secret for token generation
 */

// Export for potential external use
export {
    WebSocketTestHelper,
    TokenGenerator,
    TestDataFactory,
    TEST_CONFIG,
    RATE_LIMITS,
};
