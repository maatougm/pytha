import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { io } from 'socket.io-client'

export const useAdminStore = defineStore('admin', () => {
    // ─── STATE ─────────────────────────────────────────────────────────
    const metrics = ref(null)
    const timeline = ref(null)
    const realtimeStats = ref(null)
    const users = ref([])
    const auditLogs = ref([])
    const moderationQueue = ref([])
    const systemSettings = ref(null)
    const isLoading = ref(false)
    const error = ref(null)
    const socket = ref(null)
    const isConnected = ref(false)
    const selectedTimeRange = ref('week')

    // ─── GETTERS ───────────────────────────────────────────────────────
    const totalUsers = computed(() => metrics.value?.users?.total || 0)
    const activeUsers = computed(() => metrics.value?.users?.active || 0)
    const newUsersToday = computed(() => metrics.value?.users?.newToday || 0)
    const totalMessages = computed(() => metrics.value?.messages?.total || 0)
    const messagesToday = computed(() => metrics.value?.messages?.today || 0)
    const systemUptime = computed(() => metrics.value?.system?.uptime || 0)
    const memoryUsage = computed(() => metrics.value?.system?.memory?.percentage || 0)

    const formattedUptime = computed(() => {
        const seconds = systemUptime.value
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    })

    // ─── SOCKET CONNECTION ─────────────────────────────────────────────
    function connectSocket() {
        const authStore = JSON.parse(localStorage.getItem('sms_user') || '{}')
        const token = localStorage.getItem('sms_access_token')

        if (!token || socket.value?.connected) return

        socket.value = io('/admin', {
            auth: { token },
            transports: ['websocket', 'polling'],
        })

        socket.value.on('connect', () => {
            isConnected.value = true
            console.log('🔌 [AdminStore] Admin dashboard connected')
            socket.value.emit('dashboard:subscribe')
        })

        socket.value.on('disconnect', () => {
            isConnected.value = false
            console.log('🔌 Admin dashboard disconnected')
        })

        // Real-time events
        socket.value.on('dashboard:metrics', (data) => {
            metrics.value = data
        })

        socket.value.on('dashboard:realtime', (data) => {
            realtimeStats.value = data
        })

        socket.value.on('user:new', (data) => {
            // Refresh user list when new user registers
            fetchUsers()
        })

        socket.value.on('user:status-change', (data) => {
            // Update user in list
            const user = users.value.find(u => u.id === data.userId)
            if (user) {
                user.status = data.status
            }
        })

        socket.value.on('system:alert', (alert) => {
            // Handle system alerts - could integrate with toast system
            console.warn('System Alert:', alert)
        })
    }

    function disconnectSocket() {
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
            isConnected.value = false
        }
    }

    // ─── API ACTIONS ───────────────────────────────────────────────────
    async function fetchDashboardMetrics(range = selectedTimeRange.value) {
        isLoading.value = true
        try {
            const { data } = await api.get('/admin/dashboard/metrics', {
                params: { range }
            })
            console.log('[AdminStore] Fetched metrics:', data)
            metrics.value = data
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch metrics'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchTimeline(range = selectedTimeRange.value) {
        try {
            const { data } = await api.get('/admin/dashboard/timeline', {
                params: { range }
            })
            timeline.value = data
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch timeline'
            throw err
        }
    }

    async function fetchRealtimeStats() {
        try {
            const { data } = await api.get('/admin/dashboard/realtime')
            realtimeStats.value = data
            return data
        } catch (err) {
            console.error('Failed to fetch realtime stats:', err)
        }
    }

    async function fetchUsers(params = {}) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.get('/admin/users', { params })
            // Handle different response formats
            let usersList = []
            if (Array.isArray(data)) {
                usersList = data
            } else if (data && Array.isArray(data.data)) {
                usersList = data.data
            } else if (data && data.users && Array.isArray(data.users)) {
                usersList = data.users
            }
            users.value = usersList
            return { data: usersList, meta: data.meta || { total: usersList.length } }
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch users'
            users.value = []
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function updateUserStatus(userId, action, reason = '') {
        try {
            const { data } = await api.put(`/admin/users/${userId}/status`, {
                action,
                reason
            })
            // Update local state
            const user = users.value.find(u => u.id === userId)
            if (user) {
                user.status = action === 'activate' ? 'active' :
                    action === 'suspend' ? 'suspended' :
                        action === 'archive' ? 'archived' : user.status
            }
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update user status'
            throw err
        }
    }

    async function bulkAction(userIds, action, reason = '') {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.post('/admin/users/bulk-action', {
                targetType: 'user',
                action,
                targetIds: userIds,
                reason
            })
            // Update local state for each user
            for (const userId of userIds) {
                const user = users.value.find(u => u.id === userId)
                if (user) {
                    if (action === 'activate') user.status = 'active'
                    else if (action === 'suspend') user.status = 'suspended'
                    else if (action === 'archive') user.status = 'archived'
                }
            }
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to perform bulk action'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function inviteUser(userData) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.post('/admin/users/invite', userData)
            // Add new user to list
            users.value.unshift(data)
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to invite user'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function bulkInviteUsers(usersList) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.post('/admin/users/bulk-invite', { users: usersList })
            // Refresh users list
            await fetchUsers()
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to bulk invite users'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function editUser(userId, userData) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.put(`/admin/users/${userId}`, userData)
            // Update local state
            const index = users.value.findIndex(u => u.id === userId)
            if (index > -1) {
                users.value[index] = { ...users.value[index], ...data }
            }
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update user'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function deleteUser(userId) {
        isLoading.value = true
        error.value = null
        try {
            await api.delete(`/admin/users/${userId}`)
            // Remove from local state
            const index = users.value.findIndex(u => u.id === userId)
            if (index > -1) {
                users.value.splice(index, 1)
            }
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete user'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchAuditLogs(params = {}) {
        try {
            const { data } = await api.get('/admin/audit-logs', { params })
            auditLogs.value = data.data
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch audit logs'
            throw err
        }
    }

    async function fetchModerationQueue(params = {}) {
        try {
            const { data } = await api.get('/admin/moderation/queue', { params })
            moderationQueue.value = data.data
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch moderation queue'
            throw err
        }
    }

    async function fetchSystemSettings() {
        try {
            const { data } = await api.get('/admin/settings')
            systemSettings.value = data
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch settings'
            throw err
        }
    }

    async function updateSystemSettings(settings) {
        try {
            const { data } = await api.put('/admin/settings', settings)
            systemSettings.value = data.settings
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update settings'
            throw err
        }
    }

    async function refreshDashboard() {
        await Promise.all([
            fetchDashboardMetrics(),
            fetchTimeline(),
            fetchRealtimeStats()
        ])
    }

    function setTimeRange(range) {
        selectedTimeRange.value = range
        fetchDashboardMetrics(range)
        fetchTimeline(range)
    }

    async function resetPassword(userId) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.post(`/admin/users/${userId}/reset-password`)
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to reset password'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Teacher-Class Allocation
    async function fetchTeacherClassAllocations(params = {}) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.get('/admin/teacher-class-allocations', { params })
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch allocations'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchTeachersWithClasses() {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.get('/admin/teachers/available')
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch teachers'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchClassesWithTeachers() {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.get('/admin/classes/with-teachers')
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch classes'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function assignTeacherToClass(teacherId, classId, isPrimary = false) {
        isLoading.value = true
        error.value = null
        try {
            const { data } = await api.post('/admin/teacher-class-allocations', {
                teacherId,
                classId,
                isPrimary
            })
            return data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to assign teacher'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function removeTeacherFromClass(assignmentId) {
        isLoading.value = true
        error.value = null
        try {
            await api.delete(`/admin/teacher-class-allocations/${assignmentId}`)
            return true
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to remove teacher'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        // State
        metrics,
        timeline,
        realtimeStats,
        users,
        auditLogs,
        moderationQueue,
        systemSettings,
        isLoading,
        error,
        isConnected,
        selectedTimeRange,

        // Getters
        totalUsers,
        activeUsers,
        newUsersToday,
        totalMessages,
        messagesToday,
        systemUptime,
        memoryUsage,
        formattedUptime,

        // Actions
        connectSocket,
        disconnectSocket,
        fetchDashboardMetrics,
        fetchTimeline,
        fetchRealtimeStats,
        fetchUsers,
        updateUserStatus,
        bulkAction,
        inviteUser,
        bulkInviteUsers,
        editUser,
        deleteUser,
        resetPassword,
        fetchAuditLogs,
        fetchModerationQueue,
        fetchSystemSettings,
        updateSystemSettings,
        refreshDashboard,
        setTimeRange,
        fetchTeacherClassAllocations,
        fetchTeachersWithClasses,
        fetchClassesWithTeachers,
        assignTeacherToClass,
        removeTeacherFromClass
    }
})
