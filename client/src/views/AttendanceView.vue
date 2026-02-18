<template>
  <div class="attendance-page">
    <div class="page-header">
      <h1>{{ $t('nav.attendance') }}</h1>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else>{{ $t('attendance.subtitle') }}</p>
    </div>

    <!-- Stats Overview -->
    <div v-if="stats" class="stats-row">
      <div class="stat-card">
        <div class="stat-value" :style="{ color: getRateColor(stats.rate) }">{{ stats.rate }}%</div>
        <div class="stat-label">{{ $t('attendance.attendanceRate') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #10b981;">{{ stats.present }}</div>
        <div class="stat-label">{{ $t('attendance.present') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #ef4444;">{{ stats.absent }}</div>
        <div class="stat-label">{{ $t('attendance.absent') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f59e0b;">{{ stats.late }}</div>
        <div class="stat-label">{{ $t('attendance.late') }}</div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="attendance-card">
      <div class="calendar-header">
        <h3>{{ currentMonth }}</h3>
        <div class="calendar-nav">
          <button @click="prevMonth" class="nav-btn">‹</button>
          <button @click="goToToday" class="today-btn">{{ $t('attendance.today') }}</button>
          <button @click="nextMonth" class="nav-btn">›</button>
        </div>
      </div>
      
      <div class="calendar-legend">
        <span class="legend-item"><span class="dot present"></span> {{ $t('attendance.legend.present') }}</span>
        <span class="legend-item"><span class="dot absent"></span> {{ $t('attendance.legend.absent') }}</span>
        <span class="legend-item"><span class="dot late"></span> {{ $t('attendance.legend.late') }}</span>
        <span class="legend-item"><span class="dot excused"></span> {{ $t('attendance.legend.excused') }}</span>
      </div>

      <div class="calendar-grid">
        <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
        <div 
          v-for="date in calendarDates" 
          :key="date.day" 
          :class="['calendar-day', date.status, { today: date.isToday, 'other-month': !date.isCurrentMonth }]"
        >
          <span class="day-number">{{ date.day }}</span>
          <span v-if="date.status" class="status-indicator" :class="date.status"></span>
        </div>
      </div>
    </div>

    <!-- Recent Sessions -->
    <div v-if="recentSessions.length > 0" class="sessions-card">
      <h3>{{ $t('attendance.recentSessions') }}</h3>
      <div class="sessions-list">
        <div v-for="session in recentSessions" :key="session.id" class="session-item">
          <div class="session-info">
            <div class="session-date">{{ formatSessionDate(session.date) }}</div>
            <div class="session-class">{{ session.class?.course?.name }}</div>
          </div>
          <div class="session-status" :class="session.status">
            {{ t('attendance.' + session.status) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { attendanceApi } from '../services/attendance'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const { t } = useI18n()

const currentDate = ref(new Date())
const attendanceRecords = ref([])
const recentSessions = ref([])
const stats = ref(null)
const loading = ref(true)
const error = ref('')

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

const calendarDates = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()
  
  const dates = []
  
  // Previous month padding
  const prevMonthDays = getDaysInMonth(year, month - 1)
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const record = findRecord(year, month - 1, day)
    dates.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      status: record?.status?.toLowerCase(),
    })
  }
  
  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === today.getFullYear() && 
                    month === today.getMonth() && 
                    day === today.getDate()
    const record = findRecord(year, month, day)
    dates.push({
      day,
      isCurrentMonth: true,
      isToday,
      status: record?.status?.toLowerCase(),
    })
  }
  
  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - dates.length
  for (let day = 1; day <= remaining; day++) {
    const record = findRecord(year, month + 1, day)
    dates.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      status: record?.status?.toLowerCase(),
    })
  }
  
  return dates
})

function findRecord(year, month, day) {
  const dateStr = new Date(year, month, day).toISOString().split('T')[0]
  return attendanceRecords.value.find(r => r.date === dateStr)
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  fetchAttendance()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  fetchAttendance()
}

function goToToday() {
  currentDate.value = new Date()
  fetchAttendance()
}

function getRateColor(rate) {
  if (rate >= 90) return '#10b981'
  if (rate >= 75) return '#f59e0b'
  return '#ef4444'
}

function formatSessionDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

async function fetchAttendance() {
  loading.value = true
  error.value = ''
  
  try {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    // Fetch my attendance records
    const res = await attendanceApi.getMyAttendance({ startDate, endDate })
    // Handle various API response formats
    let records = res.data || []
    if (records && Array.isArray(records.data)) {
      records = records.data
    } else if (!Array.isArray(records)) {
      records = []
    }
    attendanceRecords.value = records
    
    // Calculate stats
    const present = records.filter(r => r.status === 'PRESENT').length
    const absent = records.filter(r => r.status === 'ABSENT').length
    const late = records.filter(r => r.status === 'LATE').length
    const excused = records.filter(r => r.status === 'EXCUSED').length
    const total = records.length
    
    stats.value = {
      present,
      absent,
      late,
      excused,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    }
    
    // Get recent sessions (last 10)
    recentSessions.value = records
      .slice(-10)
      .reverse()
      .map(r => ({
        id: r.id,
        date: r.session?.date || r.createdAt,
        status: r.status?.toLowerCase(),
        class: r.session?.class,
      }))
  } catch (err) {
    console.error('Failed to fetch attendance:', err)
    error.value = err.response?.data?.message || 'Failed to load attendance'
    showToast(error.value, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAttendance)
</script>

<style scoped>
.attendance-page {
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #737373;
}

.attendance-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.calendar-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #e5e5e5;
}

.today-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: #f5f5f5;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.today-btn:hover {
  background: #e5e5e5;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #737373;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.present { background: #10b981; }
.dot.absent { background: #ef4444; }
.dot.late { background: #f59e0b; }
.dot.excused { background: #6b7280; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  text-align: center;
}

.week-day {
  font-size: 0.875rem;
  font-weight: 600;
  color: #a3a3a3;
  padding: 0.75rem 0;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.calendar-day:hover {
  background: #f5f5f5;
}

.calendar-day.other-month {
  opacity: 0.4;
}

.calendar-day.today {
  background: #f0f9ff;
  font-weight: 600;
}

.calendar-day.today .day-number {
  color: #0ea5e9;
}

.day-number {
  font-size: 0.9375rem;
}

.status-indicator {
  position: absolute;
  bottom: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-indicator.present { background: #10b981; }
.status-indicator.absent { background: #ef4444; }
.status-indicator.late { background: #f59e0b; }
.status-indicator.excused { background: #6b7280; }

.sessions-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.sessions-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: #fafafa;
  border-radius: 12px;
}

.session-date {
  font-weight: 500;
  color: #171717;
}

.session-class {
  font-size: 0.875rem;
  color: #737373;
}

.session-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.session-status.present {
  background: #d1fae5;
  color: #059669;
}

.session-status.absent {
  background: #fee2e2;
  color: #dc2626;
}

.session-status.late {
  background: #fef3c7;
  color: #d97706;
}

.session-status.excused {
  background: #f3f4f6;
  color: #6b7280;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .calendar-legend {
    gap: 0.75rem;
  }
  
  .calendar-grid {
    gap: 0.25rem;
  }
  
  .calendar-day {
    font-size: 0.8125rem;
  }
}
</style>
