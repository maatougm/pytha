import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsUUID, ValidateNested, ArrayMaxSize, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    EXCUSED = 'excused',
}

// ─── Session DTOs ────────────────────────────────────────────

export class CreateAttendanceSessionDto {
    @IsDateString({}, { message: 'Date must be a valid ISO date string' })
    date: string;

    @IsOptional()
    @IsInt({ message: 'Period must be an integer (1-3)' })
    @Min(1)
    @Max(3)
    period?: number;

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
    @SanitizePlainText()
    notes?: string;
}

// ─── Record DTOs ─────────────────────────────────────────────

export class MarkAttendanceDto {
    @IsString()
    @IsEnum(AttendanceStatus, { message: 'Status must be one of: present, absent, late, excused' })
    status: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
    @SanitizePlainText()
    notes?: string;
}

export class BulkAttendanceEntry {
    @IsUUID('4', { message: 'Invalid student ID' })
    studentId: string;

    @IsString()
    @IsEnum(AttendanceStatus, { message: 'Status must be one of: present, absent, late, excused' })
    status: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
    @SanitizePlainText()
    notes?: string;
}

export class BulkAttendanceDto {
    @IsDateString({}, { message: 'Date must be a valid ISO date string' })
    date: string;

    @IsOptional()
    @IsInt({ message: 'Period must be an integer (1-3)' })
    @Min(1)
    @Max(3)
    period?: number;

    @IsArray()
    @ArrayMaxSize(200, { message: 'Cannot mark attendance for more than 200 students at once' })
    @ValidateNested({ each: true })
    @Type(() => BulkAttendanceEntry)
    records: BulkAttendanceEntry[];

    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Session notes cannot exceed 1000 characters' })
    @SanitizePlainText()
    sessionNotes?: string;
}

// ─── Report DTOs ─────────────────────────────────────────────

export class AttendanceReportQuery {
    @IsOptional()
    @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
    startDate?: string;

    @IsOptional()
    @IsDateString({}, { message: 'End date must be a valid ISO date string' })
    endDate?: string;
}
