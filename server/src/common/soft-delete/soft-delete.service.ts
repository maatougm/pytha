import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createAuditLog, AuditActions } from '../utils/audit-helper';

export type SoftDeleteType = 'user' | 'channel' | 'message' | 'course' | 'class' | 'file';

export interface DeletedItem {
    id: string;
    type: SoftDeleteType;
    deletedAt: Date;
    deletedBy?: string | null;
    data: any;
    daysUntilPermanentDeletion: number;
}

export interface SoftDeleteOptions {
    reason?: string;
    deletedBy?: string;
    permanentAfterDays?: number;
}

const DEFAULT_GRACE_PERIOD_DAYS = 30;

@Injectable()
export class SoftDeleteService {
    private readonly logger = new Logger(SoftDeleteService.name);

    constructor(private prisma: PrismaService) {}

    // ─── USER SOFT DELETE ────────────────────────────────────────────────

    /**
     * Soft delete a user - deactivate and mark as deleted
     * User data is preserved but user cannot log in
     */
    async softDeleteUser(userId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const user = await this.prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            include: { userRoles: { include: { role: true } } },
        });

        if (!user) {
            throw new NotFoundException('User not found or already deleted');
        }

        if (deletedBy && userId === deletedBy) {
            throw new ForbiddenException('Cannot delete yourself');
        }

        // Check if user is an admin - prevent deleting the last admin
        const isAdmin = user.userRoles.some(ur => ur.role.name === 'admin');
        if (isAdmin) {
            const adminCount = await this.prisma.userRole.count({
                where: {
                    role: { name: 'admin' },
                    user: { deletedAt: null },
                },
            });
            if (adminCount <= 1) {
                throw new ForbiddenException('Cannot delete the last admin user');
            }
        }

        // Soft delete the user
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                status: 'suspended',
            },
            include: { userRoles: { include: { role: true } } },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.USER_DELETE,
            actorId: deletedBy || 'system',
            targetId: userId,
            metadata: { reason, softDelete: true },
        });

        this.logger.log(`User ${userId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            deletedAt: updatedUser.deletedAt,
            message: 'User has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }

    /**
     * Restore a soft-deleted user
     */
    async restoreUser(userId: string, restoredBy?: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.deletedAt) {
            throw new BadRequestException('User is not deleted');
        }

        const restoredUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: null,
                status: 'active',
            },
            include: { userRoles: { include: { role: true } } },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.USER_REACTIVATE,
            actorId: restoredBy || 'system',
            targetId: userId,
            metadata: { restoredFromSoftDelete: true },
        });

        this.logger.log(`User ${userId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredUser.id,
            email: restoredUser.email,
            status: restoredUser.status,
            message: 'User has been restored successfully',
        };
    }

    // ─── CHANNEL SOFT DELETE ─────────────────────────────────────────────

    /**
     * Soft delete (archive) a channel
     */
    async softDeleteChannel(channelId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId, deletedAt: null },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found or already deleted');
        }

        const updatedChannel = await this.prisma.channel.update({
            where: { id: channelId },
            data: {
                deletedAt: new Date(),
                isArchived: true,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.ARCHIVE_CHANNEL,
            actorId: deletedBy || 'system',
            channelId,
            metadata: { reason, softDelete: true },
        });

        this.logger.log(`Channel ${channelId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedChannel.id,
            name: updatedChannel.name,
            deletedAt: updatedChannel.deletedAt,
            message: 'Channel has been archived. Data will be permanently deleted after 30 days.',
        };
    }

    /**
     * Restore a soft-deleted channel
     */
    async restoreChannel(channelId: string, restoredBy?: string): Promise<any> {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        if (!channel.deletedAt) {
            throw new BadRequestException('Channel is not deleted');
        }

        const restoredChannel = await this.prisma.channel.update({
            where: { id: channelId },
            data: {
                deletedAt: null,
                isArchived: false,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.UNARCHIVE_CHANNEL,
            actorId: restoredBy || 'system',
            channelId,
            metadata: { restoredFromSoftDelete: true },
        });

        this.logger.log(`Channel ${channelId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredChannel.id,
            name: restoredChannel.name,
            message: 'Channel has been restored successfully',
        };
    }

    // ─── MESSAGE SOFT DELETE ─────────────────────────────────────────────

    /**
     * Soft delete a message with enhanced tracking
     */
    async softDeleteMessage(messageId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const message = await this.prisma.message.findUnique({
            where: { id: messageId, isDeleted: false },
        });

        if (!message) {
            throw new NotFoundException('Message not found or already deleted');
        }

        const updatedMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy || null,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.DELETE_MESSAGE,
            actorId: deletedBy || 'system',
            messageId,
            channelId: message.channelId,
            metadata: { reason, softDelete: true },
        });

        this.logger.log(`Message ${messageId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedMessage.id,
            deletedAt: updatedMessage.deletedAt,
            deletedBy: updatedMessage.deletedBy,
            message: 'Message has been deleted',
        };
    }

    /**
     * Restore a soft-deleted message
     */
    async restoreMessage(messageId: string, restoredBy?: string): Promise<any> {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (!message.isDeleted) {
            throw new BadRequestException('Message is not deleted');
        }

        const restoredMessage = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: false,
                deletedAt: null,
                deletedBy: null,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.EDIT_MESSAGE, // Using edit as restore action
            actorId: restoredBy || 'system',
            messageId,
            channelId: message.channelId,
            metadata: { restoredFromSoftDelete: true },
        });

        this.logger.log(`Message ${messageId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredMessage.id,
            message: 'Message has been restored successfully',
        };
    }

    // ─── COURSE SOFT DELETE ──────────────────────────────────────────────

    /**
     * Soft delete a course
     */
    async softDeleteCourse(courseId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const course = await this.prisma.course.findUnique({
            where: { id: courseId, deletedAt: null },
        });

        if (!course) {
            throw new NotFoundException('Course not found or already deleted');
        }

        const updatedCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.COURSE_DEACTIVATE,
            actorId: deletedBy || 'system',
            targetId: courseId,
            metadata: { reason, softDelete: true },
        });

        this.logger.log(`Course ${courseId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedCourse.id,
            code: updatedCourse.code,
            name: updatedCourse.name,
            deletedAt: updatedCourse.deletedAt,
            message: 'Course has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }

    /**
     * Restore a soft-deleted course
     */
    async restoreCourse(courseId: string, restoredBy?: string): Promise<any> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (!course.deletedAt) {
            throw new BadRequestException('Course is not deleted');
        }

        const restoredCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: {
                deletedAt: null,
                isActive: true,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.COURSE_ACTIVATE,
            actorId: restoredBy || 'system',
            targetId: courseId,
            metadata: { restoredFromSoftDelete: true },
        });

        this.logger.log(`Course ${courseId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredCourse.id,
            code: restoredCourse.code,
            name: restoredCourse.name,
            message: 'Course has been restored successfully',
        };
    }

    // ─── CLASS SOFT DELETE ───────────────────────────────────────────────

    /**
     * Soft delete a class
     */
    async softDeleteClass(classId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const cls = await this.prisma.class.findUnique({
            where: { id: classId, deletedAt: null },
        });

        if (!cls) {
            throw new NotFoundException('Class not found or already deleted');
        }

        const updatedClass = await this.prisma.class.update({
            where: { id: classId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.COURSE_DEACTIVATE, // Reusing course action for class
            actorId: deletedBy || 'system',
            targetId: classId,
            metadata: { reason, softDelete: true, type: 'class' },
        });

        this.logger.log(`Class ${classId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedClass.id,
            deletedAt: updatedClass.deletedAt,
            message: 'Class has been deactivated. Data will be permanently deleted after 30 days.',
        };
    }

    /**
     * Restore a soft-deleted class
     */
    async restoreClass(classId: string, restoredBy?: string): Promise<any> {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
        });

        if (!cls) {
            throw new NotFoundException('Class not found');
        }

        if (!cls.deletedAt) {
            throw new BadRequestException('Class is not deleted');
        }

        const restoredClass = await this.prisma.class.update({
            where: { id: classId },
            data: {
                deletedAt: null,
                isActive: true,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.COURSE_ACTIVATE, // Reusing course action for class
            actorId: restoredBy || 'system',
            targetId: classId,
            metadata: { restoredFromSoftDelete: true, type: 'class' },
        });

        this.logger.log(`Class ${classId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredClass.id,
            message: 'Class has been restored successfully',
        };
    }

    // ─── FILE SOFT DELETE ────────────────────────────────────────────────

    /**
     * Soft delete a file
     */
    async softDeleteFile(fileId: string, options: SoftDeleteOptions = {}): Promise<any> {
        const { reason, deletedBy } = options;

        const file = await this.prisma.file.findUnique({
            where: { id: fileId, isDeleted: false },
        });

        if (!file) {
            throw new NotFoundException('File not found or already deleted');
        }

        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.DELETE_MESSAGE, // Using message delete for file
            actorId: deletedBy || 'system',
            targetId: fileId,
            metadata: { reason, softDelete: true, type: 'file' },
        });

        this.logger.log(`File ${fileId} soft deleted by ${deletedBy || 'system'}`);

        return {
            id: updatedFile.id,
            filename: updatedFile.filename,
            deletedAt: updatedFile.deletedAt,
            message: 'File has been deleted. Data will be permanently deleted after 30 days.',
        };
    }

    /**
     * Restore a soft-deleted file
     */
    async restoreFile(fileId: string, restoredBy?: string): Promise<any> {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (!file.isDeleted) {
            throw new BadRequestException('File is not deleted');
        }

        const restoredFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });

        // Create audit log
        await createAuditLog(this.prisma, {
            action: AuditActions.UNARCHIVE_CHANNEL,
            actorId: restoredBy || 'system',
            targetId: fileId,
            metadata: { restoredFromSoftDelete: true, type: 'file' },
        });

        this.logger.log(`File ${fileId} restored by ${restoredBy || 'system'}`);

        return {
            id: restoredFile.id,
            filename: restoredFile.filename,
            message: 'File has been restored successfully',
        };
    }

    // ─── PERMANENT DELETION ──────────────────────────────────────────────

    /**
     * Permanently delete an item after grace period
     */
    async permanentDelete(type: SoftDeleteType, id: string, deletedBy?: string): Promise<any> {
        const gracePeriodMs = DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

        switch (type) {
            case 'user':
                return this.permanentDeleteUser(id, gracePeriodMs, deletedBy);
            case 'channel':
                return this.permanentDeleteChannel(id, gracePeriodMs, deletedBy);
            case 'message':
                return this.permanentDeleteMessage(id, deletedBy);
            case 'course':
                return this.permanentDeleteCourse(id, gracePeriodMs, deletedBy);
            case 'class':
                return this.permanentDeleteClass(id, gracePeriodMs, deletedBy);
            case 'file':
                return this.permanentDeleteFile(id, deletedBy);
            default:
                throw new BadRequestException(`Unknown type: ${type}`);
        }
    }

    private async permanentDeleteUser(userId: string, gracePeriodMs: number, deletedBy?: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.deletedAt) {
            throw new BadRequestException('User must be soft deleted first');
        }

        const deleteAfter = new Date(user.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new ForbiddenException(
                `Cannot permanently delete user until grace period ends. ${daysRemaining} days remaining.`
            );
        }

        await this.prisma.user.delete({ where: { id: userId } });

        this.logger.log(`User ${userId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'User permanently deleted', id: userId };
    }

    private async permanentDeleteChannel(channelId: string, gracePeriodMs: number, deletedBy?: string): Promise<any> {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        if (!channel.deletedAt) {
            throw new BadRequestException('Channel must be soft deleted first');
        }

        const deleteAfter = new Date(channel.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new ForbiddenException(
                `Cannot permanently delete channel until grace period ends. ${daysRemaining} days remaining.`
            );
        }

        await this.prisma.channel.delete({ where: { id: channelId } });

        this.logger.log(`Channel ${channelId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'Channel permanently deleted', id: channelId };
    }

    private async permanentDeleteMessage(messageId: string, deletedBy?: string): Promise<any> {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (!message.isDeleted) {
            throw new BadRequestException('Message must be soft deleted first');
        }

        await this.prisma.message.delete({ where: { id: messageId } });

        this.logger.log(`Message ${messageId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'Message permanently deleted', id: messageId };
    }

    private async permanentDeleteCourse(courseId: string, gracePeriodMs: number, deletedBy?: string): Promise<any> {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (!course.deletedAt) {
            throw new BadRequestException('Course must be soft deleted first');
        }

        const deleteAfter = new Date(course.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new ForbiddenException(
                `Cannot permanently delete course until grace period ends. ${daysRemaining} days remaining.`
            );
        }

        await this.prisma.course.delete({ where: { id: courseId } });

        this.logger.log(`Course ${courseId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'Course permanently deleted', id: courseId };
    }

    private async permanentDeleteClass(classId: string, gracePeriodMs: number, deletedBy?: string): Promise<any> {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
        });

        if (!cls) {
            throw new NotFoundException('Class not found');
        }

        if (!cls.deletedAt) {
            throw new BadRequestException('Class must be soft deleted first');
        }

        const deleteAfter = new Date(cls.deletedAt.getTime() + gracePeriodMs);
        if (new Date() < deleteAfter) {
            const daysRemaining = Math.ceil((deleteAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            throw new ForbiddenException(
                `Cannot permanently delete class until grace period ends. ${daysRemaining} days remaining.`
            );
        }

        await this.prisma.class.delete({ where: { id: classId } });

        this.logger.log(`Class ${classId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'Class permanently deleted', id: classId };
    }

    private async permanentDeleteFile(fileId: string, deletedBy?: string): Promise<any> {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        if (!file.isDeleted) {
            throw new BadRequestException('File must be soft deleted first');
        }

        // Note: Physical file deletion should be handled separately
        await this.prisma.file.delete({ where: { id: fileId } });

        this.logger.log(`File ${fileId} permanently deleted by ${deletedBy || 'system'}`);

        return { message: 'File permanently deleted', id: fileId };
    }

    // ─── LIST DELETED ITEMS ──────────────────────────────────────────────

    /**
     * Get all soft-deleted items
     */
    async getDeletedItems(type?: SoftDeleteType, includeDeleted?: boolean): Promise<DeletedItem[]> {
        const results: DeletedItem[] = [];
        const gracePeriodMs = DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

        if (!type || type === 'user') {
            const users = await this.prisma.user.findMany({
                where: { deletedAt: { not: null } },
                include: { userRoles: { include: { role: true } } },
            });
            results.push(...users.map(u => ({
                id: u.id,
                type: 'user' as SoftDeleteType,
                deletedAt: u.deletedAt!,
                deletedBy: null,
                data: {
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    roles: u.userRoles.map(ur => ur.role.name),
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil(
                    (u.deletedAt!.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )),
            })));
        }

        if (!type || type === 'channel') {
            const channels = await this.prisma.channel.findMany({
                where: { deletedAt: { not: null } },
            });
            results.push(...channels.map(c => ({
                id: c.id,
                type: 'channel' as SoftDeleteType,
                deletedAt: c.deletedAt!,
                deletedBy: null,
                data: {
                    name: c.name,
                    type: c.type,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil(
                    (c.deletedAt!.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )),
            })));
        }

        if (!type || type === 'message') {
            const messages = await this.prisma.message.findMany({
                where: { isDeleted: true },
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true } },
                    channel: { select: { id: true, name: true } },
                },
            });
            results.push(...messages.map(m => ({
                id: m.id,
                type: 'message' as SoftDeleteType,
                deletedAt: m.deletedAt || m.createdAt,
                deletedBy: m.deletedBy,
                data: {
                    content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
                    sender: m.sender,
                    channel: m.channel,
                },
                daysUntilPermanentDeletion: m.deletedAt ? Math.max(0, Math.ceil(
                    (m.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )) : 0,
            })));
        }

        if (!type || type === 'course') {
            const courses = await this.prisma.course.findMany({
                where: { deletedAt: { not: null } },
            });
            results.push(...courses.map(c => ({
                id: c.id,
                type: 'course' as SoftDeleteType,
                deletedAt: c.deletedAt!,
                deletedBy: null,
                data: {
                    code: c.code,
                    name: c.name,
                    department: c.department,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil(
                    (c.deletedAt!.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )),
            })));
        }

        if (!type || type === 'class') {
            const classes = await this.prisma.class.findMany({
                where: { deletedAt: { not: null } },
                include: { course: { select: { code: true, name: true } } },
            });
            results.push(...classes.map(c => ({
                id: c.id,
                type: 'class' as SoftDeleteType,
                deletedAt: c.deletedAt!,
                deletedBy: null,
                data: {
                    term: c.term,
                    section: c.section,
                    course: c.course,
                },
                daysUntilPermanentDeletion: Math.max(0, Math.ceil(
                    (c.deletedAt!.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )),
            })));
        }

        if (!type || type === 'file') {
            const files = await this.prisma.file.findMany({
                where: { isDeleted: true },
            });
            results.push(...files.map(f => ({
                id: f.id,
                type: 'file' as SoftDeleteType,
                deletedAt: f.deletedAt || f.createdAt,
                deletedBy: null,
                data: {
                    filename: f.filename,
                    originalName: f.originalName,
                    size: f.size,
                },
                daysUntilPermanentDeletion: f.deletedAt ? Math.max(0, Math.ceil(
                    (f.deletedAt.getTime() + gracePeriodMs - Date.now()) / (24 * 60 * 60 * 1000)
                )) : 0,
            })));
        }

        // Sort by deletedAt descending
        return results.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
    }

    // ─── CLEANUP JOB ─────────────────────────────────────────────────────

    /**
     * Cleanup job to permanently delete items soft-deleted > 30 days ago
     * Should be run weekly via cron job
     */
    async cleanupOldDeletedItems(): Promise<{
        users: number;
        channels: number;
        messages: number;
        courses: number;
        classes: number;
        files: number;
        total: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_GRACE_PERIOD_DAYS);

        this.logger.log(`Starting cleanup of items soft-deleted before ${cutoffDate.toISOString()}`);

        const results = {
            users: 0,
            channels: 0,
            messages: 0,
            courses: 0,
            classes: 0,
            files: 0,
            total: 0,
        };

        try {
            // Permanently delete users
            const deletedUsers = await this.prisma.user.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.users = deletedUsers.count;
            results.total += deletedUsers.count;
            this.logger.log(`Permanently deleted ${deletedUsers.count} users`);
        } catch (error) {
            this.logger.error('Failed to delete old users:', error.message);
        }

        try {
            // Permanently delete channels
            const deletedChannels = await this.prisma.channel.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.channels = deletedChannels.count;
            results.total += deletedChannels.count;
            this.logger.log(`Permanently deleted ${deletedChannels.count} channels`);
        } catch (error) {
            this.logger.error('Failed to delete old channels:', error.message);
        }

        try {
            // Permanently delete courses
            const deletedCourses = await this.prisma.course.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.courses = deletedCourses.count;
            results.total += deletedCourses.count;
            this.logger.log(`Permanently deleted ${deletedCourses.count} courses`);
        } catch (error) {
            this.logger.error('Failed to delete old courses:', error.message);
        }

        try {
            // Permanently delete classes
            const deletedClasses = await this.prisma.class.deleteMany({
                where: { deletedAt: { lt: cutoffDate } },
            });
            results.classes = deletedClasses.count;
            results.total += deletedClasses.count;
            this.logger.log(`Permanently deleted ${deletedClasses.count} classes`);
        } catch (error) {
            this.logger.error('Failed to delete old classes:', error.message);
        }

        try {
            // Permanently delete files
            const deletedFiles = await this.prisma.file.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: { lt: cutoffDate },
                },
            });
            results.files = deletedFiles.count;
            results.total += deletedFiles.count;
            this.logger.log(`Permanently deleted ${deletedFiles.count} files`);
        } catch (error) {
            this.logger.error('Failed to delete old files:', error.message);
        }

        // Messages are deleted with channels via cascade, but we can clean up orphaned ones
        try {
            const deletedMessages = await this.prisma.message.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: { lt: cutoffDate },
                },
            });
            results.messages = deletedMessages.count;
            results.total += deletedMessages.count;
            this.logger.log(`Permanently deleted ${deletedMessages.count} messages`);
        } catch (error) {
            this.logger.error('Failed to delete old messages:', error.message);
        }

        this.logger.log(`Cleanup completed. Total items deleted: ${results.total}`);

        return results;
    }
}
