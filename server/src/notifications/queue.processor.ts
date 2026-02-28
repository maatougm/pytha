import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push.service';
import { EmailService } from './email.service';

export interface NotificationJob {
  type: 'message' | 'assignment' | 'grade' | 'attendance' | 'announcement' | 'reminder';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  email?: {
    subject: string;
    html: string;
  };
}

export interface DigestJob {
  userId: string;
  since: Date;
  unreadCount: number;
}

@Injectable()
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushNotificationService,
    private emailService: EmailService,
  ) {}

  /**
   * Process a single notification job
   */
  async processNotification(job: NotificationJob): Promise<void> {
    try {
      this.logger.debug(`Processing notification: ${job.type} for user ${job.userId}`);

      // Check user preferences
      const shouldSend = await this.pushService.shouldSendNotification(job.userId, this.mapTypeToPreference(job.type));
      
      if (!shouldSend) {
        this.logger.debug(`Notification skipped due to user preferences: ${job.userId}`);
        return;
      }

      // Send push notification
      await this.pushService.sendToUser(job.userId, job.title, job.body, job.data);

      // Send email if provided and user has email notifications enabled
      if (job.email) {
        const user = await this.prisma.user.findUnique({
          where: { id: job.userId },
          select: { email: true, emailNotificationsEnabled: true },
        });

        if (user?.emailNotificationsEnabled !== false && user?.email) {
          await this.emailService.sendEmail({
            to: user.email,
            subject: job.email.subject,
            html: job.email.html,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a batch of notifications
   */
  async processBatch(jobs: NotificationJob[]): Promise<void> {
    await Promise.all(jobs.map(job => this.processNotification(job)));
  }

  /**
   * Process digest notification
   */
  async processDigest(job: DigestJob): Promise<void> {
    try {
      this.logger.debug(`Processing digest for user ${job.userId} with ${job.unreadCount} unread`);

      const digestContent = await this.generateDigestContent(job.userId, job.since);

      if (digestContent.length === 0) {
        this.logger.debug(`No digest content for user ${job.userId}`);
        return;
      }

      const title = `You have ${job.unreadCount} new notifications`;
      const body = this.formatDigestBody(digestContent);

      await this.pushService.sendToUser(job.userId, title, body, {
        type: 'digest',
        unreadCount: job.unreadCount,
      });
    } catch (error) {
      this.logger.error(`Failed to process digest: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate digest content with optimized query
   */
  private async generateDigestContent(
    userId: string,
    since: Date,
  ): Promise<Array<{ channelName: string; senderName: string; messagePreview: string; count: number }>> {
    // Optimized: Retrieve unread messages using a single raw SQL query with CTE.
    // This avoids N+1 queries by getting everything in one database call.
    const result = await this.prisma.$queryRaw<Array<{
      channelName: string | null;
      firstName: string;
      lastName: string;
      messagePreview: string;
      count: number;
    }>>`
      WITH UnreadMessages AS (
        SELECT
          c.name as "channelName",
          u.first_name as "firstName",
          u.last_name as "lastName",
          m.content as "messagePreview",
          COUNT(*) OVER(PARTITION BY m.channel_id) as "totalCount",
          ROW_NUMBER() OVER(PARTITION BY m.channel_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN channel_members cm ON m.channel_id = cm.channel_id AND cm.user_id = ${userId}
        JOIN channels c ON m.channel_id = c.id
        JOIN users u ON m.sender_id = u.id
        WHERE m.created_at >= ${since}
          AND m.sender_id != ${userId}
          AND m.is_deleted = false
          AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
      )
      SELECT
        "channelName",
        "firstName",
        "lastName",
        "messagePreview",
        CAST("totalCount" AS INTEGER) as "count"
      FROM UnreadMessages
      WHERE rn = 1
    `;

    return result.map(row => ({
      channelName: row.channelName || 'Unnamed Channel',
      senderName: `${row.firstName} ${row.lastName}`,
      messagePreview: row.messagePreview,
      count: row.count,
    }));
  }

  /**
   * Format digest body
   */
  private formatDigestBody(content: Array<{ channelName: string; senderName: string; messagePreview: string; count: number }>): string {
    if (content.length === 0) {
      return 'No new messages';
    }

    // Show first 3 items
    const items = content.slice(0, 3);
    const remaining = content.length - items.length;

    let body = items.map(item => {
      const preview = item.messagePreview.length > 50 
        ? item.messagePreview.substring(0, 50) + '...' 
        : item.messagePreview;
      return `${item.channelName}: ${item.senderName} - "${preview}"`;
    }).join('\n');

    if (remaining > 0) {
      body += `\n+ ${remaining} more...`;
    }

    return body;
  }

  /**
   * Map notification type to preference key
   */
  private mapTypeToPreference(type: NotificationJob['type']): string {
    const mapping: Record<string, string> = {
      message: 'messages',
      assignment: 'assignments',
      grade: 'grades',
      attendance: 'attendance',
      announcement: 'announcements',
      reminder: 'announcements',
    };
    return mapping[type] || 'announcements';
  }

  /**
   * Schedule a notification (add to queue)
   */
  async scheduleNotification(job: NotificationJob, delayMs?: number): Promise<void> {
    // For now, process immediately. In production, this would add to a proper queue (Bull, etc.)
    if (delayMs && delayMs > 0) {
      setTimeout(() => {
        this.processNotification(job).catch(err => {
          this.logger.error(`Delayed notification failed: ${err.message}`);
        });
      }, delayMs);
    } else {
      await this.processNotification(job);
    }
  }

  /**
   * Retry failed notification
   */
  async retryNotification(job: NotificationJob, attempt: number = 1): Promise<void> {
    const maxRetries = 3;
    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff

    try {
      await this.processNotification(job);
    } catch (error) {
      if (attempt < maxRetries) {
        this.logger.warn(`Notification failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        setTimeout(() => {
          this.retryNotification(job, attempt + 1);
        }, delay);
      } else {
        this.logger.error(`Notification failed after ${maxRetries} attempts`);
        throw error;
      }
    }
  }
}
