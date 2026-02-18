<template>
  <div class="assignment-detail-page">
    <!-- Header -->
    <div class="page-header">
      <button class="btn-back" @click="$router.back()">
        <span>&larr;</span> Back
      </button>
      <h1>{{ assignment?.title || 'Assignment' }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading assignment...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchAssignment">Try Again</button>
    </div>

    <template v-else-if="assignment">
      <!-- Assignment Info -->
      <div class="assignment-card">
        <div class="assignment-header">
          <div class="header-main">
            <span :class="['status-badge', getStatus(assignment)]">
              {{ getStatusLabel(assignment) }}
            </span>
            <h2>{{ assignment.title }}</h2>
            <p class="class-name">{{ assignment.class?.course?.name }}</p>
          </div>
          <div class="header-meta">
            <div class="meta-item">
              <span class="meta-label">Due Date</span>
              <span :class="['meta-value', { overdue: isOverdue(assignment) }]">
                {{ formatDate(assignment.dueDate) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Points</span>
              <span class="meta-value">{{ assignment.maxPoints }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Type</span>
              <span class="meta-value">{{ assignment.type }}</span>
            </div>
          </div>
        </div>

        <div class="assignment-body">
          <h3>Description</h3>
          <p class="description">{{ assignment.description || 'No description provided.' }}</p>

          <!-- Attached Files -->
          <div v-if="assignment.files?.length" class="files-section">
            <h3>Attached Files</h3>
            <div class="files-list">
              <a 
                v-for="file in assignment.files" 
                :key="file.id"
                :href="file.url" 
                target="_blank"
                class="file-item"
              >
                <span class="file-icon">📎</span>
                <span class="file-name">{{ file.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Submission Section -->
      <div v-if="isStudent" class="submission-section">
        <h3>Your Submission</h3>

        <div v-if="submission" class="submission-card">
          <div class="submission-header">
            <span class="submission-date">
              Submitted on {{ formatDateTime(submission.submittedAt) }}
            </span>
            <span v-if="submission.isLate" class="late-badge">Late</span>
          </div>

          <div v-if="submission.content" class="submission-content">
            <p>{{ submission.content }}</p>
          </div>

          <div v-if="submission.fileIds?.length" class="submission-files">
            <h4>Submitted Files</h4>
            <div class="files-list">
              <span v-for="(fileId, idx) in submission.fileIds" :key="fileId" class="file-item">
                <span class="file-icon">📄</span>
                <span class="file-name">File {{ idx + 1 }}</span>
              </span>
            </div>
          </div>

          <!-- Grade Display -->
          <div v-if="submission.grade" class="grade-display">
            <div class="grade-box">
              <span class="grade-score">{{ submission.grade.score }}</span>
              <span class="grade-total">/{{ submission.grade.maxScore }}</span>
            </div>
            <div v-if="submission.grade.feedback" class="grade-feedback">
              <h4>Feedback</h4>
              <p>{{ submission.grade.feedback }}</p>
            </div>
          </div>
        </div>

        <!-- Submit Form -->
        <div v-else class="submit-form">
          <div v-if="isOverdue(assignment)" class="warning-banner">
            ⚠️ This assignment is overdue. You can still submit but it will be marked as late.
          </div>

          <div class="form-group">
            <label>Your Answer</label>
            <textarea 
              v-model="submissionContent" 
              rows="6"
              class="input"
              placeholder="Enter your submission..."
            ></textarea>
          </div>

          <div class="form-actions">
            <button 
              class="btn btn-primary" 
              :disabled="submitting || !submissionContent.trim()"
              @click="submitAssignment"
            >
              <span v-if="submitting" class="spinner-small"></span>
              <span v-else>Submit Assignment</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Teacher Gradebook Section -->
      <div v-else-if="isTeacher || isAdmin" class="gradebook-section">
        <h3>Submissions ({{ submissions.length }})</h3>

        <div v-if="submissions.length === 0" class="empty-state">
          <p>No submissions yet.</p>
        </div>

        <div v-else class="submissions-list">
          <div 
            v-for="sub in submissions" 
            :key="sub.id"
            class="submission-row"
          >
            <div class="student-info">
              <span class="student-name">{{ sub.student?.firstName }} {{ sub.student?.lastName }}</span>
              <span class="student-email">{{ sub.student?.email }}</span>
            </div>

            <div class="submission-meta">
              <span :class="['submission-status', { late: sub.isLate }]">
                {{ sub.isLate ? 'Late' : 'On Time' }}
              </span>
              <span class="submission-date">{{ formatDateTime(sub.submittedAt) }}</span>
            </div>

            <div class="grade-actions">
              <div v-if="sub.grade" class="graded-score">
                {{ sub.grade.score }}/{{ sub.grade.maxScore }}
              </div>
              <button 
                class="btn btn-secondary btn-sm"
                @click="openGradeModal(sub)"
              >
                {{ sub.grade ? 'Edit Grade' : 'Grade' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Grade Modal -->
    <div v-if="showGradeModal" class="modal-overlay" @click.self="closeGradeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Grade Submission</h3>
          <button class="btn-close" @click="closeGradeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="student-preview">
            <strong>{{ selectedSubmission?.student?.firstName }} {{ selectedSubmission?.student?.lastName }}</strong>
            <p>{{ selectedSubmission?.content?.substring(0, 100) }}...</p>
          </div>
          <div class="form-group">
            <label>Score (out of {{ assignment?.maxPoints }})</label>
            <input 
              v-model.number="gradeForm.score" 
              type="number" 
              class="input"
              :max="assignment?.maxPoints"
              min="0"
            />
          </div>
          <div class="form-group">
            <label>Feedback</label>
            <textarea 
              v-model="gradeForm.feedback" 
              rows="3"
              class="input"
              placeholder="Optional feedback for the student..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeGradeModal">Cancel</button>
          <button 
            class="btn btn-primary" 
            :disabled="grading"
            @click="submitGrade"
          >
            <span v-if="grading" class="spinner-small"></span>
            <span v-else>Save Grade</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { assignmentsApi } from '../services/assignments'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { showToast } = useToast()

const assignment = ref(null)
const submission = ref(null)
const submissions = ref([])
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const submissionContent = ref('')

// Grade modal state
const showGradeModal = ref(false)
const selectedSubmission = ref(null)
const gradeForm = ref({ score: 0, feedback: '' })
const grading = ref(false)

const assignmentId = computed(() => route.params.id)
const isStudent = computed(() => auth.user?.roles?.includes('student') ?? false)
const isTeacher = computed(() => auth.user?.roles?.includes('teacher') ?? false)
const isAdmin = computed(() => auth.user?.roles?.includes('admin') ?? false)

function getStatus(assignment) {
  if (submission.value?.grade) return 'graded'
  if (submission.value) return 'submitted'
  if (isOverdue(assignment)) return 'overdue'
  return 'pending'
}

function getStatusLabel(assignment) {
  const status = getStatus(assignment)
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function isOverdue(assignment) {
  if (!assignment?.dueDate) return false
  return new Date(assignment.dueDate) < new Date()
}

function formatDate(date) {
  if (!date) return 'No deadline'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchAssignment() {
  loading.value = true
  error.value = ''
  
  try {
    const { data } = await assignmentsApi.getAssignment(assignmentId.value)
    assignment.value = data
    
    // Fetch submission data based on role
    if (isStudent.value) {
      try {
        const subRes = await assignmentsApi.getMySubmission(assignmentId.value)
        submission.value = subRes.data
      } catch {
        // No submission yet
        submission.value = null
      }
    } else if (isTeacher.value || isAdmin.value) {
      const subsRes = await assignmentsApi.getSubmissions(assignmentId.value)
      submissions.value = subsRes.data || []
    }
  } catch (err) {
    console.error('Failed to fetch assignment:', err)
    error.value = err.response?.data?.message || 'Failed to load assignment'
  } finally {
    loading.value = false
  }
}

async function submitAssignment() {
  if (!submissionContent.value.trim()) return
  
  submitting.value = true
  
  try {
    await assignmentsApi.submitAssignment(assignmentId.value, {
      content: submissionContent.value
    })
    
    showToast('Assignment submitted successfully!', 'success')
    
    // Refresh to get the submission
    await fetchAssignment()
    submissionContent.value = ''
  } catch (err) {
    console.error('Failed to submit:', err)
    showToast(err.response?.data?.message || 'Failed to submit assignment', 'error')
  } finally {
    submitting.value = false
  }
}

function openGradeModal(sub) {
  selectedSubmission.value = sub
  gradeForm.value = {
    score: sub.grade?.score || 0,
    feedback: sub.grade?.feedback || ''
  }
  showGradeModal.value = true
}

function closeGradeModal() {
  showGradeModal.value = false
  selectedSubmission.value = null
}

async function submitGrade() {
  grading.value = true
  
  try {
    await assignmentsApi.gradeSubmission(selectedSubmission.value.id, {
      score: gradeForm.value.score,
      maxScore: assignment.value.maxPoints,
      feedback: gradeForm.value.feedback
    })
    
    showToast('Grade saved successfully!', 'success')
    closeGradeModal()
    await fetchAssignment()
  } catch (err) {
    console.error('Failed to grade:', err)
    showToast(err.response?.data?.message || 'Failed to save grade', 'error')
  } finally {
    grading.value = false
  }
}

onMounted(fetchAssignment)
</script>

<style scoped>
.assignment-detail-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.btn-back {
  background: none;
  border: none;
  color: #0ea5e9;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-back:hover {
  text-decoration: underline;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #737373;
}

.error-state {
  color: #ef4444;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e5e5;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.assignment-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.assignment-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.header-main {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
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

.header-main h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.class-name {
  color: #0ea5e9;
  font-weight: 500;
  margin: 0;
}

.header-meta {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.75rem;
  color: #737373;
  text-transform: uppercase;
  font-weight: 500;
}

.meta-value {
  font-size: 1rem;
  font-weight: 600;
  color: #171717;
}

.meta-value.overdue {
  color: #ef4444;
}

.assignment-body {
  padding: 1.5rem;
}

.assignment-body h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #171717;
}

.description {
  color: #404040;
  line-height: 1.6;
  margin: 0 0 1.5rem;
  white-space: pre-wrap;
}

.files-section {
  margin-top: 1.5rem;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
  color: #171717;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.file-item:hover {
  background: #e5e5e5;
}

.file-icon {
  font-size: 1rem;
}

/* Submission Section */
.submission-section,
.gradebook-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.submission-section h3,
.gradebook-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.submission-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.submission-date {
  font-size: 0.875rem;
  color: #737373;
}

.late-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.submission-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.submission-content p {
  margin: 0;
  white-space: pre-wrap;
}

.submission-files h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.grade-display {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.grade-box {
  display: inline-flex;
  align-items: baseline;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.grade-score {
  font-size: 2rem;
  font-weight: 700;
}

.grade-total {
  font-size: 1rem;
  opacity: 0.8;
}

.grade-feedback {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.grade-feedback h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.grade-feedback p {
  margin: 0;
  color: #404040;
}

/* Submit Form */
.warning-banner {
  background: #fef3c7;
  color: #92400e;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #171717;
  margin-bottom: 0.5rem;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #0ea5e9;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

/* Gradebook Section */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #737373;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.submission-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: #171717;
}

.student-email {
  font-size: 0.75rem;
  color: #737373;
}

.submission-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.submission-status {
  font-size: 0.75rem;
  font-weight: 500;
  color: #10b981;
}

.submission-status.late {
  color: #ef4444;
}

.submission-date {
  font-size: 0.75rem;
  color: #737373;
}

.grade-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.graded-score {
  font-weight: 600;
  color: #0ea5e9;
}

/* Buttons */
.btn {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #0ea5e9;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0284c7;
}

.btn-secondary {
  background: #f5f5f5;
  color: #171717;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #737373;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.btn-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.student-preview {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.student-preview p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #737373;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .header-meta {
    gap: 1rem;
  }
  
  .submission-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .submission-meta {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
  }
  
  .grade-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
