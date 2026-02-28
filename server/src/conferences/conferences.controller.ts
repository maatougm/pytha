import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConferencesService } from './conferences.service';
import {
  CreateConferenceDto,
  ConfirmConferenceDto,
  CancelConferenceDto,
} from './dto/conferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Conferences')
@ApiBearerAuth()
@Controller('conferences')
@UseGuards(JwtAuthGuard)
export class ConferencesController {
  constructor(private conferencesService: ConferencesService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all conferences for a student' })
  async getConferencesForStudent(
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.conferencesService.getConferencesForStudent(studentId, req.user.sub);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get conferences for the current user' })
  async getMyConferences(@Request() req) {
    const role = req.user.roles.includes('parent') ? 'parent' : 'teacher';
    return this.conferencesService.getConferencesForUser(req.user.sub, role);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming confirmed conferences' })
  async getUpcomingConferences(@Request() req) {
    const role = req.user.roles.includes('parent') ? 'parent' : 'teacher';
    return this.conferencesService.getUpcomingConferences(req.user.sub, role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Request a new conference (Parent only)' })
  async createConference(@Body() dto: CreateConferenceDto, @Request() req) {
    return this.conferencesService.createConference(dto, req.user.sub);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Confirm a conference (Teacher only)' })
  async confirmConference(
    @Param('id') id: string,
    @Body() dto: ConfirmConferenceDto,
    @Request() req,
  ) {
    return this.conferencesService.confirmConference(
      id,
      req.user.sub,
      dto.confirmedDate,
      dto.meetingLink,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a conference' })
  async cancelConference(
    @Param('id') id: string,
    @Body() dto: CancelConferenceDto,
    @Request() req,
  ) {
    return this.conferencesService.cancelConference(id, req.user.sub, dto.reason);
  }
}
