<template>
  <div class="admin-classes-page">
    <div class="page-header">
      <h1>Admin Class Attendance</h1>
      <p class="subtitle">Monitor daily attendance across all classes</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading classes...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchClasses" class="retry-btn">Retry</button>
    </div>

    <div v-else class="content-wrapper">
      <!-- Term Groups -->
      <div v-for="(classes, term) in groupedClasses" :key="term" class="term-section">
        <h2 class="term-header">{{ term }}</h2>
        
        <div class="classes-grid">
          <div 
            v-for="cls in classes" 
            :key="cls.id" 
            class="class-card"
            @click="openClassDetail(cls)"
          >
            <div class="card-header">
              <span class="course-code">{{ cls.code }}</span>
              <span class="student-count">👥 {{ cls.enrollmentCount }}</span>
            </div>
            
            <h3 class="course-name">{{ cls.name }}</h3>
            <p class="teacher-name">👤 {{ cls.teacher }}</p>
            
            <div class="attendance-summary">
              <div class="attendance-label">Today's Presence</div>
              <div class="progress-container">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getAttendancePercent(cls) + '%' }"
                    :class="getAttendanceColorRaw(getAttendancePercent(cls))"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ cls.todayPresent }} / {{ cls.enrollmentCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Attendance Modal -->
    <div v-if="selectedClass" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>{{ selectedClass.name }}</h2>
            <p>{{ selectedClass.code }} • {{ selectedClass.teacher }}</p>
          </div>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
            <WeeklyAttendanceGrid :class-id="selectedClass.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { coursesApi } from '../services/courses'
import WeeklyAttendanceGrid from '../components/admin/WeeklyAttendanceGrid.vue'

const groupedClasses = ref({})
const loading = ref(true)
const error = ref(null)
const selectedClass = ref(null)

onMounted(() => {
  fetchClasses()
})

async function fetchClasses() {
  loading.value = true
  error.value = null
  try {
    const { data } = await coursesApi.getAdminClassesSummary()
    groupedClasses.value = data
  } catch (err) {
    console.error('Failed to fetch admin classes:', err)
    error.value = 'Failed to load classes. Please try again.'
  } finally {
    loading.value = false
  }
}

function getAttendancePercent(cls) {
  if (!cls.enrollmentCount) return 0
  return Math.round((cls.todayPresent / cls.enrollmentCount) * 100)
}

function getAttendanceColorRaw(percent) {
  if (percent >= 90) return 'bg-green'
  if (percent >= 75) return 'bg-yellow'
  return 'bg-red'
}

function openClassDetail(cls) {
  selectedClass.value = cls
}

function closeModal() {
  selectedClass.value = null
}
</script>

<style scoped>
.admin-classes-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
}

.term-section {
  margin-bottom: 3rem;
}

.term-header {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.class-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  cursor: pointer;
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.course-code {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
}

.student-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.course-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.teacher-name {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
}

.attendance-summary {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 8px;
}

.attendance-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bg-green { background-color: #10b981; }
.bg-yellow { background-color: #f59e0b; }
.bg-red { background-color: #ef4444; }

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
  text-align: right;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.modal-header p {
  color: #6b7280;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  color: #6b7280;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
