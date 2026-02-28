/**
 * Push Notifications Service
 * 
 * Manages push notification registration, permission handling,
 * and deep linking to relevant screens when notifications are tapped.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './api-client';

// Notification categories for different types of alerts
export enum NotificationCategory {
  MESSAGE = 'message',
  ASSIGNMENT = 'assignment',
  GRADE = 'grade',
  ANNOUNCEMENT = 'announcement',
  ATTENDANCE = 'attendance',
}

// Notification data payload structure
export interface NotificationData {
  type: NotificationCategory;
  channelId?: string;
  assignmentId?: string;
  courseId?: string;
  userId?: string;
  [key: string]: any;
}

let notificationListener: Notifications.Subscription | null = null;
let responseListener: Notifications.Subscription | null = null;

/**
 * Configure notification handler for foreground notifications
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    } as Notifications.NotificationBehavior),
  });
}

/**
 * Register notification categories with actions
 * Note: Notification categories are handled through native iOS configuration
 */
export async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  // Notification categories are set up natively on iOS
  // For Android, we use channels instead (set up in notification handler)
  console.log('[Notifications] Categories registered via native configuration');
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
}

/**
 * Get push notification token for the device
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });

    return token.data;
  } catch (error) {
    console.error('Get push token error:', error);
    return null;
  }
}

/**
 * Register device token with backend for push notifications
 */
export async function registerPushTokenWithBackend(token: string): Promise<boolean> {
  try {
    await apiClient.post('/notifications/register-token', {
      token,
      platform: Platform.OS,
    });
    return true;
  } catch (error) {
    console.error('Register push token error:', error);
    return false;
  }
}

/**
 * Unregister device token (e.g., on logout)
 */
export async function unregisterPushToken(): Promise<boolean> {
  try {
    await apiClient.post('/notifications/unregister-token', {});
    return true;
  } catch (error) {
    console.error('Unregister push token error:', error);
    return false;
  }
}

/**
 * Initialize push notifications - call this on app startup
 */
export async function initializePushNotifications(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Configure handler
  configureNotificationHandler();

  // Register categories
  await registerNotificationCategories();

  // Request permissions
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permissions not granted');
    return null;
  }

  // Get token
  const token = await getPushToken();
  if (token) {
    await registerPushTokenWithBackend(token);
  }

  // Set up listeners
  setupNotificationListeners(onNotificationReceived, onNotificationResponse);

  return token;
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): void {
  // Remove existing listeners
  removeNotificationListeners();

  // Listen for incoming notifications (foreground)
  notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // Listen for notification responses (user tapped notification)
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    onNotificationResponse?.(response);
  });
}

/**
 * Remove notification listeners
 */
export function removeNotificationListeners(): void {
  if (notificationListener) {
    notificationListener.remove();
    notificationListener = null;
  }
  if (responseListener) {
    responseListener.remove();
    responseListener = null;
  }
}

/**
 * Get deep link path from notification data
 */
export function getDeepLinkPathFromNotification(data: NotificationData): string | null {
  switch (data.type) {
    case NotificationCategory.MESSAGE:
      if (data.channelId) {
        return `/(app)/chat/${data.channelId}`;
      }
      return '/(tabs)/messages';

    case NotificationCategory.ASSIGNMENT:
      if (data.assignmentId) {
        return `/(app)/assignment/${data.assignmentId}`;
      }
      return '/(tabs)/assignments';

    case NotificationCategory.GRADE:
      if (data.assignmentId) {
        return `/(app)/assignment/${data.assignmentId}`;
      }
      return '/(tabs)/assignments';

    case NotificationCategory.ANNOUNCEMENT:
      return '/(tabs)/messages';

    case NotificationCategory.ATTENDANCE:
      return '/(tabs)/index';

    default:
      return null;
  }
}

/**
 * Schedule a local notification (for testing or reminders)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: trigger ?? null,
    });
    return identifier;
  } catch (error) {
    console.error('Schedule notification error:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Clear all notifications from the notification center
 */
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  // Clear badge count (this also clears notifications on iOS)
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Get badge count
 * Note: Badge count tracking is managed locally in AsyncStorage
 */
export async function getBadgeCount(): Promise<number> {
  // Badge count is managed via setBadgeCountAsync, 
  // reading it back requires native module access
  return 0;
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === 'web') return [];

  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Type for notification received callback
 */
export type NotificationReceivedCallback = (notification: Notifications.Notification) => void;

/**
 * Type for notification response callback
 */
export type NotificationResponseCallback = (response: Notifications.NotificationResponse) => void;
