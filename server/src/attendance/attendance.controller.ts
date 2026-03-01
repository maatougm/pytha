import {
    Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
    CreateAttendanceSessionDto,
    MarkAttendanceDto,
    BulkAttendanceDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    // ─── SESSIONS ────────────────────────────────────────────

    @Post('classes/:classId/attendance')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    createSession(
        @Param('classId') classId: string,
        @Body() dto: CreateAttendanceSessionDto,
        @Request() req,
    ) {
        return this.attendanceService.createSession(classId, req.user.sub, dto);
    }

    @Get('classes/:classId/attendance')
    getClassSessions(
        @Param('classId') classId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.attendanceService.getClassSessions(classId, startDate, endDate);
    }

    @Get('attendance/sessions/:sessionId')
    getSession(@Param('sessionId') sessionId: string) {
        return this.attendanceService.getSession(sessionId);
    }

    // ─── MARKING ─────────────────────────────────────────────

    @Put('attendance/:sessionId/students/:studentId')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    markAttendance(
        @Param('sessionId') sessionId: string,
        @Param('studentId') studentId: string,
        @Body() dto: MarkAttendanceDto,
        @Request() req,
    ) {
        return this.attendanceService.markAttendance(sessionId, studentId, req.user.sub, dto);
    }

    @Post('classes/:classId/attendance/bulk')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    bulkMarkAttendance(
        @Param('classId') classId: string,
        @Body() dto: BulkAttendanceDto,
        @Request() req,
    ) {
        return this.attendanceService.bulkMarkAttendance(classId, req.user.sub, dto);
    }

    // ─── HISTORY & REPORTS ───────────────────────────────────

    @Get('students/:studentId/attendance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher', 'parent')
    getStudentAttendance(
        @Param('studentId') studentId: string,
        @Query('classId') classId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.attendanceService.getStudentAttendance(studentId, classId, startDate, endDate);
    }

    @Get('attendance/my')
    getMyAttendance(
        @Request() req,
        @Query('classId') classId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.attendanceService.getStudentAttendance(req.user.sub, classId, startDate, endDate);
    }

    @Get('classes/:classId/attendance/weekly')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    getWeeklyAttendance(
        @Param('classId') classId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.attendanceService.getClassWeeklyAttendance(classId, startDate, endDate);
    }

    @Get('classes/:classId/attendance/summary')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    getClassSummary(
        @Param('classId') classId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.attendanceService.getClassAttendanceSummary(classId, startDate, endDate);
    }

    @Get('attendance/reports')
    @UseGuards(RolesGuard)
    @Roles('admin')
    getReports(
        @Query('classId') classId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.attendanceService.getAttendanceReport({ classId, startDate, endDate });
    }
}
