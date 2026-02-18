import api from './api'

export const coursesApi = {
  // Get my classes (for current user)
  getMyClasses: (term) => api.get('/classes/my', { params: { term } }),

  // Get class details
  getClass: (id) => api.get(`/classes/${id}`),

  // Get class schedules
  getSchedules: (classId) => api.get(`/classes/${classId}/schedules`),

  // Get all courses (admin/teacher)
  getAllCourses: (params) => api.get('/courses', { params }),

  // Create course (admin/teacher)
  createCourse: (data) => api.post('/courses', data),

  // Update course (admin)
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),

  // Delete course (admin)
  deleteCourse: (id) => api.delete(`/courses/${id}`),

  // Get admin classes summary
  getAdminClassesSummary: () => api.get('/classes/admin/summary'),
  
  // Get class roster
  getClassRoster: (classId) => api.get(`/classes/${classId}/roster`),
}
