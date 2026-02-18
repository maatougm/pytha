import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

interface ProcessingResult {
    processed: number;
    succeeded: number;
    failed: number;
}

@Injectable()
export class QueueProcessor {
    private readonly logger = new Logger(QueueProcessor.name);
    private isProcessing = false;
    private readonly maxRetries = 3;
    private readonly baseDelayMs = 1000; // 1 second base for exponential backoff
    private readonly maxConcurrent = 5; // Rate limiting: max concurrent emails

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Process email queue every minute
     * This is the main entry point for scheduled queue processing
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron(): Promise<void> {
        if (this.isProcessing) {
            this.logger.debug('Queue processor already running, skipping...');
            return;
        }

        this.isProcessing = true;
        try {
            await this.processQueue();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process digest emails daily at 9 AM
     */
    @Cron('0 9 * * *') // Daily at 9:00 AM
    async sendDailyDigests(): Promise<void> {
        this.logger.log('Starting daily digest generation...');
        await this.generateDigests('daily');
    }

    /**
     * Process digest emails weekly on Monday at 9 AM
     */
    @Cron('0 9 * * 1') // Weekly on Monday at 9:00 AM
    async sendWeeklyDigests(): Promise<void> {
        this.logger.log('Starting weekly digest generation...');
        await this.generateDigests('weekly');
    }

    /**
     * Clean up old sent/failed emails weekly (Sundays at 3 AM)
     */
    @Cron('0 3 * * 0') // Weekly on Sunday at 3:00 AM
    async cleanupOldEmails(): Promise<void> {
        this.logger.log('Starting email queue cleanup...');
        const cleaned = await this.emailService.cleanupQueue(7);
        this.logger.log(`Cleaned up ${cleaned} old email queue entries`);
    }

    /**
     * Main queue processing logic
     */
    async processQueue(batchSize: number = 50): Promise<ProcessingResult> {
        const result: ProcessingResult = { processed: 0, succeeded: 0, failed: 0 };

        try {
            // Fetch pending emails with retry limit not exceeded
            const pendingEmails = await this.prisma.emailQueue.findMany({
                where: {
                    status: 'pending',
                    attempts: { lt: this.maxRetries },
                },
                orderBy: [
                    { createdAt: 'asc' }, // Oldest first
                ],
                take: batchSize,
            });

            if (pendingEmails.length === 0) {
                return result;
            }

            this.logger.log(`Processing ${pendingEmails.length} emails from queue`);

            // Process emails with rate limiting
            for (let i = 0; i < pendingEmails.length; i += this.maxConcurrent) {
                const batch = pendingEmails.slice(i, i + this.maxConcurrent);
                
                // Process batch concurrently
                const batchResults = await Promise.allSettled(
                    batch.map(email => this.processSingleEmail(email.id))
                );

                // Count results
                batchResults.forEach(res => {
                    result.processed++;
                    if (res.status === 'fulfilled' && res.value) {
                        result.succeeded++;
                    } else {
                        result.failed++;
                    }
                });

                // Add delay between batches for rate limiting
                if (i + this.maxConcurrent < pendingEmails.length) {
                    await this.delay(1000);
                }
            }

            this.logger.log(
                `Queue processing complete: ${result.succeeded} succeeded, ${result.failed} failed`
            );

        } catch (error) {
            this.logger.error('Error processing email queue:', error.message);
        }

        return result;
    }

    /**
     * Process a single email from the queue
     */
    private async processSingleEmail(emailId: string): Promise<boolean> {
        try {
            // Mark as processing to prevent duplicate processing
            const email = await this.prisma.emailQueue.update({
                where: { id: emailId },
                data: { 
                    status: 'processing',
                    attempts: { increment: 1 },
                },
            });

            // Attempt to send email
            const result = await this.emailService.sendEmail({
                to: email.toEmail,
                subject: email.subject,
                html: email.body,
            });

            if (result.success) {
                // Mark as sent
                await this.prisma.emailQueue.update({
                    where: { id: emailId },
                    data: { 
                        status: 'sent',
                        sentAt: new Date(),
                    },
                });
                this.logger.debug(`Email sent successfully to ${email.toEmail}`);
                return true;
            } else {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            this.logger.error(`Failed to send email ${emailId}:`, error.message);
            
            // Get current attempt count
            const email = await this.prisma.emailQueue.findUnique({
                where: { id: emailId },
            });

            if (email && email.attempts >= this.maxRetries) {
                // Max retries reached, mark as failed
                await this.prisma.emailQueue.update({
                    where: { id: emailId },
                    data: { status: 'failed' },
                });
                this.logger.warn(`Email ${emailId} marked as failed after ${this.maxRetries} attempts`);
            } else {
                // Schedule for retry with exponential backoff
                const delayMs = this.calculateBackoffDelay(email?.attempts || 1);
                this.logger.log(`Scheduling email ${emailId} for retry in ${delayMs}ms`);
                
                // Reset to pending status so it will be picked up again
                await this.prisma.emailQueue.update({
                    where: { id: emailId },
                    data: { status: 'pending' },
                });

                // Wait before continuing (actual retry will happen in next cron cycle)
                await this.delay(Math.min(delayMs, 5000)); // Cap at 5 seconds for cron-based retry
            }

            return false;
        }
    }

    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoffDelay(attempt: number): number {
        // Exponential backoff: 1s, 2s, 4s
        return this.baseDelayMs * Math.pow(2, attempt - 1);
    }

    /**
     * Generate digest emails for users
     */
    private async generateDigests(digestType: 'daily' | 'weekly'): Promise<void> {
        try {
            // Get users who have email notifications enabled and want digests
            const users = await this.prisma.user.findMany({
                where: {
                    emailNotificationsEnabled: true,
                    status: 'active',
                    deletedAt: null,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    notificationPreferences: true,
                },
            });

            const cutoffDate = new Date();
            if (digestType === 'daily') {
                cutoffDate.setDate(cutoffDate.getDate() - 1);
            } else {
                cutoffDate.setDate(cutoffDate.getDate() - 7);
            }

            for (const user of users) {
                try {
                    // Check user digest preferences
                    const prefs = user.notificationPreferences as Record<string, any> | null;
                    const digestPref = prefs?.digestFrequency || 'daily';
                    
                    if (digestPref !== digestType && digestPref !== 'both') {
                        continue; // Skip if user doesn't want this digest type
                    }

                    // Get unread messages
                    const unreadChannels = await this.getUnreadMessagesForUser(user.id, cutoffDate);
                    
                    if (unreadChannels.length === 0) {
                        continue; // No unread messages, skip
                    }

                    // Queue digest email
                    await this.emailService.queueEmail({
                        to: user.email,
                        subject: `${digestType === 'daily' ? 'Daily' : 'Weekly'} Message Digest`,
                        html: this.generateDigestHtml(unreadChannels, digestType),
                        priority: 'normal',
                    });

                } catch (error) {
                    this.logger.error(`Failed to generate digest for user ${user.id}:`, error.message);
                }
            }

        } catch (error) {
            this.logger.error('Error generating digests:', error.message);
        }
    }

    /**
     * Get unread messages for a user since a given date
     */
    private async getUnreadMessagesForUser(
        userId: string, 
        since: Date
    ): Promise<Array<{ channelName: string; senderName: string; messagePreview: string; count: number }>> {
        // Get user's channel memberships with lastReadAt
        const memberships = await this.prisma.channelMember.findMany({
            where: { userId },
            include: {
                channel: {
                    select: { name: true, id: true },
                },
            },
        });

        const result: Array<{ channelName: string; senderName: string; messagePreview: string; count: number }> = [];

        for (const membership of memberships) {
            const unreadMessages = await this.prisma.message.findMany({
                where: {
                    channelId: membership.channelId,
                    createdAt: { gte: since },
                    senderId: { not: userId },
                    isDeleted: false,
                    ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    sender: {
                        select: { firstName: true, lastName: true },
                    },
                },
            });

            if (unreadMessages.length > 0) {
                const latest = unreadMessages[0];
                const totalCount = await this.prisma.message.count({
                    where: {
                        channelId: membership.channelId,
                        createdAt: { gte: since },
                        senderId: { not: userId },
                        isDeleted: false,
                        ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
                    },
                });

                result.push({
                    channelName: membership.channel.name || 'Unnamed Channel',
                    senderName: `${latest.sender.firstName} ${latest.sender.lastName}`,
                    messagePreview: latest.content,
                    count: totalCount,
                });
            }
        }

        return result;
    }

    /**
     * Generate digest email HTML
     */
    private generateDigestHtml(
        channels: Array<{ channelName: string; senderName: string; messagePreview: string; count: number }>,
        digestType: 'daily' | 'weekly'
    ): string {
        const totalMessages = channels.reduce((sum, c) => sum + c.count, 0);
        
        return `
            <h2>${digestType === 'daily' ? '📬 Daily' : '📊 Weekly'} Digest</h2>
            <p>You have <strong>${totalMessages}</strong> unread messages across <strong>${channels.length}</strong> conversations.</p>
            ${channels.map(c => `
                <div style="margin: 16px 0; padding: 16px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0;">${c.channelName} ${c.count > 1 ? `(${c.count} new)` : ''}</h3>
                    <p style="margin: 0; color: #6B7280;">From ${c.senderName}</p>
                    <p style="margin: 8px 0 0 0;">${c.messagePreview.substring(0, 100)}${c.messagePreview.length > 100 ? '...' : ''}</p>
                </div>
            `).join('')}
        `;
    }

    /**
     * Utility method to delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Manually trigger queue processing (for admin/debug use)
     */
    async forceProcessQueue(batchSize?: number): Promise<ProcessingResult> {
        return this.processQueue(batchSize);
    }

    /**
     * Get current queue status
     */
    async getQueueStatus(): Promise<{
        isProcessing: boolean;
        stats: Awaited<ReturnType<EmailService['getQueueStats']>>;
    }> {
        return {
            isProcessing: this.isProcessing,
            stats: await this.emailService.getQueueStats(),
        };
    }

    /**
     * Retry a specific failed email
     */
    async retryEmail(emailId: string): Promise<boolean> {
        const email = await this.prisma.emailQueue.findUnique({
            where: { id: emailId },
        });

        if (!email) {
            throw new Error('Email not found');
        }

        if (email.status === 'sent') {
            throw new Error('Email already sent');
        }

        // Reset attempts and status
        await this.prisma.emailQueue.update({
            where: { id: emailId },
            data: { 
                status: 'pending',
                attempts: 0,
            },
        });

        // Process immediately
        return this.processSingleEmail(emailId);
    }
}
