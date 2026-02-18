import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class RegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    @SanitizePlainText()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsString()
    @MinLength(1, { message: 'First name is required' })
    @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
    @SanitizePlainText()
    firstName: string;

    @IsString()
    @MinLength(1, { message: 'Last name is required' })
    @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
    @SanitizePlainText()
    lastName: string;

    @IsOptional()
    @IsString()
    @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
    @SanitizePlainText()
    phone?: string;

    @IsString()
    @MaxLength(50, { message: 'Role cannot exceed 50 characters' })
    @SanitizePlainText()
    role: string; // admin, teacher, parent, student
}

export class LoginDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    @SanitizePlainText()
    email: string;

    @IsString()
    @MinLength(1, { message: 'Password is required' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    password: string;
}

export class RefreshDto {
    @IsString()
    @MaxLength(512, { message: 'Refresh token format is invalid' })
    refreshToken: string;
}
