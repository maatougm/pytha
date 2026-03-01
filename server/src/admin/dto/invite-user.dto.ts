import { IsString, IsEmail, IsIn, IsOptional, MaxLength, IsArray, IsNotEmpty } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class InviteUserDto {
    @IsEmail()
    @SanitizePlainText()
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'First name is required' })
    @MaxLength(100)
    @SanitizePlainText()
    firstName: string;

    @IsString()
    @IsNotEmpty({ message: 'Last name is required' })
    @MaxLength(100)
    @SanitizePlainText()
    lastName: string;

    @IsString()
    @IsIn(['admin', 'teacher', 'parent', 'student'])
    role: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    @SanitizePlainText()
    phone?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    classIds?: string[];

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    childIds?: string[];
}

export class BulkInviteUserDto {
    @IsArray()
    users: InviteUserDto[];
}
