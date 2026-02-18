import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import {
  TimeRangeQueryDto,
  ExportQueryDto,
  TimeRange,
  ExportFormat,
  DashboardStatsDto,
  UserActivityResponseDto,
  MessageStatsResponseDto,
  ChannelStatsDto,
  FileStorageStatsDto,
  EngagementMetricsDto,
} from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// Role is passed as string: 'admin', 'teacher', 'parent', 'student'

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('admin')
  @ApiOperation({ summary: 'Get overall system dashboard statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.analyticsService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user activity statistics over time' })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range for analytics',
    enum: TimeRange,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activity statistics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getUserActivity(
    @Query() query: TimeRangeQueryDto,
  ): Promise<UserActivityResponseDto> {
    return this.analyticsService.getUserActivity(query.range || TimeRange.THIRTY_DAYS);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get message statistics over time' })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Time range for analytics',
    enum: TimeRange,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message statistics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMessageStats(
    @Query() query: TimeRangeQueryDto,
  ): Promise<MessageStatsResponseDto> {
    return this.analyticsService.getMessageStats(query.range || TimeRange.THIRTY_DAYS);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get channel statistics and popular channels' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Channel statistics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getChannelStats(): Promise<ChannelStatsDto> {
    return this.analyticsService.getChannelStats();
  }

  @Get('files')
  @ApiOperation({ summary: 'Get file storage statistics by user and role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File storage statistics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getFileStorageStats(): Promise<FileStorageStatsDto> {
    return this.analyticsService.getFileStorageStats();
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Get user engagement metrics (DAU, WAU, MAU, retention)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getEngagementMetrics(): Promise<EngagementMetricsDto> {
    return this.analyticsService.getEngagementMetrics();
  }

  @Get('export')
  @Roles('admin')
  @ApiOperation({ summary: 'Export analytics data as CSV or PDF (Admin only)' })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'Type of data to export',
    enum: ['users', 'messages', 'grades'],
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format',
    enum: ['csv', 'pdf'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data exported successfully',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async exportReport(
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.analyticsService.exportReport(query.type, (query.format || 'csv') as ExportFormat);

    const filename = `analytics-${query.type}-export.${query.format}`;
    const contentType = query.format === 'csv' 
      ? 'text/csv' 
      : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check analytics service health and cache status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics service is healthy',
    type: Object,
  })
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
