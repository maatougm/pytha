import { IsString, IsOptional, IsIn, IsEmail, MaxLength } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    @SanitizePlainText()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @SanitizePlainText()
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    @SanitizePlainText()
    lastName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    @SanitizePlainText()
    phone?: string;

    @IsOptional()
    @IsString()
    @IsIn(['active', 'suspended', 'pending'])
    status?: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    avatarUrl?: string;
}
