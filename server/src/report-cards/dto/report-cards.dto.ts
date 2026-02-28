import { IsString, IsOptional, IsUUID, IsDecimal, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportCardDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'Fall' })
  @IsString()
  term: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsObject()
  courseGrades: Array<{
    courseId: string;
    courseName: string;
    grade: number;
    letterGrade: string;
    comments?: string;
  }>;

  @ApiProperty({ required: false })
  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  gpa?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  behaviorSummary?: {
    positive: number;
    negative: number;
    totalPoints: number;
  };

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  teacherComments?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  attendanceSummary?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
}

export class AcknowledgeReportCardDto {
  @ApiProperty()
  @IsUUID()
  parentId: string;
}

export class ReportCardResponseDto {
  id: string;
  studentId: string;
  academicYearId: string;
  term: string;
  courseGrades: Array<{
    courseId: string;
    courseName: string;
    grade: number;
    letterGrade: string;
    comments?: string;
  }>;
  gpa?: number;
  behaviorSummary?: {
    positive: number;
    negative: number;
    totalPoints: number;
  };
  teacherComments?: string;
  attendanceSummary?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
  parentAcknowledgedAt?: Date;
  acknowledgedBy?: string;
  generatedAt: Date;
  createdAt: Date;
}
