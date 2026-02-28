import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsNotEmpty, IsEnum } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    PARENT = 'parent',
    STUDENT = 'student',
}

export class RegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    @IsNotEmpty({ message: 'Email is required' })
    @SanitizePlainText()
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @IsNotEmpty({ message: 'Password is required' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsString({ message: 'First name must be a string' })
    @MinLength(1, { message: 'First name is required' })
    @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
    @IsNotEmpty({ message: 'First name is required' })
    @SanitizePlainText()
    firstName: string;

    @IsString({ message: 'Last name must be a string' })
    @MinLength(1, { message: 'Last name is required' })
    @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
    @IsNotEmpty({ message: 'Last name is required' })
    @SanitizePlainText()
    lastName: string;

    @IsOptional()
    @IsString({ message: 'Phone number must be a string' })
    @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
    @Matches(/^[\d\s\+\-\(\)\.]*$/, { message: 'Phone number contains invalid characters' })
    @SanitizePlainText()
    phone?: string;

    @IsString({ message: 'Role must be a string' })
    @IsEnum(UserRole, { message: 'Role must be one of: admin, teacher, parent, student' })
    @IsNotEmpty({ message: 'Role is required' })
    @SanitizePlainText()
    role: string;
}

export class LoginDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    @IsNotEmpty({ message: 'Email is required' })
    @SanitizePlainText()
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(1, { message: 'Password is required' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}

export class RefreshDto {
    @IsString({ message: 'Refresh token must be a string' })
    @MaxLength(512, { message: 'Refresh token format is invalid' })
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken: string;
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    @IsNotEmpty({ message: 'Email is required' })
    @SanitizePlainText()
    email: string;
}

export class ResetPasswordDto {
    @IsString({ message: 'Reset token must be a string' })
    @IsNotEmpty({ message: 'Reset token is required' })
    token: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @IsNotEmpty({ message: 'Password is required' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;
}

export class ChangePasswordDto {
    @IsString({ message: 'Current password must be a string' })
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @IsString({ message: 'New password must be a string' })
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    @MaxLength(128, { message: 'New password cannot exceed 128 characters' })
    @IsNotEmpty({ message: 'New password is required' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    newPassword: string;
}
