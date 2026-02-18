import api from './api'

export const usersApi = {
  // Get all users
  getAll: () => api.get('/users'),
  
  // Get user by ID
  getById: (id) => api.get(`/users/${id}`),
  
  // Update user
  update: (id, data) => api.put(`/users/${id}`, data),
  
  // Delete user
  delete: (id) => api.delete(`/users/${id}`),
}
