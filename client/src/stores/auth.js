import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
    // The refresh token is now stored in an httpOnly cookie managed by the server.
    // We only keep the access token and user profile in memory / localStorage.
    const user = ref(JSON.parse(localStorage.getItem('sms_user') || 'null'))
    const accessToken = ref(localStorage.getItem('sms_access_token') || '')

    const isAuthenticated = computed(() => !!accessToken.value)
    const userRoles = computed(() => user.value?.roles || [])
    const userInitials = computed(() => {
        if (!user.value) return '?'
        const first = user.value.firstName?.[0] || ''
        const last = user.value.lastName?.[0] || ''
        return (first + last).toUpperCase() || '?'
    })
    const fullName = computed(() => {
        if (!user.value) return ''
        return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
    })

    function hasRole(role) {
        return userRoles.value.includes(role)
    }

    function setUser(userData) {
        user.value = userData
        localStorage.setItem('sms_user', JSON.stringify(userData))
    }

    function setAccessToken(token) {
        accessToken.value = token
        localStorage.setItem('sms_access_token', token)
    }

    async function login(email, password) {
        try {
            // Server sets the refresh token as an httpOnly cookie automatically
            const { data } = await api.post('/auth/login', { email, password }, { withCredentials: true })
            setUser(data.user)
            setAccessToken(data.accessToken)
            return data
        } catch (error) {
            throw error
        }
    }

    async function register(payload) {
        try {
            const { data } = await api.post('/auth/register', payload, { withCredentials: true })
            setUser(data.user)
            setAccessToken(data.accessToken)
            return data
        } catch (error) {
            throw error
        }
    }

    async function refreshAccessToken() {
        try {
            // No body needed — the server reads the refresh token from the httpOnly cookie
            const { data } = await api.post('/auth/refresh', {}, { withCredentials: true })
            setAccessToken(data.accessToken)
            if (data.user) setUser(data.user)
            return data.accessToken
        } catch (error) {
            logout()
            throw error
        }
    }

    async function logout() {
        try {
            // Tell the server to revoke the access token and clear the cookie
            await api.post('/auth/logout', {}, { withCredentials: true })
        } catch {
            // Ignore errors — clear local state regardless
        } finally {
            user.value = null
            accessToken.value = ''
            localStorage.removeItem('sms_user')
            localStorage.removeItem('sms_access_token')
            // Remove any legacy refresh token that may have been stored previously
            localStorage.removeItem('sms_refresh_token')
        }
    }

    return {
        user,
        accessToken,
        isAuthenticated,
        userRoles,
        userInitials,
        fullName,
        hasRole,
        setUser,
        setAccessToken,
        login,
        register,
        refreshAccessToken,
        logout,
    }
})
