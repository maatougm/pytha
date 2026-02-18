<template>
  <div class="moderation-page">
    <div class="page-header">
      <h1>🛡️ Content Moderation</h1>
      <p>Review and moderate messages and content</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">🚩</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.flagged }}</span>
          <span class="stat-label">Flagged Messages</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⏳</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">Pending Review</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.approved }}</span>
          <span class="stat-label">Approved Today</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🗑️</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.removed }}</span>
          <span class="stat-label">Removed Today</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content Queue -->
    <div class="content-section">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading content...</p>
      </div>

      <div v-else-if="content.length === 0" class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>No content to review</h3>
        <p>All caught up! There are no messages pending moderation.</p>
      </div>

      <div v-else class="content-list">
        <div 
          v-for="item in content" 
          :key="item.id"
          class="content-card"
        >
          <div class="content-header">
            <div class="author-info">
              <div class="author-avatar" :style="{ background: getUserColor(item.sender?.id) }">
                {{ item.sender?.firstName?.[0] || '?' }}
              </div>
              <div class="author-details">
                <span class="author-name">{{ item.sender?.firstName }} {{ item.sender?.lastName }}</span>
                <span class="author-email">{{ item.sender?.email }}</span>
              </div>
            </div>
            <div class="content-meta">
              <span class="content-type">{{ item.contentType || 'message' }}</span>
              <span class="content-date">{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>

          <div class="content-body">
            <p class="content-text">{{ item.content }}</p>
            <div v-if="item.channel" class="channel-tag">
              in {{ item.channel.name || 'Unnamed Channel' }}
            </div>
          </div>

          <div class="content-actions">
            <button 
              class="btn btn-success"
              @click="approveContent(item)"
              :disabled="processing[item.id]"
            >
              <span v-if="processing[item.id] === 'approve'" class="spinner-small"></span>
              <span v-else>✓ Approve</span>
            </button>
            <button 
              class="btn btn-danger"
              @click="deleteContent(item)"
              :disabled="processing[item.id]"
            >
              <span v-if="processing[item.id] === 'delete'" class="spinner-small"></span>
              <span v-else>🗑️ Delete</span>
            </button>
            <button 
              class="btn btn-secondary"
              @click="viewContext(item)"
            >
              View Context
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()

const activeTab = ref('pending')
const tabs = [
  { id: 'pending', label: '⏳ Pending Review' },
  { id: 'flagged', label: '🚩 Flagged' },
  { id: 'all', label: '📋 All Content' },
]

const stats = ref({ flagged: 0, pending: 0, approved: 0, removed: 0 })
const content = ref([])
const loading = ref(true)
const processing = ref({})

// Color generator for avatars
const colorMap = new Map()
const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function getUserColor(userId) {
  if (!colorMap.has(userId)) {
    const index = colorMap.size % colors.length
    colorMap.set(userId, colors[index])
  }
  return colorMap.get(userId)
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffHours = Math.floor((now - d) / 3600000)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function fetchStats() {
  try {
    const { data } = await api.get('/admin/moderation/stats')
    stats.value = data
  } catch (err) {
    console.error('Failed to fetch stats:', err)
  }
}

async function fetchContent() {
  loading.value = true
  try {
    const flagged = activeTab.value === 'flagged'
    const { data } = await api.get('/admin/moderation/content', {
      params: { flagged, page: 1, limit: 50 }
    })
    content.value = data.content || []
  } catch (err) {
    console.error('Failed to fetch content:', err)
    showToast('Failed to load content', 'error')
  } finally {
    loading.value = false
  }
}

async function approveContent(item) {
  processing.value[item.id] = 'approve'
  try {
    await api.post(`/admin/moderation/content/${item.id}/approve`)
    showToast('Content approved', 'success')
    content.value = content.value.filter(c => c.id !== item.id)
    stats.value.pending--
    stats.value.approved++
  } catch (err) {
    showToast('Failed to approve content', 'error')
  } finally {
    processing.value[item.id] = null
  }
}

async function deleteContent(item) {
  if (!confirm('Are you sure you want to delete this content?')) return
  
  processing.value[item.id] = 'delete'
  try {
    await api.delete(`/admin/moderation/content/${item.id}`)
    showToast('Content deleted', 'success')
    content.value = content.value.filter(c => c.id !== item.id)
    stats.value.pending--
    stats.value.removed++
  } catch (err) {
    showToast('Failed to delete content', 'error')
  } finally {
    processing.value[item.id] = null
  }
}

function viewContext(item) {
  // Navigate to the message in its channel context
  showToast('Navigate to channel: ' + item.channel?.name, 'info')
}

onMounted(() => {
  fetchStats()
  fetchContent()
})
</script>

<style scoped>
.moderation-page {
  max-width: 1000px;
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #171717;
}

.stat-label {
  font-size: 0.875rem;
  color: #737373;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #737373;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f5f5f5;
  color: #171717;
}

.tab-btn.active {
  background: #0ea5e9;
  color: white;
}

/* Content Section */
.content-section {
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

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #171717;
  margin: 0 0 0.5rem;
}

.empty-state p {
  margin: 0;
}

/* Content List */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-card {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s;
}

.content-card:hover {
  border-color: #d4d4d4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #171717;
}

.author-email {
  font-size: 0.75rem;
  color: #737373;
}

.content-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.content-type {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #737373;
}

.content-date {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.content-body {
  margin-bottom: 1rem;
}

.content-text {
  color: #404040;
  line-height: 1.6;
  margin: 0 0 0.5rem;
}

.channel-tag {
  font-size: 0.75rem;
  color: #0ea5e9;
  background: #f0f9ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.content-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
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

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #f5f5f5;
  color: #404040;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .content-meta {
    align-items: flex-start;
    flex-direction: row;
    gap: 0.75rem;
  }
  
  .content-actions {
    flex-wrap: wrap;
  }
}
</style>
