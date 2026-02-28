import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface CreatePaymentIntentInput {
  amount: number;
  currency?: string;
  studentId: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceInput {
  studentId: string;
  title: string;
  description?: string;
  items: Array<{ name: string; amount: number; category: string }>;
  totalAmount: number;
  currency?: string;
  dueDate: Date;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify user has access to student's payment records
   * Throws ForbiddenException if not authorized
   */
  async verifyAccess(userId: string, userRoles: string[], studentId: string) {
    // Admin can access all records
    if (userRoles?.includes('admin')) return;
    
    // Student can access their own records
    if (userId === studentId) return;

    // Parent can access their children's records
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: userId,
          studentId,
        },
      },
    });

    if (!link) {
      throw new ForbiddenException("You are not authorized to access this student's records");
    }
  }

  async createPaymentIntent(input: CreatePaymentIntentInput, payerId: string) {
    // Validate student exists
    const student = await this.prisma.user.findFirst({
      where: { id: input.studentId, userRoles: { some: { role: { name: 'student' } } } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate invoice if provided
    if (input.invoiceId) {
      const invoice = await this.prisma.feeInvoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.studentId !== input.studentId) {
        throw new BadRequestException('Invoice does not belong to this student');
      }
    }

    // Create payment record with pending status
    const payment = await this.prisma.payment.create({
      data: {
        studentId: input.studentId,
        payerId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency || 'USD',
        status: 'pending',
        metadata: input.metadata || {},
      },
      include: {
        invoice: true,
      },
    });

    // TODO: Integrate with Stripe to create actual payment intent
    // For now, return the payment record with a mock client secret
    return {
      payment,
      clientSecret: `mock_secret_${payment.id}`,
    };
  }

  async confirmPayment(paymentId: string, payerId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== payerId) {
      throw new BadRequestException('You are not authorized to confirm this payment');
    }

    if (payment.status !== 'pending') {
      throw new BadRequestException('Payment is not in pending status');
    }

    // TODO: Verify payment with Stripe
    // For now, mark as completed
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        paidAt: new Date(),
        receiptUrl: `/receipts/${payment.id}.pdf`,
      },
      include: {
        invoice: true,
      },
    });

    // Update invoice paid amount if applicable
    if (payment.invoiceId) {
      await this.updateInvoiceStatus(payment.invoiceId);
    }

    return updatedPayment;
  }

  async updateInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: { status: 'completed' },
        },
      },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(invoice.totalAmount);
    let status: InvoiceStatus;

    if (totalPaid >= totalAmount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else if (new Date() > invoice.dueDate) {
      status = 'overdue';
    } else {
      status = 'pending';
    }

    await this.prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        status,
      },
    });
  }

  async getFeeBalance(studentId: string, userId: string, userRoles: string[]) {
    await this.verifyAccess(userId, userRoles, studentId);
    
    const invoices = await this.prisma.feeInvoice.findMany({
      where: { studentId },
      include: {
        payments: {
          where: { status: 'completed' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce(
      (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
      0
    );

    return {
      totalDue,
      totalPaid,
      remaining: totalDue - totalPaid,
      currency: 'USD',
      invoices: invoices.map((inv) => ({
        id: inv.id,
        title: inv.title,
        description: inv.description,
        items: inv.items as Array<{ name: string; amount: number; category: string }>,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        currency: inv.currency,
        dueDate: inv.dueDate,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    };
  }

  async getPaymentHistory(studentId: string, userId: string, userRoles: string[], page = 1, limit = 20) {
    await this.verifyAccess(userId, userRoles, studentId);
    
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { studentId },
        include: {
          invoice: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { studentId } }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
        receiptUrl: p.receiptUrl,
        createdAt: p.createdAt,
        invoice: p.invoice,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createInvoice(input: CreateInvoiceInput) {
    return this.prisma.feeInvoice.create({
      data: {
        studentId: input.studentId,
        title: input.title,
        description: input.description,
        items: input.items as any,
        totalAmount: input.totalAmount,
        currency: input.currency || 'USD',
        dueDate: input.dueDate,
        paidAmount: 0,
        status: 'pending',
      },
    });
  }

  async getReceipt(paymentId: string, userId: string, userRoles: string[]) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        payer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check if user is authorized (parent who paid, student, or admin)
    if (payment.payerId !== userId && payment.studentId !== userId) {
      if (!userRoles?.includes('admin')) {
        throw new ForbiddenException('You are not authorized to view this receipt');
      }
    }

    return {
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
        receiptUrl: payment.receiptUrl,
      },
      student: payment.student,
      payer: payment.payer,
      invoice: payment.invoice,
      generatedAt: new Date(),
    };
  }
}
