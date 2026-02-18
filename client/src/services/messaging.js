import api from './api'
import { io } from 'socket.io-client'

let socket = null
let messageHandlers = []
let typingHandlers = []
let userStatusHandlers = []

export const messagingApi = {
  // REST API methods
  getMyChannels: () => api.get('/channels/my'),

  getChannelMessages: (channelId, params) =>
    api.get(`/channels/${channelId}/messages`, { params }),

  getChannelMembers: (channelId) => api.get(`/channels/${channelId}/members`),

  createChannel: (data) => api.post('/channels', data),

  joinChannel: (channelId) => api.post(`/channels/${channelId}/join`),

  leaveChannel: (channelId) => api.post(`/channels/${channelId}/leave`),

  sendMessageREST: (channelId, content) =>
    api.post(`/channels/${channelId}/messages`, { content }),

  editMessage: (messageId, content) =>
    api.patch(`/channels/messages/${messageId}`, { content }),

  deleteMessage: (messageId) => api.delete(`/channels/messages/${messageId}`),

  // Reports
  reportChannel: (channelId, reason) =>
    api.post(`/channels/${channelId}/report`, { reason }),

  // Admin only
  getChannelFullHistory: (channelId) =>
    api.get(`/channels/${channelId}/full-history`),

  getAllReports: (params) =>
    api.get('/channels/admin/reports', { params }),

  updateReportStatus: (reportId, data) =>
    api.patch(`/channels/admin/reports/${reportId}`, data),
}

export const messagingSocket = {
  // Connect to WebSocket
  connect(token) {
    if (socket?.connected) return Promise.resolve()

    return new Promise((resolve, reject) => {
      socket = io('/messaging', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      socket.on('connect', () => {
        console.log('✅ Messaging connected')
        resolve()
      })

      socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err.message)
        reject(err)
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason)
      })

      // Listen for messages
      socket.on('message:new', (data) => {
        messageHandlers.forEach(handler => handler(data))
      })

      socket.on('message:updated', (data) => {
        messageHandlers.forEach(handler => handler({ ...data, type: 'updated' }))
      })

      socket.on('message:deleted', (data) => {
        messageHandlers.forEach(handler => handler({ ...data, type: 'deleted' }))
      })

      // Listen for typing
      socket.on('user:typing', (data) => {
        typingHandlers.forEach(handler => handler(data))
      })

      // Listen for user status
      socket.on('user:online', (data) => {
        userStatusHandlers.forEach(handler => handler({ ...data, status: 'online' }))
      })

      socket.on('user:offline', (data) => {
        userStatusHandlers.forEach(handler => handler({ ...data, status: 'offline' }))
      })
    })
  },

  disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    messageHandlers = []
    typingHandlers = []
    userStatusHandlers = []
  },

  isConnected() {
    return socket?.connected || false
  },

  /** Provides access to the underlying socket for advanced event handling */
  getSocket() {
    return socket
  },

  // Send message via WebSocket
  sendMessage(channelId, content, options = {}) {
    if (!socket?.connected) {
      throw new Error('Socket not connected')
    }
    socket.emit('message:send', { channelId, content, ...options })
  },

  editMessage(messageId, content) {
    if (!socket?.connected) return
    socket.emit('message:edit', { messageId, content })
  },

  deleteMessage(messageId) {
    if (!socket?.connected) return
    socket.emit('message:delete', { messageId })
  },

  startTyping(channelId) {
    if (!socket?.connected) return
    socket.emit('typing:start', { channelId })
  },

  stopTyping(channelId) {
    if (!socket?.connected) return
    socket.emit('typing:stop', { channelId })
  },

  joinChannel(channelId) {
    if (!socket?.connected) return
    socket.emit('channel:join', { channelId })
  },

  // Event handlers
  onMessage(handler) {
    messageHandlers.push(handler)
    return () => {
      messageHandlers = messageHandlers.filter(h => h !== handler)
    }
  },

  onTyping(handler) {
    typingHandlers.push(handler)
    return () => {
      typingHandlers = typingHandlers.filter(h => h !== handler)
    }
  },

  onUserStatus(handler) {
    userStatusHandlers.push(handler)
    return () => {
      userStatusHandlers = userStatusHandlers.filter(h => h !== handler)
    }
  },
}
