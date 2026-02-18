<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal" style="max-width: 800px; width: 90%;">
      <div class="modal-header">
        <h3>{{ assignment?.title }} - Submissions</h3>
        <button class="btn-icon" @click="close"><span class="material-icons-round">close</span></button>
      </div>

      <div class="modal-body">
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="sub in submissions" :key="sub.id">
                    <td>{{ sub.student.firstName }} {{ sub.student.lastName }}</td>
                    <td>
                        {{ formatDate(sub.submittedAt) }}
                        <span v-if="sub.isLate" class="badge-late">Late</span>
                    </td>
                    <td>
                        <span :class="['status-pill', sub.grade ? 'graded' : 'pending']">
                            {{ sub.grade ? 'Graded' : 'Pending' }}
                        </span>
                    </td>
                    <td>{{ sub.grade ? sub.grade.score : '-' }}/{{ assignment.maxPoints }}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" @click="openGrading(sub)">
                            Grade
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>

    <!-- Nested Grading Modal -->
    <div v-if="gradingSubmission" class="modal-overlay" style="z-index: 1000;" @click.self="gradingSubmission = null">
        <div class="modal" style="max-width: 500px;">
            <h3>Grade {{ gradingSubmission.student.firstName }}'s Work</h3>
            <div class="submission-content">
                <p><strong>Content:</strong></p>
                <div class="content-box">{{ gradingSubmission.content || 'No text content.' }}</div>
                <div v-if="gradingSubmission.fileIds?.length" class="attachments">
                    <p><strong>Attachments:</strong></p>
                    <div v-for="fid in gradingSubmission.fileIds" :key="fid" class="attachment-link">
                        <a :href="`/api/files/${fid}/download`" target="_blank" style="display:flex;align-items:center;gap:4px;">
                            <span class="material-icons-round" style="font-size:16px;">attachment</span> File {{ fid.substring(0,8) }}...
                        </a>
                    </div>
                </div>
            </div>

            <form @submit.prevent="submitGrade" style="margin-top: 16px;">
                 <div class="input-group">
                    <label>Score (Max {{ assignment.maxPoints }})</label>
                    <input v-model.number="gradeForm.score" type="number" class="input" :max="assignment.maxPoints" min="0" required />
                </div>
                <div class="input-group">
                    <label>Feedback</label>
                    <textarea v-model="gradeForm.feedback" class="input" rows="3"></textarea>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-secondary" @click="gradingSubmission = null">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Grade</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue'
import api from '../services/api'

const props = defineProps({
  isOpen: Boolean,
  assignment: Object
})

const emit = defineEmits(['close'])
const showToast = inject('showToast')

const submissions = ref([])
const gradingSubmission = ref(null)
const gradeForm = ref({ score: 0, feedback: '' })

watch(() => props.isOpen, async (val) => {
    if (val && props.assignment) {
        await fetchSubmissions()
    }
})

async function fetchSubmissions() {
    try {
        const { data } = await api.get(`/assignments/${props.assignment.id}/submissions`)
        submissions.value = data
    } catch (err) {
        showToast('Failed to load submissions', 'error')
    }
}

function openGrading(sub) {
    gradingSubmission.value = sub
    gradeForm.value = {
        score: sub.grade?.score || 0,
        feedback: sub.grade?.feedback || ''
    }
}

async function submitGrade() {
    if (!gradingSubmission.value) return
    try {
        await api.post(`/submissions/${gradingSubmission.value.id}/grade`, {
            score: gradeForm.value.score,
            feedback: gradeForm.value.feedback
        })
        showToast('Grade saved', 'success')
        gradingSubmission.value = null
        fetchSubmissions() // Refresh list
    } catch (err) {
        showToast('Failed to save grade', 'error')
    }
}

function close() {
    emit('close')
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
}

.submissions-table {
    width: 100%;
    border-collapse: collapse;
}

.submissions-table th, .submissions-table td {
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid var(--border);
}

.badge-late {
    background: #fee2e2;
    color: #ef4444;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    margin-left: 6px;
}

.status-pill.graded { background: #dcfce7; color: #16a34a; }
.status-pill.pending { background: #fef3c7; color: #d97706; }

.submission-content {
    background: var(--bg-body);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.content-box {
    margin-bottom: 12px;
    white-space: pre-wrap;
}
</style>
