/**
 * Attendance Service
 * 
 * Handles attendance sessions, marking, and reports.
 */

import apiClient from './api-client';
import type {
  AttendanceSession,
  AttendanceRecord,
  CreateAttendanceSessionRequest,
  MarkAttendanceRequest,
  BulkAttendanceRequest,
  AttendanceFilters,
  WeeklyAttendance,
  AttendanceSummary,
  AttendanceStatus,
} from '../types/api';

// ============================================================
// SESSION OPERATIONS
// ============================================================

/**
 * Get attendance sessions for a class
 * @param classId - Class ID
 * @param filters - Date range filters
 * @returns Promise with array of attendance sessions
 */
export async function getAttendanceSessions(
  classId: string,
  filters?: { startDate?: string; endDate?: string }
): Promise<AttendanceSession[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  
  const query = queryParams.toString();
  return apiClient.get<AttendanceSession[]>(
    `/classes/${classId}/attendance${query ? `?${query}` : ''}`
  );
}

/**
 * Get attendance session by ID
 * @param sessionId - Session ID
 * @returns Promise with session details including records
 */
export async function getSession(sessionId: string): Promise<AttendanceSession> {
  return apiClient.get<AttendanceSession>(`/attendance/sessions/${sessionId}`);
}

/**
 * Create a new attendance session (admin/teacher only)
 * @param classId - Class ID
 * @param data - Session creation data
 * @returns Promise with created session
 */
export async function createAttendanceSession(
  classId: string,
  data: CreateAttendanceSessionRequest
): Promise<AttendanceSession> {
  return apiClient.post<AttendanceSession>(`/classes/${classId}/attendance`, data);
}

// ============================================================
// ATTENDANCE MARKING
// ============================================================

/**
 * Mark attendance for a single student (admin/teacher only)
 * @param sessionId - Session ID
 * @param studentId - Student ID
 * @param status - Attendance status
 * @param notes - Optional notes
 * @returns Promise with attendance record
 */
export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus,
  notes?: string
): Promise<AttendanceRecord> {
  const data: MarkAttendanceRequest = { status, notes };
  return apiClient.put<AttendanceRecord>(
    `/attendance/${sessionId}/students/${studentId}`,
    data
  );
}

/**
 * Mark attendance for multiple students at once (admin/teacher only)
 * @param classId - Class ID
 * @param records - Array of attendance records
 * @param options - Optional date, period, and notes for the session
 * @returns Promise with marked records
 */
export async function bulkMarkAttendance(
  classId: string,
  records: { studentId: string; status: AttendanceStatus; notes?: string }[],
  options?: { date?: string; period?: number; notes?: string }
): Promise<AttendanceRecord[]> {
  const data: BulkAttendanceRequest = {
    records,
    date: options?.date,
    period: options?.period,
    notes: options?.notes,
  };
  return apiClient.post<AttendanceRecord[]>(`/classes/${classId}/attendance/bulk`, data);
}

// ============================================================
// ATTENDANCE HISTORY & REPORTS
// ============================================================

/**
 * Get current user's attendance history
 * @param filters - Optional filters (classId, date range)
 * @returns Promise with array of attendance records
 */
export async function getMyAttendance(
  filters?: AttendanceFilters
): Promise<AttendanceRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.classId) {
    queryParams.append('classId', filters.classId);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  
  const query = queryParams.toString();
  return apiClient.get<AttendanceRecord[]>(
    `/attendance/my${query ? `?${query}` : ''}`
  );
}

/**
 * Get attendance for a specific student
 * @param studentId - Student ID
 * @param filters - Optional filters (classId, date range)
 * @returns Promise with array of attendance records
 */
export async function getStudentAttendance(
  studentId: string,
  filters?: AttendanceFilters
): Promise<AttendanceRecord[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.classId) {
    queryParams.append('classId', filters.classId);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  
  const query = queryParams.toString();
  return apiClient.get<AttendanceRecord[]>(
    `/students/${studentId}/attendance${query ? `?${query}` : ''}`
  );
}

/**
 * Get weekly attendance report for a class (admin/teacher only)
 * @param classId - Class ID
 * @param startDate - Week start date (ISO string)
 * @param endDate - Week end date (ISO string)
 * @returns Promise with weekly attendance data
 */
export async function getWeeklyAttendance(
  classId: string,
  startDate: string,
  endDate: string
): Promise<WeeklyAttendance> {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);
  
  return apiClient.get<WeeklyAttendance>(
    `/classes/${classId}/attendance/weekly?${queryParams.toString()}`
  );
}

/**
 * Get attendance summary for a class (admin/teacher only)
 * @param classId - Class ID
 * @param filters - Optional date range filters
 * @returns Promise with attendance summary
 */
export async function getClassAttendanceSummary(
  classId: string,
  filters?: { startDate?: string; endDate?: string }
): Promise<AttendanceSummary> {
  const queryParams = new URLSearchParams();
  
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  
  const query = queryParams.toString();
  return apiClient.get<AttendanceSummary>(
    `/classes/${classId}/attendance/summary${query ? `?${query}` : ''}`
  );
}

/**
 * Get comprehensive attendance report (admin only)
 * @param filters - Filters for class, date range
 * @returns Promise with attendance report data
 */
export async function getAttendanceReport(
  filters?: AttendanceFilters
): Promise<{
  sessions: AttendanceSession[];
  summary: AttendanceSummary;
}> {
  const queryParams = new URLSearchParams();
  
  if (filters?.classId) {
    queryParams.append('classId', filters.classId);
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  
  const query = queryParams.toString();
  return apiClient.get<{
    sessions: AttendanceSession[];
    summary: AttendanceSummary;
  }>(`/attendance/reports${query ? `?${query}` : ''}`);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const attendanceService = {
  // Session operations
  getAttendanceSessions,
  getSession,
  createAttendanceSession,
  
  // Attendance marking
  markAttendance,
  bulkMarkAttendance,
  
  // History & reports
  getMyAttendance,
  getStudentAttendance,
  getWeeklyAttendance,
  getClassAttendanceSummary,
  getAttendanceReport,
};

export default attendanceService;
