<template>
  <div class="courses-page">
    <div class="page-header">
      <h1>{{ $t('nav.courses') }}</h1>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else>{{ $t('courses.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <div v-else-if="classes.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>{{ $t('courses.noClasses') }}</h3>
      <p>{{ $t('courses.notEnrolled') }}</p>
    </div>

    <div v-else class="courses-grid">
      <div v-for="cls in classes" :key="cls.id" class="course-card">
        <div class="course-icon">{{ getSubjectIcon(cls.course?.department) }}</div>
        <h3>{{ cls.course?.name || 'Untitled Course' }}</h3>
        <p class="course-code">{{ cls.course?.code }} • {{ cls.term }}</p>
        <p class="course-teacher">
          👤 {{ cls.teacher?.firstName }} {{ cls.teacher?.lastName }}
        </p>
        <div class="course-meta">
          <span class="meta-item">
            👥 {{ cls._count?.enrollments || 0 }} {{ $t('courses.students') }}
          </span>
          <span class="meta-item">
            📅 {{ formatSchedule(cls.schedules) }}
          </span>
        </div>
        <div class="course-progress" v-if="cls.progress !== undefined">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cls.progress + '%' }"></div>
          </div>
          <span>{{ cls.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { coursesApi } from '../services/courses'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const { t } = useI18n()

const classes = ref([])
const loading = ref(true)
const error = ref('')

const subjectIcons = {
  'Mathematics': '📐',
  'Science': '🔬',
  'Physics': '⚛️',
  'Chemistry': '🧪',
  'Biology': '🧬',
  'Literature': '📖',
  'History': '🏛️',
  'Geography': '🌍',
  'Arts': '🎨',
  'Music': '🎵',
  'Physical Education': '⚽',
  'Computer Science': '💻',
  'Languages': '🗣️',
}

function getSubjectIcon(department) {
  if (!department) return '📚'
  return subjectIcons[department] || '📚'
}

function formatSchedule(schedules) {
  if (!schedules || schedules.length === 0) return t('courses.noSchedule')
  const schedule = schedules[0]
  const days = schedule.daysOfWeek?.join(', ') || 'TBD'
  return `${days} ${schedule.startTime || ''}`
}

async function fetchClasses() {
  loading.value = true
  error.value = ''
  try {
    const response = await coursesApi.getMyClasses()
    // Handle various API response formats
    let data = response.data
    if (data && Array.isArray(data.data)) {
      data = data.data
    } else if (!Array.isArray(data)) {
      data = []
    }
    classes.value = data || []
  } catch (err) {
    console.error('Failed to fetch classes:', err)
    error.value = err.response?.data?.message || 'Failed to load classes'
    showToast(error.value, 'error')
    classes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchClasses)
</script>

<style scoped>
.courses-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.course-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.course-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #171717;
}

.course-code {
  font-size: 0.875rem;
  color: #0ea5e9;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.course-teacher {
  color: #737373;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.meta-item {
  font-size: 0.8125rem;
  color: #a3a3a3;
}

.course-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.course-progress span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0ea5e9;
  min-width: 40px;
}

@media (max-width: 768px) {
  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
