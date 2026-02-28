// Type declarations for modules without type definitions

declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(sql: string): Promise<void>;
    runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
    getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
    getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
    closeAsync(): Promise<void>;
  }

  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
    details?: {
      isConnectionExpensive?: boolean;
    };
  }

  export function addEventListener(listener: (state: NetInfoState) => void): () => void;
  export function fetch(): Promise<NetInfoState>;
}

declare module 'expo-calendar' {
  export interface Calendar {
    id: string;
    title: string;
    source: { name: string; id?: string };
    allowedAvailabilities: string[];
  }

  export interface Event {
    id?: string;
    title: string;
    startDate: Date | string;
    endDate: Date | string;
    location?: string;
    notes?: string;
    calendarId?: string;
    alarms?: Array<{
      relativeOffset: number;
      method: string;
    }>;
    recurrenceRule?: {
      frequency: Frequency;
    };
  }

  export enum EntityTypes {
    EVENT = 'event',
    REMINDER = 'reminder',
  }

  export enum CalendarAccessLevel {
    OWNER = 'owner',
    EDITOR = 'editor',
    CONTRIBUTOR = 'contributor',
    READ = 'read',
    NONE = 'none',
  }

  export enum AlarmMethod {
    ALERT = 'alert',
    EMAIL = 'email',
    SMS = 'sms',
  }

  export enum Frequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
  }

  export interface CalendarSource {
    id?: string;
    name: string;
    type: string;
    isLocalAccount?: boolean;
  }

  export function getCalendarsAsync(entityType?: string): Promise<Calendar[]>;
  export function getDefaultCalendarAsync(): Promise<Calendar>;
  export function createCalendarAsync(details: {
    title: string;
    color?: string;
    entityType: string;
    sourceId?: string;
    source?: CalendarSource;
    name?: string;
    ownerAccount?: string;
    accessLevel?: string;
  }): Promise<string>;
  export function requestCalendarPermissionsAsync(): Promise<{ status: string }>;
  export function getCalendarPermissionsAsync(): Promise<{ status: string }>;
  export function getEventsAsync(
    calendarIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Event[]>;
  export function createEventAsync(
    calendarId: string,
    event: Partial<Event>
  ): Promise<string>;
  export function updateEventAsync(
    eventId: string,
    updates: Partial<Event>
  ): Promise<void>;
  export function deleteEventAsync(eventId: string): Promise<void>;
}

declare module 'expo-notifications' {
  export interface NotificationBehavior {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    shouldShowBanner: boolean;
    shouldShowList: boolean;
  }

  export interface NotificationContent {
    title?: string;
    body?: string;
    data?: Record<string, any>;
    sound?: string | boolean;
    attachments?: Array<{
      url?: string;
      identifier?: string;
      type?: string;
    }>;
  }

  export interface Notification {
    request: {
      identifier: string;
      content: NotificationContent & {
        title: string | null;
        body: string | null;
      };
      trigger: any;
    };
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
  }

  export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

  export interface Subscription {
    remove(): void;
  }

  export interface NotificationTriggerInput {
    seconds?: number;
    repeats?: boolean;
  }

  export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: NotificationTriggerInput | null;
  }

  export interface PushToken {
    data: string;
    type: 'ios' | 'android';
  }

  export enum AndroidImportance {
    UNSPECIFIED = -1000,
    NONE = 0,
    MIN = 1,
    LOW = 2,
    DEFAULT = 3,
    HIGH = 4,
    MAX = 5,
  }

  export function setNotificationHandler(
    handler: {
      handleNotification: () => Promise<NotificationBehavior>;
    }
  ): void;

  export function addNotificationReceivedListener(
    listener: (notification: Notification) => void
  ): Subscription;

  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): Subscription;

  export function getPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  export function requestPermissionsAsync(options?: any): Promise<{ status: PermissionStatus }>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<PushToken>;
  
  export function setNotificationChannelAsync(
    channelId: string,
    channel: {
      name: string;
      importance: AndroidImportance;
      vibrationPattern?: number[];
      enableVibrate?: boolean;
      enableLights?: boolean;
    }
  ): Promise<void>;

  export function scheduleNotificationAsync(
    request: {
      content: NotificationContent;
      trigger: NotificationTriggerInput | null;
    }
  ): Promise<string>;

  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]>;
  export function setBadgeCountAsync(count: number): Promise<void>;
}

declare module 'expo-print' {
  export interface PrintOptions {
    html?: string;
    uri?: string;
    width?: number;
    height?: number;
    padding?: number;
    marks?: {
      dimensions?: { width: number; height: number };
      bleed?: number;
      cornerRadius?: number;
    };
  }

  export function printAsync(options: PrintOptions): Promise<void>;
  
  export function printToFileAsync(options: PrintOptions & {
    base64?: boolean;
  }): Promise<{ uri: string; numberOfPages: number }>;
}

declare module 'expo-sharing' {
  export function shareAsync(url: string, options?: {
    dialogTitle?: string;
    UTI?: string;
    mimeType?: string;
  }): Promise<void>;
  
  export function isAvailableAsync(): Promise<boolean>;
}

declare module 'expo-file-system' {
  export const cacheDirectory: string | null;
  export const documentDirectory: string | null;
  
  export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    md5?: string;
    modificationTime?: number;
  }
  
  export function getInfoAsync(uri: string, options?: { md5?: boolean; size?: boolean }): Promise<FileInfo>;
  export function readAsStringAsync(uri: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<string>;
  export function writeAsStringAsync(uri: string, content: string, options?: { encoding?: 'utf8' | 'base64' }): Promise<void>;
  export function deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(uri: string): Promise<string[]>;
  export function downloadAsync(uri: string, fileUri: string, options?: {
    headers?: Record<string, string>;
  }): Promise<{ uri: string; status: number; headers: Record<string, string>; md5?: string }>;
}

declare module 'uuid' {
  export function v4(): string;
  export function v4(options?: { random?: number[] }): string;
  export function v4(options?: { rng?: () => number[] }): string;
}
