import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
})

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config
})

// Response interceptor — handle 401 / refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const auth = useAuthStore()
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry && auth.refreshToken) {
            originalRequest._retry = true
            try {
                const { data } = await axios.post('/api/auth/refresh', {
                    refreshToken: auth.refreshToken,
                })
                auth.setTokens(data.accessToken, data.refreshToken)
                auth.setUser(data.user)
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                auth.logout()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
