import api from './api'

export const attendanceApi = {
  // Get my attendance
  getMyAttendance: (params) => api.get('/attendance/my', { params }),

  // Get student attendance (admin/teacher)
  getStudentAttendance: (studentId, params) => api.get(`/students/${studentId}/attendance`, { params }),

  // Get class attendance sessions
  getClassSessions: (classId, params) => api.get(`/classes/${classId}/attendance`, { params }),

  // Create attendance session (teacher/admin)
  createSession: (classId, data) => api.post(`/classes/${classId}/attendance`, data),

  // Mark attendance (teacher/admin)
  markAttendance: (sessionId, studentId, data) =>
    api.put(`/attendance/${sessionId}/students/${studentId}`, data),

  // Bulk mark attendance (teacher/admin)
  bulkMarkAttendance: (classId, data) => api.post(`/classes/${classId}/attendance/bulk`, data),

  // Get class attendance summary
  getClassSummary: (classId, params) => api.get(`/classes/${classId}/attendance/summary`, { params }),

  // Get attendance reports (admin)
  getReports: (params) => api.get('/attendance/reports', { params }),

  // Get weekly attendance grid
  getClassWeeklyAttendance: (classId, params) => api.get(`/classes/${classId}/attendance/weekly`, { params }),
}
