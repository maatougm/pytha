import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController, ClassesController } from './courses.controller';

@Module({
    controllers: [CoursesController, ClassesController],
    providers: [CoursesService],
    exports: [CoursesService],
})
export class CoursesModule { }
