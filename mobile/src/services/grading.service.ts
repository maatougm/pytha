/**
 * Grading Service
 * 
 * Handles assignments, submissions, grades, and gradebook operations.
 */

import apiClient from './api-client';
import type {
  Assignment,
  Submission,
  Grade,
  GradebookEntry,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  CreateSubmissionRequest,
  GradeSubmissionRequest,
  BulkGradeRequest,
  AssignmentFilters,
  PaginatedResponse,
  PaginationParams,
} from '../types/api';

// ============================================================
// ASSIGNMENT OPERATIONS
// ============================================================

/**
 * Get count of pending assignments for current user
 * @returns Promise with count of pending assignments
 */
export async function getPendingAssignmentsCount(): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>('/assignments/pending/count');
}

/**
 * Get assignments with optional filters
 * @param filters - Filter options (classId, type)
 * @returns Promise with array of assignments
 */
export async function getAssignments(
  filters?: AssignmentFilters
): Promise<Assignment[]> {
  // If classId is provided, get assignments for that class
  if (filters?.classId) {
    const queryParams = new URLSearchParams();
    
    if (filters?.type) {
      queryParams.append('type', filters.type);
    }
    
    const query = queryParams.toString();
    return apiClient.get<Assignment[]>(
      `/classes/${filters.classId}/assignments${query ? `?${query}` : ''}`
    );
  }
  
  // Otherwise, get all assignments (might need a different endpoint)
  // This is a placeholder - the backend might not have a global assignments endpoint
  throw new Error('classId is required to fetch assignments');
}

/**
 * Get assignment by ID
 * @param id - Assignment ID
 * @returns Promise with assignment details
 */
export async function getAssignmentById(id: string): Promise<Assignment> {
  return apiClient.get<Assignment>(`/assignments/${id}`);
}

/**
 * Create a new assignment (admin/teacher only)
 * @param classId - Class ID
 * @param data - Assignment creation data
 * @returns Promise with created assignment
 */
export async function createAssignment(
  classId: string,
  data: CreateAssignmentRequest
): Promise<Assignment> {
  return apiClient.post<Assignment>(`/classes/${classId}/assignments`, data);
}

/**
 * Update an assignment (admin/teacher only)
 * @param id - Assignment ID
 * @param data - Assignment update data
 * @returns Promise with updated assignment
 */
export async function updateAssignment(
  id: string,
  data: UpdateAssignmentRequest
): Promise<Assignment> {
  return apiClient.put<Assignment>(`/assignments/${id}`, data);
}

/**
 * Delete an assignment (admin/teacher only)
 * @param id - Assignment ID
 * @returns Promise that resolves when assignment is deleted
 */
export async function deleteAssignment(id: string): Promise<void> {
  return apiClient.delete<void>(`/assignments/${id}`);
}

// ============================================================
// SUBMISSION OPERATIONS
// ============================================================

/**
 * Submit an assignment (student only)
 * @param assignmentId - Assignment ID
 * @param data - Submission data including content and fileIds
 * @returns Promise with created submission
 */
export async function submitAssignment(
  assignmentId: string,
  data: CreateSubmissionRequest
): Promise<Submission> {
  return apiClient.post<Submission>(`/assignments/${assignmentId}/submit`, data);
}

/**
 * Get submissions for an assignment (admin/teacher only)
 * @param assignmentId - Assignment ID
 * @returns Promise with array of submissions
 */
export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  return apiClient.get<Submission[]>(`/assignments/${assignmentId}/submissions`);
}

/**
 * Get current user's submission for an assignment
 * @param assignmentId - Assignment ID
 * @returns Promise with submission data
 */
export async function getMySubmission(assignmentId: string): Promise<Submission> {
  return apiClient.get<Submission>(`/assignments/${assignmentId}/submissions/my`);
}

// ============================================================
// GRADE OPERATIONS
// ============================================================

/**
 * Grade a submission (admin/teacher only)
 * @param submissionId - Submission ID
 * @param data - Grade data including points and feedback
 * @returns Promise with created/updated grade
 */
export async function gradeSubmission(
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<Grade> {
  return apiClient.post<Grade>(`/submissions/${submissionId}/grade`, data);
}

/**
 * Bulk grade submissions for an assignment (admin/teacher only)
 * @param assignmentId - Assignment ID
 * @param data - Bulk grade data
 * @returns Promise with grading results
 */
export async function bulkGrade(
  assignmentId: string,
  data: BulkGradeRequest
): Promise<{ graded: number; errors: string[] }> {
  return apiClient.post<{ graded: number; errors: string[] }>(
    `/assignments/${assignmentId}/grades/bulk`,
    data
  );
}

/**
 * Get current user's grades
 * @param courseId - Optional course ID to filter by
 * @returns Promise with array of grades
 */
export async function getMyGrades(courseId?: string): Promise<Grade[]> {
  const queryParams = new URLSearchParams();
  
  if (courseId) {
    queryParams.append('classId', courseId);
  }
  
  const query = queryParams.toString();
  return apiClient.get<Grade[]>(`/grades/my${query ? `?${query}` : ''}`);
}

/**
 * Get grades for a specific student
 * @param studentId - Student ID
 * @param classId - Optional class ID to filter by
 * @returns Promise with array of grades
 */
export async function getStudentGrades(
  studentId: string,
  classId?: string
): Promise<Grade[]> {
  const queryParams = new URLSearchParams();
  
  if (classId) {
    queryParams.append('classId', classId);
  }
  
  const query = queryParams.toString();
  return apiClient.get<Grade[]>(
    `/students/${studentId}/grades${query ? `?${query}` : ''}`
  );
}

// ============================================================
// GRADEBOOK OPERATIONS
// ============================================================

/**
 * Get gradebook for a class (admin/teacher only)
 * @param classId - Class ID
 * @returns Promise with gradebook entries
 */
export async function getGradebook(classId: string): Promise<GradebookEntry[]> {
  return apiClient.get<GradebookEntry[]>(`/classes/${classId}/gradebook`);
}

/**
 * Get grades for current user or a specific course
 * This is a convenience method that wraps getMyGrades
 * @param courseId - Optional course ID
 * @returns Promise with array of grades
 */
export async function getGrades(courseId?: string): Promise<Grade[]> {
  return getMyGrades(courseId);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const gradingService = {
  // Assignment operations
  getPendingAssignmentsCount,
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  
  // Submission operations
  submitAssignment,
  getSubmissions,
  getMySubmission,
  
  // Grade operations
  gradeSubmission,
  bulkGrade,
  getMyGrades,
  getStudentGrades,
  getGrades,
  
  // Gradebook
  getGradebook,
};

export default gradingService;
