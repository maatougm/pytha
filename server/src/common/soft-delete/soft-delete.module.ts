import { Module } from '@nestjs/common';
import { SoftDeleteService } from './soft-delete.service';
import { SoftDeleteController } from './soft-delete.controller';
import { SoftDeleteCleanupService } from './soft-delete-cleanup.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [SoftDeleteService, SoftDeleteCleanupService],
    controllers: [SoftDeleteController],
    exports: [SoftDeleteService, SoftDeleteCleanupService],
})
export class SoftDeleteModule {}
