import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as Notifications.NotificationBehavior),
});

// Notification types
export type NotificationType = 
  | 'message'
  | 'assignment'
  | 'grade'
  | 'attendance'
  | 'announcement'
  | 'reminder'
  | 'system';

export interface NotificationData {
  type: NotificationType;
  id?: string;
  title?: string;
  body?: string;
  screen?: string;
  params?: Record<string, any>;
  [key: string]: any;
}

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  scheduledTime?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  pushToken: string | null;
  types: {
    messages: boolean;
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    announcements: boolean;
    reminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  pushToken: null,
  types: {
    messages: true,
    assignments: true,
    grades: true,
    attendance: true,
    announcements: true,
    reminders: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

/**
 * Hook for managing push notifications
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  // Initialize notifications
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification responses (user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        handleNotificationResponse(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Load notification settings
  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save notification settings
  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      setExpoPushToken(token.data);
      
      // Update settings with token
      const updatedSettings = { ...settings, pushToken: token.data };
      await saveSettings(updatedSettings);

      // Send token to backend
      await registerTokenWithBackend(token.data);
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });

      // Create specific channels for different notification types
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('assignments', {
        name: 'Assignments',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('grades', {
        name: 'Grades',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  };

  // Register token with backend
  const registerTokenWithBackend = async (token: string) => {
    try {
      // This would be your API call to register the token
      // await api.post('/notifications/register', { token, platform: Platform.OS });
      console.log('Token registered:', token);
    } catch (error) {
      console.error('Failed to register token with backend:', error);
    }
  };

  // Handle notification response (when user taps notification)
  const handleNotificationResponse = (data: NotificationData) => {
    console.log('Notification tapped:', data);
    // Navigation would be handled by the app navigator
    // router.push(`/${data.screen}`, { params: data.params });
  };

  // Schedule a local notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    if (!settings.enabled) return '';

    // Check quiet hours
    if (settings.quietHours.enabled && isInQuietHours()) {
      console.log('Notification delayed due to quiet hours');
      // Schedule for after quiet hours
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null,
    });

    return id;
  }, [settings]);

  // Check if current time is in quiet hours
  const isInQuietHours = (): boolean => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Spanning midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Cancel a scheduled notification
  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // Get all scheduled notifications
  const getScheduledNotifications = useCallback(async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync();
  }, []);

  // Clear badge count
  const clearBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0);
  }, []);

  // Update notification type settings
  const updateTypeSetting = useCallback(async (
    type: keyof NotificationSettings['types'],
    enabled: boolean
  ) => {
    const updatedSettings = {
      ...settings,
      types: { ...settings.types, [type]: enabled },
    };
    await saveSettings(updatedSettings);
  }, [settings]);

  // Toggle all notifications
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    const updatedSettings = { ...settings, enabled };
    await saveSettings(updatedSettings);

    if (enabled) {
      await registerForPushNotificationsAsync();
    }
  }, [settings]);

  // Update quiet hours
  const updateQuietHours = useCallback(async (
    enabled: boolean,
    start?: string,
    end?: string
  ) => {
    const updatedSettings = {
      ...settings,
      quietHours: {
        ...settings.quietHours,
        enabled,
        ...(start && { start }),
        ...(end && { end }),
      },
    };
    await saveSettings(updatedSettings);
  }, [settings]);

  // Present a notification immediately (scheduled for 1 second from now)
  const presentNotification = useCallback(async (
    title: string,
    body: string,
    data?: NotificationData
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediate notification
    });
  }, []);

  return {
    // State
    expoPushToken,
    notification,
    settings,
    permissionStatus,
    isLoading,
    
    // Actions
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    clearBadge,
    updateTypeSetting,
    toggleNotifications,
    updateQuietHours,
    presentNotification,
    registerForPushNotificationsAsync,
  };
}

/**
 * Hook for checking if specific notification type is enabled
 */
export function useNotificationType(type: keyof NotificationSettings['types']) {
  const { settings } = useNotifications();
  return settings.types[type] && settings.enabled;
}

/**
 * Hook for notification center/badge count
 */
export function useNotificationCenter() {
  const { notification, settings } = useNotifications();
  
  // Calculate unread count from notification state
  // This is a simplified version - in real app, you'd fetch from backend
  const unreadCount = notification ? 1 : 0;
  
  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    isEnabled: settings.enabled,
  };
}

/**
 * Predefined notification templates
 */
export const notificationTemplates = {
  message: (sender: string, preview: string): { title: string; body: string } => ({
    title: `New message from ${sender}`,
    body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
  }),
  
  assignment: (title: string, dueDate: string): { title: string; body: string } => ({
    title: 'New Assignment',
    body: `${title} - Due ${dueDate}`,
  }),
  
  grade: (assignment: string, grade: string): { title: string; body: string } => ({
    title: 'Grade Posted',
    body: `You received ${grade} on ${assignment}`,
  }),
  
  attendance: (status: string): { title: string; body: string } => ({
    title: 'Attendance Recorded',
    body: `You were marked ${status}`,
  }),
  
  announcement: (title: string): { title: string; body: string } => ({
    title: 'New Announcement',
    body: title,
  }),
  
  reminder: (title: string, time: string): { title: string; body: string } => ({
    title: 'Reminder',
    body: `${title} at ${time}`,
  }),
};
