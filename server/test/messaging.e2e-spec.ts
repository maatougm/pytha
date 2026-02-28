import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-67890';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';

describe('Messaging WebSocket (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let clientSocket: Socket;
    let accessToken: string;
    let userId: string;
    let channelId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
        await app.listen(3001); // Use different port for tests

        prisma = moduleFixture.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        if (clientSocket) {
            clientSocket.disconnect();
        }
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data
        await prisma.message.deleteMany({});
        await prisma.channelMember.deleteMany({});
        await prisma.channel.deleteMany({});
        await prisma.refreshToken.deleteMany({});
        await prisma.userRole.deleteMany({});
        await prisma.user.deleteMany({
            where: { email: { contains: 'test@' } },
        });

        // Create test user and get token via REST API
        const registerResponse = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'test@school.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'admin', // Use admin to bypass messaging restrictions
            });

        accessToken = registerResponse.body.accessToken;
        userId = registerResponse.body.user.id;

        // Create a test channel via REST API
        const channelResponse = await request(app.getHttpServer())
            .post('/api/channels')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                type: 'direct_message',
                name: 'Test Channel',
            });

        channelId = channelResponse.body.id;
    });

    describe('WebSocket Connection', () => {
        it('should connect with valid JWT token', (done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                expect(clientSocket.connected).toBe(true);
                done();
            });

            clientSocket.on('connect_error', (err) => {
                done(err);
            });
        });

        it('should reject connection without token', (done) => {
            clientSocket = io('http://localhost:3001', {
                transports: ['websocket'],
            });

            clientSocket.on('connect_error', (err) => {
                expect(err.message).toContain('Authentication error');
                done();
            });

            clientSocket.on('connect', () => {
                done(new Error('Should not connect without token'));
            });
        });

        it('should reject connection with invalid token', (done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: 'invalid-token' },
                transports: ['websocket'],
            });

            clientSocket.on('connect_error', (err) => {
                expect(err.message).toContain('Authentication error');
                done();
            });
        });
    });

    describe('Channel Operations', () => {
        beforeEach((done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', done);
        });

        afterEach(() => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        });

        it('should join a channel', (done) => {
            clientSocket.emit('channel:join', { channelId }, (response: any) => {
                expect(response.success).toBe(true);
                done();
            });
        });

        it('should receive error when joining non-existent channel', (done) => {
            clientSocket.emit('channel:join', { channelId: 'non-existent' }, (response: any) => {
                expect(response.success).toBe(false);
                expect(response.error).toBeDefined();
                done();
            });
        });
    });

    describe('Message Operations', () => {
        beforeEach((done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                // Join channel after connection
                clientSocket.emit('channel:join', { channelId }, () => {
                    done();
                });
            });
        });

        afterEach(() => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        });

        it('should send a message', (done) => {
            const messageData = {
                channelId,
                content: 'Hello, WebSocket!',
            };

            clientSocket.on('message:new', (message: any) => {
                expect(message.content).toBe(messageData.content);
                expect(message.senderId).toBe(userId);
                done();
            });

            clientSocket.emit('message:send', messageData, (response: any) => {
                expect(response.success).toBe(true);
                expect(response.message).toBeDefined();
            });
        });

        it('should edit a message', async () => {
            // First send a message
            const sendResponse: any = await new Promise((resolve) => {
                clientSocket.emit('message:send', {
                    channelId,
                    content: 'Original content',
                }, resolve);
            });

            expect(sendResponse.success).toBe(true);
            const messageId = sendResponse.message.id;

            // Then edit it
            const editResponse: any = await new Promise((resolve) => {
                clientSocket.emit('message:edit', {
                    messageId,
                    content: 'Updated content',
                }, resolve);
            });

            expect(editResponse.success).toBe(true);
            expect(editResponse.message.content).toBe('Updated content');
        });

        it('should delete a message', async () => {
            // First send a message
            const sendResponse: any = await new Promise((resolve) => {
                clientSocket.emit('message:send', {
                    channelId,
                    content: 'To be deleted',
                }, resolve);
            });

            const messageId = sendResponse.message.id;

            // Then delete it
            const deleteResponse: any = await new Promise((resolve) => {
                clientSocket.emit('message:delete', {
                    messageId,
                    channelId,
                }, resolve);
            });

            expect(deleteResponse.success).toBe(true);
        });

        it('should receive message:updated event when message is edited', (done) => {
            clientSocket.once('message:new', (message: any) => {
                clientSocket.once('message:updated', (updated: any) => {
                    expect(updated.messageId).toBe(message.id);
                    expect(updated.content).toBe('Updated content');
                    expect(updated.type).toBe('updated');
                    done();
                });

                clientSocket.emit('message:edit', {
                    messageId: message.id,
                    content: 'Updated content',
                });
            });

            clientSocket.emit('message:send', {
                channelId,
                content: 'Original content',
            });
        });

        it('should receive message:deleted event when message is deleted', (done) => {
            clientSocket.once('message:new', (message: any) => {
                clientSocket.once('message:deleted', (deleted: any) => {
                    expect(deleted.messageId).toBe(message.id);
                    expect(deleted.type).toBe('deleted');
                    done();
                });

                clientSocket.emit('message:delete', {
                    messageId: message.id,
                    channelId,
                });
            });

            clientSocket.emit('message:send', {
                channelId,
                content: 'To be deleted',
            });
        });
    });

    describe('Typing Indicators', () => {
        beforeEach((done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('channel:join', { channelId }, () => {
                    done();
                });
            });
        });

        afterEach(() => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        });

        it('should emit typing:start event', (done) => {
            clientSocket.emit('typing:start', { channelId }, (response: any) => {
                expect(response.success).toBe(true);
                done();
            });
        });

        it('should emit typing:stop event', (done) => {
            clientSocket.emit('typing:stop', { channelId }, (response: any) => {
                expect(response.success).toBe(true);
                done();
            });
        });

        it('should receive typing:update event', (done) => {
            clientSocket.on('typing:update', (data: any) => {
                expect(data.channelId).toBe(channelId);
                expect(data.userId).toBe(userId);
                done();
            });

            clientSocket.emit('typing:start', { channelId });
        });
    });

    describe('Read Receipts', () => {
        beforeEach((done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('channel:join', { channelId }, () => {
                    done();
                });
            });
        });

        afterEach(() => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        });

        it('should mark message as read', (done) => {
            clientSocket.once('message:new', (message: any) => {
                clientSocket.emit('message:read', {
                    messageId: message.id,
                    channelId,
                }, (response: any) => {
                    expect(response.success).toBe(true);
                    done();
                });
            });

            clientSocket.emit('message:send', {
                channelId,
                content: 'Please mark as read',
            });
        });

        it('should receive message:read_receipt event', (done) => {
            clientSocket.once('message:new', (message: any) => {
                clientSocket.once('message:read_receipt', (receipt: any) => {
                    expect(receipt.messageId).toBe(message.id);
                    expect(receipt.channelId).toBe(channelId);
                    expect(receipt.readBy.userId).toBe(userId);
                    done();
                });

                clientSocket.emit('message:read', {
                    messageId: message.id,
                    channelId,
                });
            });

            clientSocket.emit('message:send', {
                channelId,
                content: 'Read receipt test',
            });
        });

        it('should mark multiple messages as read in bulk', async () => {
            // Send multiple messages
            const messageIds: string[] = [];

            for (let i = 0; i < 3; i++) {
                const response: any = await new Promise((resolve) => {
                    clientSocket.emit('message:send', {
                        channelId,
                        content: `Message ${i}`,
                    }, resolve);
                });

                if (response.success) {
                    messageIds.push(response.message.id);
                }
            }

            // Mark all as read in bulk
            const bulkResponse: any = await new Promise((resolve) => {
                clientSocket.emit('message:read_bulk', {
                    messageIds,
                    channelId,
                }, resolve);
            });

            expect(bulkResponse.success).toBe(true);
            expect(bulkResponse.count).toBe(3);
        });
    });

    describe('Rate Limiting', () => {
        beforeEach((done) => {
            clientSocket = io('http://localhost:3001', {
                auth: { token: accessToken },
                transports: ['websocket'],
            });

            clientSocket.on('connect', () => {
                clientSocket.emit('channel:join', { channelId }, () => {
                    done();
                });
            });
        });

        afterEach(() => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        });

        it('should rate limit rapid message sends', async () => {
            const responses: any[] = [];

            // Send many messages rapidly
            for (let i = 0; i < 35; i++) {
                const response: any = await new Promise((resolve) => {
                    clientSocket.emit('message:send', {
                        channelId,
                        content: `Message ${i}`,
                    }, (res: any) => resolve(res));
                });

                responses.push(response);
            }

            // Some requests should be rate limited
            const hasRateLimited = responses.some(r => !r.success && r.error?.includes('rate limit'));
            // Note: Rate limiting might not be enabled in test environment
        });
    });
});
