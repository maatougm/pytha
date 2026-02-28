// Core Application hooks
export { useRole } from './useRole';
export { useAssignments, useAssignment, useMySubmission, useGrades } from './useAssignments';
export { useCourses, useCourse, useMyClasses, useClass, useMyEnrollments } from './useCourses';
export { useDashboardStats, useTodaysSchedule, useRecentActivity } from './useDashboard';
export { useProfile, useUpdateProfile, useChildren, useNotificationPreferences, useUpdateNotificationPreferences } from './useProfile';
export { useChannels, useChannel, useChannelMessages, useSendMessage, useMarkAsRead } from './useMessages';
export { useChat } from './useChat';

// Accessibility hooks
export {
  useScreenReader,
  useReducedMotion,
  useBoldText,
  useAccessibilityFocus,
  createAccessibilityProps,
  buttonAccessibility,
  inputAccessibility,
  switchAccessibility,
  listItemAccessibility,
  tabAccessibility,
  headerAccessibility,
  imageAccessibility,
  linkAccessibility,
  checkboxAccessibility,
  radioAccessibility,
  alertAccessibility,
  formatNumberForScreenReader,
  formatDateForScreenReader,
  formatTimeForScreenReader,
  truncateForAccessibility,
  progressAccessibility,
  ratingAccessibility,
  badgeAccessibility,
} from './useAccessibility';

// Notification hooks
export {
  useNotifications,
  useNotificationType,
  notificationTemplates,
} from './useNotifications';

// Biometric hooks
export {
  useBiometric,
  useAppLock,
} from './useBiometric';

// Network & Offline hooks
export {
  useNetworkStatus,
  useOnlineCallback,
  useUnmeteredConnection,
  useRefreshNetworkStatus,
} from './useNetworkStatus';

export {
  useOffline,
  useOfflineQueue,
  useCachedQuery,
} from './useOffline';

// Encryption hooks
export {
  useEncryption,
  useEncryptedChat,
} from './useEncryption';

// Calendar hooks
export {
  useCalendar,
  useUpcomingEvents,
} from './useCalendar';

// File upload hooks
export {
  useFileUpload,
  useMultipleFileUpload,
} from './useFileUpload';

// Phase 3: Collaboration hooks
export {
  useCollaboration,
  useTypingIndicator,
  useUserPresence,
} from './useCollaboration';

// Phase 3: Search hooks
export {
  useSearch,
  useDebouncedSearch,
  useFilteredSearch,
} from './useSearch';

// Phase 3: Analytics hooks
export {
  useAnalytics,
  useCourseAnalytics,
  useLearningStreak,
  useStudyTimer,
} from './useAnalytics';

// Phase 3: PDF Export hooks
export {
  usePDFExport,
  useGradeReportData,
  useAttendanceReportData,
  useProgressReportData,
} from './usePDFExport';

// Phase 4: Parent hooks
export {
  useParent,
  useStudentProgress,
  useFeePayments,
  useConferences,
  useReportCards,
  useBehaviorRecords,
  useAttendanceSummary,
  useTeacherCommunication,
} from './useParent';

// API hooks
export { useSocket } from './useSocket';
