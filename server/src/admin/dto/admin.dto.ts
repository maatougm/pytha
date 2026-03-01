import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsInt, Min, Max, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export enum TimeRange {
    TODAY = 'today',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
    YEAR = 'year',
}

export enum UserStatusAction {
    ACTIVATE = 'activate',
    SUSPEND = 'suspend',
    ARCHIVE = 'archive',
    DELETE = 'delete',
}

// ─── Dashboard Statistics DTOs ─────────────────────────────────────

export class DashboardStatsQueryDto {
    @IsOptional()
    @IsEnum(TimeRange)
    range?: TimeRange = TimeRange.WEEK;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class UserManagementQueryDto {
    @IsOptional()
    @IsString()
    @SanitizePlainText()
    search?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    role?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    status?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class UpdateUserStatusDto {
    @IsEnum(UserStatusAction)
    action: UserStatusAction;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}

export class BulkActionDto {
    @IsEnum(UserStatusAction)
    action: UserStatusAction;

    @IsArray()
    @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
    userIds: string[];

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}

export class SystemSettingsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    maxFileSize?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxMessageLength?: number;

    @IsOptional()
    @IsBoolean()
    maintenanceMode?: boolean;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    maintenanceMessage?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    rateLimitRequests?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    rateLimitWindow?: number;
}

// ─── Response Interfaces (for Swagger documentation) ───────────────

export interface SystemMetrics {
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

export interface ActivityTimeline {
    labels: string[];
    datasets: {
        name: string;
        data: number[];
        color: string;
    }[];
}

export interface UserActivity {
    userId: string;
    email: string;
    name: string;
    role: string;
    lastActive: Date;
    messagesSent: number;
    loginsThisMonth: number;
    status: string;
}

export interface ModerationQueue {
    id: string;
    type: 'message' | 'file' | 'user';
    content: string;
    reason: string;
    reporter?: string;
    createdAt: Date;
    status: 'pending' | 'reviewed' | 'resolved';
}
