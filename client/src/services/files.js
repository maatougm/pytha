import api from './api'

export const filesApi = {
  // List files
  getFiles: (params) => api.get('/files', { params }),
  
  // Get my files
  getMyFiles: () => api.get('/files/my'),
  
  // Get file metadata
  getFile: (id) => api.get(`/files/${id}`),
  
  // Upload file
  uploadFile: (file, data = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (data.category) formData.append('category', data.category)
    if (data.description) formData.append('description', data.description)
    if (data.relatedId) formData.append('relatedId', data.relatedId)
    if (data.relatedType) formData.append('relatedType', data.relatedType)
    
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: data.onProgress,
    })
  },
  
  // Download file
  downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  
  // Delete file
  deleteFile: (id) => api.delete(`/files/${id}`),
  
  // Get storage stats
  getStats: () => api.get('/files/stats'),
}
