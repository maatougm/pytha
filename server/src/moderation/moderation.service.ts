import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createAuditLog, AuditActions } from '../common/utils/audit-helper';

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(private prisma: PrismaService) { }

    async muteUser(channelId: string, targetUserId: string, actorId: string) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member) throw new NotFoundException('User is not a member of this channel');

        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isMuted: true },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.MUTE_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });

        this.logger.log(`User ${targetUserId} muted in channel ${channelId} by ${actorId}`);
        return { muted: true, userId: targetUserId, channelId };
    }

    async unmuteUser(channelId: string, targetUserId: string, actorId: string) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member) throw new NotFoundException('User is not a member of this channel');

        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isMuted: false },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.UNMUTE_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });

        this.logger.log(`User ${targetUserId} unmuted in channel ${channelId} by ${actorId}`);
        return { muted: false, userId: targetUserId, channelId };
    }

    async banUser(channelId: string, targetUserId: string, actorId: string) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member) throw new NotFoundException('User is not a member of this channel');

        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isBanned: true },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.BAN_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });

        this.logger.log(`User ${targetUserId} banned from channel ${channelId} by ${actorId}`);
        return { banned: true, userId: targetUserId, channelId };
    }

    async unbanUser(channelId: string, targetUserId: string, actorId: string) {
        const member = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: targetUserId } },
        });
        if (!member) throw new NotFoundException('User is not a member of this channel');

        await this.prisma.channelMember.update({
            where: { channelId_userId: { channelId, userId: targetUserId } },
            data: { isBanned: false },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.UNBAN_USER,
            channelId,
            actorId,
            targetId: targetUserId,
        });

        this.logger.log(`User ${targetUserId} unbanned from channel ${channelId} by ${actorId}`);
        return { banned: false, userId: targetUserId, channelId };
    }

    async deleteMessage(messageId: string, actorId: string) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');

        await this.prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.DELETE_MESSAGE,
            messageId,
            channelId: message.channelId,
            actorId,
        });

        this.logger.log(`Message ${messageId} deleted by ${actorId}`);
        return { deleted: true, messageId };
    }

    async archiveChannel(channelId: string, actorId: string) {
        const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) throw new NotFoundException('Channel not found');

        await this.prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: true },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.ARCHIVE_CHANNEL,
            channelId,
            actorId,
        });

        this.logger.log(`Channel ${channelId} archived by ${actorId}`);
        return { archived: true, channelId };
    }

    async unarchiveChannel(channelId: string, actorId: string) {
        const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
        if (!channel) throw new NotFoundException('Channel not found');

        await this.prisma.channel.update({
            where: { id: channelId },
            data: { isArchived: false },
        });

        await createAuditLog(this.prisma, {
            action: AuditActions.UNARCHIVE_CHANNEL,
            channelId,
            actorId,
        });

        this.logger.log(`Channel ${channelId} unarchived by ${actorId}`);
        return { archived: false, channelId };
    }

    async getAuditLog(channelId?: string, limit: number = 100, offset: number = 0) {
        const maxLimit = 500;
        const pageSize = Math.min(Math.max(1, limit), maxLimit);

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where: channelId ? { channelId } : {},
                take: pageSize,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            this.prisma.auditLog.count({
                where: channelId ? { channelId } : {},
            }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                limit: pageSize,
                offset,
            },
        };
    }

    async getChannelMembers(channelId: string) {
        return this.prisma.channelMember.findMany({
            where: { channelId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                    },
                },
            },
        });
    }
}
