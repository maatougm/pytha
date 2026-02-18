import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { QueueProcessor } from './queue.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
    ],
    providers: [EmailService, QueueProcessor],
    exports: [EmailService, QueueProcessor],
})
export class NotificationsModule { }
