import { IsEmail, IsNotEmpty, IsString, IsEnum, MinLength, IsOptional, IsUUID } from 'class-validator';

export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    PARENT = 'parent',
    STUDENT = 'student',
}

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;

    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string;
}

export class LinkParentDto {
    @IsUUID()
    @IsNotEmpty()
    parentId: string;

    @IsUUID()
    @IsNotEmpty()
    studentId: string;
}
