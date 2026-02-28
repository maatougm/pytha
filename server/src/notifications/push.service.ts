import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PushNotificationPayload {
  to: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'high' | 'normal';
}

export interface NotificationPreferences {
  messages: boolean;
  assignments: boolean;
  grades: boolean;
  attendance: boolean;
  announcements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register a push token for a user
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    try {
      // Check if token already exists
      const existing = await this.prisma.pushToken.findUnique({
        where: { token },
      });

      if (existing) {
        // Update userId if token moved to different user
        if (existing.userId !== userId) {
          await this.prisma.pushToken.update({
            where: { token },
            data: { userId },
          });
        }
        return;
      }

      // Create new token
      await this.prisma.pushToken.create({
        data: {
          userId,
          token,
          platform,
        },
      });

      this.logger.log(`Registered push token for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to register push token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unregister a push token
   */
  async unregisterToken(token: string, userId?: string): Promise<void> {
    try {
      const where: any = { token };
      if (userId) {
        where.userId = userId;
      }

      await this.prisma.pushToken.deleteMany({ where });
      this.logger.log(`Unregistered push token`);
    } catch (error) {
      this.logger.error(`Failed to unregister push token: ${error.message}`);
    }
  }

  /**
   * Unregister all tokens for a user
   */
  async unregisterAllUserTokens(userId: string): Promise<void> {
    try {
      await this.prisma.pushToken.deleteMany({
        where: { userId },
      });
      this.logger.log(`Unregistered all push tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to unregister user tokens: ${error.message}`);
    }
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    // Return defaults if not set
    const defaults: NotificationPreferences = {
      messages: true,
      assignments: true,
      grades: true,
      attendance: true,
      announcements: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };

    if (!user?.notificationPreferences) {
      return defaults;
    }

    return { ...defaults, ...(user.notificationPreferences as any) };
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...preferences };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: updated },
    });

    return updated;
  }

  /**
   * Check if user should receive notification based on preferences and quiet hours
   */
  async shouldSendNotification(
    userId: string,
    type: keyof Omit<NotificationPreferences, 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd'>,
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    // Check if notification type is enabled
    if (!prefs[type]) {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHoursEnabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const inQuietHours = prefs.quietHoursStart > prefs.quietHoursEnd
        ? currentTime >= prefs.quietHoursStart || currentTime < prefs.quietHoursEnd
        : currentTime >= prefs.quietHoursStart && currentTime < prefs.quietHoursEnd;

      if (inQuietHours) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushNotificationPayload | null> {
    // Check if user has push notifications enabled
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushNotificationsEnabled: true },
    });

    if (user?.pushNotificationsEnabled === false) {
      this.logger.debug(`Push notifications disabled for user ${userId}`);
      return null;
    }

    // Get user's push tokens
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      this.logger.debug(`No push tokens found for user ${userId}`);
      return null;
    }

    // Prepare payload
    const payload: PushNotificationPayload = {
      to: tokens.map((t) => t.token),
      title,
      body,
      data: {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      priority: 'high',
    };

    this.logger.log(`Sending notification to user ${userId}: ${title}`);
    this.logger.debug(JSON.stringify(payload));

    // Send to Expo Push Service
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Expo push API error: ${response.status} ${errorText}`);
        return null;
      }

      const result = await response.json();
      
      // Handle errors in response (invalid tokens, etc.)
      if (result.data && Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (ticket.status === 'error') {
            this.logger.error(`Push error: ${ticket.message}`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              const invalidToken = tokens[i]?.token;
              if (invalidToken) {
                this.logger.log(`Unregistering invalid token: ${invalidToken}`);
                await this.unregisterToken(invalidToken);
              }
            }
          }
        }
      }

      return payload;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return null;
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.sendToUser(userId, title, body, data)),
    );
  }

  /**
   * Send notification to all users with a specific role
   */
  async sendToRole(
    roleName: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { name: roleName },
          },
        },
      },
      select: { id: true },
    });

    await this.sendToMultipleUsers(
      users.map((u) => u.id),
      title,
      body,
      data,
    );
  }

  /**
   * Send notification to channel members
   */
  async sendToChannel(
    channelId: string,
    excludeUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const members = await this.prisma.channelMember.findMany({
      where: {
        channelId,
        userId: { not: excludeUserId },
        muted: false,
      },
      select: { userId: true },
    });

    await this.sendToMultipleUsers(
      members.map((m) => m.userId),
      title,
      body,
      { ...data, channelId },
    );
  }
}
