<template>
  <div class="dashboard">
    <PageHeader 
      :title="$t('dashboard.welcome', { name: userName })" 
      :subtitle="$t('dashboard.overview')"
    >
      <template #actions>
        <button class="btn btn-secondary" @click="refreshData">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh
        </button>
      </template>
    </PageHeader>

    <div class="dashboard-content">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon messages">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.5l-2.5 2.5-2.5-2.5H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.unreadMessages }}</span>
            <span class="stat-label">Unread Messages</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon assignments">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 2v5h5M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.pendingAssignments }}</span>
            <span class="stat-label">Pending Assignments</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon courses">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M7 7h6M7 11h6M7 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.activeCourses }}</span>
            <span class="stat-label">Active Courses</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon files">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.files }}</span>
            <span class="stat-label">Files</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Recent Messages -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Recent Messages</h3>
            <router-link to="/messages" class="link">View all</router-link>
          </div>
          
          <div v-if="recentMessages.length" class="message-list">
            <div 
              v-for="msg in recentMessages" 
              :key="msg.id"
              class="message-item"
              @click="$router.push('/messages')"
            >
              <div class="message-avatar">
                {{ getInitials(msg.sender) }}
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ msg.sender }}</span>
                  <span class="message-time">{{ formatTime(msg.time) }}</span>
                </div>
                <p class="message-preview">{{ msg.preview }}</p>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state-sm">
            <p>No recent messages</p>
          </div>
        </div>

        <!-- Upcoming Assignments -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Upcoming Assignments</h3>
            <router-link to="/assignments" class="link">View all</router-link>
          </div>
          
          <div v-if="upcomingAssignments.length" class="assignment-list">
            <div 
              v-for="assignment in upcomingAssignments" 
              :key="assignment.id"
              class="assignment-item"
            >
              <div class="assignment-info">
                <h4 class="assignment-title">{{ assignment.title }}</h4>
                <p class="assignment-course">{{ assignment.course }}</p>
              </div>
              <div class="assignment-meta">
                <span class="due-date" :class="{ urgent: isUrgent(assignment.dueDate) }">
                  Due {{ formatDate(assignment.dueDate) }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state-sm">
            <p>No upcoming assignments</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3 class="section-title">Quick Actions</h3>
        <div class="action-grid">
          <router-link to="/messages" class="action-card">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.5l-2.5 2.5-2.5-2.5H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="action-label">Send Message</span>
          </router-link>

          <router-link to="/files" class="action-card">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="action-label">Upload File</span>
          </router-link>

          <router-link to="/courses" class="action-card">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <span class="action-label">View Courses</span>
          </router-link>

          <router-link to="/attendance" class="action-card">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M16 2v4M4 2v4M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="action-label">Check Attendance</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useI18n } from 'vue-i18n'
import PageHeader from '../components/PageHeader.vue'

const auth = useAuthStore()
const { t } = useI18n()

const userName = computed(() => {
  return auth.user?.firstName || 'User'
})

const stats = ref({
  unreadMessages: 0,
  pendingAssignments: 0,
  activeCourses: 0,
  files: 0
})

const recentMessages = ref([])
const upcomingAssignments = ref([])

function refreshData() {
  // Mock data for demonstration
  stats.value = {
    unreadMessages: 3,
    pendingAssignments: 5,
    activeCourses: 4,
    files: 12
  }

  recentMessages.value = [
    { id: 1, sender: 'John Smith', preview: 'Please review the assignment before...', time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 2, sender: 'Sarah Johnson', preview: 'Meeting rescheduled to tomorrow...', time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 3, sender: 'Mike Davis', preview: 'Thanks for your help with the project...', time: new Date(Date.now() - 1000 * 60 * 60 * 5) }
  ]

  upcomingAssignments.value = [
    { id: 1, title: 'Math Homework Chapter 5', course: 'Mathematics 101', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24) },
    { id: 2, title: 'Essay on Climate Change', course: 'Environmental Science', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48) },
    { id: 3, title: 'Lab Report', course: 'Physics', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72) }
  ]
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatTime(date) {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

function formatDate(date) {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }
  
  const days = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
  if (days <= 7) {
    return `in ${days} days`
  }
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isUrgent(date) {
  const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
  return days <= 2
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.dashboard-content {
  padding: var(--space-6);
  max-width: 1440px;
  margin: 0 auto;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.messages {
  background: var(--corp-info-bg);
  color: var(--corp-info);
}

.stat-icon.assignments {
  background: var(--corp-warning-bg);
  color: var(--corp-warning);
}

.stat-icon.courses {
  background: var(--corp-success-bg);
  color: var(--corp-success);
}

.stat-icon.files {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.dashboard-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.link {
  font-size: 0.875rem;
  color: var(--text-link);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Message List */
.message-list {
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.message-item:last-child {
  border-bottom: none;
}

.message-item:hover {
  background: var(--bg-hover);
  margin: 0 calc(-1 * var(--space-5));
  padding-left: var(--space-5);
  padding-right: var(--space-5);
}

.message-avatar {
  width: 36px;
  height: 36px;
  background: var(--corp-primary-100);
  color: var(--corp-primary-700);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.message-sender {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.message-preview {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Assignment List */
.assignment-list {
  display: flex;
  flex-direction: column;
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-light);
}

.assignment-item:last-child {
  border-bottom: none;
}

.assignment-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.assignment-course {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

.due-date {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.due-date.urgent {
  color: var(--corp-danger);
  background: var(--corp-danger-light);
}

/* Quick Actions */
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.action-card:hover {
  border-color: var(--corp-primary-300);
  background: var(--corp-primary-50);
}

.action-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.action-card:hover .action-icon {
  color: var(--corp-primary-600);
}

.action-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.empty-state-sm {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: var(--space-4);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
