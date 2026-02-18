import api from './api'

export const assignmentsApi = {
  // Get assignments for a class
  getClassAssignments: (classId, type) => api.get(`/classes/${classId}/assignments`, { params: { type } }),
  
  // Get assignment details
  getAssignment: (id) => api.get(`/assignments/${id}`),
  
  // Create assignment (teacher/admin)
  createAssignment: (classId, data) => api.post(`/classes/${classId}/assignments`, data),
  
  // Update assignment (teacher/admin)
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  
  // Delete assignment (teacher/admin)
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  
  // Submit assignment (student)
  submitAssignment: (assignmentId, data) => api.post(`/assignments/${assignmentId}/submit`, data),
  
  // Get my submission
  getMySubmission: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions/my`),
  
  // Get all submissions (teacher/admin)
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  
  // Grade submission (teacher/admin)
  gradeSubmission: (submissionId, data) => api.post(`/submissions/${submissionId}/grade`, data),
  
  // Get my grades
  getMyGrades: (classId) => api.get('/grades/my', { params: { classId } }),
  
  // Get class gradebook (teacher/admin)
  getClassGradebook: (classId) => api.get(`/classes/${classId}/gradebook`),
}
