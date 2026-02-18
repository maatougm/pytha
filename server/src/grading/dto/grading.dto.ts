import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsDateString, IsArray, IsUUID, IsEnum, IsBoolean, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText, SanitizeHtml } from '../../common/decorators/sanitize.decorator';

export enum AssignmentType {
    HOMEWORK = 'homework',
    QUIZ = 'quiz',
    EXAM = 'exam',
    PROJECT = 'project',
}

// ─── Assignment DTOs ─────────────────────────────────────────

export class CreateAssignmentDto {
    @IsString()
    @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
    @SanitizePlainText()
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
    dueDate: string;

    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Max points must be at least 1' })
    @Max(10000, { message: 'Max points cannot exceed 10000' })
    maxPoints?: number;

    @IsOptional()
    @IsString()
    @IsEnum(AssignmentType)
    type?: string;
}

export class UpdateAssignmentDto {
    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
    @SanitizePlainText()
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
    @SanitizeHtml()
    description?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
    dueDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Max points must be at least 1' })
    @Max(10000, { message: 'Max points cannot exceed 10000' })
    maxPoints?: number;

    @IsOptional()
    @IsString()
    @IsEnum(AssignmentType)
    type?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

// ─── Submission DTOs ─────────────────────────────────────────

export class CreateSubmissionDto {
    @IsOptional()
    @IsString()
    @MaxLength(10000, { message: 'Content cannot exceed 10000 characters' })
    @SanitizeHtml()
    content?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10, { message: 'Cannot attach more than 10 files' })
    @IsString({ each: true })
    fileIds?: string[];
}

// ─── Grade DTOs ──────────────────────────────────────────────

export class GradeSubmissionDto {
    @IsNumber()
    @Min(0, { message: 'Score cannot be negative' })
    @Max(10000, { message: 'Score cannot exceed 10000' })
    score: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000, { message: 'Feedback cannot exceed 2000 characters' })
    @SanitizeHtml()
    feedback?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5, { message: 'Letter grade cannot exceed 5 characters' })
    @SanitizePlainText()
    letterGrade?: string;
}

class SingleGradeDto {
    @IsString()
    @IsUUID('4')
    studentId: string;

    @IsNumber()
    @Min(0)
    @Max(10000)
    score: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @SanitizeHtml()
    feedback?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5)
    @SanitizePlainText()
    letterGrade?: string;
}

export class BulkGradeDto {
    @IsArray()
    @ArrayMaxSize(100, { message: 'Cannot grade more than 100 students at once' })
    @Type(() => SingleGradeDto)
    grades: SingleGradeDto[];
}
