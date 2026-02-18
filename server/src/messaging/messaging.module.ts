import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { TypingService } from './typing.service';
import { ChannelManagementController } from './channel-management.controller';
import { ChannelManagementService } from './channel-management.service';
import { MessagingEnhancedService } from './messaging-enhanced.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MentionsModule } from '../mentions/mentions.module';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
            }),
            inject: [ConfigService],
        }),
        RedisModule,
        NotificationsModule,
        MentionsModule,
    ],
    controllers: [MessagingController, ChannelManagementController],
    providers: [
        MessagingService,
        MessagingGateway,
        TypingService,
        ChannelManagementService,
        MessagingEnhancedService,
    ],
    exports: [
        MessagingService,
        MessagingGateway,
        TypingService,
        ChannelManagementService,
        MessagingEnhancedService,
    ],
})
export class MessagingModule { }
