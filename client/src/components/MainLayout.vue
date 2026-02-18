<template>
  <div class="app-layout" :class="{ 'nav-open': isNavOpen, 'rtl': isRTL }">
    <!-- Skip Link -->
    <SkipLink />

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button 
        class="mobile-menu-btn" 
        @click="isNavOpen = !isNavOpen"
        :aria-expanded="isNavOpen"
        aria-controls="sidebar-nav"
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      
      <div class="mobile-brand">
        <div class="brand-logo-sm">S</div>
        <span class="brand-name">{{ t('app.name') }}</span>
      </div>
      
      <div class="mobile-actions">
        <LanguageSwitcher compact />
      </div>
    </header>

    <!-- Sidebar Navigation -->
    <aside 
      id="sidebar-nav"
      class="sidebar"
      @click.self="isNavOpen = false"
    >
      <!-- Brand -->
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-logo">S</div>
          <div class="brand-info">
            <span class="brand-name">{{ t('app.name') }}</span>
            <span class="brand-tagline">{{ t('app.tagline') }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav-content">
        <div class="nav-section">
          <router-link 
            v-for="item in mainNavItems" 
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: $route.path === item.path }"
            @click="isNavOpen = false"
          >
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </router-link>
        </div>

        <!-- Admin Section -->
        <div v-if="auth.hasRole('admin')" class="nav-section">
          <div class="nav-section-title">{{ t('nav.admin') }}</div>
          <router-link 
            v-for="item in adminNavItems" 
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: $route.path === item.path }"
            @click="isNavOpen = false"
          >
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div class="user-menu" v-if="auth.user">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ auth.user.firstName }} {{ auth.user.lastName }}</span>
            <span class="user-role">{{ userRoleLabel }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" :title="t('nav.logout')">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h8M5 7l-3 3 3 3M9 4v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="footer-actions">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </aside>

    <!-- Overlay -->
    <div 
      v-if="isNavOpen" 
      class="sidebar-overlay" 
      @click="isNavOpen = false"
    ></div>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-bottom-nav">
      <router-link 
        v-for="item in mobileNavItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-nav-item"
        :class="{ active: $route.path === item.path }"
      >
        <component :is="item.icon" class="mobile-nav-icon" />
        <span class="mobile-nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import SkipLink from './SkipLink.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t, locale } = useI18n()

const isNavOpen = ref(false)

const isRTL = computed(() => locale.value === 'ar')

const userInitials = computed(() => {
  if (!auth.user) return ''
  const first = auth.user.firstName?.[0] || ''
  const last = auth.user.lastName?.[0] || ''
  return (first + last).toUpperCase()
})

const userRoleLabel = computed(() => {
  const roles = auth.userRoles || []
  if (roles.includes('admin')) return t('roles.admin')
  if (roles.includes('teacher')) return t('roles.teacher')
  if (roles.includes('parent')) return t('roles.parent')
  if (roles.includes('student')) return t('roles.student')
  return t('roles.user')
})

// Icon Components
const MessageIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.5l-2.5 2.5-2.5-2.5H5a2 2 0 01-2-2V5z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
])

const CourseIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z', stroke: 'currentColor', strokeWidth: 1.5 }),
  h('path', { d: 'M7 7h6M7 11h6M7 15h4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })
])

const AssignmentIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  h('path', { d: 'M9 2v5h5', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
])

const AttendanceIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('rect', { x: 3, y: 4, width: 14, height: 14, rx: 2, stroke: 'currentColor', strokeWidth: 1.5 }),
  h('path', { d: 'M16 2v4M4 2v4M3 10h14', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })
])

const FileIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M4 4a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
])

const DashboardIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('rect', { x: 3, y: 3, width: 6, height: 6, rx: 1, stroke: 'currentColor', strokeWidth: 1.5 }),
  h('rect', { x: 11, y: 3, width: 6, height: 6, rx: 1, stroke: 'currentColor', strokeWidth: 1.5 }),
  h('rect', { x: 3, y: 11, width: 6, height: 6, rx: 1, stroke: 'currentColor', strokeWidth: 1.5 }),
  h('rect', { x: 11, y: 11, width: 6, height: 6, rx: 1, stroke: 'currentColor', strokeWidth: 1.5 })
])

const UsersIcon = () => h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' }, [
  h('path', { d: 'M13 7a3 3 0 11-6 0 3 3 0 016 0z', stroke: 'currentColor', strokeWidth: 1.5 }),
  h('path', { d: 'M4 17a5 5 0 0110 0H4z', stroke: 'currentColor', strokeWidth: 1.5 })
])

const mainNavItems = computed(() => {
  const items = [
    { path: '/messages', label: t('nav.messages'), icon: MessageIcon },
    { path: '/assignments', label: t('nav.assignments'), icon: AssignmentIcon },
    { path: '/attendance', label: t('nav.attendance'), icon: AttendanceIcon },
    { path: '/files', label: t('nav.files'), icon: FileIcon },
  ]
  
  // Teachers see "My Classes", students/parents see "Courses"
  if (auth.hasRole('teacher')) {
    items.unshift({ path: '/my-classes', label: t('nav.myClasses'), icon: CourseIcon })
  } else {
    items.unshift({ path: '/courses', label: t('nav.courses'), icon: CourseIcon })
  }
  
  return items
})

const adminNavItems = computed(() => [
  { path: '/admin', label: t('nav.dashboard'), icon: DashboardIcon },
  { path: '/admin/users', label: t('nav.userManagement'), icon: UsersIcon },
])

const mobileNavItems = computed(() => mainNavItems.value.slice(0, 4))

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-light);
  z-index: 50;
  padding: 0 var(--space-4);
  align-items: center;
  justify-content: space-between;
}

.mobile-menu-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.mobile-menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-logo-sm {
  width: 28px;
  height: 28px;
  background: var(--corp-primary-600);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 40;
}

[dir="rtl"] .sidebar {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid var(--border-sidebar);
}

.sidebar-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-light);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-logo {
  width: 36px;
  height: 36px;
  background: var(--corp-primary-600);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.25;
}

.brand-tagline {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Navigation */
.sidebar-nav-content {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
}

.nav-section {
  margin-bottom: var(--space-4);
}

.nav-section-title {
  padding: var(--space-2) var(--space-3);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 100ms ease, color 100ms ease;
  margin-bottom: var(--space-1);
}

.nav-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--bg-active);
  color: var(--text-accent);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-link.active .nav-icon {
  opacity: 1;
}

.nav-badge {
  margin-left: auto;
  background: var(--corp-danger);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

[dir="rtl"] .nav-badge {
  margin-left: 0;
  margin-right: auto;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  margin-bottom: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--corp-primary-100);
  color: var(--corp-primary-700);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.logout-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.logout-btn:hover {
  background: var(--corp-danger-light);
  color: var(--corp-danger);
}

.footer-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

/* Overlay */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 35;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  background: var(--bg-primary);
}

[dir="rtl"] .main-content {
  margin-left: 0;
  margin-right: var(--sidebar-width);
}

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-header);
  border-top: 1px solid var(--border-light);
  z-index: 50;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2);
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: 0.625rem;
  font-weight: 500;
  flex: 1;
  border-radius: var(--radius-md);
}

.mobile-nav-item:hover {
  color: var(--text-secondary);
}

.mobile-nav-item.active {
  color: var(--text-accent);
}

.mobile-nav-icon {
  width: 20px;
  height: 20px;
}

/* No page transitions for better performance */

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 300ms ease;
  }

  [dir="rtl"] .sidebar {
    transform: translateX(100%);
  }

  .nav-open .sidebar {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    padding-top: 56px;
    padding-bottom: 60px;
  }

  [dir="rtl"] .main-content {
    margin-right: 0;
  }

  .mobile-header {
    display: flex;
  }

  .mobile-bottom-nav {
    display: flex;
  }
}

@media (min-width: 1025px) and (max-width: 1280px) {
  :root {
    --sidebar-width: 240px;
  }
}
</style>
