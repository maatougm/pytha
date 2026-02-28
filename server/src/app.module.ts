import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MessagingModule } from './messaging/messaging.module';
import { ModerationModule } from './moderation/moderation.module';
import { CoursesModule } from './courses/courses.module';
import { GradingModule } from './grading/grading.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MentionsModule } from './mentions/mentions.module';
import { RedisModule } from './redis/redis.module';
import { SoftDeleteModule } from './common/soft-delete/soft-delete.module';
import { UpdateModule } from './update/update.module';
import { MetricsModule } from './metrics/metrics.module';
import { PaymentsModule } from './payments/payments.module';
import { ParentModule } from './parent/parent.module';
import { ConferencesModule } from './conferences/conferences.module';
import { ReportCardsModule } from './report-cards/report-cards.module';
import { winstonConfig } from './common/logger/winston.config';

@Module({
    imports: [
        WinstonModule.forRoot(winstonConfig),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../.env'],
            validate: (config) => {
                // Ensure required environment variables are set
                if (!config.JWT_SECRET) {
                    throw new Error('JWT_SECRET environment variable is required');
                }
                if (!config.DATABASE_URL) {
                    throw new Error('DATABASE_URL environment variable is required');
                }
                return config;
            },
        }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        RedisModule,
        PrismaModule,
        AuthModule,
        UsersModule,
        MessagingModule,
        ModerationModule,
        CoursesModule,
        GradingModule,
        AttendanceModule,
        FilesModule,
        HealthModule,
        AdminModule,
        AnalyticsModule,
        NotificationsModule,
        MentionsModule,
        SoftDeleteModule,
        UpdateModule,
        MetricsModule,
        PaymentsModule,
        ParentModule,
        ConferencesModule,
        ReportCardsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
