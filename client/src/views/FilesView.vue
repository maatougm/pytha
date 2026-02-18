<template>
  <div class="files-page">
    <div class="page-header">
      <h1>{{ $t('nav.files') }}</h1>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else>{{ files.length }} files • {{ formatSize(totalSize) }}</p>
    </div>

    <div class="files-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          :placeholder="$t('common.search')" 
          v-model="searchQuery" 
          class="input search-input" 
        />
      </div>
      <button class="btn btn-primary" @click="showUploadModal = true">
        <span>📤</span> {{ $t('files.upload') }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredFiles.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <h3>{{ $t('files.noFiles') }}</h3>
      <p>{{ $t('files.noFilesDescription') }}</p>
    </div>

    <div v-else class="files-grid">
      <div v-for="file in filteredFiles" :key="file.id" class="file-card">
        <div class="file-icon" :class="getFileType(file)">{{ getFileIcon(file) }}</div>
        <div class="file-info">
          <h4 class="file-name" :title="file.originalName">{{ file.originalName }}</h4>
          <div class="file-meta">
            <span>{{ formatSize(file.size) }}</span>
            <span>•</span>
            <span>{{ formatDate(file.createdAt) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="action-btn" @click="downloadFile(file)" title="Download">
            ⬇️
          </button>
          <button class="action-btn delete" @click="confirmDelete(file)" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal">
        <h3>{{ $t('files.upload') }}</h3>
        
        <div 
          class="upload-zone"
          :class="{ dragging: isDragging }"
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            ref="fileInput"
            type="file" 
            @change="handleFileSelect"
            class="hidden"
          />
          <div v-if="selectedFile" class="selected-file">
            <span class="file-preview">📄</span>
            <span class="file-name-preview">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
          </div>
          <div v-else class="upload-prompt">
            <span class="upload-icon">📤</span>
            <p>{{ $t('files.dragDrop') }}</p>
            <span class="upload-hint">{{ $t('files.maxSize') }} • {{ $t('files.allowedTypes') }}</span>
          </div>
        </div>

        <div v-if="uploadProgress > 0" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span>{{ uploadProgress }}%</span>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showUploadModal = false">{{ $t('common.cancel') }}</button>
          <button 
            class="btn btn-primary" 
            :disabled="!selectedFile || uploading"
            @click="uploadFile"
          >
            <span v-if="uploading" class="spinner-small"></span>
            <span v-else>{{ $t('files.upload') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal small">
        <h3>{{ $t('common.delete') }} {{ $t('nav.files') }}</h3>
        <p>{{ $t('files.deleteConfirm') }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-danger" @click="deleteFile" :disabled="deleting">
            <span v-if="deleting" class="spinner-small"></span>
            <span v-else>{{ $t('common.delete') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { filesApi } from '../services/files'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const { t } = useI18n()

const files = ref([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref('')
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const selectedFile = ref(null)
const uploadProgress = ref(0)
const uploading = ref(false)
const deleting = ref(false)
const fileToDelete = ref(null)
const isDragging = ref(false)
const totalSize = ref(0)

const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value || []
  const query = searchQuery.value.toLowerCase()
  return (files.value || []).filter(f => f?.originalName?.toLowerCase().includes(query))
})

const fileTypeIcons = {
  'application/pdf': { icon: '📄', class: 'pdf' },
  'image/': { icon: '🖼️', class: 'image' },
  'video/': { icon: '🎬', class: 'video' },
  'audio/': { icon: '🎵', class: 'audio' },
  'application/msword': { icon: '📝', class: 'doc' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', class: 'doc' },
  'application/vnd.ms-excel': { icon: '📊', class: 'xls' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', class: 'xls' },
  'application/vnd.ms-powerpoint': { icon: '📈', class: 'ppt' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📈', class: 'ppt' },
  'text/': { icon: '📃', class: 'text' },
  'application/zip': { icon: '📦', class: 'zip' },
}

function getFileType(file) {
  const mimeType = file.mimeType || ''
  for (const [key, value] of Object.entries(fileTypeIcons)) {
    if (mimeType.startsWith(key) || (key.endsWith('/') && mimeType.startsWith(key))) {
      return value.class
    }
  }
  return 'default'
}

function getFileIcon(file) {
  const mimeType = file.mimeType || ''
  for (const [key, value] of Object.entries(fileTypeIcons)) {
    if (mimeType.startsWith(key) || (key.endsWith('/') && mimeType.startsWith(key))) {
      return value.icon
    }
  }
  return '📎'
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return t('time.today')
  if (diffDays === 1) return t('time.yesterday')
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays })
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('files.sizeError'), 'error')
      return
    }
    selectedFile.value = file
  }
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('files.sizeError'), 'error')
      return
    }
    selectedFile.value = file
  }
}

async function uploadFile() {
  if (!selectedFile.value) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const interval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)
    
    await filesApi.uploadFile(selectedFile.value, {
      category: 'general',
      onProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      }
    })
    
    clearInterval(interval)
    uploadProgress.value = 100
    
    showToast(t('files.uploadSuccess'), 'success')
    selectedFile.value = null
    showUploadModal.value = false
    await fetchFiles()
  } catch (err) {
    console.error('Upload failed:', err)
    showToast(err.response?.data?.message || t('files.uploadError'), 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

async function downloadFile(file) {
  try {
    const response = await filesApi.downloadFile(file.id)
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showToast(t('files.download'), 'success')
  } catch (err) {
    console.error('Download failed:', err)
    showToast(t('files.downloadError'), 'error')
  }
}

function confirmDelete(file) {
  fileToDelete.value = file
  showDeleteModal.value = true
}

async function deleteFile() {
  if (!fileToDelete.value) return
  
  deleting.value = true
  try {
    await filesApi.deleteFile(fileToDelete.value.id)
    showToast(t('files.deleteSuccess'), 'success')
    showDeleteModal.value = false
    fileToDelete.value = null
    await fetchFiles()
  } catch (err) {
    console.error('Delete failed:', err)
    showToast(err.response?.data?.message || t('common.error'), 'error')
  } finally {
    deleting.value = false
  }
}

async function fetchFiles() {
  loading.value = true
  error.value = ''
  try {
    const response = await filesApi.getMyFiles()
    // Handle various API response formats
    let data = response.data || []
    if (data && Array.isArray(data.data)) {
      data = data.data
    } else if (!Array.isArray(data)) {
      data = []
    }
    files.value = data
    totalSize.value = files.value.reduce((sum, f) => sum + (f?.size || 0), 0)
  } catch (err) {
    console.error('Failed to fetch files:', err)
    error.value = err.response?.data?.message || 'Failed to load files'
    showToast(error.value, 'error')
    files.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchFiles)
</script>

<style scoped>
.files-page {
  max-width: 1200px;
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

.files-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}

.search-input {
  padding-left: 2.5rem;
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

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.file-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-icon.pdf { background: #fee2e2; }
.file-icon.doc { background: #dbeafe; }
.file-icon.ppt { background: #fef3c7; }
.file-icon.xls { background: #d1fae5; }
.file-icon.image { background: #fce7f3; }
.file-icon.video { background: #f3e8ff; }
.file-icon.audio { background: #cffafe; }
.file-icon.zip { background: #f3f4f6; }

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.8125rem;
  color: #a3a3a3;
  display: flex;
  gap: 0.5rem;
}

.file-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.delete:hover {
  background: #fee2e2;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.small {
  max-width: 400px;
}

.modal h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.upload-zone {
  border: 2px dashed #e5e5e5;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.hidden {
  display: none;
}

.selected-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.file-preview {
  font-size: 3rem;
}

.file-name-preview {
  font-weight: 500;
  word-break: break-all;
}

.file-size {
  font-size: 0.875rem;
  color: #737373;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.upload-prompt p {
  color: #737373;
}

.upload-hint {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.upload-progress .progress-bar {
  flex: 1;
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.upload-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.upload-progress span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0ea5e9;
  min-width: 40px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

@media (max-width: 768px) {
  .files-toolbar {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
    width: 100%;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
