<template>
  <div class="system-settings-page">
    <div class="page-header">
      <h1>⚙️ System Settings</h1>
      <p>Configure global system preferences and policies</p>
    </div>

    <div class="settings-grid">
      <!-- General Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🌐 General</h2>
          <p>Basic system configuration</p>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <div class="setting-info">
              <label>Maintenance Mode</label>
              <p>Disable access for all non-admin users</p>
            </div>
            <label class="toggle">
              <input v-model="settings.maintenanceMode" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Allow Registration</label>
              <p>Enable new user sign-ups</p>
            </div>
            <label class="toggle">
              <input v-model="settings.allowRegistration" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Require Approval</label>
              <p>New accounts need admin approval</p>
            </div>
            <label class="toggle">
              <input v-model="settings.requireApproval" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- File Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>📁 File Uploads</h2>
          <p>Configure file storage limits</p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Max File Size (MB)</label>
            <input 
              v-model.number="settings.maxFileSize" 
              type="number"
              class="input"
              min="1"
              max="100"
            >
            <span class="help-text">Maximum size for individual file uploads</span>
          </div>

          <div class="form-group">
            <label>Max Storage Per User (GB)</label>
            <input 
              v-model.number="settings.maxStoragePerUser" 
              type="number"
              class="input"
              min="1"
              max="10"
            >
            <span class="help-text">Total storage quota per user</span>
          </div>

          <div class="form-group">
            <label>Allowed File Types</label>
            <div class="file-types">
              <label v-for="type in fileTypes" :key="type" class="checkbox-label">
                <input 
                  v-model="settings.allowedFileTypes" 
                  type="checkbox" 
                  :value="type"
                >
                {{ type }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Messaging Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>💬 Messaging</h2>
          <p>Chat and communication policies</p>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <div class="setting-info">
              <label>Enable Direct Messages</label>
              <p>Allow users to send private messages</p>
            </div>
            <label class="toggle">
              <input v-model="settings.enableDirectMessages" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Content Filtering</label>
              <p>Automatically filter inappropriate content</p>
            </div>
            <label class="toggle">
              <input v-model="settings.contentFiltering" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label>Message Retention (days)</label>
            <input 
              v-model.number="settings.messageRetentionDays" 
              type="number"
              class="input"
              min="7"
              max="365"
            >
            <span class="help-text">How long to keep deleted messages</span>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>🔒 Security</h2>
          <p>Authentication and security policies</p>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <div class="setting-info">
              <label>Two-Factor Authentication</label>
              <p>Require 2FA for admin accounts</p>
            </div>
            <label class="toggle">
              <input v-model="settings.require2FA" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label>Session Timeout (minutes)</label>
            <input 
              v-model.number="settings.sessionTimeout" 
              type="number"
              class="input"
              min="5"
              max="480"
            >
            <span class="help-text">Auto-logout after inactivity</span>
          </div>

          <div class="form-group">
            <label>Max Login Attempts</label>
            <input 
              v-model.number="settings.maxLoginAttempts" 
              type="number"
              class="input"
              min="3"
              max="10"
            >
            <span class="help-text">Failed attempts before lockout</span>
          </div>
        </div>
      </div>

      <!-- Email Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>📧 Notifications</h2>
          <p>Email notification settings</p>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <div class="setting-info">
              <label>Email Notifications</label>
              <p>Send email alerts for important events</p>
            </div>
            <label class="toggle">
              <input v-model="settings.emailNotifications" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label>Notification Email</label>
            <input 
              v-model="settings.notificationEmail" 
              type="email"
              class="input"
              placeholder="admin@school.com"
            >
            <span class="help-text">Default sender address for emails</span>
          </div>
        </div>
      </div>

      <!-- Backup Settings -->
      <div class="settings-card">
        <div class="card-header">
          <h2>💾 Backup</h2>
          <p>Data backup and recovery</p>
        </div>
        <div class="card-body">
          <div class="setting-item">
            <div class="setting-info">
              <label>Automatic Backups</label>
              <p>Schedule regular database backups</p>
            </div>
            <label class="toggle">
              <input v-model="settings.autoBackup" type="checkbox">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label>Backup Frequency</label>
            <select v-model="settings.backupFrequency" class="input">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" @click="triggerBackup">
              🔄 Run Backup Now
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Bar -->
    <div class="save-bar">
      <div class="save-info">
        <span v-if="hasChanges" class="unsaved-indicator">● Unsaved changes</span>
        <span v-else class="saved-indicator">✓ All changes saved</span>
      </div>
      <div class="save-actions">
        <button class="btn btn-secondary" @click="resetSettings" :disabled="!hasChanges || saving">
          Reset
        </button>
        <button class="btn btn-primary" @click="saveSettings" :disabled="!hasChanges || saving">
          <span v-if="saving" class="spinner-small"></span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()

const fileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip']

const defaultSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  requireApproval: true,
  maxFileSize: 10,
  maxStoragePerUser: 1,
  allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  enableDirectMessages: true,
  contentFiltering: true,
  messageRetentionDays: 30,
  require2FA: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  emailNotifications: true,
  notificationEmail: '',
  autoBackup: true,
  backupFrequency: 'daily'
}

const settings = ref({ ...defaultSettings })
const originalSettings = ref({ ...defaultSettings })
const saving = ref(false)

const hasChanges = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value)
})

async function fetchSettings() {
  try {
    const { data } = await api.get('/admin/settings')
    settings.value = { ...defaultSettings, ...data }
    originalSettings.value = { ...settings.value }
  } catch (err) {
    console.error('Failed to fetch settings:', err)
    showToast('Using default settings', 'info')
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await api.put('/admin/settings', settings.value)
    originalSettings.value = { ...settings.value }
    showToast('Settings saved successfully', 'success')
  } catch (err) {
    console.error('Failed to save settings:', err)
    showToast(err.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

function resetSettings() {
  settings.value = { ...originalSettings.value }
}

async function triggerBackup() {
  try {
    await api.post('/admin/backup')
    showToast('Backup started successfully', 'success')
  } catch (err) {
    showToast('Failed to start backup', 'error')
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.system-settings-page {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 80px;
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

/* Settings Grid */
.settings-grid {
  display: grid;
  gap: 1.5rem;
}

.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.card-header p {
  color: #737373;
  font-size: 0.875rem;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

/* Setting Items */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info label {
  display: block;
  font-weight: 500;
  color: #171717;
  margin-bottom: 0.25rem;
}

.setting-info p {
  font-size: 0.875rem;
  color: #737373;
  margin: 0;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #e5e5e5;
  border-radius: 24px;
  transition: background 0.3s;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle input:checked + .toggle-slider {
  background: #0ea5e9;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Form Groups */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #171717;
  margin-bottom: 0.5rem;
}

.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
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

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #737373;
  margin-top: 0.25rem;
}

/* File Types */
.file-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #404040;
  cursor: pointer;
}

.checkbox-label input {
  cursor: pointer;
}

/* Form Actions */
.form-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

/* Save Bar */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e5e5;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

.unsaved-indicator {
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 500;
}

.saved-indicator {
  color: #10b981;
  font-size: 0.875rem;
}

.save-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn {
  padding: 0.625rem 1.25rem;
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

.btn-secondary:hover:not(:disabled) {
  background: #e5e5e5;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e5e5;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .system-settings-page {
    padding-bottom: 100px;
  }
  
  .save-bar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
  
  .file-types {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
