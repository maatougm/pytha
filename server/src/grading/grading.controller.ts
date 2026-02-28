import {
    Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradingService } from './grading.service';
import {
    CreateAssignmentDto, UpdateAssignmentDto,
    CreateSubmissionDto,
    GradeSubmissionDto, BulkGradeDto,
} from './dto/grading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Grading')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class GradingController {
    constructor(private gradingService: GradingService) { }

    // ─── ASSIGNMENTS ─────────────────────────────────────────

    @Post('classes/:classId/assignments')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    createAssignment(
        @Param('classId') classId: string,
        @Body() dto: CreateAssignmentDto,
        @Request() req,
    ) {
        return this.gradingService.createAssignment(classId, req.user.sub, dto);
    }

    @Get('assignments/pending/count')
    getPendingAssignmentsCount(@Request() req) {
        return this.gradingService.getPendingAssignmentsCount(req.user.sub);
    }

    @Get('classes/:classId/assignments')
    getClassAssignments(
        @Param('classId') classId: string,
        @Query('type') type?: string,
    ) {
        return this.gradingService.getClassAssignments(classId, { type });
    }

    @Get('assignments/:id')
    getAssignment(@Param('id') id: string) {
        return this.gradingService.getAssignment(id);
    }

    @Put('assignments/:id')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    updateAssignment(
        @Param('id') id: string,
        @Body() dto: UpdateAssignmentDto,
        @Request() req,
    ) {
        return this.gradingService.updateAssignment(id, req.user.sub, dto);
    }

    @Delete('assignments/:id')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    deleteAssignment(@Param('id') id: string, @Request() req) {
        return this.gradingService.deleteAssignment(id, req.user.sub, req.user.roles);
    }

    // ─── SUBMISSIONS ─────────────────────────────────────────

    @Post('assignments/:id/submit')
    @UseGuards(RolesGuard)
    @Roles('student')
    submitAssignment(
        @Param('id') assignmentId: string,
        @Body() dto: CreateSubmissionDto,
        @Request() req,
    ) {
        return this.gradingService.submitAssignment(assignmentId, req.user.sub, dto);
    }

    @Get('assignments/:id/submissions')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    getSubmissions(@Param('id') assignmentId: string) {
        return this.gradingService.getSubmissions(assignmentId);
    }

    @Get('assignments/:assignmentId/submissions/my')
    getMySubmission(
        @Param('assignmentId') assignmentId: string,
        @Request() req,
    ) {
        return this.gradingService.getStudentSubmission(assignmentId, req.user.sub);
    }

    // ─── GRADING ─────────────────────────────────────────────

    @Post('submissions/:id/grade')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    gradeSubmission(
        @Param('id') submissionId: string,
        @Body() dto: GradeSubmissionDto,
        @Request() req,
    ) {
        return this.gradingService.gradeSubmission(submissionId, req.user.sub, dto);
    }

    @Post('assignments/:id/grades/bulk')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    bulkGrade(
        @Param('id') assignmentId: string,
        @Body() dto: BulkGradeDto,
        @Request() req,
    ) {
        return this.gradingService.bulkGrade(assignmentId, req.user.sub, dto);
    }

    // ─── GRADEBOOK ───────────────────────────────────────────

    @Get('classes/:classId/gradebook')
    @UseGuards(RolesGuard)
    @Roles('admin', 'teacher')
    getClassGradebook(@Param('classId') classId: string) {
        return this.gradingService.getClassGradebook(classId);
    }

    @Get('students/:studentId/grades')
    getStudentGrades(
        @Param('studentId') studentId: string,
        @Query('classId') classId?: string,
    ) {
        return this.gradingService.getStudentGrades(studentId, classId);
    }

    @Get('grades/my')
    getMyGrades(@Request() req, @Query('classId') classId?: string) {
        return this.gradingService.getStudentGrades(req.user.sub, classId);
    }
}
