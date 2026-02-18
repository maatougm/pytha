import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { sanitizeUsers } from '../common/utils/user-sanitizer';

// Local enums (schema uses strings, not enums)
enum UserStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    SUSPENDED = 'suspended',
}

enum AuditAction {
    USER_UPDATE = 'user_update',
    USER_APPROVE = 'user_approve',
    USER_SUSPEND = 'user_suspend',
    USER_REACTIVATE = 'user_reactivate',
    USER_DELETE = 'user_delete',
    MESSAGE_DELETE = 'message_delete',
    MESSAGE_EDIT = 'message_edit',
    COURSE_ACTIVATE = 'course_activate',
    COURSE_DEACTIVATE = 'course_deactivate',
    SETTINGS_UPDATE = 'settings_update',
}
import { UpdateUserDto } from './dto/update-user.dto';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { SystemSettingsDto } from './dto/system-settings.dto';
import { InviteUserDto, BulkInviteUserDto } from './dto/invite-user.dto';
import { User, Course, Class } from '@prisma/client';
import * as crypto from 'crypto';

// Using SystemMetrics from admin.dto.ts which has nested structure
// This interface matches the expected frontend format
interface SystemMetrics {
    timestamp: string;
    users: {
        total: number;
        active: number;
        newToday: number;
        newThisWeek: number;
        byRole: Record<string, number>;
    };
    messages: {
        total: number;
        today: number;
        thisWeek: number;
        averagePerDay: number;
    };
    courses: {
        total: number;
        active: number;
        totalEnrollments: number;
    };
    files: {
        total: number;
        totalSize: number;
        today: number;
    };
    attendance: {
        totalSessions: number;
        averageRate: number;
    };
    system: {
        uptime: number;
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: number;
        activeConnections: number;
    };
}

interface ActivityTimeline {
    labels: string[];
    datasets: {
        name: string;
        data: number[];
        color: string;
    }[];
}

interface RealTimeStats {
    onlineUsers: number;
    activeChannels: number;
    pendingTasks: number;
    systemHealth: {
        database: 'healthy' | 'degraded' | 'down';
        websocket: 'healthy' | 'degraded' | 'down';
        storage: 'healthy' | 'degraded' | 'full';
    };
}

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    private metricsCache: { data: SystemMetrics; timestamp: number } | null = null;
    private readonly CACHE_TTL = 60000; // 1 minute

    constructor(private prisma: PrismaService) { }

    // ─── USER MANAGEMENT ────────────────────────────────────────────────

    async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
        const result = await this.getAllUsers({
            ...params,
            status: params.status as UserStatus,
        });
        return {
            users: sanitizeUsers(result.users),
            total: result.total,
        };
    }

    async updateUserStatus(userId: string, dto: any, actorId: string) {
        const { status, reason } = dto;
        switch (status) {
            case 'active':
                return this.approveUser(userId, actorId);
            case 'suspended':
                return this.suspendUser(userId, reason, actorId);
            default:
                throw new BadRequestException(`Unsupported status: ${status}`);
        }
    }

    async getAllUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: UserStatus;
        role?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeDeleted?: boolean;
    }): Promise<{ users: User[]; total: number }> {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            role,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeDeleted = false,
        } = params;

        const where: Prisma.UserWhereInput = {};

        // By default, exclude soft-deleted users
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        if (search) {
            // HIGH-005 fix: escape PostgreSQL LIKE wildcards to prevent performance attacks
            const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
            where.OR = [
                { email: { contains: sanitizedSearch, mode: 'insensitive' } },
                { firstName: { contains: sanitizedSearch, mode: 'insensitive' } },
                { lastName: { contains: sanitizedSearch, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (role) {
            where.userRoles = {
                some: {
                    role: {
                        name: role,
                    },
                },
            };
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            uploadedFiles: true,
                            sentMessages: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async getUserById(userId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: { role: true },
                },
                enrollments: {
                    include: { class: { include: { course: true } } },
                },
                parentOf: {
                    include: {
                        student: true,
                    },
                },
                childOf: {
                    include: {
                        parent: true,
                    },
                },
                _count: {
                    select: {
                        uploadedFiles: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUser(userId: string, updateData: UpdateUserDto, actorId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_UPDATE,

                targetId: userId,
                metadata: { changes: updateData } as any,
            },
        });

        return updatedUser;
    }

    async approveUser(userId: string, actorId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.status !== UserStatus.PENDING) {
            throw new BadRequestException('User is not pending approval');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE, updatedAt: new Date() },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_APPROVE,

                targetId: userId,
                metadata: { previousStatus: user.status, newStatus: UserStatus.ACTIVE } as any,
            },
        });

        return updatedUser;
    }

    async suspendUser(userId: string, reason: string, actorId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.id === actorId) {
            throw new BadRequestException('Cannot suspend yourself');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.SUSPENDED, updatedAt: new Date() },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_SUSPEND,

                targetId: userId,
                metadata: { reason, previousStatus: user.status } as any,
            },
        });

        return updatedUser;
    }

    async reactivateUser(userId: string, actorId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE, updatedAt: new Date() },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_REACTIVATE,

                targetId: userId,
                metadata: { previousStatus: user.status } as any,
            },
        });

        return updatedUser;
    }

    async deleteUser(userId: string, actorId: string, permanent: boolean = false): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.id === actorId) {
            throw new BadRequestException('Cannot delete yourself');
        }

        if (permanent) {
            // Permanent delete - only if already soft deleted
            if (!user.deletedAt) {
                throw new BadRequestException('User must be soft deleted first before permanent deletion');
            }

            await this.prisma.$transaction([
                this.prisma.auditLog.create({
                    data: {
                        actorId: actorId,
                        action: AuditAction.USER_DELETE,
                        targetId: userId,
                        metadata: { deletedUserEmail: user.email, permanent: true } as any,
                    },
                }),
                this.prisma.user.delete({ where: { id: userId } }),
            ]);
        } else {
            // Soft delete - set deletedAt and status
            await this.prisma.$transaction([
                this.prisma.auditLog.create({
                    data: {
                        actorId: actorId,
                        action: AuditAction.USER_DELETE,
                        targetId: userId,
                        metadata: { deletedUserEmail: user.email, softDelete: true } as any,
                    },
                }),
                this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        deletedAt: new Date(),
                        status: 'suspended',
                    }
                }),
            ]);
        }
    }

    // ─── ANALYTICS ──────────────────────────────────────────────────────

    async getSystemMetrics(): Promise<SystemMetrics> {
        // Cache check
        if (this.metricsCache && Date.now() - this.metricsCache.timestamp < this.CACHE_TTL) {
            return this.metricsCache.data;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [
            userCounts,
            totalCourses,
            activeCourses,
            totalClasses,
            totalMessages,
            messagesToday,
            messagesThisWeek,
            totalFiles,
            filesToday,
            storageAgg,
            totalEnrollments,
            attendanceSessions,
            usersByRole,
        ] = await Promise.all([
            this.prisma.user.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this.prisma.course.count(),
            this.prisma.course.count({ where: { isActive: true } }),
            this.prisma.class.count(),
            this.prisma.message.count(),
            this.prisma.message.count({ where: { createdAt: { gte: today } } }),
            this.prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.file.count(),
            this.prisma.file.count({ where: { createdAt: { gte: today } } }),
            this.prisma.file.aggregate({
                _sum: { size: true },
            }),
            this.prisma.classEnrollment.count(),
            this.prisma.attendanceSession.count(),
            this.prisma.userRole.groupBy({
                by: ['roleId'],
                _count: { userId: true },
            }),
        ]);

        const totalUsers = userCounts.reduce((sum, u) => sum + u._count.id, 0);
        const activeUsers = userCounts.find(u => u.status === UserStatus.ACTIVE)?._count.id || 0;
        const newToday = await this.prisma.user.count({ where: { createdAt: { gte: today } } });
        const newThisWeek = await this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } });

        // Build role map
        const byRole: Record<string, number> = {};
        for (const ur of usersByRole) {
            const role = await this.prisma.role.findUnique({ where: { id: ur.roleId } });
            byRole[role?.name || 'unknown'] = ur._count.userId;
        }

        const metrics: SystemMetrics = {
            timestamp: new Date().toISOString(),
            users: {
                total: totalUsers,
                active: activeUsers,
                newToday,
                newThisWeek,
                byRole,
            },
            messages: {
                total: totalMessages,
                today: messagesToday,
                thisWeek: messagesThisWeek,
                averagePerDay: Math.round(totalMessages / 30), // 30-day average
            },
            courses: {
                total: totalCourses,
                active: activeCourses,
                totalEnrollments,
            },
            files: {
                total: totalFiles,
                totalSize: storageAgg._sum.size || 0,
                today: filesToday,
            },
            attendance: {
                totalSessions: attendanceSessions,
                averageRate: await this.calculateAverageAttendanceRate(),
            },
            system: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                },
                cpu: 0, // Would need os.loadavg() for actual CPU
                activeConnections: 0, // Would need WebSocket tracking
            },
        };

        this.metricsCache = { data: metrics, timestamp: Date.now() };
        return metrics;
    }

    /**
     * Get daily activity counts using efficient SQL grouping
     * Uses raw queries to leverage PostgreSQL's native date functions
     * instead of loading all records into memory
     */
    private async getDailyCounts(
        model: 'message' | 'user' | 'file',
        startDate: Date,
        endDate: Date,
    ): Promise<number[]> {
        // Hardcoded allowlist — never interpolate user input here
        const tableMap = { message: 'messages', user: 'users', file: 'files' } as const;
        const table = tableMap[model];
        const dateField = 'created_at'; // same for all models; kept explicit for clarity

        // CRIT-001 fix: use Prisma.sql tagged template instead of $queryRawUnsafe.
        // Prisma.raw() is safe here because table/dateField come from a hardcoded allowlist.
        const results = await this.prisma.$queryRaw<
            Array<{ date: string; count: bigint }>
        >(
            Prisma.sql`
            SELECT DATE(${Prisma.raw(dateField)}) as date, COUNT(*) as count
            FROM ${Prisma.raw(table)}
            WHERE ${Prisma.raw(dateField)} >= ${startDate} AND ${Prisma.raw(dateField)} <= ${endDate}
            GROUP BY DATE(${Prisma.raw(dateField)})
            ORDER BY date
            `,
        );

        // Build a map of date -> count
        const countsByDate = new Map<string, number>();
        results.forEach((row: any) => {
            countsByDate.set(row.date.toISOString().split('T')[0], Number(row.count));
        });

        // Fill in all days in the range
        const days = this.getDaysArray(startDate, endDate);
        return days.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            return countsByDate.get(dateStr) || 0;
        });
    }

    private getDaysArray(startDate: Date, endDate: Date): Date[] {
        const dates: Date[] = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    async getActivityTimeline(range?: string): Promise<ActivityTimeline> {
        // Map TimeRange enum values to days
        const rangeMap: Record<string, number> = {
            'today': 1,
            'week': 7,
            'month': 30,
            'quarter': 90,
            'year': 365,
        };
        const days = range ? (rangeMap[range] || parseInt(range, 10) || 30) : 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [userCounts, messageCounts, fileCounts, dayLabels] = await Promise.all([
            this.getDailyCounts('user', startDate, endDate),
            this.getDailyCounts('message', startDate, endDate),
            this.getDailyCounts('file', startDate, endDate),
            this.getDaysArray(startDate, endDate),
        ]);

        return {
            labels: dayLabels.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
                { name: 'New Users', data: userCounts, color: '#3b82f6' },
                { name: 'Messages', data: messageCounts, color: '#10b981' },
                { name: 'Files', data: fileCounts, color: '#f59e0b' },
            ],
        };
    }

    async getRealTimeStats(): Promise<RealTimeStats> {
        // Check database health
        let dbHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            dbHealth = 'down';
        }

        // Check storage (simplified - would check actual disk space)
        const storageHealth: 'healthy' | 'degraded' | 'full' = 'healthy';

        return {
            onlineUsers: 0, // Will be updated by gateway
            activeChannels: await this.prisma.channel.count({ where: { isArchived: false } }),
            pendingTasks: await this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
            systemHealth: {
                database: dbHealth,
                websocket: 'healthy',
                storage: storageHealth,
            },
        };
    }

    // ─── CONTENT MODERATION ─────────────────────────────────────────────

    async getModerationQueue(page?: number, limit?: number) {
        return this.getContentForModeration({ page, limit });
    }

    async bulkAction(dto: any, actorId: string): Promise<{ success: number; failed: number }> {
        const { action, targetType, targetIds, reason } = dto;

        // CRIT-002 fix: validate targetIds array — must be non-empty, max 100, all valid UUIDs
        if (!Array.isArray(targetIds) || targetIds.length === 0) {
            throw new BadRequestException('No targets specified');
        }
        if (targetIds.length > 100) {
            throw new BadRequestException('Bulk action limited to 100 targets per request');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const id of targetIds) {
            if (typeof id !== 'string' || !uuidRegex.test(id)) {
                throw new BadRequestException(`Invalid ID format: ${id}`);
            }
        }

        let success = 0;
        let failed = 0;

        // Process each target
        for (const targetId of targetIds) {
            try {
                switch (targetType) {
                    case 'user':
                        await this.handleBulkUserAction(action, targetId, reason, actorId);
                        break;
                    case 'message':
                        await this.handleBulkMessageAction(action, targetId, actorId);
                        break;
                    case 'course':
                        await this.handleBulkCourseAction(action, targetId, actorId);
                        break;
                    default:
                        failed++;
                        continue;
                }
                success++;
            } catch (err) {
                this.logger.warn(`Bulk action failed for ${targetType} ${targetId}:`, err.message);
                failed++;
            }
        }

        this.logger.log(`Bulk action completed by ${actorId}: ${success} succeeded, ${failed} failed`);
        return { success, failed };
    }

    private async handleBulkUserAction(action: string, userId: string, reason: string, actorId: string) {
        switch (action) {
            case 'suspend':
                await this.suspendUser(userId, reason, actorId);
                break;
            case 'activate':
                await this.reactivateUser(userId, actorId);
                break;
            case 'delete':
                // Soft delete by default
                await this.deleteUser(userId, actorId, false);
                break;
            case 'permanent-delete':
                // Permanent delete
                await this.deleteUser(userId, actorId, true);
                break;
            default:
                throw new BadRequestException(`Unknown user action: ${action}`);
        }
    }

    private async handleBulkMessageAction(action: string, messageId: string, actorId: string) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');

        switch (action) {
            case 'delete':
                await this.prisma.message.update({
                    where: { id: messageId },
                    data: { isDeleted: true },
                });
                await this.prisma.auditLog.create({
                    data: {
                        actorId,
                        action: AuditAction.MESSAGE_DELETE,
                        messageId,
                        channelId: message.channelId,
                        metadata: { bulkAction: true } as any,
                    },
                });
                break;
            default:
                throw new BadRequestException(`Unknown message action: ${action}`);
        }
    }

    private async handleBulkCourseAction(action: string, courseId: string, actorId: string) {
        const isActive = action === 'activate';
        await this.toggleCourseStatus(courseId, isActive, actorId);
    }

    private async calculateAverageAttendanceRate(): Promise<number> {
        try {
            // Get all attendance records from the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [totalRecords, presentRecords] = await Promise.all([
                this.prisma.attendanceRecord.count({
                    where: { markedAt: { gte: thirtyDaysAgo } },
                }),
                this.prisma.attendanceRecord.count({
                    where: {
                        markedAt: { gte: thirtyDaysAgo },
                        status: 'present',
                    },
                }),
            ]);

            if (totalRecords === 0) return 100; // Default if no data

            // Calculate percentage
            return Math.round((presentRecords / totalRecords) * 100);
        } catch (error) {
            this.logger.error('Failed to calculate attendance rate:', error);
            return 85; // Fallback value
        }
    }

    async getContentForModeration(params: {
        page?: number;
        limit?: number;
        contentType?: 'message' | 'file';
        flagged?: boolean;
    }): Promise<{ content: any[]; total: number }> {
        const { page = 1, limit = 50, contentType, flagged = false } = params;
        const skip = (page - 1) * limit;

        if (!contentType || contentType === 'message') {
            const where: Prisma.MessageWhereInput = {};
            if (flagged) {
                // Note: Message model doesn't have metadata field
                // Flagged messages would need a separate flagged boolean or metadata column
                where.isDeleted = false;
            }

            const [messages, total] = await Promise.all([
                this.prisma.message.findMany({
                    where,
                    include: {
                        sender: {
                            select: { id: true, email: true, firstName: true, lastName: true },
                        },
                        channel: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.message.count({ where }),
            ]);

            return {
                content: messages.map(m => ({ ...m, contentType: 'message' })),
                total,
            };
        }

        return { content: [], total: 0 };
    }

    async moderateContent(contentId: string, moderationData: ModerateContentDto, actorId: string): Promise<any> {
        const { contentType, action, reason } = moderationData;

        if (contentType === 'message') {
            const message = await this.prisma.message.findUnique({
                where: { id: contentId },
            });
            if (!message) throw new NotFoundException('Message not found');

            const updatedMessage = await this.prisma.message.update({
                where: { id: contentId },
                data: {
                    isDeleted: action === 'delete',
                },
            });

            await this.prisma.auditLog.create({
                data: {
                    actorId: actorId,
                    action: action === 'delete' ? AuditAction.MESSAGE_DELETE : AuditAction.MESSAGE_EDIT,
                    messageId: contentId,
                    metadata: { reason, action } as any,
                },
            });

            return updatedMessage;
        }

        throw new BadRequestException('Unsupported content type');
    }

    // ─── AUDIT LOGS ─────────────────────────────────────────────────────

    async getAuditLogs(
        page?: number,
        limit?: number,
        filters?: { action?: string; actorId?: string; startDate?: string; endDate?: string }
    ): Promise<{ logs: any[]; total: number }> {
        const { action, actorId, startDate, endDate } = filters || {};
        const pageNum = page ?? 1;
        const limitNum = limit ?? 50;
        const skip = (pageNum - 1) * limitNum;

        const where: Prisma.AuditLogWhereInput = {};
        if (actorId) where.actorId = actorId;
        if (action) where.action = action;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { logs, total };
    }

    async cleanupOldAuditLogs(daysToKeep: number = 180): Promise<{ deleted: number }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await this.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
        });

        this.logger.log(`Cleaned up ${result.count} old audit logs`);
        return { deleted: result.count };
    }

    async cleanupOldData(): Promise<{ message: string; details: any }> {
        const auditResult = await this.cleanupOldAuditLogs(180);
        return {
            message: 'Cleanup completed successfully',
            details: { auditLogsDeleted: auditResult.deleted },
        };
    }

    // ─── COURSE/CLASS MANAGEMENT ────────────────────────────────────────

    async getAllCourses(params: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    }): Promise<{ courses: Course[]; total: number }> {
        const { page = 1, limit = 20, isActive } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.CourseWhereInput = {};
        if (isActive !== undefined) where.isActive = isActive;

        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    _count: { select: { classes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.course.count({ where }),
        ]);

        return { courses, total };
    }

    async getAllClasses(params: {
        page?: number;
        limit?: number;
    }): Promise<{ classes: Class[]; total: number }> {
        const { page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;

        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                include: {
                    course: true,
                    teacher: { select: { id: true, email: true, firstName: true, lastName: true } },
                    _count: { select: { enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.class.count(),
        ]);

        return { classes, total };
    }

    async toggleCourseStatus(courseId: string, isActive: boolean, actorId: string): Promise<Course> {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Course not found');

        const updatedCourse = await this.prisma.course.update({
            where: { id: courseId },
            data: { isActive, updatedAt: new Date() },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: isActive ? AuditAction.COURSE_ACTIVATE : AuditAction.COURSE_DEACTIVATE,
                targetId: courseId,
                metadata: { previousStatus: course.isActive, newStatus: isActive } as any,
            },
        });

        return updatedCourse;
    }

    // ─── SYSTEM SETTINGS ────────────────────────────────────────────────

    async getSystemSettings(): Promise<SystemSettingsDto> {
        // Return default settings (would load from database/cache in production)
        return {
            maintenanceMode: false,
            allowRegistration: true,
            requireApproval: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
            maxStoragePerUser: 1024 * 1024 * 1024, // 1GB
        };
    }

    async updateSystemSettings(settings: SystemSettingsDto, actorId: string): Promise<SystemSettingsDto> {
        // In production, save to database
        this.logger.log(`System settings updated by ${actorId}`, settings);

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.SETTINGS_UPDATE,
                targetId: 'system',
                metadata: settings as any,
            },
        });

        return settings;
    }

    // ─── DASHBOARD SUMMARY ──────────────────────────────────────────────

    async getDashboardSummary(): Promise<{
        metrics: SystemMetrics;
        timeline: ActivityTimeline;
        recentActivity: any[];
        pendingApprovals: number;
    }> {
        const [metrics, timeline, recentAuditLogs, pendingApprovals] = await Promise.all([
            this.getSystemMetrics(),
            this.getActivityTimeline('14'),
            this.prisma.auditLog.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
        ]);

        return {
            metrics,
            timeline,
            recentActivity: recentAuditLogs,
            pendingApprovals,
        };
    }

    // ─── USER INVITATION ────────────────────────────────────────────────

    async inviteUser(dto: InviteUserDto, actorId: string): Promise<User> {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await this.hashPassword(tempPassword);

        // Get the role
        const role = await this.prisma.role.findUnique({
            where: { name: dto.role },
        });

        if (!role) {
            throw new BadRequestException(`Role '${dto.role}' not found`);
        }

        // Create user with transaction to ensure role assignment
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                    passwordHash: hashedPassword,
                    status: UserStatus.ACTIVE,
                },
            });

            // Assign role
            await tx.userRole.create({
                data: {
                    userId: newUser.id,
                    roleId: role.id,
                },
            });

            // Handle parent-child relationships if applicable
            if (dto.role === 'student' && dto.parentId) {
                await tx.parentStudent.create({
                    data: {
                        parentId: dto.parentId,
                        studentId: newUser.id,
                    },
                });
            }

            if (dto.role === 'parent' && dto.childIds && dto.childIds.length > 0) {
                await tx.parentStudent.createMany({
                    data: dto.childIds.map(childId => ({
                        parentId: newUser.id,
                        studentId: childId,
                    })),
                });
            }

            // Handle class enrollments for students
            if (dto.role === 'student' && dto.classIds && dto.classIds.length > 0) {
                await tx.classEnrollment.createMany({
                    data: dto.classIds.map(classId => ({
                        studentId: newUser.id,
                        classId: classId,
                        status: 'active',
                    })),
                });
            }

            return newUser;
        });

        // Create audit log
        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_APPROVE,
                targetId: user.id,
                metadata: {
                    invitedBy: actorId,
                    role: dto.role,
                    tempPassword: tempPassword // In production, send this via email instead
                } as any,
            },
        });

        this.logger.log(`User invited by ${actorId}: ${dto.email} (${dto.role})`);

        // Return user with the temporary password (in production, send via email)
        return { ...user, tempPassword } as any;
    }

    async bulkInviteUsers(dto: BulkInviteUserDto, actorId: string): Promise<{ success: number; failed: number; results: any[] }> {
        const results: any[] = [];
        let success = 0;
        let failed = 0;

        for (const userDto of dto.users) {
            try {
                const user = await this.inviteUser(userDto, actorId);
                results.push({ success: true, email: userDto.email, user });
                success++;
            } catch (err: any) {
                results.push({ success: false, email: userDto.email, error: err.message });
                failed++;
            }
        }

        this.logger.log(`Bulk invite completed by ${actorId}: ${success} succeeded, ${failed} failed`);
        return { success, failed, results };
    }

    async resetPassword(userId: string, actorId: string): Promise<{ tempPassword: string }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Generate new temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await this.hashPassword(tempPassword);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                updatedAt: new Date()
            },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: actorId,
                action: AuditAction.USER_UPDATE,
                targetId: userId,
                metadata: { action: 'password_reset' } as any,
            },
        });

        this.logger.log(`Password reset for user ${userId} by ${actorId}`);
        return { tempPassword };
    }

    private async hashPassword(password: string): Promise<string> {
        // Simple bcrypt-like hashing using crypto
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    // ─── TEACHER-CLASS ALLOCATION ───────────────────────────────────────

    async getTeacherClassAllocations(teacherId?: string, classId?: string) {
        const where: any = {};
        if (teacherId) where.teacherId = teacherId;
        if (classId) where.classId = classId;

        return this.prisma.classTeacher.findMany({
            where,
            include: {
                teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                class: {
                    include: {
                        course: { select: { id: true, name: true, code: true } },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }

    async assignTeacherToClass(dto: { teacherId: string; classId: string; isPrimary?: boolean }, adminId: string) {
        // Verify teacher exists and has teacher role
        const teacher = await this.prisma.user.findFirst({
            where: {
                id: dto.teacherId,
                userRoles: { some: { role: { name: 'teacher' } } },
            },
        });
        if (!teacher) throw new NotFoundException('Teacher not found');

        // Verify class exists
        const classExists = await this.prisma.class.findUnique({
            where: { id: dto.classId },
        });
        if (!classExists) throw new NotFoundException('Class not found');

        // Check if assignment already exists
        const existing = await this.prisma.classTeacher.findUnique({
            where: {
                classId_teacherId: { classId: dto.classId, teacherId: dto.teacherId },
            },
        });
        if (existing) throw new BadRequestException('Teacher is already assigned to this class');

        // If setting as primary, unset any existing primary teacher
        if (dto.isPrimary) {
            await this.prisma.classTeacher.updateMany({
                where: { classId: dto.classId, isPrimary: true },
                data: { isPrimary: false },
            });
        }

        const assignment = await this.prisma.classTeacher.create({
            data: {
                classId: dto.classId,
                teacherId: dto.teacherId,
                isPrimary: dto.isPrimary || false,
                assignedBy: adminId,
            },
            include: {
                teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                class: {
                    include: {
                        course: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });

        await this.prisma.auditLog.create({
            data: {
                actorId: adminId,
                action: AuditAction.USER_UPDATE,
                targetId: dto.teacherId,
                metadata: { action: 'assign_teacher_to_class', classId: dto.classId } as any,
            },
        });

        this.logger.log(`Teacher ${dto.teacherId} assigned to class ${dto.classId} by ${adminId}`);
        return assignment;
    }

    async removeTeacherFromClass(assignmentId: string) {
        const assignment = await this.prisma.classTeacher.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) throw new NotFoundException('Assignment not found');

        await this.prisma.classTeacher.delete({
            where: { id: assignmentId },
        });

        this.logger.log(`Teacher ${assignment.teacherId} removed from class ${assignment.classId}`);
        return { deleted: true };
    }

    async getTeachersWithClasses() {
        const teachers = await this.prisma.user.findMany({
            where: {
                userRoles: { some: { role: { name: 'teacher' } } },
                status: 'active',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                classAssignments: {
                    include: {
                        class: {
                            include: {
                                course: { select: { id: true, name: true, code: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { lastName: 'asc' },
        });

        return teachers.map(t => ({
            ...t,
            classCount: t.classAssignments.length,
            classes: t.classAssignments.map(ca => ({
                assignmentId: ca.id,
                isPrimary: ca.isPrimary,
                assignedAt: ca.assignedAt,
                ...ca.class,
            })),
        }));
    }

    async getClassesWithTeachers() {
        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { id: true, name: true, code: true } },
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
            orderBy: { term: 'desc' },
        });

        return classes.map(c => ({
            ...c,
            studentCount: c._count.enrollments,
            teacherCount: c.teachers.length,
            teachers: c.teachers.map(t => ({
                assignmentId: t.id,
                isPrimary: t.isPrimary,
                assignedAt: t.assignedAt,
                ...t.teacher,
            })),
        }));
    }

    // ─── CLASS COMPOSITION ──────────────────────────────────────────

    async getClassComposition() {
        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { id: true, name: true, code: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
                enrollments: {
                    where: { status: 'active' },
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarUrl: true,
                                gradeLevel: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ term: 'desc' }, { course: { name: 'asc' } }],
        });

        return classes.map(c => ({
            id: c.id,
            name: c.course.name,
            code: c.course.code,
            section: c.section,
            term: c.term,
            teacher: c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : null,
            maxStudents: c.maxStudents,
            students: c.enrollments.map(e => ({
                id: e.student.id,
                firstName: e.student.firstName,
                lastName: e.student.lastName,
                email: e.student.email,
                avatarUrl: e.student.avatarUrl,
                gradeLevel: e.student.gradeLevel,
                enrollmentId: e.id,
            })),
        }));
    }

    async getUnassignedStudents(term?: string) {
        // Get all student user IDs
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole) return [];

        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
                // Not enrolled in any active class
                enrollments: {
                    none: { status: 'active' },
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                gradeLevel: true,
            },
            orderBy: [{ gradeLevel: 'asc' }, { lastName: 'asc' }],
        });

        return students;
    }

    async enrollStudent(classId: string, studentId: string) {
        // Check if already enrolled
        const existing = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (existing) {
            if (existing.status === 'active') {
                throw new BadRequestException('Student is already enrolled in this class');
            }
            // Re-activate if dropped
            return this.prisma.classEnrollment.update({
                where: { id: existing.id },
                data: { status: 'active' },
            });
        }

        return this.prisma.classEnrollment.create({
            data: { classId, studentId, status: 'active' },
        });
    }

    async unenrollStudent(classId: string, studentId: string) {
        const enrollment = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (!enrollment) throw new NotFoundException('Enrollment not found');

        return this.prisma.classEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'dropped' },
        });
    }

    // ─── ACADEMIC YEAR ──────────────────────────────────────────────

    async getAcademicYears() {
        return this.prisma.academicYear.findMany({
            orderBy: { startDate: 'desc' },
        });
    }

    async createAcademicYear(data: { name: string; startDate: string; endDate: string }) {
        return this.prisma.academicYear.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isCurrent: false,
            },
        });
    }

    async setCurrentAcademicYear(yearId: string) {
        // Unset all current
        await this.prisma.academicYear.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });
        // Set the new one
        return this.prisma.academicYear.update({
            where: { id: yearId },
            data: { isCurrent: true },
        });
    }

    // ─── GRADE PROMOTION ────────────────────────────────────────────

    async getPromotionPreview() {
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole) return { grades: [], total: 0 };

        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
            },
            select: { id: true, gradeLevel: true, firstName: true, lastName: true },
        });

        // Group by grade level
        const gradeMap: Record<string, number> = {};
        let noGrade = 0;
        for (const s of students) {
            if (!s.gradeLevel) {
                noGrade++;
                continue;
            }
            gradeMap[s.gradeLevel] = (gradeMap[s.gradeLevel] || 0) + 1;
        }

        const grades = Object.entries(gradeMap)
            .map(([grade, count]) => {
                const num = parseInt(grade.replace(/\D/g, ''), 10);
                const nextGrade = num >= 12 ? 'Graduated' : `Grade ${num + 1}`;
                return { currentGrade: grade, nextGrade, count, willGraduate: num >= 12 };
            })
            .sort((a, b) => {
                const aNum = parseInt(a.currentGrade.replace(/\D/g, ''), 10) || 0;
                const bNum = parseInt(b.currentGrade.replace(/\D/g, ''), 10) || 0;
                return aNum - bNum;
            });

        return { grades, noGrade, total: students.length };
    }

    async promoteAllStudents(actorId: string) {
        const studentRole = await this.prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole) throw new NotFoundException('Student role not found');

        const students = await this.prisma.user.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                userRoles: { some: { roleId: studentRole.id } },
                gradeLevel: { not: null },
            },
            select: { id: true, gradeLevel: true },
        });

        let promoted = 0;
        let graduated = 0;

        for (const s of students) {
            const num = parseInt(s.gradeLevel!.replace(/\D/g, ''), 10);
            if (isNaN(num)) continue;

            if (num >= 12) {
                await this.prisma.user.update({
                    where: { id: s.id },
                    data: { gradeLevel: 'Graduated', status: 'archived' },
                });
                graduated++;
            } else {
                await this.prisma.user.update({
                    where: { id: s.id },
                    data: { gradeLevel: `Grade ${num + 1}` },
                });
                promoted++;
            }
        }

        // Archive all current enrollments
        await this.prisma.classEnrollment.updateMany({
            where: { status: 'active' },
            data: { status: 'completed' },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                actorId,
                action: 'promote_students',
                metadata: { promoted, graduated, total: students.length } as any,
            },
        });

        this.logger.log(`Grade promotion by ${actorId}: ${promoted} promoted, ${graduated} graduated`);
        return { promoted, graduated, total: students.length };
    }
}
