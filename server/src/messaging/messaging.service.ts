import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, SendMessageDto } from './dto/messaging.dto';
import { MarkMessageReadDto, ReadReceiptResponseDto, ChannelReadStatusDto } from './dto/read-receipt.dto';
import { AddReactionDto } from './dto/reaction.dto';
import { SearchMessagesDto, SearchMessagesResponse } from './dto/search-messages.dto';
import { createAuditLog, AuditActions } from '../common/utils/audit-helper';
import { EmailService } from '../notifications/email.service';
import { EmailType } from '../notifications/templates/email-templates';
import { MentionsService } from '../mentions/mentions.service';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;



@Injectable()
export class MessagingService {
    private readonly logger = new Logger(MessagingService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private mentionsService: MentionsService,
    ) { }

    // ─── CHANNELS ──────────────────────────────────────────────

    async createChannel(dto: CreateChannelDto, userId: string, userRoles: string[] = []) {
        // Validate messaging restrictions based on user role
        if (!userRoles.includes('admin')) {
            await this.validateMessagingRestrictions(userId, userRoles, dto.memberIds || []);
        }

        const channel = await this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                classId: dto.classId,
                createdBy: userId,
                members: {
                    create: [
                        { userId, role: 'owner' },
                        ...(dto.memberIds || []).map((id) => ({
                            userId: id,
                            role: 'member' as const,
                        })),
                    ],
                },
            },
            include: {
                members: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
                },
            },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.CREATE_CHANNEL,
            channelId: channel.id,
            actorId: userId,
        });

        return channel;
    }

    private async validateMessagingRestrictions(creatorId: string, creatorRoles: string[], memberIds: string[]) {
        const isTeacher = creatorRoles.includes('teacher');
        const isStudent = creatorRoles.includes('student');
        const isParent = creatorRoles.includes('parent');

        for (const memberId of memberIds) {
            const member = await this.prisma.user.findUnique({
                where: { id: memberId },
                include: {
                    userRoles: { include: { role: true } },
                    enrollments: { select: { classId: true } },
                    parentOf: { select: { studentId: true } },
                    childOf: { select: { parentId: true, student: { select: { enrollments: { select: { classId: true } } } } } },
                },
            });

            if (!member) continue;

            const memberRoles = member.userRoles.map(ur => ur.role.name);
            const isMemberTeacher = memberRoles.includes('teacher');
            const isMemberStudent = memberRoles.includes('student');
            const isMemberParent = memberRoles.includes('parent');

            // TEACHER creating channel
            if (isTeacher) {
                // Get teacher's assigned classes (from both new ClassTeacher table and legacy teacherId column)
                const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                    where: { teacherId: creatorId },
                    select: { classId: true },
                });
                const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);

                // Also check legacy teacherId column on Class table
                const legacyClasses = await this.prisma.class.findMany({
                    where: { teacherId: creatorId },
                    select: { id: true },
                });
                legacyClasses.forEach(c => {
                    if (!teacherClassIds.includes(c.id)) {
                        teacherClassIds.push(c.id);
                    }
                });

                // Can message other teachers assigned to same class
                if (isMemberTeacher) {
                    const memberClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const memberClassIds = memberClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = teacherClassIds.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to the same class`
                        );
                    }
                    continue;
                }

                // Can message students in their assigned classes
                if (isMemberStudent) {
                    const studentClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = teacherClassIds.some(id => studentClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message student ${member.firstName} ${member.lastName} - not enrolled in your class`
                        );
                    }
                    continue;
                }

                // Can message parents whose children are in their assigned classes
                if (isMemberParent) {
                    const children = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: {
                            student: {
                                select: {
                                    enrollments: { select: { classId: true } },
                                },
                            },
                        },
                    });
                    const childClassIds = children.flatMap(c => c.student.enrollments.map(e => e.classId));
                    const hasCommonClass = teacherClassIds.some(id => childClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message parent ${member.firstName} ${member.lastName} - their child is not enrolled in your class`
                        );
                    }
                    continue;
                }
            }

            // STUDENT creating channel
            if (isStudent) {
                // Get student's enrolled classes
                const studentClassIds = await this.prisma.classEnrollment.findMany({
                    where: { studentId: creatorId },
                    select: { classId: true },
                });
                const studentClasses = studentClassIds.map(e => e.classId);

                // Can message teachers assigned to their classes
                if (isMemberTeacher) {
                    const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = studentClasses.some(id => teacherClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to your class`
                        );
                    }
                    continue;
                }

                // Can message other students in same class
                if (isMemberStudent) {
                    const memberClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = studentClasses.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message student ${member.firstName} ${member.lastName} - not in the same class`
                        );
                    }
                    continue;
                }

                // Can message parents of students in same class
                if (isMemberParent) {
                    // Get children of this parent
                    const parentChildren = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: { studentId: true },
                    });
                    const childIds = parentChildren.map(pc => pc.studentId);

                    // Check if any child is in the same class as the creator
                    const childEnrollments = await this.prisma.classEnrollment.findMany({
                        where: {
                            studentId: { in: childIds },
                            classId: { in: studentClasses }
                        },
                    });

                    if (childEnrollments.length === 0) {
                        throw new ForbiddenException(
                            `Cannot message parent ${member.firstName} ${member.lastName} - not related to your class`
                        );
                    }
                    continue;
                }
            }

            // PARENT creating channel
            if (isParent) {
                // Get parent's children
                const parentChildren = await this.prisma.parentStudent.findMany({
                    where: { parentId: creatorId },
                    select: { studentId: true },
                });
                const childIds = parentChildren.map(pc => pc.studentId);

                // Get classes of parent's children
                const childEnrollments = await this.prisma.classEnrollment.findMany({
                    where: { studentId: { in: childIds } },
                    select: { classId: true },
                });
                const parentChildClasses = childEnrollments.map(e => e.classId);

                // Can message teachers assigned to their children's classes
                if (isMemberTeacher) {
                    const teacherClassAssignments = await this.prisma.classTeacher.findMany({
                        where: { teacherId: memberId },
                        select: { classId: true },
                    });
                    const teacherClassIds = teacherClassAssignments.map(ca => ca.classId);
                    const hasCommonClass = parentChildClasses.some(id => teacherClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message teacher ${member.firstName} ${member.lastName} - not assigned to your child's class`
                        );
                    }
                    continue;
                }

                // Can message other parents whose children are in same class
                if (isMemberParent) {
                    // Get children of the other parent
                    const otherParentChildren = await this.prisma.parentStudent.findMany({
                        where: { parentId: memberId },
                        select: { studentId: true },
                    });
                    const otherChildIds = otherParentChildren.map(pc => pc.studentId);

                    // Check if any child shares a class
                    const otherChildEnrollments = await this.prisma.classEnrollment.findMany({
                        where: {
                            studentId: { in: otherChildIds },
                            classId: { in: parentChildClasses }
                        },
                    });

                    if (otherChildEnrollments.length === 0) {
                        throw new ForbiddenException(
                            `Cannot message parent ${member.firstName} ${member.lastName} - your children are not in the same class`
                        );
                    }
                    continue;
                }

                // Can message students in their children's classes
                if (isMemberStudent) {
                    const memberClassIds = member.enrollments.map(e => e.classId);
                    const hasCommonClass = parentChildClasses.some(id => memberClassIds.includes(id));
                    if (!hasCommonClass) {
                        throw new ForbiddenException(
                            `Cannot message student ${member.firstName} ${member.lastName} - not in your child's class`
                        );
                    }
                    continue;
                }
            }
        }
    }

    async getUserChannels(userId: string) {
        // Optimized query to avoid N+1 - fetch channels with last message in single query
        // Exclude soft-deleted channels
        const channels = await this.prisma.channel.findMany({
            where: {
                isArchived: false,
                deletedAt: null,
                members: { some: { userId, isBanned: false } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 100, // Reasonable limit for channel list
        });

        return channels.map((ch) => ({
            ...ch,
            lastMessage: ch.messages[0] || null,
            messages: undefined,
        }));
    }

    async getUserChannelsWithUnread(userId: string) {
        // Get channels with membership info including lastReadAt
        const memberships = await this.prisma.channelMember.findMany({
            where: {
                userId,
                isBanned: false,
                channel: {
                    isArchived: false,
                    deletedAt: null,
                },
            },
            include: {
                channel: {
                    include: {
                        members: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                            },
                        },
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                sender: { select: { id: true, firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { channel: { updatedAt: 'desc' } },
            take: 100,
        });

        // Calculate unread count for each channel
        const channelsWithUnread = await Promise.all(
            memberships.map(async (membership) => {
                const { channel, lastReadAt } = membership;

                // Count unread messages
                let unreadCount = 0;
                if (lastReadAt) {
                    unreadCount = await this.prisma.message.count({
                        where: {
                            channelId: channel.id,
                            createdAt: { gt: lastReadAt },
                            senderId: { not: userId }, // Don't count own messages
                            isDeleted: false,
                        },
                    });
                } else {
                    // Never read - count all messages from others
                    unreadCount = await this.prisma.message.count({
                        where: {
                            channelId: channel.id,
                            senderId: { not: userId },
                            isDeleted: false,
                        },
                    });
                }

                return {
                    ...channel,
                    lastMessage: channel.messages[0] || null,
                    messages: undefined,
                    unreadCount,
                    membership: {
                        role: membership.role,
                        joinedAt: membership.joinedAt,
                        lastReadAt: membership.lastReadAt,
                    },
                };
            }),
        );

        return channelsWithUnread;
    }

    async markChannelAsRead(channelId: string, userId: string) {
        // Verify membership
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!member) throw new ForbiddenException('Not a member of this channel');
        if (member.isBanned) throw new ForbiddenException('You are banned from this channel');

        // Update lastReadAt timestamp
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { lastReadAt: new Date() },
        });

        return { success: true, channelId };
    }

    async getChannel(channelId: string, userId: string, includeDeleted: boolean = false) {
        const where: any = { id: channelId };
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        const channel = await this.prisma.channel.findFirst({
            where,
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
                    },
                },
            },
        });

        if (!channel) throw new NotFoundException('Channel not found');

        const isMember = channel.members.some((m) => m.userId === userId);
        if (!isMember) throw new ForbiddenException('Not a member of this channel');

        return channel;
    }

    async getChannelMembers(channelId: string, userId: string) {
        // Verify membership
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');

        return this.prisma.channelMember.findMany({
            where: { channelId, isBanned: false },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
            },
        });
    }

    async addMember(channelId: string, userId: string, role: string = 'member') {
        return this.prisma.channelMember.create({
            data: { channelId, userId, role },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
    }

    async removeMember(channelId: string, userId: string) {
        return this.prisma.channelMember.delete({
            where: { channelId_userId: { channelId, userId } },
        });
    }

    // ─── MESSAGES ──────────────────────────────────────────────

    async getMessages(channelId: string, userId: string, cursor?: string, limit: number = DEFAULT_PAGE_SIZE) {
        // Enforce pagination limits
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

        // Verify membership
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');
        if (member.isBanned) throw new ForbiddenException('You are banned from this channel');

        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
            },
            take: pageSize,
            ...(cursor
                ? {
                    skip: 1,
                    cursor: { id: cursor },
                }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        return {
            messages: messages.reverse(),
            // After reverse(), messages[0] is oldest and messages[last] is newest.
            // nextCursor must point to the oldest message so the next page loads older ones.
            nextCursor: messages.length === pageSize ? messages[0]?.id : null,
        };
    }

    async sendMessage(channelId: string, userId: string, dto: SendMessageDto) {
        // Verify membership and not muted
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');
        if (member.isBanned) throw new ForbiddenException('You are banned from this channel');
        if (member.isMuted) throw new ForbiddenException('You are muted in this channel');

        const message = await this.prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
                data: {
                    channelId,
                    senderId: userId,
                    content: dto.content,
                    replyTo: dto.replyTo,
                },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                    parent: {
                        select: {
                            id: true,
                            content: true,
                            sender: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                    reactions: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                            },
                        },
                    },
                },
            });

            // Update channel timestamp in same transaction
            await tx.channel.update({
                where: { id: channelId },
                data: { updatedAt: new Date() },
            });

            return msg;
        });

        // Fire-and-forget audit log
        createAuditLog(this.prisma, {
            action: AuditActions.SEND_MESSAGE,
            messageId: message.id,
            channelId,
            actorId: userId,
        });

        // Queue email notifications asynchronously
        this.queueMessageNotifications(message, channelId, userId).catch(err => {
            this.logger.error('Failed to queue message notifications:', err);
        });

        return message;
    }

    /**
     * Queue email notifications for channel members
     */
    private async queueMessageNotifications(
        message: any,
        channelId: string,
        senderId: string,

    ): Promise<void> {
        try {
            // Get channel info
            const channel = await this.prisma.channel.findUnique({
                where: { id: channelId },
                select: { name: true },
            });

            if (!channel) return;

            // Get all channel members except sender
            const members = await this.prisma.channelMember.findMany({
                where: {
                    channelId,
                    userId: { not: senderId },
                    isBanned: false,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            emailNotificationsEnabled: true,
                            notificationPreferences: true,
                        },
                    },
                },
            });

            const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
            const channelName = channel.name || 'Unnamed Channel';

            for (const member of members) {
                if (!member.user.emailNotificationsEnabled) continue;

                const prefs = (member.user.notificationPreferences as Record<string, any>) || {};

                if (prefs.new_message !== false) {
                    // Normal priority: new message notification
                    // Queue for digest or immediate based on user preference
                    const digestEnabled = prefs.digest !== false;

                    if (!digestEnabled) {
                        // Immediate notification
                        await this.emailService.queueEmail({
                            to: member.user.email,
                            subject: `New message from ${senderName} in ${channelName}`,
                            html: 'pending',
                            priority: 'normal',
                            metadata: {
                                type: 'new_message',
                                messageId: message.id,
                                senderName,
                                channelName,
                                messageContent: message.content,
                            },
                        });
                    }
                    // If digest enabled, message will be included in next digest
                }
            }
        } catch (error) {
            this.logger.error('Error queueing message notifications:', error);
        }
    }

    async editMessage(messageId: string, userId: string, content: string) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');
        if (message.senderId !== userId) throw new ForbiddenException('Cannot edit another user\'s message');
        if (message.isDeleted) throw new BadRequestException('Cannot edit a deleted message');

        // Track edit history before updating
        await this.trackEditHistory(messageId, message.content, userId);

        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: { content, editedAt: new Date() },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        createAuditLog(this.prisma, {
            action: AuditActions.EDIT_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId: userId,
        });

        return updated;
    }

    async deleteMessage(messageId: string, userId: string, roles: string[], softDelete: boolean = true) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');
        if (message.isDeleted) throw new BadRequestException('Message is already deleted');

        const isAdmin = roles.includes('admin');
        if (message.senderId !== userId && !isAdmin) {
            throw new ForbiddenException('Cannot delete another user\'s message');
        }

        if (softDelete) {
            // Enhanced soft delete with tracking
            await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: userId,
                },
            });
        } else {
            // Hard delete - first delete mentions (cascade will handle this but explicit is cleaner)
            await this.mentionsService.deleteMessageMentions(messageId);

            // Hard delete the message
            await this.prisma.message.delete({ where: { id: messageId } });
        }

        createAuditLog(this.prisma, {
            action: AuditActions.DELETE_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { softDelete },
        });

        return { deleted: true, softDelete };
    }

    // ─── SEARCH ────────────────────────────────────────────────

    async searchMessages(
        channelId: string,
        userId: string,
        dto: SearchMessagesDto,
    ): Promise<SearchMessagesResponse> {
        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this channel');
        }

        // Validate and normalize pagination
        const page = Math.max(1, dto.page || 1);
        const limit = Math.min(100, Math.max(1, dto.limit || 20));
        const skip = (page - 1) * limit;

        // Build date filters
        const dateConditions: string[] = [];
        const queryParams: (string | Date)[] = [channelId];
        let paramIndex = 2;

        if (dto.from) {
            dateConditions.push(`m.created_at >= $${paramIndex}::timestamp`);
            queryParams.push(new Date(dto.from));
            paramIndex++;
        }
        if (dto.to) {
            dateConditions.push(`m.created_at <= $${paramIndex}::timestamp`);
            queryParams.push(new Date(dto.to));
            paramIndex++;
        }

        // Build sender filter
        if (dto.sender) {
            dateConditions.push(`m.sender_id = $${paramIndex}`);
            queryParams.push(dto.sender);
            paramIndex++;
        }

        const whereClause = dateConditions.length > 0
            ? `AND ${dateConditions.join(' AND ')}`
            : '';

        // Convert search query to PostgreSQL websearch_to_tsquery format
        // This supports: "exact phrases", OR, -exclude, (grouping)
        const searchQuery = dto.q.trim();

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM messages m
            WHERE m.channel_id = $1
                AND m.is_deleted = false
                AND m.search_vector @@ websearch_to_tsquery('english', $${paramIndex})
                ${whereClause}
        `;
        const countParams = [...queryParams, searchQuery];

        // Main search query with ranking and highlighting
        const searchParamIndex = paramIndex;
        paramIndex++;
        const limitParamIndex = paramIndex++;
        const offsetParamIndex = paramIndex++;

        const searchQuery_sql = `
            SELECT 
                m.id,
                m.channel_id as "channelId",
                m.sender_id as "senderId",
                m.content,
                m.content_type as "contentType",
                m.reply_to as "replyTo",
                m.is_deleted as "isDeleted",
                m.edited_at as "editedAt",
                m.created_at as "createdAt",
                u.id as "senderId",
                u.first_name as "senderFirstName",
                u.last_name as "senderLastName",
                u.avatar_url as "senderAvatarUrl",
                ts_rank_cd(m.search_vector, websearch_to_tsquery('english', $${searchParamIndex}), 32) as rank,
                ts_headline(
                    'english',
                    m.content,
                    websearch_to_tsquery('english', $${searchParamIndex}),
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10, MaxFragments=3, FragmentDelimiter=...'
                ) as headline
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.channel_id = $1
                AND m.is_deleted = false
                AND m.search_vector @@ websearch_to_tsquery('english', $${searchParamIndex})
                ${whereClause}
            ORDER BY 
                ts_rank_cd(m.search_vector, websearch_to_tsquery('english', $${searchParamIndex}), 32) DESC,
                m.created_at DESC
            LIMIT $${limitParamIndex}
            OFFSET $${offsetParamIndex}
        `;

        const searchParams = [...queryParams, searchQuery, limit, skip];

        // Execute queries
        const [countResult, messagesResult] = await Promise.all([
            this.prisma.$queryRawUnsafe<{ total: number }[]>(countQuery, ...countParams),
            this.prisma.$queryRawUnsafe<
                {
                    id: string;
                    channelId: string;
                    senderId: string;
                    content: string;
                    contentType: string;
                    replyTo: string | null;
                    isDeleted: boolean;
                    editedAt: Date | null;
                    createdAt: Date;
                    senderFirstName: string;
                    senderLastName: string;
                    senderAvatarUrl: string | null;
                    rank: number;
                    headline: string;
                }[]
            >(searchQuery_sql, ...searchParams),
        ]);

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        // Format messages
        const messages = messagesResult.map((row) => ({
            id: row.id,
            channelId: row.channelId,
            senderId: row.senderId,
            content: row.content,
            contentType: row.contentType,
            replyTo: row.replyTo,
            isDeleted: row.isDeleted,
            editedAt: row.editedAt,
            createdAt: row.createdAt,
            sender: {
                id: row.senderId,
                firstName: row.senderFirstName,
                lastName: row.senderLastName,
                avatarUrl: row.senderAvatarUrl,
            },
            highlights: this.parseHighlights(row.headline),
            rank: Number(row.rank),
        }));

        return {
            messages,
            meta: {
                total,
                page,
                limit,
                totalPages,
                query: searchQuery,
            },
        };
    }

    /**
     * Parse ts_headline output to extract highlight fragments
     */
    private parseHighlights(headline: string): string[] {
        if (!headline) return [];

        // Split by the fragment delimiter and filter out empty strings
        return headline
            .split('...')
            .map((fragment) => fragment.trim())
            .filter((fragment) => fragment.length > 0);
    }

    // ─── REPORTS ───────────────────────────────────────────────

    async reportChannel(channelId: string, userId: string, reason: string) {
        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!membership) throw new ForbiddenException('Not a member of this channel');

        // Check if already reported by this user
        const existingReport = await this.prisma.channelReport.findFirst({
            where: { channelId, reportedBy: userId, status: { in: ['pending', 'investigating'] } },
        });
        if (existingReport) {
            throw new BadRequestException('You have already reported this channel');
        }

        const report = await this.prisma.channelReport.create({
            data: {
                channelId,
                reportedBy: userId,
                reason,
                status: 'pending',
            },
            include: {
                channel: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        return report;
    }

    async getChannelFullHistory(channelId: string, adminId: string) {
        // Verify admin
        const admin = await this.prisma.userRole.findFirst({
            where: { userId: adminId, role: { name: 'admin' } },
        });
        if (!admin) throw new ForbiddenException('Admin access required');

        // Get all messages including deleted ones with full history
        const messages = await this.prisma.message.findMany({
            where: { channelId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        isDeleted: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                attachments: true,
                reactions: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        // Get channel info with members
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
                    },
                },
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        // Get reports for this channel
        const reports = await this.prisma.channelReport.findMany({
            where: { channelId },
            include: {
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            channel,
            messages,
            reports,
            totalMessages: messages.length,
            deletedMessages: messages.filter(m => m.isDeleted).length,
            editedMessages: messages.filter(m => m.editedAt).length,
        };
    }

    async getAllReports(status?: string, page: number = 1, limit: number = 20) {
        const where = status && status !== 'all' ? { status } : {};

        const [reports, total] = await Promise.all([
            this.prisma.channelReport.findMany({
                where,
                include: {
                    channel: {
                        select: { id: true, name: true, type: true, createdAt: true },
                    },
                    reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.channelReport.count({ where }),
        ]);

        return {
            reports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateReportStatus(reportId: string, adminId: string, dto: any) {
        const report = await this.prisma.channelReport.findUnique({
            where: { id: reportId },
        });
        if (!report) throw new NotFoundException('Report not found');

        const updated = await this.prisma.channelReport.update({
            where: { id: reportId },
            data: {
                status: dto.status,
                assignedTo: dto.status === 'investigating' ? adminId : report.assignedTo,
                resolution: dto.resolution,
                resolvedAt: dto.status === 'resolved' || dto.status === 'dismissed' ? new Date() : report.resolvedAt,
            },
            include: {
                channel: { select: { id: true, name: true, type: true } },
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        return updated;
    }

    // ─── REACTIONS ─────────────────────────────────────────────

    async addReaction(messageId: string, userId: string, dto: AddReactionDto) {
        // Verify message exists and is not deleted
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message) throw new NotFoundException('Message not found');
        if (message.isDeleted) throw new BadRequestException('Cannot react to a deleted message');

        // Verify user is a member of the channel
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');
        if (member.isBanned) throw new ForbiddenException('You are banned from this channel');

        // Create or get existing reaction
        const reaction = await this.prisma.reaction.upsert({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction: dto.reaction,
                },
            },
            update: {}, // No update if already exists
            create: {
                messageId,
                userId,
                reaction: dto.reaction,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });

        createAuditLog(this.prisma, {
            action: AuditActions.ADD_REACTION,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { reaction: dto.reaction },
        });

        return reaction;
    }

    async removeReaction(messageId: string, userId: string, reaction: string) {
        // Verify message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message) throw new NotFoundException('Message not found');

        // Find and delete the reaction
        const existingReaction = await this.prisma.reaction.findUnique({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });

        if (!existingReaction) {
            throw new NotFoundException('Reaction not found');
        }

        await this.prisma.reaction.delete({
            where: {
                messageId_userId_reaction: {
                    messageId,
                    userId,
                    reaction,
                },
            },
        });

        createAuditLog(this.prisma, {
            action: AuditActions.REMOVE_REACTION,
            messageId,
            channelId: message.channelId,
            actorId: userId,
            metadata: { reaction },
        });

        return { removed: true, reaction };
    }

    async getReactions(messageId: string, userId: string) {
        // Verify message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });
        if (!message) throw new NotFoundException('Message not found');

        // Verify user is a member of the channel
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');

        const reactions = await this.prisma.reaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group reactions by emoji for easier consumption
        const groupedReactions = reactions.reduce((acc, r) => {
            if (!acc[r.reaction]) {
                acc[r.reaction] = {
                    reaction: r.reaction,
                    count: 0,
                    users: [],
                };
            }
            acc[r.reaction].count++;
            acc[r.reaction].users.push(r.user);
            return acc;
        }, {} as Record<string, { reaction: string; count: number; users: any[] }>);

        return {
            messageId,
            reactions: Object.values(groupedReactions),
            total: reactions.length,
        };
    }

    // ─── EDIT HISTORY ──────────────────────────────────────────

    async trackEditHistory(messageId: string, previousContent: string, editedBy: string) {
        await this.prisma.editHistory.create({
            data: {
                messageId,
                previousContent,
                editedBy,
            },
        });
    }

    async getEditHistory(messageId: string, adminId: string) {
        // Verify admin
        const admin = await this.prisma.userRole.findFirst({
            where: { userId: adminId, role: { name: 'admin' } },
        });
        if (!admin) throw new ForbiddenException('Admin access required');

        // Verify message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) throw new NotFoundException('Message not found');

        const history = await this.prisma.editHistory.findMany({
            where: { messageId },
            include: {
                editor: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { editedAt: 'asc' },
        });

        return {
            messageId,
            currentContent: message.content,
            history: history.map((h) => ({
                id: h.id,
                previousContent: h.previousContent,
                editedBy: h.editedBy,
                editedAt: h.editedAt,
                editor: h.editor,
            })),
            totalEdits: history.length,
        };
    }

    // ─── READ RECEIPTS ─────────────────────────────────────────

    /**
     * Mark a specific message as read by a user
     */
    async markMessageAsRead(messageId: string, userId: string): Promise<ReadReceiptResponseDto> {
        // Verify message exists and is not deleted
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });

        if (!message) throw new NotFoundException('Message not found');
        if (message.isDeleted) throw new BadRequestException('Cannot read a deleted message');

        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId } },
        });

        if (!membership) throw new ForbiddenException('Not a member of this channel');
        if (membership.isBanned) throw new ForbiddenException('You are banned from this channel');

        // Don't record read receipt for own messages
        if (message.senderId === userId) {
            return this.getMessageReadReceipts(messageId, userId);
        }

        // Create or update read receipt (upsert)
        await this.prisma.messageRead.upsert({
            where: {
                messageId_userId: { messageId, userId },
            },
            update: {
                readAt: new Date(), // Update read time if already exists
            },
            create: {
                messageId,
                userId,
                readAt: new Date(),
            },
        });

        // Also update the channel's lastReadAt for this user
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId: message.channelId, userId } },
            data: { lastReadAt: new Date() },
        });

        return this.getMessageReadReceipts(messageId, userId);
    }

    /**
     * Mark multiple messages as read by a user
     */
    async markMessagesAsRead(messageIds: string[], channelId: string, userId: string): Promise<{ readCount: number; channelId: string }> {
        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) throw new ForbiddenException('Not a member of this channel');
        if (membership.isBanned) throw new ForbiddenException('You are banned from this channel');

        // Filter out user's own messages
        const messages = await this.prisma.message.findMany({
            where: {
                id: { in: messageIds },
                channelId,
                isDeleted: false,
                senderId: { not: userId }, // Exclude own messages
            },
            select: { id: true },
        });

        const validMessageIds = messages.map(m => m.id);

        if (validMessageIds.length === 0) {
            return { readCount: 0, channelId };
        }

        // Use transaction to create read receipts
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            // Create read receipts for all messages
            for (const messageId of validMessageIds) {
                await tx.messageRead.upsert({
                    where: {
                        messageId_userId: { messageId, userId },
                    },
                    update: {
                        readAt: now,
                    },
                    create: {
                        messageId,
                        userId,
                        readAt: now,
                    },
                });
            }

            // Update channel's lastReadAt
            await tx.channelMember.update({
                where: { channelId_userId: { channelId, userId } },
                data: { lastReadAt: now },
            });
        });

        return { readCount: validMessageIds.length, channelId };
    }

    /**
     * Get read receipts for a message - who has read it and when
     */
    async getMessageReadReceipts(messageId: string, requestingUserId: string): Promise<ReadReceiptResponseDto> {
        // Verify message exists
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { channel: true },
        });

        if (!message) throw new NotFoundException('Message not found');

        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: message.channelId, userId: requestingUserId } },
        });

        if (!membership) throw new ForbiddenException('Not a member of this channel');

        // Get read receipts with user details
        const readReceipts = await this.prisma.messageRead.findMany({
            where: { messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { readAt: 'asc' },
        });

        // Get total channel members (excluding sender)
        const totalMembers = await this.prisma.channelMember.count({
            where: {
                channelId: message.channelId,
                isBanned: false,
                userId: { not: message.senderId },
            },
        });

        return {
            messageId,
            channelId: message.channelId,
            readBy: readReceipts.map(r => ({
                userId: r.user.id,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                avatarUrl: r.user.avatarUrl,
                readAt: r.readAt,
            })),
            readCount: readReceipts.length,
            totalMembers,
        };
    }

    /**
     * Get read status for all messages in a channel for a specific user
     */
    async getChannelReadStatus(channelId: string, userId: string): Promise<ChannelReadStatusDto> {
        // Verify user is a member of the channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) throw new ForbiddenException('Not a member of this channel');

        // Get messages with read status (only messages not sent by the user)
        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
                senderId: { not: userId },
            },
            select: {
                id: true,
                reads: {
                    where: { userId },
                    select: { userId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to recent messages
        });

        const messageStatuses = messages.map(m => ({
            messageId: m.id,
            readBy: m.reads.map(r => r.userId),
            readCount: m.reads.length,
        }));

        // Count unread messages
        const unreadCount = messageStatuses.filter(m => m.readBy.length === 0).length;

        return {
            channelId,
            messages: messageStatuses,
            unreadCount,
        };
    }

    /**
     * Get messages with read receipts included (for detailed message views)
     */
    async getMessagesWithReadReceipts(channelId: string, userId: string, cursor?: string, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

        // Verify membership
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this channel');
        if (member.isBanned) throw new ForbiddenException('You are banned from this channel');

        const messages = await this.prisma.message.findMany({
            where: {
                channelId,
                isDeleted: false,
            },
            take: pageSize,
            ...(cursor
                ? {
                    skip: 1,
                    cursor: { id: cursor },
                }
                : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                reads: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { readAt: 'asc' },
                },
            },
        });

        return {
            messages: messages.reverse().map(msg => ({
                ...msg,
                readBy: msg.reads.map(r => ({
                    userId: r.user.id,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    avatarUrl: r.user.avatarUrl,
                    readAt: r.readAt,
                })),
                reads: undefined, // Remove raw reads array
            })),
            nextCursor: messages.length === pageSize ? messages[0]?.id : null,
        };
    }

    // ─── TYPING INDICATORS ─────────────────────────────────────

    /**
     * Start typing indicator for a user in a channel
     * Note: This is handled by TypingService, this method is for database persistence if needed
     */
    async startTyping(channelId: string, userId: string): Promise<void> {
        // Verify user is a member
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership || membership.isBanned || membership.isMuted) {
            return; // Silently ignore if not a member or banned/muted
        }

        // Persist to database (optional, for cross-instance sync)
        // Using upsert with 5 second expiration
        const expiresAt = new Date(Date.now() + 5000);

        try {
            await this.prisma.typingIndicator.upsert({
                where: {
                    channelId_userId: { channelId, userId },
                },
                update: {
                    startedAt: new Date(),
                    expiresAt,
                },
                create: {
                    channelId,
                    userId,
                    startedAt: new Date(),
                    expiresAt,
                },
            });
        } catch (error) {
            this.logger.error('Error saving typing indicator:', error.message);
        }
    }

    /**
     * Stop typing indicator for a user
     */
    async stopTyping(channelId: string, userId: string): Promise<void> {
        try {
            await this.prisma.typingIndicator.deleteMany({
                where: { channelId, userId },
            });
        } catch (error) {
            // Ignore errors (record might not exist)
        }
    }

    /**
     * Get users currently typing in a channel (from database)
     * This is a fallback when Redis is not available
     */
    async getTypingUsers(channelId: string, excludeUserId?: string): Promise<{ userId: string; userName: string; firstName: string; lastName: string }[]> {
        const now = new Date();

        const typingIndicators = await this.prisma.typingIndicator.findMany({
            where: {
                channelId,
                expiresAt: { gt: now },
                userId: excludeUserId ? { not: excludeUserId } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return typingIndicators.map(t => ({
            userId: t.user.id,
            userName: t.user.email?.split('@')[0] || `${t.user.firstName} ${t.user.lastName}`,
            firstName: t.user.firstName,
            lastName: t.user.lastName,
        }));
    }
}
