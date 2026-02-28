import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Parent')
@ApiBearerAuth()
@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent', 'admin')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Get('children')
  @ApiOperation({ summary: 'Get all children linked to the parent' })
  async getLinkedChildren(@Request() req) {
    return this.parentService.getLinkedChildren(req.user.sub);
  }

  @Get('children/:studentId/progress')
  @ApiOperation({ summary: 'Get detailed progress for a specific child' })
  async getStudentProgress(
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.parentService.getStudentProgress(req.user.sub, studentId);
  }

  @Get('children/:studentId/teachers')
  @ApiOperation({ summary: 'Get teacher contacts for a specific child' })
  async getTeacherContacts(
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.parentService.getTeacherContacts(req.user.sub, studentId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get parent dashboard statistics' })
  async getDashboardStats(@Request() req) {
    return this.parentService.getDashboardStats(req.user.sub);
  }
}
