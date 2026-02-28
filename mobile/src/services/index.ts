/**
 * Services Index
 * 
 * Central export point for all API services.
 */

// API Client & Utilities
export { 
  default as apiClient,
  ApiError,
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from './api-client';

// Services
export { default as authService, authService as auth } from './auth.service';
export { default as userService, userService as user } from './user.service';
export { default as messagingService, messagingService as messaging } from './messaging.service';
export { default as courseService, courseService as course } from './course.service';
export { default as gradingService, gradingService as grading } from './grading.service';
export { default as attendanceService, attendanceService as attendance } from './attendance.service';
export { default as fileService, fileService as file } from './file.service';
export { default as adminService, adminService as admin } from './admin.service';
export { default as socketService, socketService as socket } from './socket.service';

// Push Notification Service
export {
  NotificationCategory,
  configureNotificationHandler,
  registerNotificationCategories,
  requestNotificationPermissions,
  getPushToken,
  registerPushTokenWithBackend,
  unregisterPushToken,
  initializePushNotifications,
  setupNotificationListeners,
  removeNotificationListeners,
  getDeepLinkPathFromNotification,
  scheduleLocalNotification,
  cancelScheduledNotification,
  clearAllNotifications,
  getBadgeCount,
  setBadgeCount,
  getScheduledNotifications,
  cancelAllScheduledNotifications,
  type NotificationData,
  type NotificationReceivedCallback,
  type NotificationResponseCallback,
} from './notifications.service';

// Default export with all services
export { default } from './api-client';
