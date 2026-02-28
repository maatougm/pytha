import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ConferenceStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export class CreateConferenceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ type: [String], example: ['2026-03-01T14:00:00Z', '2026-03-02T15:00:00Z'] })
  @IsArray()
  @IsDateString({}, { each: true })
  proposedDates: string[];

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  durationMinutes?: number = 30;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfirmConferenceDto {
  @ApiProperty()
  @IsDateString()
  confirmedDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  meetingLink?: string;
}

export class CancelConferenceDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class ConferenceResponseDto {
  id: string;
  studentId: string;
  parentId: string;
  teacherId: string;
  proposedDates: string[];
  confirmedDate?: string;
  durationMinutes: number;
  status: ConferenceStatus;
  notes?: string;
  meetingLink?: string;
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
