<template>
  <div class="weekly-attendance-grid">
    <div class="grid-controls">
      <button @click="prevWeek" class="nav-btn">‹</button>
      <div class="date-range">
        {{ formatDate(weekStart) }} - {{ formatDate(weekEnd) }}
      </div>
      <button @click="nextWeek" class="nav-btn">›</button>
      <button @click="goToCurrentWeek" class="today-btn">Current Week</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading attendance data...</p>
    </div>

    <div v-else class="grid-container">
      <table class="attendance-table">
        <thead>
          <tr>
            <th class="student-col">Student</th>
            <th v-for="day in weekDays" :key="day.date" class="day-col">
              <div class="day-header">
                <span class="day-name">{{ day.name }}</span>
                <span class="day-date">{{ day.shortDate }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.student.id">
            <td class="student-cell">
              <div class="student-info">
                <div class="student-avatar">
                   {{ student.student.firstName[0] }}{{ student.student.lastName[0] }}
                </div>
                <div>
                  <div class="student-name">
                    {{ student.student.firstName }} {{ student.student.lastName }}
                  </div>
                  <!-- Weekly Rate -->
                  <div class="student-rate" :class="getRateColor(calculateWeeklyRate(student))">
                    {{ calculateWeeklyRate(student) }}%
                  </div>
                </div>
              </div>
            </td>
            <td v-for="day in weekDays" :key="day.date" class="day-cell">
              <div class="sessions-grid">
                 <div 
                   v-for="period in [1, 2, 3]" 
                   :key="period" 
                   class="session-slot"
                   :class="getStatusClass(student.attendance[day.isoDate]?.[period])"
                   :title="getStatusTitle(student.attendance[day.isoDate]?.[period], period)"
                 >
                   {{ period }}
                 </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { attendanceApi } from '../../services/attendance'

const props = defineProps({
  classId: {
    type: String,
    required: true
  }
})

const weekStart = ref(getStartOfWeek(new Date()))
const weekEnd = computed(() => {
  const end = new Date(weekStart.value)
  end.setDate(end.getDate() + 4) // Mon-Fri
  return end
})

const students = ref([])
const loading = ref(false)

const weekDays = computed(() => {
  const days = []
  const curr = new Date(weekStart.value)
  for (let i = 0; i < 5; i++) {
    days.push({
      date: new Date(curr),
      isoDate: curr.toISOString().split('T')[0],
      name: curr.toLocaleDateString('en-US', { weekday: 'short' }),
      shortDate: curr.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    })
    curr.setDate(curr.getDate() + 1)
  }
  return days
})

watch(() => props.classId, () => {
  fetchWeeklyAttendance()
})

watch(weekStart, () => {
  fetchWeeklyAttendance()
})

onMounted(() => {
  if(props.classId) fetchWeeklyAttendance()
})

function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function goToCurrentWeek() {
  weekStart.value = getStartOfWeek(new Date())
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function fetchWeeklyAttendance() {
  if (!props.classId) return
  loading.value = true
  try {
    const { data } = await attendanceApi.getClassWeeklyAttendance(
      props.classId, 
      {
        startDate: weekStart.value.toISOString().split('T')[0],
        endDate: weekEnd.value.toISOString().split('T')[0]
      }
    )
    students.value = data.students
  } catch (err) {
    console.error('Failed to fetch weekly attendance:', err)
  } finally {
    loading.value = false
  }
}

function getStatusClass(status) {
  if (!status) return 'status-none'
  return `status-${status.toLowerCase()}`
}

function getStatusTitle(status, period) {
  const pName = period === 1 ? 'Morning' : period === 2 ? 'Midday' : 'Afternoon'
  return `${pName}: ${status || 'No Record'}`
}

function calculateWeeklyRate(student) {
  let present = 0
  let total = 0
  
  // Iterate over loaded week days
  weekDays.value.forEach(day => {
    const dayData = student.attendance[day.isoDate]
    if (dayData) {
      [1, 2, 3].forEach(p => {
         if (dayData[p]) {
            total++
            if (['PRESENT', 'LATE'].includes(dayData[p])) present++
         }
      })
    }
  })
  
  if (total === 0) return 0
  return Math.round((present / total) * 100)
}

function getRateColor(rate) {
  if (rate >= 90) return 'text-green'
  if (rate >= 75) return 'text-yellow'
  return 'text-red'
}
</script>

<style scoped>
.weekly-attendance-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.grid-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
}

.date-range {
  font-weight: 600;
  color: #374151;
  min-width: 200px;
  text-align: center;
}

.today-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.today-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.grid-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.attendance-table th,
.attendance-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.attendance-table th {
  background: #f9fafb;
}

.student-col {
  width: 250px;
  position: sticky;
  left: 0;
  background: #f9fafb;
  z-index: 10;
  font-weight: 600;
  color: #374151;
}

.day-col {
  text-align: center;
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-name {
  font-weight: 600;
  color: #374151;
}

.day-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.student-cell {
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
  border-right: 1px solid #e5e7eb;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.student-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.95rem;
}

.student-rate {
  font-size: 0.75rem;
  font-weight: 600;
}

.text-green { color: #059669; }
.text-yellow { color: #d97706; }
.text-red { color: #dc2626; }

.sessions-grid {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.session-slot {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.status-present {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.status-absent {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.status-late {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.status-excused {
  background: #e5e7eb;
  color: #374151;
  border-color: #d1d5db;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
</style>
