/**
 * Course Service
 * 
 * Handles course catalog, classes, enrollments, and schedules.
 */

import apiClient from './api-client';
import type {
  Course,
  Class,
  ClassEnrollment,
  Schedule,
  CourseFilters,
  ClassFilters,
  EnrollStudentRequest,
  BulkEnrollRequest,
  AddSchedulesRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types/api';

// ============================================================
// COURSE OPERATIONS
// ============================================================

/**
 * Get all courses with optional filters
 * @param filters - Filter options (department, active, search)
 * @param params - Pagination parameters
 * @returns Promise with paginated courses
 */
export async function getCourses(
  filters?: CourseFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<Course>> {
  const queryParams = new URLSearchParams();
  
  // Add filters
  if (filters?.department) {
    queryParams.append('department', filters.department);
  }
  if (filters?.active !== undefined) {
    queryParams.append('active', filters.active.toString());
  }
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }
  
  // Add pagination
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<Course>>(
    `/courses${query ? `?${query}` : ''}`
  );
}

/**
 * Get course by ID
 * @param id - Course ID
 * @returns Promise with course details
 */
export async function getCourseById(id: string): Promise<Course> {
  return apiClient.get<Course>(`/courses/${id}`);
}

// ============================================================
// CLASS OPERATIONS
// ============================================================

/**
 * Get all classes with optional filters
 * @param filters - Filter options (term, teacherId, courseId, studentId)
 * @param params - Pagination parameters
 * @returns Promise with paginated classes
 */
export async function getClasses(
  filters?: ClassFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<Class>> {
  const queryParams = new URLSearchParams();
  
  // Add filters
  if (filters?.term) {
    queryParams.append('term', filters.term);
  }
  if (filters?.teacherId) {
    queryParams.append('teacherId', filters.teacherId);
  }
  if (filters?.courseId) {
    queryParams.append('courseId', filters.courseId);
  }
  if (filters?.studentId) {
    queryParams.append('studentId', filters.studentId);
  }
  
  // Add pagination
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<Class>>(
    `/classes${query ? `?${query}` : ''}`
  );
}

/**
 * Get class by ID
 * @param id - Class ID
 * @returns Promise with class details including course and teachers
 */
export async function getClassById(id: string): Promise<Class> {
  return apiClient.get<Class>(`/classes/${id}`);
}

/**
 * Get current user's classes
 * For teachers: returns classes they teach
 * For students: returns classes they're enrolled in
 * @param term - Optional term filter
 * @returns Promise with array of classes
 */
export async function getMyClasses(term?: string): Promise<Class[]> {
  const queryParams = new URLSearchParams();
  
  if (term) {
    queryParams.append('term', term);
  }
  
  const query = queryParams.toString();
  return apiClient.get<Class[]>(`/classes/my${query ? `?${query}` : ''}`);
}

// ============================================================
// ENROLLMENT OPERATIONS
// ============================================================

/**
 * Enroll a student in a class (admin/teacher only)
 * @param classId - Class ID
 * @param studentId - Student ID to enroll
 * @returns Promise with enrollment data
 */
export async function enrollInClass(
  classId: string,
  studentId: string
): Promise<ClassEnrollment> {
  const data: EnrollStudentRequest = { studentId };
  return apiClient.post<ClassEnrollment>(`/classes/${classId}/enroll`, data);
}

/**
 * Bulk enroll students in a class (admin/teacher only)
 * @param classId - Class ID
 * @param studentIds - Array of student IDs to enroll
 * @returns Promise with enrollment results
 */
export async function bulkEnrollStudents(
  classId: string,
  studentIds: string[]
): Promise<{ enrolled: number; errors: string[] }> {
  const data: BulkEnrollRequest = { studentIds };
  return apiClient.post<{ enrolled: number; errors: string[] }>(
    `/classes/${classId}/enroll/bulk`,
    data
  );
}

/**
 * Drop a student from a class (admin/teacher only)
 * @param classId - Class ID
 * @param studentId - Student ID to drop
 * @returns Promise that resolves when student is dropped
 */
export async function dropStudent(classId: string, studentId: string): Promise<void> {
  return apiClient.delete<void>(`/classes/${classId}/students/${studentId}`);
}

/**
 * Get current user's enrollments
 * @returns Promise with array of enrollments
 */
export async function getMyEnrollments(): Promise<ClassEnrollment[]> {
  // Get my classes which include enrollment info
  const classes = await getMyClasses();
  
  // Extract enrollment data from classes
  return classes
    .filter(c => c.enrollments && c.enrollments.length > 0)
    .flatMap(c => c.enrollments || []);
}

/**
 * Get class roster (admin/teacher only)
 * @param classId - Class ID
 * @param params - Pagination parameters
 * @returns Promise with paginated roster
 */
export async function getClassRoster(
  classId: string,
  params?: PaginationParams
): Promise<PaginatedResponse<ClassEnrollment>> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<ClassEnrollment>>(
    `/classes/${classId}/roster${query ? `?${query}` : ''}`
  );
}

// ============================================================
// SCHEDULE OPERATIONS
// ============================================================

/**
 * Get schedules for a class
 * @param classId - Class ID
 * @returns Promise with array of schedules
 */
export async function getClassSchedule(classId: string): Promise<Schedule[]> {
  return apiClient.get<Schedule[]>(`/classes/${classId}/schedules`);
}

/**
 * Add schedules to a class (admin/teacher only)
 * @param classId - Class ID
 * @param schedules - Array of schedule data
 * @returns Promise with created schedules
 */
export async function addClassSchedules(
  classId: string,
  schedules: { dayOfWeek: number; startTime: string; endTime: string; room?: string }[]
): Promise<Schedule[]> {
  const data: AddSchedulesRequest = { schedules };
  return apiClient.post<Schedule[]>(`/classes/${classId}/schedules`, data);
}

/**
 * Delete a schedule (admin/teacher only)
 * @param scheduleId - Schedule ID
 * @returns Promise that resolves when schedule is deleted
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  return apiClient.delete<void>(`/classes/schedules/${scheduleId}`);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const courseService = {
  // Course operations
  getCourses,
  getCourseById,
  
  // Class operations
  getClasses,
  getClassById,
  getMyClasses,
  
  // Enrollment operations
  enrollInClass,
  bulkEnrollStudents,
  dropStudent,
  getMyEnrollments,
  getClassRoster,
  
  // Schedule operations
  getClassSchedule,
  addClassSchedules,
  deleteSchedule,
};

export default courseService;
