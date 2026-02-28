import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { QueueProcessor } from './queue.processor';
import { PushNotificationService } from './push.service';
import { PushNotificationController } from './push.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [PushNotificationController],
  providers: [EmailService, QueueProcessor, PushNotificationService],
  exports: [EmailService, QueueProcessor, PushNotificationService],
})
export class NotificationsModule {}
