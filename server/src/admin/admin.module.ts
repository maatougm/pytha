import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGateway } from './admin.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [PrismaModule, ScheduleModule.forRoot(), JwtModule.register({})],
    controllers: [AdminController],
    providers: [AdminService, AdminGateway],
    exports: [AdminService],
})
export class AdminModule { }
