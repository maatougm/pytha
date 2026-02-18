import { Module } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { MentionsController } from './mentions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MentionsController],
    providers: [MentionsService],
    exports: [MentionsService],
})
export class MentionsModule { }
