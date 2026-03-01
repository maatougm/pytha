import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min, IsObject, IsArray, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in cents' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  paymentIntentId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  category: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Invoice title is required' })
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  @IsNotEmpty({ message: 'Invoice items are required' })
  items: InvoiceItemDto[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate: Date;
}

export class PaymentResponseDto {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paidAt?: Date;
  receiptUrl?: string;
  createdAt: Date;
  invoice?: {
    id: string;
    title: string;
  };
}

export class InvoiceResponseDto {
  id: string;
  title: string;
  description?: string;
  items: Array<{
    name: string;
    amount: number;
    category: string;
  }>;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: Date;
  status: InvoiceStatus;
  createdAt: Date;
}

export class FeeBalanceDto {
  totalDue: number;
  totalPaid: number;
  remaining: number;
  currency: string;
  invoices: InvoiceResponseDto[];
}
