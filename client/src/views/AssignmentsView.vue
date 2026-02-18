<template>
  <div class="assignments-page">
    <div class="page-header">
      <h1>{{ $t('nav.assignments') }}</h1>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else>{{ assignments.length }} assignments</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <button 
        v-for="filter in filters" 
        :key="filter.value"
        :class="['filter-btn', { active: activeFilter === filter.value }]"
        @click="activeFilter = filter.value"
      >
        {{ $t(filter.label) }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredAssignments.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>{{ $t('assignments.noAssignments') }}</h3>
      <p>{{ $t('assignments.noAssignmentsDescription') }}</p>
    </div>

    <div v-else class="assignments-list">
      <div 
        v-for="assignment in filteredAssignments" 
        :key="assignment.id" 
        class="assignment-card"
        @click="openAssignment(assignment)"
      >
        <div class="assignment-status" :class="getStatus(assignment)"></div>
        <div class="assignment-content">
          <div class="assignment-header">
            <h3>{{ assignment.title }}</h3>
            <span class="status-badge" :class="getStatus(assignment)">
              {{ getStatusLabel(assignment) }}
            </span>
          </div>
          <p class="assignment-class">{{ assignment.class?.course?.name }}</p>
          <p class="assignment-description" v-if="assignment.description">
            {{ assignment.description.substring(0, 100) }}
          </p>
          <div class="assignment-meta">
            <span class="due-date" :class="{ overdue: isOverdue(assignment) }">
              📅 {{ $t('assignments.due') }}: {{ formatDate(assignment.dueDate) }}
            </span>
            <span class="points">{{ assignment.points }} {{ $t('assignments.points') }}</span>
            <span class="type">{{ assignment.type }}</span>
          </div>
        </div>
        <div class="assignment-grade" v-if="assignment.submission?.grade">
          <div class="grade-value">{{ assignment.submission.grade.score }}</div>
          <div class="grade-label">/{{ assignment.points }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { assignmentsApi } from '../services/assignments'
import { coursesApi } from '../services/courses'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const { showToast } = useToast()
const auth = useAuthStore()
const { t } = useI18n()

const assignments = ref([])
const classes = ref([])
const loading = ref(true)
const error = ref('')
const activeFilter = ref('all')

const filters = [
  { label: 'assignments.filterAll', value: 'all' },
  { label: 'assignments.filterPending', value: 'pending' },
  { label: 'assignments.filterSubmitted', value: 'submitted' },
  { label: 'assignments.filterGraded', value: 'graded' },
]

const filteredAssignments = computed(() => {
  if (activeFilter.value === 'all') return assignments.value
  return assignments.value.filter(a => getStatus(a) === activeFilter.value)
})

function getStatus(assignment) {
  if (assignment.submission?.grade) return 'graded'
  if (assignment.submission) return 'submitted'
  if (isOverdue(assignment)) return 'overdue'
  return 'pending'
}

function getStatusLabel(assignment) {
  const status = getStatus(assignment)
  const statusMap = {
    'pending': 'assignments.statusPending',
    'submitted': 'assignments.statusSubmitted',
    'graded': 'assignments.statusGraded',
    'overdue': 'assignments.statusOverdue'
  }
  return statusMap[status] ? t(statusMap[status]) : status.charAt(0).toUpperCase() + status.slice(1)
}

function isOverdue(assignment) {
  if (!assignment.dueDate) return false
  return new Date(assignment.dueDate) < new Date()
}

function formatDate(date) {
  if (!date) return 'No deadline'
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return t('assignments.overdue')
  if (diffDays === 0) return t('time.today')
  if (diffDays === 1) return t('time.tomorrow')
  if (diffDays <= 7) return t('assignments.daysLeft', { count: diffDays })
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function openAssignment(assignment) {
  router.push({ name: 'AssignmentDetail', params: { id: assignment.id } })
}

async function fetchAssignments() {
  loading.value = true
  error.value = ''
  try {
    // First get my classes
    const classesRes = await coursesApi.getMyClasses()
    // Handle various API response formats
    let classesData = classesRes.data || []
    if (classesData && Array.isArray(classesData.data)) {
      classesData = classesData.data
    } else if (!Array.isArray(classesData)) {
      classesData = []
    }
    classes.value = classesData
    
    // Then fetch assignments for each class
    const allAssignments = []
    for (const cls of classes.value) {
      if (!cls || !cls.id) continue
      try {
        const res = await assignmentsApi.getClassAssignments(cls.id)
        // Handle various API response formats
        let assignmentsList = res.data || []
        if (assignmentsList && Array.isArray(assignmentsList.data)) {
          assignmentsList = assignmentsList.data
        } else if (!Array.isArray(assignmentsList)) {
          assignmentsList = []
        }
        const classAssignments = assignmentsList.map(a => ({
          ...a,
          class: cls,
        }))
        allAssignments.push(...classAssignments)
      } catch (err) {
        console.warn(`Failed to fetch assignments for class ${cls?.id}:`, err)
      }
    }
    
    // Fetch my submissions/grades for each assignment
    const isStudent = auth.user?.roles?.includes('student')
    if (isStudent) {
      for (const assignment of allAssignments) {
        if (!assignment || !assignment.id) continue
        try {
          const subRes = await assignmentsApi.getMySubmission(assignment.id)
          assignment.submission = subRes.data
        } catch {
          // No submission yet
        }
      }
    }
    
    // Sort by due date
    assignments.value = allAssignments.sort((a, b) => {
      if (!a?.dueDate) return 1
      if (!b?.dueDate) return -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
  } catch (err) {
    console.error('Failed to fetch assignments:', err)
    error.value = err.response?.data?.message || 'Failed to load assignments'
    showToast(error.value, 'error')
    assignments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchAssignments)
</script>

<style scoped>
.assignments-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #737373;
}

.page-header .error {
  color: #ef4444;
}

.filters-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid #e5e5e5;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: #737373;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.filter-btn.active {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #737373;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #737373;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-card {
  display: flex;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.assignment-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.assignment-status {
  width: 6px;
  flex-shrink: 0;
}

.assignment-status.pending { background: #f59e0b; }
.assignment-status.submitted { background: #3b82f6; }
.assignment-status.graded { background: #10b981; }
.assignment-status.overdue { background: #ef4444; }

.assignment-content {
  flex: 1;
  padding: 1.25rem;
  min-width: 0;
}

.assignment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.assignment-header h3 {
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0;
}

.assignment-class {
  color: #0ea5e9;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.assignment-description {
  color: #737373;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assignment-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.due-date {
  font-size: 0.875rem;
  color: #737373;
}

.due-date.overdue {
  color: #ef4444;
  font-weight: 500;
}

.points {
  font-size: 0.875rem;
  color: #0ea5e9;
  font-weight: 500;
}

.type {
  font-size: 0.75rem;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #737373;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.submitted {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.graded {
  background: #d1fae5;
  color: #059669;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #dc2626;
}

.assignment-grade {
  display: flex;
  align-items: baseline;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-left: 1px solid #e5e5e5;
}

.grade-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0ea5e9;
}

.grade-label {
  font-size: 1rem;
  color: #0ea5e9;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .assignment-grade {
    padding: 0.75rem;
  }
  
  .grade-value {
    font-size: 1.5rem;
  }
}
</style>
