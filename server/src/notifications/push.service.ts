import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
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
  private readonly expo = new Expo();

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

    const validTokens = tokens
      .map((t) => t.token)
      .filter((token) => {
        if (!Expo.isExpoPushToken(token)) {
          this.logger.warn(`Push token ${token} is not a valid Expo push token`);
          return false;
        }
        return true;
      });

    if (validTokens.length === 0) {
      this.logger.debug(`No valid Expo push tokens for user ${userId}`);
      return null;
    }

    // Maintain the old payload format to return it at the end
    const payload: PushNotificationPayload = {
      to: validTokens,
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

    // Prepare payloads per token
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      title,
      body,
      data: payload.data,
      sound: payload.sound,
      priority: payload.priority,
    }));

    this.logger.log(`Sending notifications to user ${userId}: ${title}`);
    this.logger.debug(JSON.stringify(messages));

    try {
      // Chunk messages
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: any[] = [];

      // Send the chunks to the Expo push notification service
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);

          // Process tickets for immediate errors
          for (const [index, ticket] of ticketChunk.entries()) {
            if (ticket.status === 'error') {
              this.logger.error(`Error sending notification: ${ticket.message}`);
              if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                // The token is no longer valid, unregister it
                const invalidToken = chunk[index].to;
                // 'to' can be a string or array of strings in ExpoPushMessage
                const tokensToUnregister = Array.isArray(invalidToken) ? invalidToken : [invalidToken];

                for (const token of tokensToUnregister) {
                  this.logger.log(`Unregistering invalid token: ${token}`);
                  await this.unregisterToken(token, userId);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error sending push notification chunk:`, error);
        }
      }

      // TODO: Implement background receipt checks if full compliance is intended.
      // E.g. save successful ticket IDs and process them asynchronously later with getPushNotificationReceiptsAsync()

      return payload;
    } catch (error) {
      this.logger.error(`Failed to prepare/send push notifications for user ${userId}:`, error);
      return null;
    }
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
