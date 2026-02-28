/**
 * API Types for School Hub Mobile App
 * 
 * TypeScript interfaces for all API requests/responses
 * mirroring the NestJS backend DTOs and entities.
 */

// ============================================================
// COMMON / SHARED TYPES
// ============================================================

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export type ChannelType = 
  | 'podcast' 
  | 'classroom' 
  | 'direct_message' 
  | 'teacher_parent' 
  | 'teacher_student' 
  | 'admin_broadcast' 
  | 'group';

export type ChannelMemberRole = 'owner' | 'moderator' | 'member' | 'student';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type FileCategory = 'image' | 'document' | 'audio' | 'video' | 'archive';

export type VirusScanStatus = 'pending' | 'clean' | 'infected' | 'error';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================
// USER & AUTH TYPES
// ============================================================

export interface Role {
  id: string;
  name: UserRole;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  gradeLevel?: string;
  status: 'active' | 'suspended' | 'archived';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles?: { role: Role }[];
}

export interface UserWithRoles extends User {
  roles: { role: Role }[];
}

export interface Profile extends User {
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  messageNotifications: boolean;
  assignmentNotifications: boolean;
  gradeNotifications: boolean;
  attendanceNotifications: boolean;
  announcementNotifications: boolean;
}

export interface Child {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  avatarUrl?: string;
}

export interface ParentStudentLink {
  parentId: string;
  studentId: string;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  user: User;
  accessToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

// ============================================================
// MESSAGING TYPES
// ============================================================

export interface Channel {
  id: string;
  type: ChannelType;
  name?: string;
  description?: string;
  classId?: string;
  isArchived: boolean;
  createdBy?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  maxMembers?: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  members?: ChannelMember[];
  unreadCount?: number;
}

export interface ChannelMember {
  channelId: string;
  userId: string;
  role: ChannelMemberRole;
  isMuted: boolean;
  isBanned: boolean;
  joinedAt: string;
  lastReadAt?: string;
  user?: User;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileId: string;
  file?: FileInfo;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  replyTo?: Message;
  attachments?: MessageAttachment[];
  reactions?: Reaction[];
  readReceipts?: MessageRead[];
  mentions?: Mention[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: User;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user?: User;
}

export interface Mention {
  id: string;
  messageId: string;
  userId: string;
  isRead: boolean;
  createdAt: string;
  user?: User;
}

export interface TypingIndicator {
  id: string;
  channelId: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  user?: User;
}

export interface ChannelMute {
  id: string;
  channelId: string;
  mutedUserId: string;
  mutedById: string;
  expiresAt?: string;
  reason?: string;
  createdAt: string;
}

export interface ChannelReport {
  id: string;
  channelId: string;
  reportedById: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  assignedToId?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EditHistory {
  id: string;
  messageId: string;
  previousContent: string;
  editedById: string;
  createdAt: string;
}

// Messaging DTOs
export interface CreateChannelRequest {
  type: ChannelType;
  name?: string;
  description?: string;
  classId?: string;
  memberIds?: string[];
  maxMembers?: number;
}

export interface SendMessageRequest {
  content: string;
  replyToId?: string;
  attachmentIds?: string[];
}

export interface EditMessageRequest {
  content: string;
}

export interface MarkMessagesReadRequest {
  messageIds: string[];
}

export interface AddReactionRequest {
  emoji: string;
}

export interface SearchMessagesRequest {
  query: string;
  cursor?: string;
  limit?: number;
}

export interface ReportChannelRequest {
  reason: string;
}

export interface UpdateReportStatusRequest {
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
}

// ============================================================
// COURSE TYPES
// ============================================================

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
  isActive: boolean;
  createdById?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

export interface Class {
  id: string;
  courseId: string;
  academicYearId: string;
  term: string;
  section?: string;
  maxStudents?: number;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  academicYear?: AcademicYear;
  teachers?: ClassTeacher[];
  enrollments?: ClassEnrollment[];
  schedules?: Schedule[];
  studentCount?: number;
}

export interface ClassTeacher {
  id: string;
  classId: string;
  teacherId: string;
  isPrimary: boolean;
  assignedAt: string;
  teacher?: User;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  status: 'enrolled' | 'dropped' | 'completed';
  enrolledAt: string;
  droppedAt?: string;
  student?: User;
}

export interface Schedule {
  id: string;
  classId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  room?: string;
  createdAt: string;
  updatedAt: string;
}

// Course DTOs
export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
  description?: string;
  department?: string;
  credits?: number;
  isActive?: boolean;
}

export interface CreateClassRequest {
  courseId: string;
  academicYearId: string;
  term: string;
  section?: string;
  maxStudents?: number;
}

export interface UpdateClassRequest {
  term?: string;
  section?: string;
  maxStudents?: number;
  isActive?: boolean;
}

export interface EnrollStudentRequest {
  studentId: string;
}

export interface BulkEnrollRequest {
  studentIds: string[];
}

export interface AddScheduleRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface AddSchedulesRequest {
  schedules: AddScheduleRequest[];
}

export interface CourseFilters {
  department?: string;
  active?: boolean;
  search?: string;
}

export interface ClassFilters {
  term?: string;
  teacherId?: string;
  courseId?: string;
  studentId?: string;
}

// ============================================================
// GRADING TYPES
// ============================================================

export interface Assignment {
  id: string;
  classId: string;
  createdById: string;
  title: string;
  description?: string;
  type: 'homework' | 'quiz' | 'exam' | 'project' | 'participation' | 'other';
  maxPoints: number;
  points?: number;  // Alias for maxPoints for UI
  dueDate?: string;
  allowLateSubmission: boolean;
  latePenaltyPercent?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'pending' | 'submitted' | 'graded' | 'late';  // UI status
  earnedPoints?: number;  // For graded assignments
  courseName?: string;  // Display name for class
  submissionCount?: number;  // For teacher view
  studentName?: string;  // For parent view
  class?: Class;
  createdBy?: User;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileIds: string[];
  submittedAt: string;
  isLate: boolean;
  grade?: Grade;
  files?: FileInfo[];
  student?: User;
}

export interface Grade {
  id: string;
  submissionId?: string;
  studentId: string;
  assignmentId?: string;
  classId?: string;
  points: number;
  letterGrade?: string;
  feedback?: string;
  isFinalized: boolean;
  gradedById?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
  assignment?: Assignment;
  gradedBy?: User;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  assignments: {
    assignmentId: string;
    title: string;
    points: number;
    maxPoints: number;
    letterGrade?: string;
  }[];
  totalPoints: number;
  totalMaxPoints: number;
  average: number;
}

// Grading DTOs
export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  type: 'homework' | 'quiz' | 'exam' | 'project' | 'participation' | 'other';
  maxPoints: number;
  dueDate?: string;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  isPublished?: boolean;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  type?: 'homework' | 'quiz' | 'exam' | 'project' | 'participation' | 'other';
  maxPoints?: number;
  dueDate?: string;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  isPublished?: boolean;
}

export interface CreateSubmissionRequest {
  content?: string;
  fileIds?: string[];
}

export interface GradeSubmissionRequest {
  points: number;
  letterGrade?: string;
  feedback?: string;
  isFinalized?: boolean;
}

export interface BulkGradeRequest {
  grades: {
    studentId: string;
    points: number;
    letterGrade?: string;
    feedback?: string;
  }[];
}

export interface AssignmentFilters {
  classId?: string;
  type?: string;
}

// ============================================================
// ATTENDANCE TYPES
// ============================================================

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  period?: number;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  createdBy?: User;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  markedById?: string;
  markedAt?: string;
  student?: User;
  markedBy?: User;
}

// Attendance DTOs
export interface CreateAttendanceSessionRequest {
  date: string;
  period?: number;
  notes?: string;
}

export interface MarkAttendanceRequest {
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceRequest {
  records: BulkAttendanceRecord[];
  date?: string;
  period?: number;
  notes?: string;
}

export interface AttendanceFilters {
  classId?: string;
  startDate?: string;
  endDate?: string;
}

export interface WeeklyAttendance {
  weekStart: string;
  weekEnd: string;
  days: {
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }[];
}

export interface AttendanceSummary {
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  byStatus: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

// ============================================================
// FILE TYPES
// ============================================================

export interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  hash: string;
  category: FileCategory;
  uploaderId: string;
  relatedId?: string;
  relatedType?: string;
  description?: string;
  thumbnailPath?: string;
  virusScanStatus: VirusScanStatus;
  metadata?: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  uploader?: User;
}

export interface FilePermission {
  id: string;
  fileId: string;
  roleId?: string;
  userId?: string;
  canView: boolean;
  canDownload: boolean;
  createdAt: string;
  role?: Role;
  user?: User;
}

export interface UploadQuota {
  totalQuota: number;
  usedStorage: number;
  availableStorage: number;
  uploadsPerMinute: number;
  currentUploads: number;
  maxFileSize: number;
}

export interface AllowedFileTypes {
  categories: {
    image: {
      mimeTypes: string[];
      extensions: string[];
      maxSize: string;
    };
    document: {
      mimeTypes: string[];
      extensions: string[];
      maxSize: string;
    };
    audio: {
      mimeTypes: string[];
      extensions: string[];
      maxSize: string;
    };
    video: {
      mimeTypes: string[];
      extensions: string[];
      maxSize: string;
    };
    archive: {
      mimeTypes: string[];
      extensions: string[];
      maxSize: string;
    };
  };
  notes: string[];
}

// File DTOs
export interface UploadFileRequest {
  file: File;
  relatedId?: string;
  relatedType?: string;
  description?: string;
}

export interface SetFilePermissionRequest {
  roleId?: string;
  userId?: string;
  canView: boolean;
  canDownload: boolean;
}

export interface FileFilters {
  category?: string;
  uploaderId?: string;
  relatedId?: string;
  relatedType?: string;
  search?: string;
}

export interface UploadFileResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  createdAt: string;
  thumbnailUrl?: string;
  virusScanStatus: VirusScanStatus;
  warnings?: string[];
}

// ============================================================
// ADMIN TYPES
// ============================================================

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalClasses: number;
  messagesToday: number;
  filesUploaded: number;
  storageUsed: number;
}

export interface TimelineData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface RealTimeStats {
  onlineUsers: number;
  activeChannels: number;
  pendingReports: number;
  systemLoad: number;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  actor?: User;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
  };
  uptime: number;
  version: string;
}

export interface ModerationQueueItem {
  id: string;
  type: 'channel_report' | 'message' | 'file';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  details: Record<string, unknown>;
}

// Admin DTOs
export interface UserFilters {
  search?: string;
  role?: string;
  passwordVersion?: number;
  status?: string;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'suspended' | 'archived';
  reason?: string;
}

export interface BulkActionRequest {
  userIds: string[];
  action: 'activate' | 'suspend' | 'archive' | 'delete';
  reason?: string;
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface BulkInviteRequest {
  users: InviteUserRequest[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: 'active' | 'suspended' | 'archived';
}

export interface LinkParentRequest {
  parentId: string;
  studentId: string;
}

export interface SystemSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  maxFileSize: number;
  maintenanceMode: boolean;
}

export interface AuditLogFilters {
  action?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClassComposition {
  classId: string;
  className: string;
  courseName: string;
  teacherNames: string[];
  studentCount: number;
  students: {
    id: string;
    name: string;
    gradeLevel?: string;
  }[];
}

export interface PromotionPreview {
  currentGrade: string;
  nextGrade: string;
  students: {
    id: string;
    name: string;
    canPromote: boolean;
    reason?: string;
  }[];
}

// ============================================================
// PUSH NOTIFICATION TYPES
// ============================================================

export type PushNotificationType = 
  | 'message' 
  | 'assignment' 
  | 'grade' 
  | 'announcement' 
  | 'attendance' 
  | 'mention';

export interface PushNotificationPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  data: {
    channelId?: string;
    assignmentId?: string;
    courseId?: string;
    userId?: string;
    [key: string]: any;
  };
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: PushNotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
  sender?: User;
}

export interface NotificationFilters {
  type?: PushNotificationType;
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface MarkNotificationsReadRequest {
  notificationIds?: string[]; // If empty, marks all as read
}
