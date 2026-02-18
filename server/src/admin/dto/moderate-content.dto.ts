import { IsString, IsOptional, IsIn } from 'class-validator';
import { SanitizePlainText } from '../../common/decorators/sanitize.decorator';

export class ModerateContentDto {
    @IsString()
    @IsIn(['message', 'file'])
    contentType: 'message' | 'file';

    @IsString()
    @IsIn(['delete', 'warn', 'ignore'])
    action: 'delete' | 'warn' | 'ignore';

    @IsOptional()
    @IsString()
    @SanitizePlainText()
    reason?: string;
}
