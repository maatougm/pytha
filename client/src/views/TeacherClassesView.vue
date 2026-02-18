<template>
  <div class="teacher-classes">
    <PageHeader 
      title="My Classes" 
      subtitle="Manage your assigned classes, take attendance, and create assignments"
    >
      <template #actions>
        <button class="btn btn-secondary" @click="refreshData" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh
        </button>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your classes...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="classes.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
          <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 7h6M7 11h6M7 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3>No Classes Assigned</h3>
      <p>You don't have any classes assigned to you yet.</p>
    </div>

    <!-- Classes Grid -->
    <div v-else class="classes-container">
      <div v-for="cls in classes" :key="cls.id" class="class-card">
        <!-- Class Header -->
        <div class="class-header">
          <div class="class-info">
            <h3 class="class-name">{{ cls.course?.name }}</h3>
            <p class="class-code">{{ cls.course?.code }} • {{ cls.term }} {{ cls.section ? `• Section ${cls.section}` : '' }}</p>
          </div>
          <div class="class-badge" :class="{ 'has-schedule': cls.schedules?.length > 0 }">
            {{ cls.schedules?.length > 0 ? 'Active' : 'No Schedule' }}
          </div>
        </div>

        <!-- Class Stats -->
        <div class="class-stats">
          <div class="stat">
            <span class="stat-value">{{ cls._count?.enrollments || 0 }}</span>
            <span class="stat-label">Students</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ cls._count?.assignments || 0 }}</span>
            <span class="stat-label">Assignments</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getRoom(cls) }}</span>
            <span class="stat-label">Room</span>
          </div>
        </div>

        <!-- Schedule Info -->
        <div v-if="cls.schedules?.length" class="class-schedule">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M16 2v4M4 2v4M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ formatSchedule(cls.schedules) }}</span>
        </div>

        <!-- Quick Actions -->
        <div class="class-actions">
          <button class="action-btn primary" @click="openAttendance(cls)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M16 2v4M4 2v4M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Take Attendance
          </button>
          <button class="action-btn" @click="viewRoster(cls)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M4 17a5 5 0 0110 0H4z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Roster
          </button>
          <button class="action-btn" @click="createAssignment(cls)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 2v5h5M9 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Assignment
          </button>
          <button class="action-btn" @click="viewClassDetail(cls)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Details
          </button>
        </div>
      </div>
    </div>

    <!-- Attendance Modal -->
    <div v-if="showAttendanceModal" class="modal-overlay" @click.self="closeAttendanceModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div>
            <h3>Take Attendance</h3>
            <p class="modal-subtitle">{{ selectedClass?.course?.name }} • {{ selectedClass?.term }}</p>
          </div>
          <button class="btn-icon" @click="closeAttendanceModal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="attendance-date">
            <label>Date</label>
            <input type="date" v-model="attendanceDate" class="input" />
          </div>
          
          <div v-if="loadingRoster" class="loading-sm">
            <div class="spinner-sm"></div>
            <span>Loading students...</span>
          </div>
          
          <div v-else-if="classRoster.length === 0" class="empty-state-sm">
            <p>No students enrolled in this class.</p>
          </div>
          
          <div v-else class="attendance-list">
            <div v-for="student in classRoster" :key="student.id" class="attendance-item">
              <div class="student-info">
                <div class="student-avatar">{{ getInitials(student.firstName, student.lastName) }}</div>
                <div class="student-name">
                  <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                  <span class="email">{{ student.email }}</span>
                </div>
              </div>
              <div class="attendance-status">
                <label class="status-option">
                  <input type="radio" :name="`status-${student.id}`" value="present" v-model="attendanceRecords[student.id]" />
                  <span class="status-badge present">Present</span>
                </label>
                <label class="status-option">
                  <input type="radio" :name="`status-${student.id}`" value="absent" v-model="attendanceRecords[student.id]" />
                  <span class="status-badge absent">Absent</span>
                </label>
                <label class="status-option">
                  <input type="radio" :name="`status-${student.id}`" value="late" v-model="attendanceRecords[student.id]" />
                  <span class="status-badge late">Late</span>
                </label>
                <label class="status-option">
                  <input type="radio" :name="`status-${student.id}`" value="excused" v-model="attendanceRecords[student.id]" />
                  <span class="status-badge excused">Excused</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAttendanceModal">Cancel</button>
          <button class="btn btn-primary" @click="saveAttendance" :disabled="savingAttendance">
            <span v-if="savingAttendance" class="btn-spinner"></span>
            <span v-else>Save Attendance</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Roster Modal -->
    <div v-if="showRosterModal" class="modal-overlay" @click.self="closeRosterModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div>
            <h3>Class Roster</h3>
            <p class="modal-subtitle">{{ selectedClass?.course?.name }} • {{ selectedClass?.term }} • {{ classRoster.length }} students</p>
          </div>
          <button class="btn-icon" @click="closeRosterModal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingRoster" class="loading-state">
            <div class="spinner"></div>
            <p>Loading roster...</p>
          </div>
          
          <div v-else-if="classRoster.length === 0" class="empty-state">
            <p>No students enrolled in this class.</p>
          </div>
          
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in classRoster" :key="student.id">
                <td>
                  <div class="student-cell">
                    <div class="student-avatar-sm">{{ getInitials(student.firstName, student.lastName) }}</div>
                    <span>{{ student.firstName }} {{ student.lastName }}</span>
                  </div>
                </td>
                <td>{{ student.email }}</td>
                <td><span class="badge badge-success">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRosterModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import PageHeader from '../components/PageHeader.vue'
import api from '../services/api'
import { coursesApi } from '../services/courses'

const router = useRouter()
const { showToast } = useToast()

const classes = ref([])
const loading = ref(true)
const selectedClass = ref(null)

// Attendance modal
const showAttendanceModal = ref(false)
const attendanceDate = ref(new Date().toISOString().split('T')[0])
const classRoster = ref([])
const loadingRoster = ref(false)
const attendanceRecords = ref({})
const savingAttendance = ref(false)

// Roster modal
const showRosterModal = ref(false)

async function fetchClasses() {
  loading.value = true
  try {
    const response = await api.get('/classes/my')
    let data = response.data
    if (data && Array.isArray(data.data)) {
      data = data.data
    } else if (!Array.isArray(data)) {
      data = []
    }
    classes.value = data
  } catch (err) {
    console.error('Failed to fetch classes:', err)
    showToast('Failed to load classes', 'error')
    classes.value = []
  } finally {
    loading.value = false
  }
}

function getRoom(cls) {
  return cls.room || 'TBD'
}

function formatSchedule(schedules) {
  if (!schedules || schedules.length === 0) return 'No schedule set'
  const schedule = schedules[0]
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayNames = schedule.dayOfWeek !== undefined ? days[schedule.dayOfWeek] : 'TBD'
  return `${dayNames} ${schedule.startTime || ''} - ${schedule.endTime || ''}`
}

function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase()
}

function refreshData() {
  fetchClasses()
}

// Attendance
async function openAttendance(cls) {
  selectedClass.value = cls
  showAttendanceModal.value = true
  attendanceDate.value = new Date().toISOString().split('T')[0]
  await loadRoster(cls.id)
  // Initialize all as present
  attendanceRecords.value = {}
  classRoster.value.forEach(student => {
    attendanceRecords.value[student.id] = 'present'
  })
}

function closeAttendanceModal() {
  showAttendanceModal.value = false
  selectedClass.value = null
  classRoster.value = []
  attendanceRecords.value = {}
}

async function loadRoster(classId) {
  loadingRoster.value = true
  try {
    const response = await coursesApi.getClassRoster(classId)
    let data = response.data
    if (data && data.data) {
      data = data.data
    }
    classRoster.value = data.enrollments?.map(e => e.student) || []
  } catch (err) {
    console.error('Failed to load roster:', err)
    showToast('Failed to load roster', 'error')
    classRoster.value = []
  } finally {
    loadingRoster.value = false
  }
}

async function saveAttendance() {
  savingAttendance.value = true
  try {
    const records = Object.entries(attendanceRecords.value).map(([studentId, status]) => ({
      studentId,
      status
    }))
    
    await api.post(`/classes/${selectedClass.value.id}/attendance/bulk`, {
      date: attendanceDate.value,
      records
    })
    
    showToast('Attendance saved successfully', 'success')
    closeAttendanceModal()
  } catch (err) {
    console.error('Failed to save attendance:', err)
    showToast('Failed to save attendance', 'error')
  } finally {
    savingAttendance.value = false
  }
}

// Roster
async function viewRoster(cls) {
  selectedClass.value = cls
  showRosterModal.value = true
  await loadRoster(cls.id)
}

function closeRosterModal() {
  showRosterModal.value = false
  selectedClass.value = null
  classRoster.value = []
}

// Assignment
function createAssignment(cls) {
  router.push(`/assignments?classId=${cls.id}`)
}

// Class Detail
function viewClassDetail(cls) {
  router.push(`/classes/${cls.id}`)
}

onMounted(fetchClasses)
</script>

<style scoped>
.teacher-classes {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top-color: var(--corp-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--space-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: var(--space-16);
  color: var(--text-secondary);
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

/* Classes Container */
.classes-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-6);
}

/* Class Card */
.class-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.class-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.class-code {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.class-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.class-badge.has-schedule {
  background: var(--corp-success-bg);
  color: var(--corp-success);
}

/* Stats */
.class-stats {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Schedule */
.class-schedule {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Actions */
.class-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--corp-primary-600);
  border-color: var(--corp-primary-600);
  color: white;
}

.action-btn.primary:hover {
  background: var(--corp-primary-700);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-lg {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-light);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Attendance */
.attendance-date {
  margin-bottom: var(--space-4);
}

.attendance-date label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.attendance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.student-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.student-avatar {
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
}

.student-avatar-sm {
  width: 28px;
  height: 28px;
  background: var(--corp-primary-100);
  color: var(--corp-primary-700);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 600;
}

.student-name {
  display: flex;
  flex-direction: column;
}

.student-name .name {
  font-weight: 500;
  color: var(--text-primary);
}

.student-name .email {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.attendance-status {
  display: flex;
  gap: var(--space-2);
}

.status-option {
  cursor: pointer;
}

.status-option input {
  display: none;
}

.status-badge {
  display: block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.status-option input:checked + .status-badge.present {
  background: var(--corp-success);
  color: white;
}

.status-option input:checked + .status-badge.absent {
  background: var(--corp-danger);
  color: white;
}

.status-option input:checked + .status-badge.late {
  background: var(--corp-warning);
  color: white;
}

.status-option input:checked + .status-badge.excused {
  background: var(--corp-info);
  color: white;
}

/* Loading */
.loading-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8);
  color: var(--text-secondary);
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-light);
  border-top-color: var(--corp-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state-sm {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-muted);
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.student-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: var(--corp-success-bg);
  color: var(--corp-success);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* Responsive */
@media (max-width: 768px) {
  .teacher-classes {
    padding: var(--space-4);
  }
  
  .classes-container {
    grid-template-columns: 1fr;
  }
  
  .class-actions {
    grid-template-columns: 1fr;
  }
  
  .attendance-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .attendance-status {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
