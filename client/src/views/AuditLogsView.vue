<template>
  <div class="audit-logs-page">
    <div class="page-header">
      <h1>📋 Audit Logs</h1>
      <p>Track all system activities and changes</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Action</label>
        <select v-model="filters.action" class="input" @change="fetchLogs">
          <option value="">All Actions</option>
          <option value="user_create">User Created</option>
          <option value="user_update">User Updated</option>
          <option value="user_suspend">User Suspended</option>
          <option value="message_delete">Message Deleted</option>
          <option value="message_edit">Message Edited</option>
          <option value="channel_create">Channel Created</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Start Date</label>
        <input v-model="filters.startDate" type="date" class="input" @change="fetchLogs">
      </div>
      <div class="filter-group">
        <label>End Date</label>
        <input v-model="filters.endDate" type="date" class="input" @change="fetchLogs">
      </div>
      <div class="filter-group search-group">
        <label>Search</label>
        <input 
          v-model="filters.search" 
          type="text" 
          class="input"
          placeholder="Search by user or target..."
          @input="debouncedSearch"
        >
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading audit logs...</p>
      </div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No audit logs found</h3>
        <p>No activities match your current filters.</p>
      </div>

      <template v-else>
        <div class="logs-table-wrapper">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id" class="log-row">
                <td class="log-time">
                  <span class="time-main">{{ formatTime(log.createdAt) }}</span>
                  <span class="time-date">{{ formatDate(log.createdAt) }}</span>
                </td>
                <td>
                  <div class="actor-cell">
                    <div class="actor-avatar" :style="{ background: getUserColor(log.actor?.id) }">
                      {{ log.actor?.firstName?.[0] || '?' }}
                    </div>
                    <div class="actor-info">
                      <span class="actor-name">{{ log.actor?.firstName }} {{ log.actor?.lastName }}</span>
                      <span class="actor-email">{{ log.actor?.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['action-badge', getActionClass(log.action)]">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td>
                  <span class="target-id" :title="log.targetId">
                    {{ log.targetId ? log.targetId.substring(0, 8) + '...' : '-' }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="log.metadata" 
                    class="btn-details"
                    @click="viewDetails(log)"
                  >
                    View Details
                  </button>
                  <span v-else class="no-details">-</span>
                </td>
                <td class="log-ip">{{ log.ipAddress || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button 
            class="btn btn-secondary"
            :disabled="page === 1"
            @click="page--; fetchLogs()"
          >
            Previous
          </button>
          <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
          <button 
            class="btn btn-secondary"
            :disabled="page >= totalPages"
            @click="page++; fetchLogs()"
          >
            Next
          </button>
        </div>
      </template>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Log Details</h3>
          <button class="btn-close" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <label>Action</label>
            <p>{{ selectedLog?.action }}</p>
          </div>
          <div class="detail-section">
            <label>Actor</label>
            <p>{{ selectedLog?.actor?.firstName }} {{ selectedLog?.actor?.lastName }} ({{ selectedLog?.actor?.email }})</p>
          </div>
          <div class="detail-section">
            <label>Timestamp</label>
            <p>{{ formatFullDate(selectedLog?.createdAt) }}</p>
          </div>
          <div v-if="selectedLog?.metadata" class="detail-section">
            <label>Metadata</label>
            <pre class="metadata-json">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDetailsModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const logs = ref([])
const loading = ref(true)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / limit.value))

const filters = ref({
  action: '',
  startDate: '',
  endDate: '',
  search: ''
})

const showDetailsModal = ref(false)
const selectedLog = ref(null)

let searchTimeout = null

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchLogs()
  }, 300)
}

// Color generator for avatars
const colorMap = new Map()
const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function getUserColor(userId) {
  if (!userId) return '#9ca3af'
  if (!colorMap.has(userId)) {
    const index = colorMap.size % colors.length
    colorMap.set(userId, colors[index])
  }
  return colorMap.get(userId)
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-US')
}

function formatAction(action) {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getActionClass(action) {
  const classes = {
    user_create: 'success',
    user_update: 'info',
    user_suspend: 'danger',
    user_delete: 'danger',
    message_delete: 'warning',
    message_edit: 'info',
    channel_create: 'success',
    login: 'success',
    logout: 'neutral'
  }
  return classes[action] || 'neutral'
}

async function fetchLogs() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      ...filters.value
    }
    const { data } = await api.get('/admin/audit-logs', { params })
    // Handle both potential response structures
    if (data.data && Array.isArray(data.data)) {
      logs.value = data.data
      total.value = data.meta?.total || data.total || 0
    } else {
      logs.value = data.logs || []
      total.value = data.total || 0
    }
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
  } finally {
    loading.value = false
  }
}

function viewDetails(log) {
  selectedLog.value = log
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedLog.value = null
}

onMounted(fetchLogs)
</script>

<style scoped>
.audit-logs-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.page-header p {
  color: #737373;
  margin: 0;
}

/* Filters */
.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group.search-group {
  grid-column: span 2;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #737373;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #0ea5e9;
}

/* Logs Section */
.logs-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  text-align: center;
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
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Logs Table */
.logs-table-wrapper {
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.logs-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #737373;
  border-bottom: 1px solid #e5e5e5;
  white-space: nowrap;
}

.log-row {
  border-bottom: 1px solid #f5f5f5;
}

.log-row:hover {
  background: #fafafa;
}

.log-row td {
  padding: 1rem;
  vertical-align: top;
}

.log-time {
  display: flex;
  flex-direction: column;
}

.time-main {
  font-weight: 500;
  color: #171717;
}

.time-date {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.actor-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.actor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.actor-info {
  display: flex;
  flex-direction: column;
}

.actor-name {
  font-weight: 500;
  color: #171717;
}

.actor-email {
  font-size: 0.75rem;
  color: #737373;
}

.action-badge {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.action-badge.success {
  background: #d1fae5;
  color: #059669;
}

.action-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.action-badge.warning {
  background: #fef3c7;
  color: #d97706;
}

.action-badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

.action-badge.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.target-id {
  font-family: monospace;
  font-size: 0.75rem;
  color: #737373;
}

.btn-details {
  background: none;
  border: none;
  color: #0ea5e9;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
}

.btn-details:hover {
  text-decoration: underline;
}

.no-details {
  color: #a3a3a3;
}

.log-ip {
  font-family: monospace;
  font-size: 0.75rem;
  color: #737373;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e5e5;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #171717;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #737373;
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
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.detail-section p {
  margin: 0;
  color: #171717;
}

.metadata-json {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
}

@media (max-width: 768px) {
  .filter-group.search-group {
    grid-column: span 1;
  }
  
  .logs-table th,
  .logs-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
