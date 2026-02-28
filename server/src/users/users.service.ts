import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser, sanitizeUsers } from '../common/utils/user-sanitizer';
import { NotificationPreferencesDto, NotificationPreferencesResponse } from '../notifications/dto/notification-preferences.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const defaultPreferences = {
    new_message: true,
    mention: true,
    digest: true,
    digestFrequency: 'daily' as const,
    account_activity: true,
    assignment_reminder: true,
    grade_posted: true,
};

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = DEFAULT_PAGE_SIZE, includeDeleted: boolean = false) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where = includeDeleted ? {} : { deletedAt: null };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { userRoles: { include: { role: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: sanitizeUsers(users),
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findById(id: string, includeDeleted: boolean = false) {
        const where: any = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        const user = await this.prisma.user.findFirst({
            where,
            include: { userRoles: { include: { role: true } } },
        });
        if (!user) return null;
        return sanitizeUser(user);
    }

    async findPublicProfile(id: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                userRoles: { select: { role: { select: { name: true } } } },
            },
        });
        if (!user) return null;
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            roles: user.userRoles.map((ur) => ur.role.name),
        };
    }

    async findByRole(roleName: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    userRoles: { some: { role: { name: roleName } } },
                    status: 'active',
                },
                include: { userRoles: { include: { role: true } } },
                orderBy: { lastName: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.user.count({
                where: {
                    userRoles: { some: { role: { name: roleName } } },
                    status: 'active',
                },
            }),
        ]);

        return {
            data: sanitizeUsers(users),
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getParentChildren(parentId: string) {
        const relations = await this.prisma.parentStudent.findMany({
            where: { parentId },
            include: {
                student: {
                    include: { userRoles: { include: { role: true } } },
                },
            },
        });
        return relations.map((r) => sanitizeUser(r.student));
    }

    async findByEmail(email: string, includeDeleted: boolean = false) {
        const where: any = { email: email.toLowerCase() };
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        const user = await this.prisma.user.findFirst({
            where,
            include: { userRoles: { include: { role: true } } },
        });
        if (!user) return null;
        return sanitizeUser(user);
    }

    // ─── NOTIFICATION PREFERENCES ──────────────────────────────

    async getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const storedPrefs = (user.notificationPreferences as Record<string, any>) || {};

        return {
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            preferences: {
                new_message: storedPrefs.new_message ?? defaultPreferences.new_message,
                mention: storedPrefs.mention ?? defaultPreferences.mention,
                digest: storedPrefs.digest ?? defaultPreferences.digest,
                digestFrequency: storedPrefs.digestFrequency ?? defaultPreferences.digestFrequency,
                account_activity: storedPrefs.account_activity ?? defaultPreferences.account_activity,
                assignment_reminder: storedPrefs.assignment_reminder ?? defaultPreferences.assignment_reminder,
                grade_posted: storedPrefs.grade_posted ?? defaultPreferences.grade_posted,
            },
        };
    }

    async updateNotificationPreferences(
        userId: string,
        dto: NotificationPreferencesDto,
    ): Promise<NotificationPreferencesResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Merge existing preferences with new values
        const currentPrefs = (user.notificationPreferences as Record<string, any>) || {};
        const updatedPrefs = {
            ...currentPrefs,
            ...(dto.new_message !== undefined && { new_message: dto.new_message }),
            ...(dto.mention !== undefined && { mention: dto.mention }),
            ...(dto.digest !== undefined && { digest: dto.digest }),
            ...(dto.digestFrequency !== undefined && { digestFrequency: dto.digestFrequency }),
            ...(dto.account_activity !== undefined && { account_activity: dto.account_activity }),
            ...(dto.assignment_reminder !== undefined && { assignment_reminder: dto.assignment_reminder }),
            ...(dto.grade_posted !== undefined && { grade_posted: dto.grade_posted }),
        };

        // Update user
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.emailNotificationsEnabled !== undefined && {
                    emailNotificationsEnabled: dto.emailNotificationsEnabled,
                }),
                notificationPreferences: updatedPrefs,
            },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });

        const storedPrefs = (updated.notificationPreferences as Record<string, any>) || {};

        return {
            emailNotificationsEnabled: updated.emailNotificationsEnabled,
            preferences: {
                new_message: storedPrefs.new_message ?? defaultPreferences.new_message,
                mention: storedPrefs.mention ?? defaultPreferences.mention,
                digest: storedPrefs.digest ?? defaultPreferences.digest,
                digestFrequency: storedPrefs.digestFrequency ?? defaultPreferences.digestFrequency,
                account_activity: storedPrefs.account_activity ?? defaultPreferences.account_activity,
                assignment_reminder: storedPrefs.assignment_reminder ?? defaultPreferences.assignment_reminder,
                grade_posted: storedPrefs.grade_posted ?? defaultPreferences.grade_posted,
            },
        };
    }

    /**
     * Check if two users have a valid relationship
     * Relationships include: parent-student, teacher-student, same class
     */
    async hasRelationship(userId: string, targetUserId: string): Promise<boolean> {
        // Don't check relationship with self
        if (userId === targetUserId) return true;

        const [user, targetUser] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                include: { userRoles: { include: { role: true } } },
            }),
            this.prisma.user.findUnique({
                where: { id: targetUserId },
                include: { userRoles: { include: { role: true } } },
            }),
        ]);

        if (!user || !targetUser) return false;

        const userRoles = user.userRoles.map((ur) => ur.role.name);
        const targetRoles = targetUser.userRoles.map((ur) => ur.role.name);

        // Check parent-student relationship
        const isParentStudentRelation = await this.prisma.parentStudent.findFirst({
            where: {
                OR: [
                    { parentId: userId, studentId: targetUserId },
                    { parentId: targetUserId, studentId: userId },
                ],
            },
        });
        if (isParentStudentRelation) return true;

        // Check if user is teacher of target student
        const teacherStudentRelation = await this.prisma.classTeacher.findFirst({
            where: {
                teacherId: userId,
                class: {
                    enrollments: {
                        some: { studentId: targetUserId },
                    },
                },
            },
        });
        if (teacherStudentRelation) return true;

        // Check if they share a class (both students)
        const userEnrollments = await this.prisma.classEnrollment.findMany({
            where: { studentId: userId },
            select: { classId: true },
        });
        const targetEnrollments = await this.prisma.classEnrollment.findMany({
            where: { studentId: targetUserId },
            select: { classId: true },
        });

        const userClassIds = new Set(userEnrollments.map((e) => e.classId));
        const sharedEnrollment = targetEnrollments.some((e) => userClassIds.has(e.classId));
        if (sharedEnrollment) return true;

        // Check shared channel membership
        const sharedChannel = await this.prisma.channelMember.findFirst({
            where: {
                userId: targetUserId,
                channel: {
                    members: {
                        some: { userId },
                    },
                },
            },
        });
        if (sharedChannel) return true;

        return false;
    }
}
