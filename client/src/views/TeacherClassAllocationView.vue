<template>
  <div class="allocation-page">
    <div class="page-header">
      <div>
        <h1>Teacher-Class Allocation</h1>
        <p class="subtitle">Manage teacher assignments to classes</p>
      </div>
      <button class="btn btn-primary" @click="openAssignModal">
        + Assign Teacher
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <h3>{{ stats.totalTeachers }}</h3>
          <p>Active Teachers</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <h3>{{ stats.totalClasses }}</h3>
          <p>Total Classes</p>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <h3>{{ stats.unassignedClasses }}</h3>
          <p>Unassigned Classes</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>{{ stats.utilization }}%</h3>
          <p>Teacher Utilization</p>
        </div>
      </div>
    </div>

    <!-- Controls & Tabs -->
    <div class="controls-bar">
      <div class="tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'teachers' }]"
          @click="activeTab = 'teachers'"
        >
          By Teacher
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'classes' }]"
          @click="activeTab = 'classes'"
        >
          By Class
        </button>
      </div>

      <div class="filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search teachers, classes..." 
            class="search-input"
          />
        </div>
        
        <label v-if="activeTab === 'classes'" class="toggle-filter">
          <input v-model="filterUnassigned" type="checkbox" />
          <span class="toggle-label">Show Unassigned Only</span>
        </label>
      </div>
    </div>

    <!-- Teachers View -->
    <div v-if="activeTab === 'teachers'" class="view-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading teachers...</p>
      </div>
      
      <div v-else-if="teachers.length === 0" class="empty-state">
        <div class="empty-icon">👨‍🏫</div>
        <h3>No teachers found</h3>
        <p>There are no active teachers in the system</p>
      </div>

      <div v-else class="teachers-grid">
        <div 
          v-for="teacher in filteredTeachers" 
          :key="teacher.id"
          class="teacher-card"
        >
          <div class="teacher-header">
            <img 
              v-if="teacher.avatarUrl" 
              :src="teacher.avatarUrl" 
              class="teacher-avatar-img" 
              alt="Teacher avatar"
            />
            <div v-else class="teacher-avatar">{{ getInitials(teacher) }}</div>
            
            <div class="teacher-info">
              <h4>{{ teacher.firstName }} {{ teacher.lastName }}</h4>
              <p class="teacher-email">{{ teacher.email }}</p>
            </div>
            <span class="class-count-badge">
              {{ teacher.classCount }} class{{ teacher.classCount !== 1 ? 'es' : '' }}
            </span>
          </div>
          
          <div class="assigned-classes">
            <h5>Assigned Classes</h5>
            <div v-if="teacher.classes.length === 0" class="no-classes">
              No classes assigned
            </div>
            <div v-else class="class-list">
              <div 
                v-for="cls in teacher.classes" 
                :key="cls.assignmentId"
                :class="['class-tag', { primary: cls.isPrimary }]"
              >
                <div class="tag-content">
                  <span class="class-name">{{ cls.course.name }}</span>
                  <span class="class-term">{{ cls.term }}</span>
                </div>
                <span v-if="cls.isPrimary" class="primary-badge" title="Primary Teacher">★</span>
                <button 
                  class="btn-remove"
                  @click="confirmRemoveAssignment(cls.assignmentId, teacher, cls)"
                  title="Remove assignment"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Classes View -->
    <div v-else class="view-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading classes...</p>
      </div>
      
      <div v-else-if="classes.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No classes found</h3>
        <p>There are no active classes in the system</p>
      </div>

      <div v-else class="classes-grid">
        <div 
          v-for="cls in filteredClasses" 
          :key="cls.id"
          class="class-card"
        >
          <div class="class-header">
            <div class="class-info">
              <h4>{{ cls.course.name }}</h4>
              <p class="class-meta">
                <span class="term">{{ cls.term }}</span>
                <span class="section" v-if="cls.section">Sec {{ cls.section }}</span>
                <span class="students">{{ cls.studentCount }} students</span>
              </p>
            </div>
            <span :class="['teacher-count-badge', { 'zero': cls.teacherCount === 0 }]">
              {{ cls.teacherCount }} teacher{{ cls.teacherCount !== 1 ? 's' : '' }}
            </span>
          </div>
          
          <div class="assigned-teachers">
            <h5>Assigned Teachers</h5>
            <div v-if="cls.teachers.length === 0" class="no-teachers warning-text">
              ⚠️ No teachers assigned
            </div>
            <div v-else class="teacher-list">
              <div 
                v-for="teacher in cls.teachers" 
                :key="teacher.assignmentId"
                :class="['teacher-tag', { primary: teacher.isPrimary }]"
              >
                <img 
                  v-if="teacher.avatarUrl" 
                  :src="teacher.avatarUrl" 
                  class="mini-avatar" 
                  alt=""
                />
                <span class="teacher-name">{{ teacher.firstName }} {{ teacher.lastName }}</span>
                <span v-if="teacher.isPrimary" class="primary-badge" title="Primary Teacher">★</span>
                <button 
                  class="btn-remove"
                  @click="confirmRemoveAssignment(teacher.assignmentId, teacher, cls)"
                  title="Remove assignment"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Assign Teacher to Class</h3>
          <button class="btn-close" @click="closeAssignModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Teacher *</label>
            <select v-model="assignForm.teacherId" class="input">
              <option value="">Choose a teacher</option>
              <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.firstName }} {{ teacher.lastName }} ({{ teacher.email }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Select Class *</label>
            <select v-model="assignForm.classId" class="input">
              <option value="">Choose a class</option>
              <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                {{ cls.course.name }} - {{ cls.term }} {{ cls.section ? `(Section ${cls.section})` : '' }}
              </option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="assignForm.isPrimary" type="checkbox" />
              <span>Set as Primary Teacher</span>
            </label>
            <small class="help-text">Primary teacher is the main contact for the class</small>
          </div>
          
          <div v-if="assignError" class="error-message">
            {{ assignError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAssignModal" :disabled="assigning">
            Cancel
          </button>
          <button 
            class="btn btn-primary" 
            @click="submitAssignment"
            :disabled="!assignForm.teacherId || !assignForm.classId || assigning"
          >
            <span v-if="assigning" class="spinner-small"></span>
            <span v-else>Assign</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Remove Modal -->
    <div v-if="showRemoveModal" class="modal-overlay" @click.self="closeRemoveModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Remove Assignment</h3>
          <button class="btn-close" @click="closeRemoveModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to remove <strong>{{ removeTarget?.teacherName }}</strong> from <strong>{{ removeTarget?.className }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRemoveModal" :disabled="removing">
            Cancel
          </button>
          <button 
            class="btn btn-danger" 
            @click="confirmRemove"
            :disabled="removing"
          >
            <span v-if="removing" class="spinner-small"></span>
            <span v-else>Remove</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'
import { showToast } from '../composables/useToast'

const adminStore = useAdminStore()

const activeTab = ref('teachers')
const loading = ref(true)
const teachers = ref([])
const classes = ref([])

// Filtering & Search
const searchQuery = ref('')
const filterUnassigned = ref(false)

// Statistics
const stats = computed(() => {
  const totalTeachers = teachers.value.length
  const totalClasses = classes.value.length
  const unassignedClasses = classes.value.filter(c => c.teachers.length === 0).length
  const utilization = totalTeachers > 0 
    ? Math.round((teachers.value.filter(t => t.classes.length > 0).length / totalTeachers) * 100)
    : 0

  return { totalTeachers, totalClasses, unassignedClasses, utilization }
})

const filteredTeachers = computed(() => {
  let result = teachers.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.firstName.toLowerCase().includes(query) || 
      t.lastName.toLowerCase().includes(query) || 
      (t.email && t.email.toLowerCase().includes(query))
    )
  }
  
  return result
})

const filteredClasses = computed(() => {
  let result = classes.value
  
  if (filterUnassigned.value) {
    result = result.filter(c => c.teachers.length === 0)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.course.name.toLowerCase().includes(query) ||
      c.course.code.toLowerCase().includes(query) ||
      (c.section && c.section.toLowerCase().includes(query))
    )
  }
  
  return result
})

// Assign Modal
const showAssignModal = ref(false)
const assigning = ref(false)
const assignError = ref('')
const assignForm = ref({
  teacherId: '',
  classId: '',
  isPrimary: false
})

// Remove Modal
const showRemoveModal = ref(false)
const removing = ref(false)
const removeTarget = ref(null)

const availableTeachers = computed(() => {
  return teachers.value || []
})

const availableClasses = computed(() => {
  return classes.value || []
})

function getInitials(user) {
  return (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
}

async function loadData() {
  loading.value = true
  try {
    const [teachersData, classesData] = await Promise.all([
      adminStore.fetchTeachersWithClasses(),
      adminStore.fetchClassesWithTeachers()
    ])
    teachers.value = teachersData
    classes.value = classesData
  } catch (err) {
    console.error('Failed to load data:', err)
    showToast('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

function openAssignModal() {
  showAssignModal.value = true
  assignForm.value = { teacherId: '', classId: '', isPrimary: false }
  assignError.value = ''
}

function closeAssignModal() {
  showAssignModal.value = false
  assignForm.value = { teacherId: '', classId: '', isPrimary: false }
  assignError.value = ''
}

async function submitAssignment() {
  if (!assignForm.value.teacherId || !assignForm.value.classId) return
  
  assigning.value = true
  assignError.value = ''
  
  try {
    await adminStore.assignTeacherToClass(
      assignForm.value.teacherId,
      assignForm.value.classId,
      assignForm.value.isPrimary
    )
    showToast('Teacher assigned successfully', 'success')
    closeAssignModal()
    await loadData()
  } catch (err) {
    assignError.value = err.response?.data?.message || 'Failed to assign teacher'
    showToast(assignError.value, 'error')
  } finally {
    assigning.value = false
  }
}

function confirmRemoveAssignment(assignmentId, teacher, cls) {
  removeTarget.value = {
    assignmentId,
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    className: cls.course?.name || cls.name || 'Unknown Class'
  }
  showRemoveModal.value = true
}

function closeRemoveModal() {
  showRemoveModal.value = false
  removeTarget.value = null
}

async function confirmRemove() {
  if (!removeTarget.value) return
  
  removing.value = true
  try {
    await adminStore.removeTeacherFromClass(removeTarget.value.assignmentId)
    showToast('Assignment removed successfully', 'success')
    closeRemoveModal()
    await loadData()
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to remove assignment', 'error')
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.allocation-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--border);
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.warning {
  border-color: var(--warning-light, #fcd34d);
  background: var(--warning-lighter, #fffbeb);
}

.stat-icon {
  font-size: 2rem;
  background: var(--bg-body);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
}

.tabs {
  margin-bottom: 0;
  border-bottom: none;
}

.filters {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-body);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.toggle-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

/* Updated Avatar Styles */
.teacher-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
}

.mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.tag-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.class-term {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.teacher-count-badge.zero {
  background: var(--danger-light, #fee2e2);
  color: var(--danger, #ef4444);
}

.warning-text {
  color: var(--warning, #d97706) !important;
  font-weight: 500;
}

/* Loading & Empty */
.loading {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  color: var(--text-secondary);
}

/* Teachers Grid */
.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.teacher-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.teacher-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.teacher-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.teacher-info {
  flex: 1;
}

.teacher-info h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
}

.teacher-email {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.class-count-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Classes Grid */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.class-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.class-info h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
}

.class-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.class-meta span {
  background: var(--bg-body);
  padding: 2px 8px;
  border-radius: 4px;
}

.teacher-count-badge {
  background: var(--success-light, #d1fae5);
  color: var(--success, #065f46);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Assigned Lists */
.assigned-classes h5,
.assigned-teachers h5 {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.no-classes,
.no-teachers {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.9rem;
}

.class-list,
.teacher-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-tag,
.teacher-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-body);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.class-tag.primary,
.teacher-tag.primary {
  background: var(--primary-light);
  border-color: var(--primary);
}

.class-name,
.teacher-name {
  flex: 1;
  font-size: 0.95rem;
}

.primary-badge {
  background: var(--primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--danger-light, #fee2e2);
  color: var(--danger, #ef4444);
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
  padding: 20px;
}

.modal {
  background: var(--bg-card);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--bg-body);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 0.9rem;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg-body);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
}

.checkbox-group {
  margin-top: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.help-text {
  display: block;
  margin-top: 4px;
  margin-left: 26px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.error-message {
  background: var(--danger-light, #fee2e2);
  color: var(--danger, #dc2626);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--bg-body);
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-body);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
}

.btn-danger {
  background: var(--danger, #ef4444);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger-dark, #dc2626);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@media (max-width: 768px) {
  .teachers-grid,
  .classes-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
