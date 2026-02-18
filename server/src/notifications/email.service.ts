import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplate, EmailType } from './templates/email-templates';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

export interface QueuedEmailOptions extends EmailOptions {
    priority?: 'high' | 'normal' | 'low';
    scheduledFor?: Date;
    metadata?: Record<string, any>;
}

@Injectable()
export class EmailService {
    private transporter: Transporter;
    private readonly logger = new Logger(EmailService.name);
    private readonly isDevelopment: boolean;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587', 10);
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        const smtpSecure = this.configService.get('SMTP_SECURE') === 'true';

        if (!smtpUser || !smtpPass) {
            this.logger.warn('SMTP credentials not configured. Emails will be logged to console only.');
            // Create a mock transporter for development
            this.transporter = this.createMockTransporter();
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Verify connection
        this.transporter.verify((error) => {
            if (error) {
                this.logger.error('SMTP connection failed:', error.message);
            } else {
                this.logger.log('SMTP server ready to send emails');
            }
        });
    }

    private createMockTransporter(): Transporter {
        return {
            sendMail: async (mailOptions: any) => {
                this.logger.log('==================== MOCK EMAIL ====================');
                this.logger.log(`To: ${mailOptions.to}`);
                this.logger.log(`From: ${mailOptions.from}`);
                this.logger.log(`Subject: ${mailOptions.subject}`);
                this.logger.log(`Text: ${mailOptions.text?.substring(0, 200)}...`);
                this.logger.log('====================================================');
                return { messageId: `mock-${Date.now()}` };
            },
            verify: (cb: any) => cb(null),
        } as any;
    }

    /**
     * Send an email immediately
     */
    async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const fromEmail = this.configService.get('SMTP_FROM') || 'noreply@schoolmessaging.com';
            const fromName = this.configService.get('SMTP_FROM_NAME') || 'School Messaging System';

            const result = await this.transporter.sendMail({
                from: options.from || `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });

            this.logger.log(`Email sent successfully to ${options.to}, messageId: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Queue an email to be sent asynchronously
     */
    async queueEmail(options: QueuedEmailOptions): Promise<string> {
        const emailQueue = await this.prisma.emailQueue.create({
            data: {
                toEmail: options.to,
                subject: options.subject,
                body: options.html,
                status: 'pending',
                // Store metadata as JSON in body if needed for complex scenarios
            },
        });

        this.logger.log(`Email queued for ${options.to}, queue ID: ${emailQueue.id}`);
        return emailQueue.id;
    }

    /**
     * Send a notification digest email (daily or weekly)
     */
    async sendNotificationDigest(
        to: string,
        userName: string,
        unreadMessages: Array<{
            channelName: string;
            senderName: string;
            messagePreview: string;
            count: number;
        }>,
        digestType: 'daily' | 'weekly' = 'daily',
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const template = EmailTemplate.getDigestTemplate({
            userName,
            unreadMessages,
            digestType,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });

        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }

    /**
     * Send immediate notification for new messages with @mentions
     */
    async sendNewMessageNotification(
        to: string,
        recipientName: string,
        senderName: string,
        channelName: string,
        messageContent: string,
        isMention: boolean = false,
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const template = EmailTemplate.getNewMessageTemplate({
            recipientName,
            senderName,
            channelName,
            messageContent,
            isMention,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });

        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }

    /**
     * Send account activity alert
     */
    async sendAccountActivityAlert(
        to: string,
        userName: string,
        activityType: 'login' | 'password_change' | 'profile_update' | 'suspicious_activity',
        details: {
            timestamp: Date;
            ipAddress?: string;
            device?: string;
            location?: string;
        },
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const template = EmailTemplate.getAccountActivityTemplate({
            userName,
            activityType,
            details,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });

        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(
        to: string,
        userName: string,
        resetToken: string,
        expiresIn: string = '1 hour',
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const baseUrl = this.configService.get('VITE_API_URL') || 'http://localhost:5173';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        const template = EmailTemplate.getPasswordResetTemplate({
            userName,
            resetUrl,
            expiresIn,
            appUrl: baseUrl,
        });

        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(
        to: string,
        userName: string,
        role: string,
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const template = EmailTemplate.getWelcomeTemplate({
            userName,
            role,
            appUrl: this.configService.get('VITE_API_URL') || 'http://localhost:5173',
        });

        return this.sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }

    /**
     * Check if a user should receive email notifications based on their preferences
     */
    async shouldSendEmail(userId: string, notificationType: EmailType): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailNotificationsEnabled: true,
                notificationPreferences: true,
            },
        });

        if (!user || !user.emailNotificationsEnabled) {
            return false;
        }

        // Check specific notification type preferences
        const preferences = user.notificationPreferences as Record<string, boolean> | null;
        if (preferences && preferences[notificationType] === false) {
            return false;
        }

        return true;
    }

    /**
     * Get email queue statistics
     */
    async getQueueStats(): Promise<{
        pending: number;
        processing: number;
        sent: number;
        failed: number;
        total: number;
    }> {
        const [pending, processing, sent, failed] = await Promise.all([
            this.prisma.emailQueue.count({ where: { status: 'pending' } }),
            this.prisma.emailQueue.count({ where: { status: 'processing' } }),
            this.prisma.emailQueue.count({ where: { status: 'sent' } }),
            this.prisma.emailQueue.count({ where: { status: 'failed' } }),
        ]);

        return {
            pending,
            processing,
            sent,
            failed,
            total: pending + processing + sent + failed,
        };
    }

    /**
     * Clean up old sent/failed emails from queue
     */
    async cleanupQueue(olderThanDays: number = 7): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.prisma.emailQueue.deleteMany({
            where: {
                status: { in: ['sent', 'failed'] },
                createdAt: { lt: cutoffDate },
            },
        });

        this.logger.log(`Cleaned up ${result.count} old email queue entries`);
        return result.count;
    }
}
