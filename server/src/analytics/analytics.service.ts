import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TimeRange,
  ExportFormat,
  ExportType,
  DashboardStatsDto,
  UserActivityResponseDto,
  MessageStatsResponseDto,
  ChannelStatsDto,
  FileStorageStatsDto,
  EngagementMetricsDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'analytics:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // Cache key helpers
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(this.getCacheKey(key));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCached(key: string, data: unknown): Promise<void> {
    try {
      await this.redis.set(
        this.getCacheKey(key),
        JSON.stringify(data),
        this.CACHE_TTL,
      );
    } catch (error) {
      this.logger.warn(`Failed to cache analytics data: ${error.message}`);
    }
  }

  // Date range helper
  private getDateRange(range: TimeRange): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    const days = range === TimeRange.SEVEN_DAYS ? 7 : range === TimeRange.THIRTY_DAYS ? 30 : 90;
    start.setDate(start.getDate() - days);
    return { start, end };
  }

  // =====================
  // Dashboard Stats
  // =====================
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const cacheKey = 'dashboard';
    const cached = await this.getCached<DashboardStatsDto>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      usersByRole,
      totalMessages,
      messagesToday,
      totalChannels,
      activeChannels,
      totalFiles,
      totalStorage,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      pendingReports,
      averageGrade,
      attendanceRate,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.getUsersByRole(),
      this.prisma.message.count({ where: { isDeleted: false } }),
      this.getMessagesToday(),
      this.prisma.channel.count({ where: { deletedAt: null } }),
      this.prisma.channel.count({ where: { deletedAt: null, isArchived: false } }),
      this.prisma.file.count({ where: { isDeleted: false } }),
      this.getTotalStorage(),
      this.getNewUsersCount(7),
      this.getNewUsersCount(30),
      this.getActiveUsersToday(),
      this.prisma.channelReport.count({ where: { status: 'pending' } }),
      this.getAverageGrade(),
      this.getAttendanceRate(),
    ]);

    const stats: DashboardStatsDto = {
      totalUsers,
      usersByRole,
      totalMessages,
      messagesToday,
      totalChannels,
      activeChannels,
      totalFiles,
      totalStorageUsed: totalStorage,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      pendingReports,
      averageGrade,
      attendanceRate,
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, stats);
    return stats;
  }

  private async getUsersByRole(): Promise<{ role: string; count: number }[]> {
    const result = await this.prisma.$queryRaw`
      SELECT r.name as role, COUNT(*)::int as count
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN users u ON ur.user_id = u.id
      WHERE u.deleted_at IS NULL
      GROUP BY r.name
    `;
    return result as { role: string; count: number }[];
  }

  private async getMessagesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.message.count({
      where: { createdAt: { gte: today }, isDeleted: false },
    });
  }

  private async getTotalStorage(): Promise<number> {
    const result = await this.prisma.file.aggregate({
      where: { isDeleted: false },
      _sum: { size: true },
    });
    return result._sum.size || 0;
  }

  private async getNewUsersCount(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.prisma.user.count({
      where: { createdAt: { gte: date }, deletedAt: null },
    });
  }

  private async getActiveUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.user.count({
      where: { lastLoginAt: { gte: today }, deletedAt: null },
    });
  }

  private async getAverageGrade(): Promise<number | null> {
    const result = await this.prisma.grade.aggregate({
      _avg: { score: true },
    });
    return result._avg.score ? Math.round(result._avg.score * 100) / 100 : null;
  }

  private async getAttendanceRate(): Promise<number | null> {
    const records = await this.prisma.attendanceRecord.findMany({
      select: { status: true },
    });
    if (records.length === 0) return null;
    const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((present / records.length) * 10000) / 100;
  }

  // =====================
  // User Activity
  // =====================
  async getUserActivity(timeRange: TimeRange): Promise<UserActivityResponseDto> {
    const cacheKey = `user-activity:${timeRange}`;
    const cached = await this.getCached<UserActivityResponseDto>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getDateRange(timeRange);
    const days = timeRange === TimeRange.SEVEN_DAYS ? 7 : timeRange === TimeRange.THIRTY_DAYS ? 30 : 90;

    // Generate daily data
    const data = await Promise.all(
      Array.from({ length: days }, async (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [activeUsers, newUsers, logins] = await Promise.all([
          this.prisma.user.count({
            where: {
              lastLoginAt: {
                gte: date,
                lt: nextDate,
              },
              deletedAt: null,
            },
          }),
          this.prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDate,
              },
              deletedAt: null,
            },
          }),
          this.prisma.auditLog.count({
            where: {
              action: 'login',
              createdAt: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
        ]);

        return {
          date: date.toISOString().split('T')[0],
          activeUsers,
          newUsers,
          logins,
        };
      }),
    );

    const result: UserActivityResponseDto = {
      timeRange,
      data,
      summary: {
        totalActiveUsers: data.reduce((sum, d) => sum + d.activeUsers, 0),
        totalNewUsers: data.reduce((sum, d) => sum + d.newUsers, 0),
        averageDailyActive: Math.round((data.reduce((sum, d) => sum + d.activeUsers, 0) / days) * 100) / 100,
      },
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, result);
    return result;
  }

  // =====================
  // Message Stats
  // =====================
  async getMessageStats(timeRange: TimeRange): Promise<MessageStatsResponseDto> {
    const cacheKey = `message-stats:${timeRange}`;
    const cached = await this.getCached<MessageStatsResponseDto>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.getDateRange(timeRange);
    const days = timeRange === TimeRange.SEVEN_DAYS ? 7 : timeRange === TimeRange.THIRTY_DAYS ? 30 : 90;

    // Daily stats
    const dailyStats = await Promise.all(
      Array.from({ length: days }, async (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const count = await this.prisma.message.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
            isDeleted: false,
          },
        });

        return {
          date: date.toISOString().split('T')[0],
          count,
        };
      }),
    );

    // Messages by channel type
    const byChannelType = await this.prisma.$queryRaw`
      SELECT c.type, COUNT(*)::int as count
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      WHERE m.is_deleted = false
      AND m.created_at >= ${start}
      GROUP BY c.type
    `;

    const totalMessages = dailyStats.reduce((sum, d) => sum + d.count, 0);

    const result: MessageStatsResponseDto = {
      timeRange,
      dailyStats,
      byChannelType: byChannelType as { type: string; count: number }[],
      totalMessages,
      averagePerDay: Math.round((totalMessages / days) * 100) / 100,
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, result);
    return result;
  }

  // =====================
  // Channel Stats
  // =====================
  async getChannelStats(): Promise<ChannelStatsDto> {
    const cacheKey = 'channels';
    const cached = await this.getCached<ChannelStatsDto>(cacheKey);
    if (cached) return cached;

    const [
      totalChannels,
      channelsByType,
      mostActiveChannels,
      newChannelsThisMonth,
      archivedChannels,
    ] = await Promise.all([
      this.prisma.channel.count({ where: { deletedAt: null } }),
      this.getChannelsByType(),
      this.getMostActiveChannels(),
      this.getNewChannelsCount(30),
      this.prisma.channel.count({ where: { deletedAt: null, isArchived: true } }),
    ]);

    const stats: ChannelStatsDto = {
      totalChannels,
      channelsByType,
      mostActiveChannels: (mostActiveChannels as unknown as any[]).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        messageCount: c.message_count,
        memberCount: c.member_count,
      })),
      newChannelsThisMonth,
      archivedChannels,
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, stats);
    return stats;
  }

  private async getChannelsByType(): Promise<{ type: string; count: number }[]> {
    const result = await this.prisma.channel.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _count: { id: true },
    });
    return result.map(r => ({ type: r.type, count: r._count.id }));
  }

  private async getMostActiveChannels() {
    const channels = await this.prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.type,
        COUNT(m.id)::int as message_count,
        COUNT(DISTINCT cm.user_id)::int as member_count
      FROM channels c
      LEFT JOIN messages m ON c.id = m.channel_id AND m.is_deleted = false
      LEFT JOIN channel_members cm ON c.id = cm.channel_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.type
      ORDER BY message_count DESC
      LIMIT 10
    `;
    return channels as {
      id: string;
      name: string | null;
      type: string;
      message_count: number;
      member_count: number;
    }[];
  }

  private async getNewChannelsCount(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.prisma.channel.count({
      where: { createdAt: { gte: date }, deletedAt: null },
    });
  }

  // =====================
  // File Storage Stats
  // =====================
  async getFileStorageStats(): Promise<FileStorageStatsDto> {
    const cacheKey = 'files';
    const cached = await this.getCached<FileStorageStatsDto>(cacheKey);
    if (cached) return cached;

    const [
      totalFiles,
      totalStorage,
      storageByCategory,
      storageByRole,
      topUploaders,
      recentUploads,
      deletedFiles,
    ] = await Promise.all([
      this.prisma.file.count({ where: { isDeleted: false } }),
      this.getTotalStorage(),
      this.getStorageByCategory(),
      this.getStorageByRole(),
      this.getTopUploaders(),
      this.getRecentUploadsCount(),
      this.prisma.file.count({ where: { isDeleted: true } }),
    ]);

    const stats: FileStorageStatsDto = {
      totalFiles,
      totalStorageUsed: totalStorage,
      storageByCategory,
      storageByRole,
      topUploaders,
      recentUploads,
      deletedFiles,
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, stats);
    return stats;
  }

  private async getStorageByCategory(): Promise<{ category: string; size: number; count: number }[]> {
    const result = await this.prisma.file.groupBy({
      by: ['category'],
      where: { isDeleted: false },
      _sum: { size: true },
      _count: { id: true },
    });
    return result.map(r => ({
      category: r.category,
      size: r._sum.size || 0,
      count: r._count.id,
    }));
  }

  private async getStorageByRole(): Promise<{ role: string; size: number; count: number }[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        r.name as role,
        COALESCE(SUM(f.size), 0)::bigint as size,
        COUNT(f.id)::int as count
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN files f ON u.id = f.uploader_id AND f.is_deleted = false
      WHERE u.deleted_at IS NULL
      GROUP BY r.name
    `;
    return (result as { role: string; size: bigint; count: number }[]).map(r => ({
      role: r.role,
      size: Number(r.size),
      count: r.count,
    }));
  }

  private async getTopUploaders(): Promise<{ userId: string; name: string; fileCount: number; totalSize: number }[]> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(f.id)::int as file_count,
        COALESCE(SUM(f.size), 0)::bigint as total_size
      FROM users u
      JOIN files f ON u.id = f.uploader_id
      WHERE f.is_deleted = false
      AND u.deleted_at IS NULL
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY file_count DESC
      LIMIT 10
    `;
    return (result as { user_id: string; name: string; file_count: number; total_size: bigint }[]).map(r => ({
      userId: r.user_id,
      name: r.name,
      fileCount: r.file_count,
      totalSize: Number(r.total_size),
    }));
  }

  private async getRecentUploadsCount(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.prisma.file.count({
      where: { createdAt: { gte: sevenDaysAgo }, isDeleted: false },
    });
  }

  // =====================
  // Engagement Metrics
  // =====================
  async getEngagementMetrics(): Promise<EngagementMetricsDto> {
    const cacheKey = 'engagement';
    const cached = await this.getCached<EngagementMetricsDto>(cacheKey);
    if (cached) return cached;

    const [
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      userRetention,
      messagesPerUser,
      channelsPerUser,
      peakActivityTime,
    ] = await Promise.all([
      this.getDAU(),
      this.getWAU(),
      this.getMAU(),
      this.getUserRetention(),
      this.getMessagesPerUser(),
      this.getChannelsPerUser(),
      this.getPeakActivityTime(),
    ]);

    const metrics: EngagementMetricsDto = {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      userRetention,
      averageSessionDuration: null, // Would need session tracking
      messagesPerUser,
      channelsPerUser,
      peakActivityTime,
      generatedAt: new Date(),
    };

    await this.setCached(cacheKey, metrics);
    return metrics;
  }

  private async getDAU(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.user.count({
      where: { lastLoginAt: { gte: today }, deletedAt: null },
    });
  }

  private async getWAU(): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.prisma.user.count({
      where: { lastLoginAt: { gte: weekAgo }, deletedAt: null },
    });
  }

  private async getMAU(): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return this.prisma.user.count({
      where: { lastLoginAt: { gte: monthAgo }, deletedAt: null },
    });
  }

  private async getUserRetention(): Promise<{ day1: number; day7: number; day30: number }> {
    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, active1d, active7d, active30d] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: day1 }, deletedAt: null } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: day7 }, deletedAt: null } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: day30 }, deletedAt: null } }),
    ]);

    return {
      day1: totalUsers > 0 ? Math.round((active1d / totalUsers) * 10000) / 100 : 0,
      day7: totalUsers > 0 ? Math.round((active7d / totalUsers) * 10000) / 100 : 0,
      day30: totalUsers > 0 ? Math.round((active30d / totalUsers) * 10000) / 100 : 0,
    };
  }

  private async getMessagesPerUser(): Promise<number> {
    const [totalMessages, totalUsers] = await Promise.all([
      this.prisma.message.count({ where: { isDeleted: false } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return totalUsers > 0 ? Math.round((totalMessages / totalUsers) * 100) / 100 : 0;
  }

  private async getChannelsPerUser(): Promise<number> {
    const [totalMembers, totalUsers] = await Promise.all([
      this.prisma.channelMember.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return totalUsers > 0 ? Math.round((totalMembers / totalUsers) * 100) / 100 : 0;
  }

  private async getPeakActivityTime(): Promise<string | null> {
    const result = await this.prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*)::int as count
      FROM messages
      WHERE is_deleted = false
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `;
    const row = (result as { hour: number; count: number }[])[0];
    if (!row) return null;
    return `${String(row.hour).padStart(2, '0')}:00`;
  }

  // =====================
  // Export Report
  // =====================
  async exportReport(type: ExportType, format: ExportFormat): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.${format}`;

    let data: unknown[] = [];

    switch (type) {
      case ExportType.USERS:
        data = await this.exportUsersData();
        break;
      case ExportType.MESSAGES:
        data = await this.exportMessagesData();
        break;
      case ExportType.GRADES:
        data = await this.exportGradesData();
        break;
    }

    if (format === ExportFormat.CSV) {
      return this.convertToCSV(data);
    }

    // For PDF, return JSON data with metadata (actual PDF generation would require additional library)
    return JSON.stringify({
      filename,
      generatedAt: new Date(),
      recordCount: data.length,
      data,
    }, null, 2);
  }

  private async exportUsersData(): Promise<unknown[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    });
  }

  private async exportMessagesData(): Promise<unknown[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.prisma.message.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, isDeleted: false },
      select: {
        id: true,
        content: true,
        contentType: true,
        createdAt: true,
        channel: { select: { name: true, type: true } },
        sender: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  private async exportGradesData(): Promise<unknown[]> {
    return this.prisma.grade.findMany({
      select: {
        id: true,
        score: true,
        maxScore: true,
        letterGrade: true,
        feedback: true,
        gradedAt: true,
        assignment: { select: { title: true } },
        student: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  private convertToCSV(data: unknown[]): string {
    if (data.length === 0) return '';

    const flattenObject = (obj: unknown, prefix = ''): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj || {})) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          result[newKey] = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join('; ');
        } else {
          result[newKey] = value;
        }
      }
      return result;
    };

    const flattened = data.map(item => flattenObject(item));
    const headers = Object.keys(flattened[0]);
    const csvRows = [
      headers.join(','),
      ...flattened.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const str = String(value).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(','),
      ),
    ];
    return csvRows.join('\n');
  }

  // =====================
  // Scheduled Cache Updates
  // =====================
  @Cron(CronExpression.EVERY_HOUR)
  async refreshAnalyticsCache(): Promise<void> {
    this.logger.log('Refreshing analytics cache...');
    const startTime = Date.now();

    try {
      await Promise.all([
        this.getDashboardStats(),
        this.getUserActivity(TimeRange.SEVEN_DAYS),
        this.getUserActivity(TimeRange.THIRTY_DAYS),
        this.getUserActivity(TimeRange.NINETY_DAYS),
        this.getMessageStats(TimeRange.SEVEN_DAYS),
        this.getMessageStats(TimeRange.THIRTY_DAYS),
        this.getMessageStats(TimeRange.NINETY_DAYS),
        this.getChannelStats(),
        this.getFileStorageStats(),
        this.getEngagementMetrics(),
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(`Analytics cache refreshed successfully in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Failed to refresh analytics cache: ${error.message}`, error.stack);
    }
  }
}
