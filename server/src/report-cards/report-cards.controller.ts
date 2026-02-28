import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportCardsService } from './report-cards.service';
import { CreateReportCardDto } from './dto/report-cards.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Report Cards')
@ApiBearerAuth()
@Controller('report-cards')
@UseGuards(JwtAuthGuard)
export class ReportCardsController {
  constructor(private reportCardsService: ReportCardsService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all report cards for a student' })
  async getReportCardsForStudent(
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.reportCardsService.getReportCardsForStudent(studentId, req.user.sub);
  }

  @Get('student/:studentId/latest')
  @ApiOperation({ summary: 'Get the latest report card for a student' })
  async getLatestReportCard(
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.reportCardsService.getLatestReportCard(studentId, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific report card by ID' })
  async getReportCardById(@Param('id') id: string, @Request() req) {
    return this.reportCardsService.getReportCardById(id, req.user.sub);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Create a new report card (Admin/Teacher only)' })
  async createReportCard(@Body() dto: CreateReportCardDto) {
    return this.reportCardsService.createReportCard(dto);
  }

  @Post(':id/acknowledge')
  @UseGuards(RolesGuard)
  @Roles('parent')
  @ApiOperation({ summary: 'Acknowledge a report card (Parent only)' })
  async acknowledgeReportCard(@Param('id') id: string, @Request() req) {
    return this.reportCardsService.acknowledgeReportCard(id, req.user.sub);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Generate a report card automatically (Admin/Teacher only)' })
  async generateReportCard(
    @Query('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('term') term: string,
  ) {
    return this.reportCardsService.generateReportCard(studentId, academicYearId, term);
  }
}
