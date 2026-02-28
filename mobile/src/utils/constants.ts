/**
 * App Constants for School Hub Mobile
 * 
 * Centralized constants for API endpoints, storage keys,
 * query keys, pagination defaults, and app configuration.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================
// APP CONFIGURATION
// ============================================================

export const APP_CONFIG = {
  name: Constants.expoConfig?.extra?.appName || process.env.EXPO_PUBLIC_APP_NAME || 'School Hub',
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
  bundleIdentifier: Constants.expoConfig?.ios?.bundleIdentifier || 'com.schoolhub.app',
  packageName: Constants.expoConfig?.android?.package || 'com.schoolhub.app',
  environment: (process.env.EXPO_PUBLIC_ENV as 'development' | 'staging' | 'production') || 'development',
};

// ============================================================
// API CONFIGURATION
// ============================================================

// Your computer's IP address - UPDATE THIS to match your network
const COMPUTER_IP = '10.181.191.47';

// Use IP for native devices, localhost for web
const DEFAULT_API_HOST = Platform.OS === 'web' ? 'localhost:3000' : `${COMPUTER_IP}:3000`;

export const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  process.env.EXPO_PUBLIC_API_URL || 
  `http://${DEFAULT_API_HOST}/api`;

export const WS_BASE_URL = 
  Constants.expoConfig?.extra?.wsUrl || 
  process.env.EXPO_PUBLIC_WS_URL || 
  `http://${DEFAULT_API_HOST}`;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    CHILDREN: '/users/children',
    NOTIFICATIONS: '/users/notifications/preferences',
  },
  
  // Channels & Messaging
  CHANNELS: {
    BASE: '/channels',
    BY_ID: (id: string) => `/channels/${id}`,
    JOIN: (id: string) => `/channels/${id}/join`,
    LEAVE: (id: string) => `/channels/${id}/leave`,
    MEMBERS: (id: string) => `/channels/${id}/members`,
    MESSAGES: (id: string) => `/channels/${id}/messages`,
    MUTE: (id: string) => `/channels/${id}/mute`,
    UNMUTE: (id: string) => `/channels/${id}/unmute`,
    SEARCH: '/channels/search',
  },
  
  // Messages
  MESSAGES: {
    BASE: '/messages',
    BY_ID: (id: string) => `/messages/${id}`,
    EDIT: (id: string) => `/messages/${id}/edit`,
    DELETE: (id: string) => `/messages/${id}/delete`,
    READ: (id: string) => `/messages/${id}/read`,
    REACTIONS: (id: string) => `/messages/${id}/reactions`,
  },
  
  // Courses
  COURSES: {
    BASE: '/courses',
    BY_ID: (id: string) => `/courses/${id}`,
    CLASSES: '/courses/classes',
    CLASS_BY_ID: (id: string) => `/courses/classes/${id}`,
    ENROLL: (classId: string) => `/courses/classes/${classId}/enroll`,
    SCHEDULES: (classId: string) => `/courses/classes/${classId}/schedules`,
  },
  
  // Assignments & Grading
  ASSIGNMENTS: {
    BASE: '/assignments',
    BY_ID: (id: string) => `/assignments/${id}`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
    GRADE: (id: string) => `/assignments/${id}/grade`,
    SUBMISSIONS: (id: string) => `/assignments/${id}/submissions`,
  },
  
  // Grades
  GRADES: {
    BASE: '/grades',
    BY_ID: (id: string) => `/grades/${id}`,
    GRADEBOOK: '/grades/gradebook',
    FINALIZE: (id: string) => `/grades/${id}/finalize`,
  },
  
  // Attendance
  ATTENDANCE: {
    BASE: '/attendance',
    SESSIONS: '/attendance/sessions',
    SESSION_BY_ID: (id: string) => `/attendance/sessions/${id}`,
    MARK: (sessionId: string, studentId: string) => 
      `/attendance/sessions/${sessionId}/students/${studentId}`,
    BULK_MARK: (sessionId: string) => `/attendance/sessions/${sessionId}/bulk`,
    SUMMARY: '/attendance/summary',
    WEEKLY: '/attendance/weekly',
  },
  
  // Files
  FILES: {
    BASE: '/files',
    UPLOAD: '/files/upload',
    BY_ID: (id: string) => `/files/${id}`,
    DOWNLOAD: (id: string) => `/files/${id}/download`,
    PERMISSIONS: (id: string) => `/files/${id}/permissions`,
    QUOTA: '/files/quota',
    ALLOWED_TYPES: '/files/allowed-types',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    METRICS: '/admin/metrics',
    TIMELINE: '/admin/timeline',
    REALTIME: '/admin/realtime',
    USERS: '/admin/users',
    USER_BY_ID: (id: string) => `/admin/users/${id}`,
    USER_STATUS: (id: string) => `/admin/users/${id}/status`,
    BULK_ACTION: '/admin/users/bulk-action',
    INVITE: '/admin/users/invite',
    AUDIT_LOGS: '/admin/audit-logs',
    MODERATION: '/admin/moderation',
    SETTINGS: '/admin/settings',
    HEALTH: '/admin/health',
    PROMOTE_STUDENTS: '/admin/promote-students',
  },
} as const;

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  // Auth tokens
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  
  // User data
  USER: 'user_data',
  USER_ROLE: 'user_role',
  
  // Settings
  THEME: 'theme_preference',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notification_settings',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  
  // Onboarding
  ONBOARDING_COMPLETE: 'onboarding_complete',
  
  // Cache
  DASHBOARD_CACHE: 'dashboard_cache',
  COURSES_CACHE: 'courses_cache',
  MESSAGES_CACHE: 'messages_cache',
} as const;

// ============================================================
// QUERY KEYS (TanStack Query)
// ============================================================

export const QUERY_KEYS = {
  // Auth
  AUTH: {
    ME: ['auth', 'me'],
    SESSION: ['auth', 'session'],
  },
  
  // Users
  USERS: {
    ALL: ['users'],
    BY_ID: (id: string) => ['users', id],
    PROFILE: ['users', 'profile'],
    CHILDREN: ['users', 'children'],
    NOTIFICATIONS: ['users', 'notifications'],
  },
  
  // Channels
  CHANNELS: {
    ALL: ['channels'],
    BY_ID: (id: string) => ['channels', id],
    MESSAGES: (id: string) => ['channels', id, 'messages'],
    MEMBERS: (id: string) => ['channels', id, 'members'],
    UNREAD: ['channels', 'unread'],
  },
  
  // Courses
  COURSES: {
    ALL: ['courses'],
    BY_ID: (id: string) => ['courses', id],
    CLASSES: ['courses', 'classes'],
    CLASS_BY_ID: (id: string) => ['courses', 'classes', id],
    ENROLLMENTS: (classId: string) => ['courses', 'classes', classId, 'enrollments'],
    SCHEDULES: (classId: string) => ['courses', 'classes', classId, 'schedules'],
  },
  
  // Assignments
  ASSIGNMENTS: {
    ALL: ['assignments'],
    BY_ID: (id: string) => ['assignments', id],
    BY_COURSE: (courseId: string) => ['assignments', 'course', courseId],
    SUBMISSIONS: (id: string) => ['assignments', id, 'submissions'],
  },
  
  // Grades
  GRADES: {
    ALL: ['grades'],
    BY_ID: (id: string) => ['grades', id],
    GRADEBOOK: (classId: string) => ['grades', 'gradebook', classId],
    BY_STUDENT: (studentId: string) => ['grades', 'student', studentId],
  },
  
  // Attendance
  ATTENDANCE: {
    SESSIONS: ['attendance', 'sessions'],
    SESSION_BY_ID: (id: string) => ['attendance', 'sessions', id],
    BY_CLASS: (classId: string) => ['attendance', 'class', classId],
    BY_STUDENT: (studentId: string) => ['attendance', 'student', studentId],
    SUMMARY: ['attendance', 'summary'],
    WEEKLY: ['attendance', 'weekly'],
  },
  
  // Files
  FILES: {
    ALL: ['files'],
    BY_ID: (id: string) => ['files', id],
    QUOTA: ['files', 'quota'],
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: ['admin', 'dashboard'],
    METRICS: ['admin', 'metrics'],
    TIMELINE: ['admin', 'timeline'],
    REALTIME: ['admin', 'realtime'],
    USERS: ['admin', 'users'],
    AUDIT_LOGS: ['admin', 'audit-logs'],
    MODERATION: ['admin', 'moderation'],
    HEALTH: ['admin', 'health'],
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: ['dashboard', 'overview'],
    STATS: ['dashboard', 'stats'],
    ACTIVITY: ['dashboard', 'activity'],
  },
} as const;

// ============================================================
// PAGINATION DEFAULTS
// ============================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MESSAGES_LIMIT: 50,
  NOTIFICATIONS_LIMIT: 20,
} as const;

// ============================================================
// DATE/TIME FORMATS
// ============================================================

export const DATE_FORMATS = {
  // Display formats
  FULL: 'MMMM d, yyyy',
  SHORT: 'MMM d, yyyy',
  COMPACT: 'MM/dd/yyyy',
  MONTH_YEAR: 'MMMM yyyy',
  
  // Time formats
  TIME: 'h:mm a',
  TIME_24H: 'HH:mm',
  DATETIME: 'MMM d, yyyy h:mm a',
  DATETIME_SHORT: 'MMM d, h:mm a',
  
  // Relative
  RELATIVE: 'relative',
  
  // ISO formats
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DATE_ISO: 'yyyy-MM-dd',
} as const;

// ============================================================
// FILE UPLOAD LIMITS
// ============================================================

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Allowed MIME types by category
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    ARCHIVE: ['application/zip', 'application/x-zip-compressed'],
  },
  
  // File extensions
  ALLOWED_EXTENSIONS: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    VIDEO: ['.mp4', '.webm', '.mov'],
    AUDIO: ['.mp3', '.wav', '.ogg'],
    ARCHIVE: ['.zip'],
  },
} as const;

// ============================================================
// UI CONSTANTS
// ============================================================

export const UI = {
  // Animation durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Debounce delays
  DEBOUNCE: {
    SEARCH: 300,
    INPUT: 500,
    SCROLL: 100,
  },
  
  // Toast durations
  TOAST: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
  },
  
  // Screen padding
  SCREEN_PADDING: 16,
  
  // Max lengths
  MAX_INPUT_LENGTH: {
    NAME: 100,
    EMAIL: 255,
    PASSWORD: 128,
    MESSAGE: 2000,
    DESCRIPTION: 1000,
    SEARCH: 100,
  },
  
  // Avatar sizes
  AVATAR_SIZE: {
    XS: 24,
    SM: 32,
    MD: 40,
    LG: 64,
    XL: 96,
  },
} as const;

// ============================================================
// USER ROLES
// ============================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.TEACHER]: 'Teacher',
  [USER_ROLES.PARENT]: 'Parent',
  [USER_ROLES.STUDENT]: 'Student',
};

export const ROLE_COLORS: Record<string, string> = {
  [USER_ROLES.ADMIN]: '#ef4444',    // Red
  [USER_ROLES.TEACHER]: '#3b82f6',  // Blue
  [USER_ROLES.PARENT]: '#10b981',   // Green
  [USER_ROLES.STUDENT]: '#f59e0b',  // Amber
};

// ============================================================
// CHANNEL TYPES
// ============================================================

export const CHANNEL_TYPES = {
  PODCAST: 'podcast',
  CLASSROOM: 'classroom',
  DIRECT_MESSAGE: 'direct_message',
  TEACHER_PARENT: 'teacher_parent',
  TEACHER_STUDENT: 'teacher_student',
  ADMIN_BROADCAST: 'admin_broadcast',
  GROUP: 'group',
} as const;

export const CHANNEL_TYPE_LABELS: Record<string, string> = {
  [CHANNEL_TYPES.PODCAST]: 'Podcast',
  [CHANNEL_TYPES.CLASSROOM]: 'Classroom',
  [CHANNEL_TYPES.DIRECT_MESSAGE]: 'Direct Message',
  [CHANNEL_TYPES.TEACHER_PARENT]: 'Teacher-Parent',
  [CHANNEL_TYPES.TEACHER_STUDENT]: 'Teacher-Student',
  [CHANNEL_TYPES.ADMIN_BROADCAST]: 'Announcement',
  [CHANNEL_TYPES.GROUP]: 'Group',
};

// ============================================================
// ATTENDANCE STATUS
// ============================================================

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.ABSENT]: 'Absent',
  [ATTENDANCE_STATUS.LATE]: 'Late',
  [ATTENDANCE_STATUS.EXCUSED]: 'Excused',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  [ATTENDANCE_STATUS.PRESENT]: '#10b981',  // Green
  [ATTENDANCE_STATUS.ABSENT]: '#ef4444',   // Red
  [ATTENDANCE_STATUS.LATE]: '#f59e0b',     // Amber
  [ATTENDANCE_STATUS.EXCUSED]: '#6b7280',  // Gray
};

// ============================================================
// ASSIGNMENT TYPES
// ============================================================

export const ASSIGNMENT_TYPES = {
  HOMEWORK: 'homework',
  QUIZ: 'quiz',
  EXAM: 'exam',
  PROJECT: 'project',
  PARTICIPATION: 'participation',
  OTHER: 'other',
} as const;

export const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  [ASSIGNMENT_TYPES.HOMEWORK]: 'Homework',
  [ASSIGNMENT_TYPES.QUIZ]: 'Quiz',
  [ASSIGNMENT_TYPES.EXAM]: 'Exam',
  [ASSIGNMENT_TYPES.PROJECT]: 'Project',
  [ASSIGNMENT_TYPES.PARTICIPATION]: 'Participation',
  [ASSIGNMENT_TYPES.OTHER]: 'Other',
};

// ============================================================
// ERROR MESSAGES
// ============================================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  OFFLINE: 'You are offline. Please check your connection.',
  
  // Auth
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_REQUIRED: 'Email is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    PASSWORD_REQUIRED: 'Password is required.',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
    PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  },
  
  // File upload
  FILE: {
    TOO_LARGE: 'File is too large. Maximum size is 10MB.',
    INVALID_TYPE: 'Invalid file type.',
    UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  },
} as const;

// ============================================================
// SUCCESS MESSAGES
// ============================================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  UPLOADED: 'File uploaded successfully.',
  SENT: 'Message sent successfully.',
  JOINED: 'Joined successfully.',
  LEFT: 'Left successfully.',
  SUBMITTED: 'Submitted successfully.',
  GRADED: 'Graded successfully.',
} as const;
