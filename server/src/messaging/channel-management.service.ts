import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, ChannelMember, ChannelMute, Prisma } from '@prisma/client';

export interface CreateChannelDto {
    type: 'podcast' | 'classroom' | 'class_broadcast' | 'direct_message' | 'teacher_parent' | 'teacher_student' | 'admin_broadcast' | 'group';
    name: string;
    description?: string;
    memberIds?: string[]; // For DMs or groups
    classId?: string; // For classroom channels
    maxMembers?: number;
}

export interface ChannelRequestDto {
    type: 'teacher_parent' | 'teacher_student' | 'group';
    name: string;
    description?: string;
    memberIds: string[];
    reason?: string;
}

export interface MuteUserDto {
    userId: string;
    duration?: number; // minutes, undefined = permanent
    reason?: string;
}

@Injectable()
export class ChannelManagementService {
    private readonly logger = new Logger(ChannelManagementService.name);

    constructor(private prisma: PrismaService) {}

    // ─── CHANNEL CREATION ───────────────────────────────────────────────

    /**
     * Create a channel (admin can create any type, others need approval)
     */
    async createChannel(
        dto: CreateChannelDto,
        creatorId: string,
        creatorRoles: string[],
    ): Promise<Channel> {
        const isAdmin = creatorRoles.includes('admin');
        const isTeacher = creatorRoles.includes('teacher');

        // Permission checks
        if (!isAdmin) {
            // Non-admins need approval for certain channel types
            const needsApproval = ['teacher_parent', 'teacher_student', 'group'].includes(dto.type);
            
            if (needsApproval) {
                // Create pending channel
                return this.createPendingChannel(dto, creatorId);
            }

            // Teachers can create classroom channels
            if (dto.type === 'classroom' && !isTeacher) {
                throw new ForbiddenException('Only teachers can create classroom channels');
            }
        }

        // Create the channel immediately
        return this.createApprovedChannel(dto, creatorId);
    }

    /**
     * Create a podcast channel (admin only)
     */
    async createPodcastChannel(
        name: string,
        description: string,
        adminId: string,
    ): Promise<Channel> {
        return this.prisma.channel.create({
            data: {
                type: 'podcast',
                name,
                description,
                createdBy: adminId,
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });
    }

    /**
     * Create a classroom channel (admin or teacher)
     */
    async createClassroomChannel(
        name: string,
        description: string,
        classId: string,
        teacherId: string,
        maxStudents: number = 30,
    ): Promise<Channel> {
        // Verify teacher teaches this class
        const classData = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { enrollments: { include: { student: true } } },
        });

        if (!classData) {
            throw new NotFoundException('Class not found');
        }

        if (classData.teacherId !== teacherId) {
            throw new ForbiddenException('You can only create channels for classes you teach');
        }

        // Create channel with teacher as owner and all students as members
        const channel = await this.prisma.channel.create({
            data: {
                type: 'classroom',
                name,
                description,
                classId,
                createdBy: teacherId,
                approvalStatus: 'approved',
                maxMembers: maxStudents,
                members: {
                    create: [
                        { userId: teacherId, role: 'owner' },
                        ...classData.enrollments.map(e => ({
                            userId: e.studentId,
                            role: 'student',
                        })),
                    ],
                },
            },
        });

        this.logger.log(`Classroom channel created: ${channel.id} for class ${classId}`);
        return channel;
    }

    /**
     * Create a direct message or small group conversation
     */
    async createDirectMessage(
        dto: CreateChannelDto,
        creatorId: string,
        creatorRoles: string[],
    ): Promise<Channel> {
        if (!dto.memberIds || dto.memberIds.length === 0) {
            throw new BadRequestException('At least one member is required');
        }

        // Check if conversation already exists between these users
        const existingChannel = await this.findExistingDirectMessage(
            creatorId,
            dto.memberIds,
            dto.type,
        );

        if (existingChannel) {
            return existingChannel;
        }

        const isAdmin = creatorRoles.includes('admin');

        if (isAdmin) {
            // Admin can create immediately
            return this.createApprovedChannel(dto, creatorId);
        }

        // Others need approval
        return this.createPendingChannel(dto, creatorId);
    }

    private async createApprovedChannel(dto: CreateChannelDto, creatorId: string): Promise<Channel> {
        const memberIds = dto.memberIds || [];
        
        return this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                description: dto.description,
                classId: dto.classId,
                createdBy: creatorId,
                approvalStatus: 'approved',
                approvedBy: creatorId,
                approvedAt: new Date(),
                maxMembers: dto.maxMembers,
                members: {
                    create: [
                        { userId: creatorId, role: 'owner' },
                        ...memberIds.map(id => ({ userId: id, role: 'member' })),
                    ],
                },
            },
            include: { members: true },
        });
    }

    private async createPendingChannel(dto: CreateChannelDto, requesterId: string): Promise<Channel> {
        return this.prisma.channel.create({
            data: {
                type: dto.type,
                name: dto.name,
                description: dto.description,
                createdBy: requesterId,
                requestedBy: requesterId,
                approvalStatus: 'pending',
                members: {
                    create: [
                        { userId: requesterId, role: 'owner' },
                        ...(dto.memberIds || []).map(id => ({ userId: id, role: 'member' })),
                    ],
                },
            },
        });
    }

    private async findExistingDirectMessage(
        userId: string,
        memberIds: string[],
        type: string,
    ): Promise<Channel | null> {
        // For direct messages between 2 people, check if channel already exists
        if (type === 'direct_message' && memberIds.length === 1) {
            const existing = await this.prisma.channel.findFirst({
                where: {
                    type: 'direct_message',
                    deletedAt: null, // Exclude soft-deleted channels
                    AND: [
                        { members: { some: { userId } } },
                        { members: { some: { userId: memberIds[0] } } },
                    ],
                },
                include: { members: true },
            });

            // Ensure it's only these 2 members
            if (existing && existing.members.length === 2) {
                return existing;
            }
        }

        return null;
    }

    // ─── CHANNEL APPROVAL WORKFLOW ──────────────────────────────────────

    /**
     * Get all pending channel requests (for admin)
     */
    async getPendingChannels(params: {
        page?: number;
        limit?: number;
        type?: string;
    }): Promise<{ channels: Channel[]; total: number }> {
        const { page = 1, limit = 20, type } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.ChannelWhereInput = {
            approvalStatus: 'pending',
            deletedAt: null, // Exclude soft-deleted channels
        };
        if (type) where.type = type;

        const [channels, total] = await Promise.all([
            this.prisma.channel.findMany({
                where,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                    creator: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channel.count({ where }),
        ]);

        return { channels: channels as Channel[], total };
    }

    /**
     * Approve a channel request
     */
    async approveChannel(
        channelId: string,
        adminId: string,
    ): Promise<Channel> {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        if (channel.approvalStatus !== 'pending') {
            throw new BadRequestException('Channel is not pending approval');
        }

        return this.prisma.channel.update({
            where: { id: channelId },
            data: {
                approvalStatus: 'approved',
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });
    }

    /**
     * Reject a channel request
     */
    async rejectChannel(
        channelId: string,
        adminId: string,
        reason: string,
    ): Promise<Channel> {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        if (channel.approvalStatus !== 'pending') {
            throw new BadRequestException('Channel is not pending approval');
        }

        return this.prisma.channel.update({
            where: { id: channelId },
            data: {
                approvalStatus: 'rejected',
                approvedBy: adminId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
        });
    }

    // ─── MUTE FUNCTIONALITY ─────────────────────────────────────────────

    /**
     * Mute a user in a channel (admin or channel owner)
     */
    async muteUser(
        channelId: string,
        dto: MuteUserDto,
        muterId: string,
        muterRoles: string[],
    ): Promise<ChannelMute> {
        const { userId, duration, reason } = dto;

        // Check permissions
        await this.checkModerationPermission(channelId, muterId, muterRoles);

        // Can't mute yourself
        if (userId === muterId) {
            throw new BadRequestException('Cannot mute yourself');
        }

        // Check if user is in channel
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership) {
            throw new NotFoundException('User is not a member of this channel');
        }

        // Deactivate any existing active mutes
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                userId,
                isActive: true,
            },
            data: { isActive: false },
        });

        // Calculate expiration
        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 1000)
            : null;

        // Create mute record
        const mute = await this.prisma.channelMute.create({
            data: {
                channelId,
                userId,
                mutedBy: muterId,
                expiresAt,
                reason,
                isActive: true,
            },
        });

        // Update member status
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { isMuted: true },
        });

        this.logger.log(`User ${userId} muted in channel ${channelId} by ${muterId}`);
        return mute;
    }

    /**
     * Mute all students in a classroom channel
     */
    async muteAllStudents(
        channelId: string,
        muterId: string,
        muterRoles: string[],
        duration?: number,
        reason?: string,
    ): Promise<{ muted: number }> {
        await this.checkModerationPermission(channelId, muterId, muterRoles);

        const students = await this.prisma.channelMember.findMany({
            where: {
                channelId,
                role: 'student',
                isMuted: false,
            },
        });

        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 1000)
            : null;

        // Create mute records for all students
        await this.prisma.$transaction([
            ...students.map(s =>
                this.prisma.channelMute.create({
                    data: {
                        channelId,
                        userId: s.userId,
                        mutedBy: muterId,
                        expiresAt,
                        reason: reason || 'Muted all students',
                        isActive: true,
                    },
                })
            ),
            this.prisma.channelMember.updateMany({
                where: {
                    channelId,
                    role: 'student',
                },
                data: { isMuted: true },
            }),
        ]);

        this.logger.log(`All ${students.length} students muted in channel ${channelId}`);
        return { muted: students.length };
    }

    /**
     * Unmute a user
     */
    async unmuteUser(
        channelId: string,
        userId: string,
        muterId: string,
        muterRoles: string[],
    ): Promise<void> {
        await this.checkModerationPermission(channelId, muterId, muterRoles);

        // Deactivate mute records
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                userId,
                isActive: true,
            },
            data: { isActive: false },
        });

        // Update member status
        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId } },
            data: { isMuted: false },
        });

        this.logger.log(`User ${userId} unmuted in channel ${channelId}`);
    }

    /**
     * Unmute all students
     */
    async unmuteAllStudents(
        channelId: string,
        muterId: string,
        muterRoles: string[],
    ): Promise<{ unmuted: number }> {
        await this.checkModerationPermission(channelId, muterId, muterRoles);

        const result = await this.prisma.channelMember.updateMany({
            where: {
                channelId,
                role: 'student',
                isMuted: true,
            },
            data: { isMuted: false },
        });

        // Deactivate all mute records
        await this.prisma.channelMute.updateMany({
            where: {
                channelId,
                isActive: true,
            },
            data: { isActive: false },
        });

        this.logger.log(`All students unmuted in channel ${channelId}`);
        return { unmuted: result.count };
    }

    /**
     * Check if user is currently muted
     */
    async isUserMuted(channelId: string, userId: string): Promise<{ muted: boolean; reason?: string; expiresAt?: Date }> {
        // Check member status first
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!member || !member.isMuted) {
            return { muted: false };
        }

        // Check for active mute record
        const mute = await this.prisma.channelMute.findFirst({
            where: {
                channelId,
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: { mutedAt: 'desc' },
        });

        if (!mute) {
            // Mute expired, update member status
            await this.prisma.channelMember.update({
                where: { channelId_userId: { channelId, userId } },
                data: { isMuted: false },
            });
            return { muted: false };
        }

        return {
            muted: true,
            reason: mute.reason || undefined,
            expiresAt: mute.expiresAt || undefined,
        };
    }

    /**
     * Get mute list for a channel
     */
    async getChannelMutes(channelId: string): Promise<ChannelMute[]> {
        return this.prisma.channelMute.findMany({
            where: {
                channelId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                muter: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
            orderBy: { mutedAt: 'desc' },
        }) as Promise<ChannelMute[]>;
    }

    // ─── ADMIN CONVERSATION MONITORING ──────────────────────────────────

    /**
     * Get all conversations with filters (admin only)
     */
    async getAllConversations(params: {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        search?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{ channels: any[]; total: number }> {
        const { page = 1, limit = 20, type, status, search, dateFrom, dateTo } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.ChannelWhereInput = {
            deletedAt: null, // Exclude soft-deleted channels by default
        };

        if (type) where.type = type;
        if (status) where.approvalStatus = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }

        const [channels, total] = await Promise.all([
            this.prisma.channel.findMany({
                where,
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, email: true, firstName: true, lastName: true },
                            },
                        },
                    },
                    creator: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channel.count({ where }),
        ]);

        return { channels, total };
    }

    /**
     * Get conversation details with recent messages
     */
    async getConversationDetails(channelId: string, includeDeleted: boolean = false): Promise<any> {
        const where: any = { id: channelId };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        
        const channel = await this.prisma.channel.findFirst({
            where,
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                        attachments: true,
                    },
                },
                mutes: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        return channel;
    }

    // ─── HELPER METHODS ─────────────────────────────────────────────────

    private async checkModerationPermission(
        channelId: string,
        userId: string,
        userRoles: string[],
    ): Promise<void> {
        const isAdmin = userRoles.includes('admin');

        if (isAdmin) return;

        // Check if user is channel owner or moderator
        const membership = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (!membership || !['owner', 'moderator'].includes(membership.role)) {
            throw new ForbiddenException('You do not have permission to moderate this channel');
        }
    }
}
