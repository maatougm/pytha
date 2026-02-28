/**
 * Admin Service
 * 
 * Handles administrative operations including user management,
 * analytics, audit logs, and system health monitoring.
 */

import apiClient from './api-client';
import type {
  User,
  DashboardMetrics,
  TimelineData,
  RealTimeStats,
  AuditLog,
  SystemHealth,
  ModerationQueueItem,
  UserFilters,
  UpdateUserStatusRequest,
  BulkActionRequest,
  InviteUserRequest,
  BulkInviteRequest,
  CreateUserRequest,
  UpdateUserRequest,
  LinkParentRequest,
  SystemSettings,
  AuditLogFilters,
  ClassComposition,
  PromotionPreview,
  PaginatedResponse,
  PaginationParams,
  UserRole,
} from '../types/api';

// ============================================================
// DASHBOARD & ANALYTICS
// ============================================================

/**
 * Get dashboard metrics
 * @returns Promise with system-wide metrics
 */
export async function getAnalytics(): Promise<DashboardMetrics> {
  return apiClient.get<DashboardMetrics>('/admin/dashboard/metrics');
}

/**
 * Get activity timeline data for charts
 * @param range - Time range (week, month, quarter, year)
 * @returns Promise with timeline data
 */
export async function getActivityTimeline(
  range: 'week' | 'month' | 'quarter' | 'year' = 'week'
): Promise<TimelineData> {
  return apiClient.get<TimelineData>(`/admin/dashboard/timeline?range=${range}`);
}

/**
 * Get real-time statistics
 * @returns Promise with real-time stats
 */
export async function getRealTimeStats(): Promise<RealTimeStats> {
  return apiClient.get<RealTimeStats>('/admin/dashboard/realtime');
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * Get all users with filtering and pagination
 * @param filters - Filter options (search, role, status)
 * @param params - Pagination parameters
 * @returns Promise with paginated users
 */
export async function getUsers(
  filters?: UserFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<User>> {
  const queryParams = new URLSearchParams();

  // Add filters
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }
  if (filters?.role) {
    queryParams.append('role', filters.role);
  }
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }

  // Add pagination
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<User>>(
    `/admin/users${query ? `?${query}` : ''}`
  );
}

/**
 * Create a new user (admin function)
 * @param data - User creation data
 * @returns Promise with created user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  return apiClient.post<User>('/admin/users/create', data);
}

/**
 * Update user details
 * @param id - User ID
 * @param data - User update data
 * @returns Promise with updated user
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<User> {
  return apiClient.put<User>(`/admin/users/${id}`, data);
}

/**
 * Update user status (activate, suspend, archive)
 * @param id - User ID
 * @param data - Status update data
 * @returns Promise with updated user
 */
export async function updateUserStatus(
  id: string,
  data: UpdateUserStatusRequest
): Promise<User> {
  return apiClient.put<User>(`/admin/users/${id}/status`, data);
}

/**
 * Delete a user permanently
 * @param id - User ID
 * @returns Promise that resolves when user is deleted
 */
export async function deleteUser(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/users/${id}`);
}

/**
 * Perform bulk action on multiple users
 * @param data - Bulk action data
 * @returns Promise with action results
 */
export async function bulkAction(
  data: BulkActionRequest
): Promise<{ processed: number; errors: string[] }> {
  return apiClient.post<{ processed: number; errors: string[] }>(
    '/admin/users/bulk-action',
    data
  );
}

/**
 * Invite a new user via email
 * @param data - Invite data
 * @returns Promise with invite result
 */
export async function inviteUser(
  data: InviteUserRequest
): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    '/admin/users/invite',
    data
  );
}

/**
 * Bulk invite multiple users
 * @param data - Bulk invite data
 * @returns Promise with invite results
 */
export async function bulkInviteUsers(
  data: BulkInviteRequest
): Promise<{ invited: number; errors: string[] }> {
  return apiClient.post<{ invited: number; errors: string[] }>(
    '/admin/users/bulk-invite',
    data
  );
}

/**
 * Reset user password (admin function)
 * @param id - User ID
 * @returns Promise with reset result
 */
export async function resetUserPassword(
  id: string
): Promise<{ success: boolean; tempPassword?: string; message: string }> {
  return apiClient.post<{ success: boolean; tempPassword?: string; message: string }>(
    `/admin/users/${id}/reset-password`,
    {}
  );
}

/**
 * Link a parent to a student
 * @param data - Parent-student link data
 * @returns Promise with link result
 */
export async function linkParent(
  data: LinkParentRequest
): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    '/admin/users/link-parent',
    data
  );
}

// ============================================================
// AUDIT LOGS
// ============================================================

/**
 * Get system audit logs
 * @param filters - Filter options (action, actorId, date range)
 * @param params - Pagination parameters
 * @returns Promise with paginated audit logs
 */
export async function getAuditLogs(
  filters?: AuditLogFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<AuditLog>> {
  const queryParams = new URLSearchParams();

  // Add filters
  if (filters?.action) {
    queryParams.append('action', filters.action);
  }
  if (filters?.actorId) {
    queryParams.append('actorId', filters.actorId);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  // Add pagination
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<AuditLog>>(
    `/admin/audit-logs${query ? `?${query}` : ''}`
  );
}

// ============================================================
// SYSTEM HEALTH & SETTINGS
// ============================================================

/**
 * Get system health status
 * @returns Promise with system health data
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  return apiClient.get<SystemHealth>('/health');
}

/**
 * Get current system settings
 * @returns Promise with system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  return apiClient.get<SystemSettings>('/admin/settings');
}

/**
 * Update system settings
 * @param settings - Settings to update
 * @returns Promise with updated settings
 */
export async function updateSystemSettings(
  settings: Partial<SystemSettings>
): Promise<SystemSettings> {
  return apiClient.put<SystemSettings>('/admin/settings', settings);
}

/**
 * Trigger manual cleanup of old data
 * @returns Promise with cleanup result
 */
export async function triggerCleanup(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/admin/tasks/cleanup', {});
}

// ============================================================
// CONTENT MODERATION
// ============================================================

/**
 * Get content moderation queue
 * @param params - Pagination parameters
 * @returns Promise with moderation queue items
 */
export async function getModerationQueue(
  params?: PaginationParams
): Promise<PaginatedResponse<ModerationQueueItem>> {
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<ModerationQueueItem>>(
    `/admin/moderation/queue${query ? `?${query}` : ''}`
  );
}

/**
 * Perform action on moderation queue item
 * @param reportId - Queue item ID
 * @param data - Action data
 * @returns Promise that resolves when action is complete
 */
export async function moderateContent(
  reportId: string,
  data: { action: 'resolve' | 'dismiss' | 'action' | 'delete'; reason?: string }
): Promise<void> {
  return apiClient.post<void>(`/admin/moderation/queue/${reportId}/action`, data);
}

// ============================================================
// TEACHER-CLASS ALLOCATION
// ============================================================

/**
 * Get all teacher-class allocations
 * @param filters - Optional filters (teacherId, classId)
 * @returns Promise with allocations
 */
export async function getTeacherClassAllocations(filters?: {
  teacherId?: string;
  classId?: string;
}): Promise<{
  id: string;
  teacherId: string;
  classId: string;
  isPrimary: boolean;
  teacherName: string;
  className: string;
}[]> {
  const queryParams = new URLSearchParams();

  if (filters?.teacherId) {
    queryParams.append('teacherId', filters.teacherId);
  }
  if (filters?.classId) {
    queryParams.append('classId', filters.classId);
  }

  const query = queryParams.toString();
  return apiClient.get<{
    id: string;
    teacherId: string;
    classId: string;
    isPrimary: boolean;
    teacherName: string;
    className: string;
  }[]>(`/admin/teacher-class-allocations${query ? `?${query}` : ''}`);
}

/**
 * Assign a teacher to a class
 * @param teacherId - Teacher ID
 * @param classId - Class ID
 * @param isPrimary - Whether this is the primary teacher
 * @returns Promise with allocation data
 */
export async function assignTeacherToClass(
  teacherId: string,
  classId: string,
  isPrimary: boolean = false
): Promise<{ id: string; teacherId: string; classId: string; isPrimary: boolean }> {
  return apiClient.post<{ id: string; teacherId: string; classId: string; isPrimary: boolean }>(
    '/admin/teacher-class-allocations',
    { teacherId, classId, isPrimary }
  );
}

/**
 * Remove a teacher from a class
 * @param allocationId - Allocation ID
 * @returns Promise that resolves when allocation is removed
 */
export async function removeTeacherFromClass(allocationId: string): Promise<void> {
  return apiClient.delete<void>(`/admin/teacher-class-allocations/${allocationId}`);
}

/**
 * Get all teachers with their class assignments
 * @returns Promise with teachers and their classes
 */
export async function getTeachersWithClasses(): Promise<{
  id: string;
  name: string;
  email: string;
  classes: { id: string; name: string; isPrimary: boolean }[];
}[]> {
  return apiClient.get<{
    id: string;
    name: string;
    email: string;
    classes: { id: string; name: string; isPrimary: boolean }[];
  }[]>('/admin/teachers/available');
}

/**
 * Get all classes with their assigned teachers
 * @returns Promise with classes and their teachers
 */
export async function getClassesWithTeachers(): Promise<{
  id: string;
  name: string;
  courseName: string;
  teachers: { id: string; name: string; isPrimary: boolean }[];
}[]> {
  return apiClient.get<{
    id: string;
    name: string;
    courseName: string;
    teachers: { id: string; name: string; isPrimary: boolean }[];
  }[]>('/admin/classes/with-teachers');
}

// ============================================================
// CLASS COMPOSITION
// ============================================================

/**
 * Get class composition with enrolled students
 * @returns Promise with class composition data
 */
export async function getClassComposition(): Promise<ClassComposition[]> {
  return apiClient.get<ClassComposition[]>('/admin/classes/composition');
}

/**
 * Get students not enrolled in any class
 * @returns Promise with unassigned students
 */
export async function getUnassignedStudents(): Promise<{
  id: string;
  name: string;
  email: string;
  gradeLevel?: string;
}[]> {
  return apiClient.get<{ id: string; name: string; email: string; gradeLevel?: string }[]>(
    '/admin/students/unassigned'
  );
}

/**
 * Enroll a student in a class (admin function)
 * @param classId - Class ID
 * @param studentId - Student ID
 * @returns Promise with enrollment result
 */
export async function adminEnrollStudent(
  classId: string,
  studentId: string
): Promise<{ success: boolean; enrollmentId: string }> {
  return apiClient.post<{ success: boolean; enrollmentId: string }>(
    `/admin/classes/${classId}/enroll`,
    { studentId }
  );
}

/**
 * Remove a student from a class (admin function)
 * @param classId - Class ID
 * @param studentId - Student ID
 * @returns Promise that resolves when student is unenrolled
 */
export async function adminUnenrollStudent(
  classId: string,
  studentId: string
): Promise<void> {
  return apiClient.delete<void>(`/admin/classes/${classId}/unenroll/${studentId}`);
}

// ============================================================
// ACADEMIC YEAR
// ============================================================

/**
 * Get all academic years
 * @returns Promise with academic years
 */
export async function getAcademicYears(): Promise<{
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}[]> {
  return apiClient.get<{ id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }[]>(
    '/admin/academic-years'
  );
}

/**
 * Create a new academic year
 * @param data - Academic year data
 * @returns Promise with created academic year
 */
export async function createAcademicYear(
  data: { name: string; startDate: string; endDate: string }
): Promise<{ id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }> {
  return apiClient.post<{ id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }>(
    '/admin/academic-years',
    data
  );
}

/**
 * Set an academic year as current
 * @param id - Academic year ID
 * @returns Promise with updated academic year
 */
export async function setCurrentAcademicYear(
  id: string
): Promise<{ id: string; name: string; isCurrent: boolean }> {
  return apiClient.patch<{ id: string; name: string; isCurrent: boolean }>(
    `/admin/academic-years/${id}/set-current`,
    {}
  );
}

// ============================================================
// GRADE PROMOTION
// ============================================================

/**
 * Preview grade promotion results
 * @returns Promise with promotion preview
 */
export async function getPromotionPreview(): Promise<PromotionPreview> {
  return apiClient.get<PromotionPreview>('/admin/promotion/preview');
}

/**
 * Execute grade promotion for all students
 * @returns Promise with promotion results
 */
export async function promoteAllStudents(): Promise<{
  promoted: number;
  failed: number;
  errors: string[];
}> {
  return apiClient.post<{ promoted: number; failed: number; errors: string[] }>(
    '/admin/promotion/execute',
    {}
  );
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const adminService = {
  // Dashboard & Analytics
  getAnalytics,
  getActivityTimeline,
  getRealTimeStats,

  // User Management
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  bulkAction,
  inviteUser,
  bulkInviteUsers,
  resetUserPassword,
  linkParent,

  // Audit Logs
  getAuditLogs,

  // System Health & Settings
  getSystemHealth,
  getSystemSettings,
  updateSystemSettings,
  triggerCleanup,

  // Content Moderation
  getModerationQueue,
  moderateContent,

  // Teacher-Class Allocation
  getTeacherClassAllocations,
  assignTeacherToClass,
  removeTeacherFromClass,
  getTeachersWithClasses,
  getClassesWithTeachers,

  // Class Composition
  getClassComposition,
  getUnassignedStudents,
  adminEnrollStudent,
  adminUnenrollStudent,

  // Academic Year
  getAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,

  // Grade Promotion
  getPromotionPreview,
  promoteAllStudents,
};

export default adminService;
