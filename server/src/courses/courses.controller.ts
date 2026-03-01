import {
    Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import {
    CreateCourseDto, UpdateCourseDto,
    CreateClassDto, UpdateClassDto,
    EnrollStudentDto, BulkEnrollDto,
    AddSchedulesDto,
} from './dto/courses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const MAX_PAGE_SIZE = 100;

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
    constructor(private coursesService: CoursesService) { }

    // ─── COURSES ─────────────────────────────────────────────

    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Create a new course' })
    createCourse(@Body() dto: CreateCourseDto) {
        return this.coursesService.createCourse(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all courses' })
    @ApiQuery({ name: 'department', required: false })
    @ApiQuery({ name: 'active', required: false, type: Boolean })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAllCourses(
        @Query('department') department?: string,
        @Query('active') active?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.findAllCourses({
            department,
            isActive: active !== undefined ? active === 'true' : undefined,
            search,
        }, page ? parseInt(page) : 1, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get course by ID' })
    findCourse(@Param('id') id: string) {
        return this.coursesService.findCourseById(id);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Update course' })
    updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
        return this.coursesService.updateCourse(id, dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete course' })
    deleteCourse(@Param('id') id: string) {
        return this.coursesService.deleteCourse(id);
    }
}

// ─── Classes Controller ──────────────────────────────────────

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
    constructor(private coursesService: CoursesService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Create a new class' })
    createClass(@Body() dto: CreateClassDto) {
        return this.coursesService.createClass(dto);
    }

    @Get('admin/summary')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Get classes summary for admin' })
    getAdminClasses() {
        return this.coursesService.getAdminClasses();
    }

    @Get()
    @ApiOperation({ summary: 'Get all classes' })
    @ApiQuery({ name: 'term', required: false })
    @ApiQuery({ name: 'teacherId', required: false })
    @ApiQuery({ name: 'courseId', required: false })
    @ApiQuery({ name: 'studentId', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAllClasses(
        @Query('term') term?: string,
        @Query('teacherId') teacherId?: string,
        @Query('courseId') courseId?: string,
        @Query('studentId') studentId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.findAllClasses(
            { term, teacherId, courseId, studentId },
            page ? parseInt(page) : 1,
            limitNum,
        );
    }

    @Get('my')
    @ApiOperation({ summary: 'Get current user\'s classes' })
    @ApiQuery({ name: 'term', required: false })
    getMyClasses(@Request() req, @Query('term') term?: string) {
        const roles = req.user.roles || [];
        if (roles.includes('teacher')) {
            return this.coursesService.getTeacherClasses(req.user.sub, term);
        }
        return this.coursesService.getStudentClasses(req.user.sub, term);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get class by ID' })
    findClass(@Param('id') id: string) {
        return this.coursesService.findClassById(id);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Update class' })
    updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) {
        return this.coursesService.updateClass(id, dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete class' })
    deleteClass(@Param('id') id: string) {
        return this.coursesService.deleteClass(id);
    }

    // ─── ENROLLMENT ──────────────────────────────────────────

    @Post(':id/enroll')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Enroll a student' })
    enrollStudent(@Param('id') classId: string, @Body() dto: EnrollStudentDto) {
        return this.coursesService.enrollStudent(classId, dto);
    }

    @Post(':id/enroll/bulk')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Bulk enroll students' })
    bulkEnroll(@Param('id') classId: string, @Body() dto: BulkEnrollDto) {
        return this.coursesService.bulkEnroll(classId, dto.studentIds);
    }

    @Delete(':id/students/:studentId')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Drop a student' })
    dropStudent(@Param('id') classId: string, @Param('studentId') studentId: string) {
        return this.coursesService.dropStudent(classId, studentId);
    }

    @Get(':id/roster')
    @ApiOperation({ summary: 'Get class roster' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getRoster(
        @Param('id') classId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = Math.min(limit ? parseInt(limit) : 20, MAX_PAGE_SIZE);
        return this.coursesService.getClassRoster(
            classId,
            page ? parseInt(page) : 1,
            limitNum,
        );
    }

    // ─── SCHEDULES ───────────────────────────────────────────

    @Post(':id/schedules')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Add schedules to class' })
    addSchedules(@Param('id') classId: string, @Body() dto: AddSchedulesDto) {
        return this.coursesService.addSchedules(classId, dto.schedules);
    }

    @Get(':id/schedules')
    @ApiOperation({ summary: 'Get class schedules' })
    getSchedules(@Param('id') classId: string) {
        return this.coursesService.getSchedules(classId);
    }

    @Delete('schedules/:scheduleId')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Delete schedule' })
    deleteSchedule(@Param('scheduleId') scheduleId: string) {
        return this.coursesService.deleteSchedule(scheduleId);
    }
}
