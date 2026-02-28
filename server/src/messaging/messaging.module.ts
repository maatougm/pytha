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
import {
    MessageHandler,
    ReactionHandler,
    TypingHandler,
    ChannelHandler,
} from './handlers';

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
        // Services
        MessagingService,
        TypingService,
        ChannelManagementService,
        MessagingEnhancedService,
        // Gateway
        MessagingGateway,
        // WebSocket Handlers
        MessageHandler,
        ReactionHandler,
        TypingHandler,
        ChannelHandler,
    ],
    exports: [
        MessagingService,
        MessagingGateway,
        TypingService,
        ChannelManagementService,
        MessagingEnhancedService,
        // Export handlers in case they're needed by other modules
        MessageHandler,
        ReactionHandler,
        TypingHandler,
        ChannelHandler,
    ],
})
export class MessagingModule { }
