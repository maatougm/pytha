import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';

export class NotificationPreferencesDto {
    @IsOptional()
    @IsBoolean()
    emailNotificationsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    new_message?: boolean;

    @IsOptional()
    @IsBoolean()
    mention?: boolean;

    @IsOptional()
    @IsBoolean()
    digest?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['daily', 'weekly', 'both', 'none'])
    digestFrequency?: 'daily' | 'weekly' | 'both' | 'none';

    @IsOptional()
    @IsBoolean()
    account_activity?: boolean;

    @IsOptional()
    @IsBoolean()
    assignment_reminder?: boolean;

    @IsOptional()
    @IsBoolean()
    grade_posted?: boolean;
}

export interface NotificationPreferencesResponse {
    emailNotificationsEnabled: boolean;
    preferences: {
        new_message: boolean;
        mention: boolean;
        digest: boolean;
        digestFrequency: 'daily' | 'weekly' | 'both' | 'none';
        account_activity: boolean;
        assignment_reminder: boolean;
        grade_posted: boolean;
    };
}
