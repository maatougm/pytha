import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedMention, MentionResponseDto, MentionsListResponseDto } from './dto/mentions.dto';

// Regex to match @mentions: @username or @"Full Name"
const MENTION_REGEX = /@([a-zA-Z0-9_]+)|@"([^"]+)"/g;

@Injectable()
export class MentionsService {
    private readonly logger = new Logger(MentionsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Parse @mentions from message content
     * Supports: @username or @"Full Name"
     * Returns array of parsed mentions with raw text and extracted identifiers
     */
    parseMentions(content: string): ParsedMention[] {
        const mentions: ParsedMention[] = [];
        const seen = new Set<string>();

        let match: RegExpExecArray | null;
        // Reset regex lastIndex to ensure we start from the beginning
        MENTION_REGEX.lastIndex = 0;

        while ((match = MENTION_REGEX.exec(content)) !== null) {
            const raw = match[0];
            // Avoid duplicate mentions
            if (seen.has(raw.toLowerCase())) continue;
            seen.add(raw.toLowerCase());

            const mention: ParsedMention = { raw };

            if (match[1]) {
                // @username format
                mention.username = match[1];
            } else if (match[2]) {
                // @"Full Name" format
                mention.fullName = match[2];
            }

            mentions.push(mention);
        }

        return mentions;
    }

    /**
     * Resolve parsed mentions to actual user IDs
     * Searches by username pattern (firstName_lastName) or full name
     */
    async getMentionedUsers(mentions: ParsedMention[], channelId: string): Promise<Array<{ userId: string; mention: ParsedMention }>> {
        const results: Array<{ userId: string; mention: ParsedMention }> = [];

        // Get channel members to limit search scope
        const channelMembers = await this.prisma.channelMember.findMany({
            where: { channelId },
            select: { userId: true },
        });
        const memberUserIds = channelMembers.map(m => m.userId);

        if (memberUserIds.length === 0) return results;

        for (const mention of mentions) {
            try {
                let user: { id: string } | null = null;

                if (mention.username) {
                    // Try to match by firstName_lastName pattern or email prefix
                    const searchTerm = mention.username.toLowerCase().replace(/_/g, ' ');

                    // Search among channel members
                    user = await this.prisma.user.findFirst({
                        where: {
                            id: { in: memberUserIds },
                            OR: [
                                {
                                    firstName: {
                                        equals: searchTerm.split(' ')[0],
                                        mode: 'insensitive',
                                    },
                                    lastName: {
                                        equals: searchTerm.split(' ').slice(1).join(' ') || '',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    email: {
                                        startsWith: mention.username.toLowerCase() + '@',
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                        select: { id: true },
                    });
                }

                if (mention.fullName && !user) {
                    // Try to match by full name
                    const nameParts = mention.fullName.trim().split(/\s+/);
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');

                    user = await this.prisma.user.findFirst({
                        where: {
                            id: { in: memberUserIds },
                            firstName: {
                                equals: firstName,
                                mode: 'insensitive',
                            },
                            ...(lastName && {
                                lastName: {
                                    equals: lastName,
                                    mode: 'insensitive',
                                },
                            }),
                        },
                        select: { id: true },
                    });
                }

                if (user) {
                    results.push({ userId: user.id, mention });
                }
            } catch (error) {
                this.logger.error(`Error resolving mention ${mention.raw}:`, error);
            }
        }

        return results;
    }

    /**
     * Create mention records for a message
     */
    async createMentions(
        messageId: string,
        mentions: Array<{ userId: string; mention: ParsedMention }>,
    ): Promise<string[]> {
        const createdMentionIds: string[] = [];

        for (const { userId, mention } of mentions) {
            try {
                const created = await this.prisma.mention.create({
                    data: {
                        messageId,
                        mentionedUserId: userId,
                        mentionText: mention.raw,
                        isRead: false,
                    },
                    select: { id: true },
                });
                createdMentionIds.push(created.id);
            } catch (error) {
                this.logger.error(`Error creating mention for user ${userId}:`, error);
            }
        }

        return createdMentionIds;
    }

    /**
     * Get mentions for a specific user with pagination
     */
    async getUserMentions(
        userId: string,
        options: {
            unreadOnly?: boolean;
            page?: number;
            limit?: number;
        } = {},
    ): Promise<MentionsListResponseDto> {
        const { unreadOnly = false, page = 1, limit = 20 } = options;

        const skip = (page - 1) * limit;

        const where = {
            mentionedUserId: userId,
            ...(unreadOnly && { isRead: false }),
        };

        const [mentions, total, unreadCount] = await Promise.all([
            this.prisma.mention.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    message: {
                        select: {
                            id: true,
                            content: true,
                            channelId: true,
                            createdAt: true,
                            sender: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                },
                            },
                            channel: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.mention.count({ where }),
            this.prisma.mention.count({
                where: { mentionedUserId: userId, isRead: false },
            }),
        ]);

        return {
            mentions: mentions.map(m => this.mapToMentionResponse(m)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        };
    }

    /**
     * Mark a single mention as read
     */
    async markMentionAsRead(mentionId: string, userId: string): Promise<{ success: boolean }> {
        const mention = await this.prisma.mention.findFirst({
            where: {
                id: mentionId,
                mentionedUserId: userId,
            },
        });

        if (!mention) {
            throw new NotFoundException('Mention not found');
        }

        await this.prisma.mention.update({
            where: { id: mentionId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { success: true };
    }

    /**
     * Mark all mentions as read for a user
     */
    async markAllMentionsAsRead(userId: string): Promise<{ success: boolean; markedCount: number }> {
        const result = await this.prisma.mention.updateMany({
            where: {
                mentionedUserId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return {
            success: true,
            markedCount: result.count,
        };
    }

    /**
     * Mark specific mentions as read
     */
    async markMentionsAsRead(userId: string, mentionIds: string[]): Promise<{ success: boolean; markedCount: number }> {
        const result = await this.prisma.mention.updateMany({
            where: {
                id: { in: mentionIds },
                mentionedUserId: userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return {
            success: true,
            markedCount: result.count,
        };
    }

    /**
     * Get count of unread mentions for a user
     */
    async getUnreadMentionCount(userId: string): Promise<number> {
        return this.prisma.mention.count({
            where: {
                mentionedUserId: userId,
                isRead: false,
            },
        });
    }

    /**
     * Get mentions for a specific message
     */
    async getMessageMentions(messageId: string): Promise<MentionResponseDto[]> {
        const mentions = await this.prisma.mention.findMany({
            where: { messageId },
            include: {
                mentionedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return mentions.map(m => this.mapToMentionResponse(m));
    }

    /**
     * Delete all mentions for a message (used when message is deleted)
     */
    async deleteMessageMentions(messageId: string): Promise<void> {
        await this.prisma.mention.deleteMany({
            where: { messageId },
        });
    }

    /**
     * Map Prisma mention to response DTO
     */
    private mapToMentionResponse(mention: any): MentionResponseDto {
        return {
            id: mention.id,
            messageId: mention.messageId,
            mentionedUserId: mention.mentionedUserId,
            mentionText: mention.mentionText,
            isRead: mention.isRead,
            createdAt: mention.createdAt,
            readAt: mention.readAt,
            ...(mention.message && {
                message: {
                    id: mention.message.id,
                    content: mention.message.content,
                    channelId: mention.message.channelId,
                    createdAt: mention.message.createdAt,
                    sender: mention.message.sender,
                    channel: mention.message.channel,
                },
            }),
        };
    }
}
