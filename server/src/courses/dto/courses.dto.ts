import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsArray, IsUUID, ArrayMaxSize, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

// ─── Course DTOs ─────────────────────────────────────────────

export class CreateCourseDto {
    @IsString()
    @MaxLength(20, { message: 'Course code cannot exceed 20 characters' })
    @SanitizePlainText()
    code: string;

    @IsString()
    @MaxLength(200, { message: 'Course name cannot exceed 200 characters' })
    @SanitizePlainText()
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(20, { message: 'Credits cannot exceed 20' })
    credits?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Department cannot exceed 100 characters' })
    @SanitizePlainText()
    department?: string;
}

export class UpdateCourseDto {
    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Course name cannot exceed 200 characters' })
    @SanitizePlainText()
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(20)
    credits?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Department cannot exceed 100 characters' })
    @SanitizePlainText()
    department?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// ─── Class DTOs ──────────────────────────────────────────────

export class CreateClassDto {
    @IsUUID('4', { message: 'Invalid course ID' })
    courseId: string;

    @IsUUID('4', { message: 'Invalid teacher ID' })
    teacherId: string;

    @IsString()
    @MaxLength(50, { message: 'Term cannot exceed 50 characters' })
    @SanitizePlainText()
    term: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Section cannot exceed 20 characters' })
    @SanitizePlainText()
    section?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Room cannot exceed 50 characters' })
    @SanitizePlainText()
    room?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000, { message: 'Max students cannot exceed 1000' })
    maxStudents?: number;
}

export class UpdateClassDto {
    @IsOptional()
    @IsUUID('4', { message: 'Invalid teacher ID' })
    teacherId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Term cannot exceed 50 characters' })
    @SanitizePlainText()
    term?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Section cannot exceed 20 characters' })
    @SanitizePlainText()
    section?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Room cannot exceed 50 characters' })
    @SanitizePlainText()
    room?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000)
    maxStudents?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// ─── Enrollment ──────────────────────────────────────────────

export class EnrollStudentDto {
    @IsUUID('4', { message: 'Invalid student ID' })
    studentId: string;
}

export class BulkEnrollDto {
    @IsArray()
    @ArrayMaxSize(100, { message: 'Cannot enroll more than 100 students at once' })
    @IsUUID('4', { each: true })
    studentIds: string[];
}

// ─── Schedule ────────────────────────────────────────────────

export class CreateScheduleDto {
    @IsInt()
    @Min(0)
    @Max(6, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' })
    dayOfWeek: number;

    @IsString()
    @MaxLength(10, { message: 'Time format is invalid' })
    @SanitizePlainText()
    startTime: string; // "09:00"

    @IsString()
    @MaxLength(10, { message: 'Time format is invalid' })
    @SanitizePlainText()
    endTime: string;   // "10:30"
}

export class AddSchedulesDto {
    @IsArray()
    @ArrayMaxSize(7, { message: 'Cannot add more than 7 schedules at once' })
    @Type(() => CreateScheduleDto)
    schedules: CreateScheduleDto[];
}
