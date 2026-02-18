import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class UpdateUserStatusDto {
    @IsString()
    @IsIn(['active', 'suspended', 'pending', 'archived'])
    status: string;

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}
