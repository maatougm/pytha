import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { guest: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/RegisterView.vue'),
        meta: { guest: true },
    },
    {
        path: '/',
        component: () => import('../components/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('../views/HomeView.vue'),
            },
            {
                path: 'messages',
                name: 'Messages',
                component: () => import('../views/MessagingView.vue'),
            },
            {
                path: 'courses',
                name: 'Courses',
                component: () => import('../views/CoursesView.vue'),
            },
            {
                path: 'my-classes',
                name: 'MyClasses',
                component: () => import('../views/TeacherClassesView.vue'),
                meta: { role: 'teacher' },
            },
            {
                path: 'assignments',
                name: 'Assignments',
                component: () => import('../views/AssignmentsView.vue'),
            },
            {
                path: 'assignments/:id',
                name: 'AssignmentDetail',
                component: () => import('../views/AssignmentDetailView.vue'),
            },
            {
                path: 'attendance',
                name: 'Attendance',
                component: () => import('../views/AttendanceView.vue'),
            },
            {
                path: 'files',
                name: 'Files',
                component: () => import('../views/FilesView.vue'),
            },
            {
                path: 'admin',
                name: 'Admin',
                component: () => import('../views/AdminDashboardView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/users',
                name: 'UserManagement',
                component: () => import('../views/UserManagementView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/moderation',
                name: 'Moderation',
                component: () => import('../views/ModerationView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/audit',
                name: 'AuditLogs',
                component: () => import('../views/AuditLogsView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/settings',
                name: 'SystemSettings',
                component: () => import('../views/SystemSettingsView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/classes',
                name: 'AdminClasses',
                component: () => import('../views/AdminClassesView.vue'),
                meta: { role: 'admin' },
            },
            {
                path: 'admin/teacher-allocations',
                name: 'TeacherClassAllocation',
                component: () => import('../views/TeacherClassAllocationView.vue'),
                meta: { role: 'admin' },
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        // Always scroll to top on navigation - instant
        return { top: 0, behavior: 'instant' }
    },
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return next('/login')
    }

    if (to.meta.guest && auth.isAuthenticated) {
        return next('/')
    }

    if (to.meta.role && !auth.hasRole(to.meta.role)) {
        return next('/')
    }

    next()
})

export default router
