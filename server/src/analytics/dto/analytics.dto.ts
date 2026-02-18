import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export enum TimeRange {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export enum ExportType {
  USERS = 'users',
  MESSAGES = 'messages',
  GRADES = 'grades',
}

export class TimeRangeQueryDto {
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange = TimeRange.THIRTY_DAYS;
}

export class ExportQueryDto {
  @IsEnum(ExportType)
  type: ExportType;

  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserActivityQueryDto {
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange = TimeRange.THIRTY_DAYS;

  @IsOptional()
  @IsString()
  role?: string;
}

export class MessageStatsQueryDto {
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange = TimeRange.THIRTY_DAYS;

  @IsOptional()
  @IsString()
  channelId?: string;
}

// Response DTOs
export interface DashboardStatsDto {
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalMessages: number;
  messagesToday: number;
  totalChannels: number;
  activeChannels: number;
  totalFiles: number;
  totalStorageUsed: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  pendingReports: number;
  averageGrade: number | null;
  attendanceRate: number | null;
  generatedAt: Date;
}

export interface UserActivityDataDto {
  date: string;
  activeUsers: number;
  newUsers: number;
  logins: number;
}

export interface UserActivityResponseDto {
  timeRange: string;
  data: UserActivityDataDto[];
  summary: {
    totalActiveUsers: number;
    totalNewUsers: number;
    averageDailyActive: number;
  };
  generatedAt: Date;
}

export interface MessageStatsDataDto {
  date: string;
  count: number;
  channelType?: string;
}

export interface MessageStatsResponseDto {
  timeRange: string;
  dailyStats: MessageStatsDataDto[];
  byChannelType: { type: string; count: number }[];
  totalMessages: number;
  averagePerDay: number;
  generatedAt: Date;
}

export interface ChannelStatsDto {
  totalChannels: number;
  channelsByType: { type: string; count: number }[];
  mostActiveChannels: {
    id: string;
    name: string | null;
    type: string;
    messageCount: number;
    memberCount: number;
  }[];
  newChannelsThisMonth: number;
  archivedChannels: number;
  generatedAt: Date;
}

export interface FileStorageStatsDto {
  totalFiles: number;
  totalStorageUsed: number;
  storageByCategory: { category: string; size: number; count: number }[];
  storageByRole: { role: string; size: number; count: number }[];
  topUploaders: {
    userId: string;
    name: string;
    fileCount: number;
    totalSize: number;
  }[];
  recentUploads: number;
  deletedFiles: number;
  generatedAt: Date;
}

export interface EngagementMetricsDto {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  averageSessionDuration: number | null;
  messagesPerUser: number;
  channelsPerUser: number;
  peakActivityTime: string | null;
  generatedAt: Date;
}
