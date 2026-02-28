import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PushNotificationPayload {
  to: string[]; // Expo push tokens
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "07:00"
  types: {
    messages: boolean;
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    announcements: boolean;
    reminders: boolean;
  };
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private prisma: PrismaService) {}

  async registerToken(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android' | 'web',
    deviceName?: string,
  ) {
    // Check if token already exists
    const existing = await this.prisma.pushToken.findUnique({
      where: { token },
    });

    if (existing) {
      // Update existing token
      return this.prisma.pushToken.update({
        where: { id: existing.id },
        data: {
          userId,
          deviceType,
          deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }

    // Create new token
    return this.prisma.pushToken.create({
      data: {
        userId,
        token,
        deviceType,
        deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  async unregisterToken(token: string, userId: string) {
    const pushToken = await this.prisma.pushToken.findUnique({
      where: { token },
    });

    if (!pushToken || pushToken.userId !== userId) {
      return null;
    }

    return this.prisma.pushToken.update({
      where: { id: pushToken.id },
      data: { isActive: false },
    });
  }

  async getUserTokens(userId: string) {
    return this.prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushNotificationsEnabled: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return this.getDefaultPreferences();
    }

    const prefs = user.notificationPreferences as NotificationPreferences | null;

    return {
      enabled: user.pushNotificationsEnabled,
      quietHoursStart: prefs?.quietHoursStart || '22:00',
      quietHoursEnd: prefs?.quietHoursEnd || '07:00',
      types: {
        messages: prefs?.types?.messages ?? true,
        assignments: prefs?.types?.assignments ?? true,
        grades: prefs?.types?.grades ?? true,
        attendance: prefs?.types?.attendance ?? true,
        announcements: prefs?.types?.announcements ?? true,
        reminders: prefs?.types?.reminders ?? true,
      },
    };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences> & { types?: Record<string, boolean> },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const currentPrefs = (user?.notificationPreferences as unknown as NotificationPreferences) ||
      this.getDefaultPreferences();

    const updatedPrefs: NotificationPreferences = {
      ...currentPrefs,
      ...preferences,
      types: {
        ...currentPrefs.types,
        ...(preferences.types || {}),
      },
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        pushNotificationsEnabled: preferences.enabled ?? currentPrefs.enabled,
        notificationPreferences: updatedPrefs as any,
      },
    });
  }

  async shouldSendNotification(
    userId: string,
    type: keyof NotificationPreferences['types'],
  ): Promise<boolean> {
    const prefs = await this.getNotificationPreferences(userId);

    // Check if push notifications are enabled
    if (!prefs.enabled) {
      return false;
    }

    // Check if this notification type is enabled
    if (!prefs.types[type]) {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      if (this.isInQuietHours(currentTime, prefs.quietHoursStart, prefs.quietHoursEnd)) {
        return false;
      }
    }

    return true;
  }

  private isInQuietHours(currentTime: string, start: string, end: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes < endMinutes) {
      // Same day range (e.g., 10:00 - 14:00)
      return current >= startMinutes && current <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 07:00)
      return current >= startMinutes || current <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    type: keyof NotificationPreferences['types'],
    data?: Record<string, any>,
  ) {
    // Check if we should send
    const shouldSend = await this.shouldSendNotification(userId, type);
    if (!shouldSend) {
      this.logger.debug(`Notification skipped for user ${userId} (type: ${type})`);
      return null;
    }

    // Get user tokens
    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) {
      this.logger.debug(`No active tokens for user ${userId}`);
      return null;
    }

    // Prepare payload
    const payload: PushNotificationPayload = {
      to: tokens.map((t) => t.token),
      title,
      body,
      data: {
        ...data,
        type,
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      priority: 'high',
    };

    // TODO: Send to Expo Push Service
    // For now, just log the notification
    this.logger.log(`Sending notification to user ${userId}: ${title}`);
    this.logger.debug(JSON.stringify(payload));

    // TODO: Implement actual Expo Push API call
    // const response = await fetch('https://exp.host/--/api/v2/push/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // });

    return payload;
  }

  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    type: keyof NotificationPreferences['types'],
    data?: Record<string, any>,
  ) {
    const results = await Promise.all(
      userIds.map((userId) =>
        this.sendNotification(userId, title, body, type, data).catch((err) => {
          this.logger.error(`Failed to send notification to ${userId}:`, err);
          return null;
        }),
      ),
    );

    return results.filter((r) => r !== null);
  }

  async sendTestNotification(userId: string) {
    return this.sendNotification(
      userId,
      'Test Notification',
      'This is a test notification from School Hub!',
      'announcements',
      { test: true },
    );
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      types: {
        messages: true,
        assignments: true,
        grades: true,
        attendance: true,
        announcements: true,
        reminders: true,
      },
    };
  }
}
