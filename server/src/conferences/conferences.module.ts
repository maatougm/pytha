import { Module } from '@nestjs/common';
import { ConferencesController } from './conferences.controller';
import { ConferencesService } from './conferences.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConferencesController],
  providers: [ConferencesService],
  exports: [ConferencesService],
})
export class ConferencesModule {}
