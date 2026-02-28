import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PushNotificationService } from './push.service';
import {
  RegisterPushTokenDto,
  UpdateNotificationPreferencesDto,
} from './dto/push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('notifications/push')
@UseGuards(JwtAuthGuard)
export class PushNotificationController {
  constructor(private pushService: PushNotificationService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a push token for the current user' })
  async registerToken(
    @Body() dto: RegisterPushTokenDto,
    @Request() req,
  ) {
    return this.pushService.registerToken(
      req.user.sub,
      dto.token,
      dto.deviceType,
      dto.deviceName,
    );
  }

  @Delete('token')
  @ApiOperation({ summary: 'Unregister/unsubscribe a push token' })
  async unregisterToken(@Body('token') token: string, @Request() req) {
    return this.pushService.unregisterToken(token, req.user.sub);
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get all registered push tokens for the user' })
  async getUserTokens(@Request() req) {
    return this.pushService.getUserTokens(req.user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req) {
    return this.pushService.getNotificationPreferences(req.user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Request() req,
  ) {
    return this.pushService.updateNotificationPreferences(req.user.sub, dto as any);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test push notification' })
  async sendTestNotification(@Request() req) {
    return this.pushService.sendTestNotification(req.user.sub);
  }
}
