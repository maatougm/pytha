import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsEnum(['ios', 'android', 'web'])
  deviceType: 'ios' | 'android' | 'web';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false, example: '22:00' })
  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @ApiProperty({ required: false, example: '07:00' })
  @IsString()
  @IsOptional()
  quietHoursEnd?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  types?: Record<string, boolean>;
}

export class NotificationPreferencesResponseDto {
  enabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  types: {
    messages: boolean;
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    announcements: boolean;
    reminders: boolean;
  };
}
