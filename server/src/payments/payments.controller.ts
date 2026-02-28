import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  CreateInvoiceDto,
} from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('balance/:studentId')
  @ApiOperation({ summary: 'Get fee balance and invoice list for a student' })
  async getFeeBalance(@Param('studentId') studentId: string, @Request() req) {
    // TODO: Check if user is parent of student or admin
    return this.paymentsService.getFeeBalance(studentId);
  }

  @Get('history/:studentId')
  @ApiOperation({ summary: 'Get payment history for a student' })
  async getPaymentHistory(
    @Param('studentId') studentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    // TODO: Check if user is parent of student or admin
    return this.paymentsService.getPaymentHistory(
      studentId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('intent')
  @ApiOperation({ summary: 'Create a payment intent' })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Request() req,
  ) {
    return this.paymentsService.createPaymentIntent(dto, req.user.sub);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a payment' })
  async confirmPayment(@Body() dto: ConfirmPaymentDto, @Request() req) {
    return this.paymentsService.confirmPayment(dto.paymentIntentId, req.user.sub);
  }

  @Get('receipt/:paymentId')
  @ApiOperation({ summary: 'Get payment receipt' })
  async getReceipt(@Param('paymentId') paymentId: string, @Request() req) {
    return this.paymentsService.getReceipt(paymentId, req.user.sub);
  }

  // Admin endpoints

  @Post('invoices')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new fee invoice (Admin only)' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.paymentsService.createInvoice(dto);
  }
}
