import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChannelManagementService } from './channel-management.service';

export interface SendMessageWithAttachmentsDto {
    content: string;
    contentType?: 'text' | 'image' | 'file' | 'voice' | 'mixed';
    replyTo?: string;
    attachments?: {
        fileName: string;
        fileType: string;
        filePath: string;
        url?: string;
        duration?: number;
        width?: number;
        height?: number;
    }[];
}

@Injectable()
export class MessagingEnhancedService {
    private readonly logger = new Logger(MessagingEnhancedService.name);

    constructor(
        private prisma: PrismaService,
        private channelManagementService: ChannelManagementService,
    ) {}

    /**
     * Send a message with attachments (text, image, file, voice)
     */
    async sendMessage(
        channelId: string,
        senderId: string,
        dto: SendMessageWithAttachmentsDto,
    ): Promise<any> {
        // Check if channel exists and user is a member
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: senderId } },
            include: { channel: true },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this channel');
        }

        if (membership.channel.isArchived) {
            throw new ForbiddenException('This channel is archived');
        }

        if (membership.channel.approvalStatus !== 'approved') {
            throw new ForbiddenException('This channel is pending approval');
        }

        // Check if user is muted
        const muteStatus = await this.channelManagementService.isUserMuted(channelId, senderId);
        if (muteStatus.muted) {
            throw new ForbiddenException(
                `You are muted in this channel${muteStatus.reason ? `: ${muteStatus.reason}` : ''}` +
                `${muteStatus.expiresAt ? ` until ${muteStatus.expiresAt.toLocaleString()}` : ''}`
            );
        }

        // Check if user is banned
        if (membership.isBanned) {
            throw new ForbiddenException('You are banned from this channel');
        }

        // Create message with attachments
        const messageData: Prisma.MessageCreateInput = {
            content: dto.content,
            contentType: dto.contentType || 'text',
            channel: { connect: { id: channelId } },
            sender: { connect: { id: senderId } },
            ...(dto.replyTo && { parent: { connect: { id: dto.replyTo } } }),
        };

        const message = await this.prisma.message.create({
            data: messageData,
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
                attachments: true,
                parent: {
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });

        // Create attachments if any
        if (dto.attachments && dto.attachments.length > 0) {
            await this.prisma.messageAttachment.createMany({
                data: dto.attachments.map(att => ({
                    messageId: message.id,
                    fileName: att.fileName,
                    fileType: att.fileType,
                    fileSize: 0, // Would be set from actual file
                    filePath: att.filePath,
                    url: att.url,
                    duration: att.duration,
                    width: att.width,
                    height: att.height,
                })),
            });

            // Reload message with attachments
            return this.prisma.message.findUnique({
                where: { id: message.id },
                include: {
                    sender: {
                        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    attachments: true,
                    parent: {
                        include: {
                            sender: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
        }

        this.logger.log(`Message sent: ${message.id} in channel ${channelId}`);
        return message;
    }

    /**
     * Get messages with pagination and include attachments
     */
    async getMessages(
        channelId: string,
        userId: string,
        params: {
            cursor?: string;
            limit?: number;
            contentType?: string;
        },
    ): Promise<{ messages: any[]; nextCursor?: string }> {
        const { cursor, limit = 50, contentType } = params;

        // Check membership
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this channel');
        }

        const where: Prisma.MessageWhereInput = {
            channelId,
            isDeleted: false,
        };

        if (contentType) {
            where.contentType = contentType;
        }

        const messages = await this.prisma.message.findMany({
            where,
            take: limit + 1, // Get one extra to check if there's more
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
                attachments: true,
                _count: {
                    select: { replies: true },
                },
            },
        });

        let nextCursor: string | undefined;
        if (messages.length > limit) {
            const nextMessage = messages.pop();
            nextCursor = nextMessage?.id;
        }

        return { messages, nextCursor };
    }

    /**
     * Upload and attach a file to a message
     */
    async attachFile(
        messageId: string,
        userId: string,
        file: {
            fileName: string;
            fileType: string;
            filePath: string;
            fileSize: number;
            url?: string;
            duration?: number;
            width?: number;
            height?: number;
        },
    ): Promise<any> {
        // Verify message exists and belongs to user
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only attach files to your own messages');
        }

        // Create attachment
        const attachment = await this.prisma.messageAttachment.create({
            data: {
                messageId,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                filePath: file.filePath,
                url: file.url,
                duration: file.duration,
                width: file.width,
                height: file.height,
            },
        });

        // Update message content type if needed
        const contentType = this.determineContentType(file.fileType);
        if (contentType !== 'text' && message.contentType === 'text') {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { contentType },
            });
        } else if (contentType !== message.contentType) {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { contentType: 'mixed' },
            });
        }

        return attachment;
    }

    /**
     * Get voice messages for a channel
     */
    async getVoiceMessages(
        channelId: string,
        userId: string,
        params: { limit?: number; cursor?: string },
    ): Promise<{ messages: any[]; nextCursor?: string }> {
        const { limit = 20, cursor } = params;

        // Check membership
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this channel');
        }

        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
                OR: [
                    { contentType: 'voice' },
                    { contentType: 'mixed' },
                ],
            },
            take: limit + 1,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                attachments: {
                    where: {
                        fileType: { startsWith: 'audio/' },
                    },
                },
            },
        });

        let nextCursor: string | undefined;
        if (messages.length > limit) {
            const nextMessage = messages.pop();
            nextCursor = nextMessage?.id;
        }

        return { messages, nextCursor };
    }

    /**
     * Search messages in a channel
     */
    async searchMessages(
        channelId: string,
        userId: string,
        query: string,
        params: { contentType?: string; hasAttachments?: boolean; dateFrom?: Date; dateTo?: Date },
    ): Promise<any[]> {
        // Check membership
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this channel');
        }

        const where: Prisma.MessageWhereInput = {
            channelId,
            isDeleted: false,
            content: { contains: query, mode: 'insensitive' },
        };

        if (params.contentType) {
            where.contentType = params.contentType;
        }

        if (params.dateFrom || params.dateTo) {
            where.createdAt = {};
            if (params.dateFrom) where.createdAt.gte = params.dateFrom;
            if (params.dateTo) where.createdAt.lte = params.dateTo;
        }

        const messages = await this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                sender: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                attachments: params.hasAttachments !== undefined ? true : undefined,
            },
        });

        if (params.hasAttachments !== undefined) {
            return messages.filter(m => 
                params.hasAttachments ? m.attachments.length > 0 : m.attachments.length === 0
            );
        }

        return messages;
    }

    private determineContentType(fileType: string): string {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('audio/')) return 'voice';
        if (fileType.startsWith('video/')) return 'file';
        return 'file';
    }
}
