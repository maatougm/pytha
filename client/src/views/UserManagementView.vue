<template>
  <div class="user-management">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p class="subtitle">Manage users, roles, and permissions</p>
      </div>
      <button class="btn btn-primary" @click="showInviteModal = true">
        <span>+ Invite User</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search users..."
          class="input"
          @input="debouncedSearch"
        />
      </div>
      <select v-model="filters.role" class="select" @change="fetchUsers">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
        <option value="student">Student</option>
      </select>
      <select v-model="filters.status" class="select" @change="fetchUsers">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="archived">Archived</option>
      </select>
      <button 
        class="btn btn-secondary" 
        :disabled="selectedUsers.length === 0"
        @click="showBulkActionModal = true"
      >
        Bulk Actions ({{ selectedUsers.length }})
      </button>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Messages</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" :class="{ selected: selectedUsers.includes(user.id) }">
            <td>
              <input 
                type="checkbox" 
                :checked="selectedUsers.includes(user.id)"
                @change="toggleSelect(user.id)"
              />
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">{{ getInitials(user) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge" :class="getUserRole(user)">
                {{ getUserRoleLabel(user) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.status">
                {{ user.status }}
              </span>
            </td>
            <td>{{ formatDate(user.lastLoginAt) }}</td>
            <td>{{ user.stats?.messagesSent || 0 }}</td>
            <td>
              <div class="action-menu-wrapper">
                <button class="btn-icon" @click="viewUser(user)" title="View">👁️</button>
                <button class="btn-icon" @click="toggleActionMenu(user.id)" title="Actions">⋮</button>
                <div v-if="showActionMenu === user.id" class="action-menu-dropdown">
                  <button class="menu-item" @click="onActionClick(user, 'edit')">
                    <span class="menu-icon">✏️</span> Edit
                  </button>
                  <button class="menu-item" @click="onActionClick(user, 'reset-password')">
                    <span class="menu-icon">🔑</span> Reset Password
                  </button>
                  <div class="menu-divider"></div>
                  <button v-if="user.status === 'active'" class="menu-item" @click="onActionClick(user, 'suspend')">
                    <span class="menu-icon">🚫</span> Suspend
                  </button>
                  <button v-else class="menu-item" @click="onActionClick(user, 'activate')">
                    <span class="menu-icon">✓</span> Activate
                  </button>
                  <button class="menu-item item-danger" @click="onActionClick(user, 'delete')">
                    <span class="menu-icon">🗑️</span> Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        class="btn btn-sm" 
        :disabled="page === 1"
        @click="page--; fetchUsers()"
      >
        Previous
      </button>
      <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
      <button 
        class="btn btn-sm" 
        :disabled="page >= totalPages"
        @click="page++; fetchUsers()"
      >
        Next
      </button>
    </div>

    <!-- User Detail Modal -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="selectedUser = null">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>User Details</h3>
          <button class="btn-icon" @click="selectedUser = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="user-profile">
            <div class="profile-header">
              <div class="profile-avatar">{{ getInitials(selectedUser) }}</div>
              <div class="profile-info">
                <h4>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h4>
                <p>{{ selectedUser.email }}</p>
                <div class="profile-badges">
                  <span class="role-badge" :class="selectedUser.roles?.[0] || 'unknown'">
                    {{ selectedUser.roles?.[0] || 'Unknown' }}
                  </span>
                  <span class="status-badge" :class="selectedUser.status">
                    {{ selectedUser.status }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="profile-stats">
              <div class="stat-box">
                <div class="stat-value">{{ selectedUser.stats?.messagesSent || 0 }}</div>
                <div class="stat-label">Messages</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ selectedUser.stats?.submissions || 0 }}</div>
                <div class="stat-label">Submissions</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">{{ formatDate(selectedUser.createdAt) }}</div>
                <div class="stat-label">Joined</div>
              </div>
            </div>

            <div class="profile-actions">
              <button class="btn btn-secondary" @click="openResetPasswordModal(selectedUser)">
                🔑 Reset Password
              </button>
              <button 
                v-if="selectedUser.status === 'active'"
                class="btn btn-warning"
                @click="confirmAction(selectedUser, 'suspend')"
              >
                Suspend User
              </button>
              <button 
                v-else-if="selectedUser.status === 'suspended'"
                class="btn btn-success"
                @click="confirmAction(selectedUser, 'activate')"
              >
                Activate User
              </button>
              <button 
                class="btn btn-danger"
                @click="confirmAction(selectedUser, 'delete')"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmModal.show" class="modal-overlay" @click.self="confirmModal.show = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirm Action</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to {{ confirmModal.action }} this user?</p>
          <p v-if="confirmModal.user" class="user-name">
            {{ confirmModal.user.firstName }} {{ confirmModal.user.lastName }}
          </p>
          <div class="form-group">
            <label>Reason (optional)</label>
            <textarea v-model="confirmModal.reason" class="input" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="confirmModal.show = false">Cancel</button>
          <button 
            class="btn" 
            :class="getActionButtonClass(confirmModal.action)"
            @click="executeAction"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Action Modal -->
    <div v-if="showBulkActionModal" class="modal-overlay" @click.self="showBulkActionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Bulk Action</h3>
        </div>
        <div class="modal-body">
          <p>Perform action on <strong>{{ selectedUsers.length }}</strong> selected users:</p>
          <div class="form-group">
            <label>Action</label>
            <select v-model="bulkAction" class="input">
              <option value="activate">✓ Activate</option>
              <option value="suspend">🚫 Suspend</option>
              <option value="archive">📦 Archive</option>
              <option value="delete">🗑️ Delete Permanently</option>
            </select>
          </div>
          <div class="form-group">
            <label>Reason (optional)</label>
            <textarea v-model="bulkReason" class="input" rows="3" placeholder="Enter reason for this action..."></textarea>
          </div>
          <div v-if="bulkAction === 'delete'" class="warning-box">
            ⚠️ <strong>Warning:</strong> This will permanently delete {{ selectedUsers.length }} users. This action cannot be undone.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBulkActionModal = false">Cancel</button>
          <button 
            :class="['btn', bulkAction === 'delete' ? 'btn-danger' : 'btn-primary']" 
            @click="executeBulkAction"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Processing...' : (bulkAction === 'delete' ? 'Delete Users' : 'Apply to All') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Invite User Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="closeInviteModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Invite New User</h3>
          <button class="btn-close" @click="closeInviteModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>First Name *</label>
              <input v-model="inviteForm.firstName" type="text" class="input" placeholder="Enter first name" />
            </div>
            <div class="form-group">
              <label>Last Name *</label>
              <input v-model="inviteForm.lastName" type="text" class="input" placeholder="Enter last name" />
            </div>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input v-model="inviteForm.email" type="email" class="input" placeholder="user@school.com" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="inviteForm.phone" type="tel" class="input" placeholder="+1 234 567 8900" />
          </div>
          <div class="form-group">
            <label>Role *</label>
            <select v-model="inviteForm.role" class="input">
              <option value="">Select Role</option>
              <option value="admin">👔 Admin</option>
              <option value="teacher">📚 Teacher</option>
              <option value="parent">👨‍👩‍👧 Parent</option>
              <option value="student">🎓 Student</option>
            </select>
          </div>
          <div v-if="inviteError" class="error-message">
            {{ inviteError }}
          </div>
          <div v-if="inviteSuccess" class="success-message">
            ✓ User invited successfully! Temporary password: <code>{{ inviteSuccess.tempPassword }}</code>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeInviteModal">Cancel</button>
          <button 
            class="btn btn-primary" 
            @click="submitInvite"
            :disabled="isLoading || !isInviteFormValid"
          >
            {{ isLoading ? 'Inviting...' : 'Send Invitation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Edit User</h3>
          <button class="btn-close" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="editForm.firstName" type="text" class="input" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input v-model="editForm.lastName" type="text" class="input" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="editForm.email" type="email" class="input" disabled />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="editForm.phone" type="tel" class="input" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editForm.status" class="input">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">Cancel</button>
          <button 
            class="btn btn-primary" 
            @click="submitEdit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click.self="closeResetPasswordModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button class="btn-close" @click="closeResetPasswordModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to reset the password for <strong>{{ resetPasswordUser?.firstName }} {{ resetPasswordUser?.lastName }}</strong>?</p>
          <p class="text-muted">A new temporary password will be generated.</p>
          <div v-if="resetPasswordResult" class="success-message">
            <p>✓ Password reset successfully!</p>
            <div class="temp-password">
              <label>New Temporary Password:</label>
              <code>{{ resetPasswordResult.tempPassword }}</code>
              <button class="btn-copy" @click="copyToClipboard(resetPasswordResult.tempPassword)">Copy</button>
            </div>
          </div>
          <div v-if="resetPasswordError" class="error-message">
            {{ resetPasswordError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeResetPasswordModal">
            {{ resetPasswordResult ? 'Close' : 'Cancel' }}
          </button>
          <button 
            v-if="!resetPasswordResult"
            class="btn btn-primary" 
            @click="submitResetPassword"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../stores/admin'
import { debounce } from '../utils/debounce'
import { showToast } from '../composables/useToast'

const adminStore = useAdminStore()

const users = computed(() => adminStore.users || [])
const isLoading = computed(() => adminStore.isLoading)
const totalPages = computed(() => {
  const total = users.value.length > 0 ? users.value.length : 0
  return Math.ceil(total / limit.value) || 1
})

const filters = ref({
  search: '',
  role: '',
  status: ''
})

const page = ref(1)
const limit = ref(20)
const selectedUsers = ref([])
const selectedUser = ref(null)
const showBulkActionModal = ref(false)
const showInviteModal = ref(false)
const showEditModal = ref(false)
const bulkAction = ref('activate')
const bulkReason = ref('')
const inviteError = ref('')
const inviteSuccess = ref(null)
const editError = ref('')

// Invite form
const inviteForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: ''
})

// Edit form
const editForm = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'active'
})

const isInviteFormValid = computed(() => {
  return inviteForm.value.firstName && 
         inviteForm.value.lastName && 
         inviteForm.value.email && 
         inviteForm.value.role
})

const confirmModal = ref({
  show: false,
  action: '',
  user: null,
  reason: ''
})

const isAllSelected = computed(() => {
  return users.value.length > 0 && selectedUsers.value.length === users.value.length
})

const debouncedSearch = debounce(() => {
  page.value = 1
  fetchUsers()
}, 300)

async function fetchUsers() {
  await adminStore.fetchUsers({
    ...filters.value,
    page: page.value,
    limit: limit.value
  })
}

function toggleSelect(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map(u => u.id)
  }
}

function viewUser(user) {
  selectedUser.value = user
}

function editUser(user) {
  editForm.value = {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    status: user.status || 'active'
  }
  editError.value = ''
  showEditModal.value = true
}

async function submitEdit() {
  try {
    await adminStore.editUser(editForm.value.id, {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      phone: editForm.value.phone,
      status: editForm.value.status
    })
    showToast('User updated successfully', 'success')
    closeEditModal()
    await fetchUsers()
  } catch (err) {
    editError.value = err.response?.data?.message || 'Failed to update user'
    showToast(editError.value, 'error')
  }
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = { id: '', firstName: '', lastName: '', email: '', phone: '', status: 'active' }
  editError.value = ''
}

function closeInviteModal() {
  showInviteModal.value = false
  inviteForm.value = { firstName: '', lastName: '', email: '', phone: '', role: '' }
  inviteError.value = ''
  inviteSuccess.value = null
}

async function submitInvite() {
  inviteError.value = ''
  inviteSuccess.value = null
  
  try {
    const result = await adminStore.inviteUser(inviteForm.value)
    inviteSuccess.value = result
    showToast('User invited successfully!', 'success')
    setTimeout(() => {
      closeInviteModal()
      fetchUsers()
    }, 3000)
  } catch (err) {
    inviteError.value = err.response?.data?.message || 'Failed to invite user'
    showToast(inviteError.value, 'error')
  }
}

function confirmAction(user, action) {
  confirmModal.value = {
    show: true,
    action,
    user,
    reason: ''
  }
}

async function executeAction() {
  try {
    if (confirmModal.value.action === 'delete') {
      await adminStore.deleteUser(confirmModal.value.user.id)
      showToast('User deleted successfully', 'success')
    } else {
      await adminStore.updateUserStatus(
        confirmModal.value.user.id,
        confirmModal.value.action,
        confirmModal.value.reason
      )
      showToast(`User ${confirmModal.value.action}d successfully`, 'success')
    }
    confirmModal.value.show = false
    selectedUser.value = null
    await fetchUsers()
  } catch (err) {
    console.error('Action failed:', err)
    showToast(err.response?.data?.message || 'Action failed', 'error')
  }
}

async function executeBulkAction() {
  try {
    // Handle delete separately since it's not in the bulk action endpoint
    if (bulkAction.value === 'delete') {
      let success = 0
      let failed = 0
      for (const userId of selectedUsers.value) {
        try {
          await adminStore.deleteUser(userId)
          success++
        } catch (e) {
          failed++
        }
      }
      showToast(`Deleted ${success} users${failed > 0 ? `, ${failed} failed` : ''}`, success > 0 ? 'success' : 'error')
    } else {
      await adminStore.bulkAction(
        selectedUsers.value,
        bulkAction.value,
        bulkReason.value
      )
      showToast(`Bulk ${bulkAction.value} completed successfully`, 'success')
    }
    showBulkActionModal.value = false
    selectedUsers.value = []
    bulkReason.value = ''
    await fetchUsers()
  } catch (err) {
    console.error('Bulk action failed:', err)
    showToast(err.response?.data?.message || 'Bulk action failed', 'error')
  }
}

function getInitials(user) {
  return (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
}

function formatDate(date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString()
}

function getActionButtonClass(action) {
  const classes = {
    activate: 'btn-success',
    suspend: 'btn-warning',
    archive: 'btn-secondary',
    delete: 'btn-danger'
  }
  return classes[action] || 'btn-primary'
}

// Action Menu
const showActionMenu = ref(null) // userId or null

function toggleActionMenu(userId) {
  showActionMenu.value = showActionMenu.value === userId ? null : userId
}

function closeActionMenu() {
  showActionMenu.value = null
}

function onActionClick(user, action) {
  closeActionMenu()
  if (action === 'edit') {
    editUser(user)
  } else if (action === 'delete') {
    confirmAction(user, 'delete')
  } else if (action === 'activate') {
    confirmAction(user, 'activate')
  } else if (action === 'suspend') {
    confirmAction(user, 'suspend')
  } else if (action === 'reset-password') {
    openResetPasswordModal(user)
  }
}

// Reset Password
const showResetPasswordModal = ref(false)
const resetPasswordUser = ref(null)
const resetPasswordResult = ref(null)
const resetPasswordError = ref('')

function openResetPasswordModal(user) {
  resetPasswordUser.value = user
  resetPasswordResult.value = null
  resetPasswordError.value = ''
  showResetPasswordModal.value = true
}

function closeResetPasswordModal() {
  showResetPasswordModal.value = false
  resetPasswordUser.value = null
  resetPasswordResult.value = null
  resetPasswordError.value = ''
}

async function submitResetPassword() {
  resetPasswordError.value = ''
  try {
    const result = await adminStore.resetPassword(resetPasswordUser.value.id)
    resetPasswordResult.value = result
    showToast('Password reset successfully!', 'success')
  } catch (err) {
    resetPasswordError.value = err.response?.data?.message || 'Failed to reset password'
    showToast(resetPasswordError.value, 'error')
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  showToast('Copied to clipboard!', 'success')
}

// Role helper functions
function getUserRole(user) {
  if (!user) return 'unknown'
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0]
  }
  if (user.role) {
    return user.role
  }
  return 'unknown'
}

function getUserRoleLabel(user) {
  const role = getUserRole(user)
  if (!role || role === 'unknown') return 'Unknown'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
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

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
}

.table-container {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  background: var(--bg-body);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.data-table tr:hover {
  background: var(--bg-hover);
}

.data-table tr.selected {
  background: var(--primary-light);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.role-badge,
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.admin { background: #fef3c7; color: #92400e; }
.role-badge.teacher { background: #dbeafe; color: #1e40af; }
.role-badge.parent { background: #fce7f3; color: #9d174d; }
.role-badge.student { background: #d1fae5; color: #065f46; }

.status-badge.active { background: #d1fae5; color: #065f46; }
.status-badge.suspended { background: #fee2e2; color: #991b1b; }
.status-badge.archived { background: #f3f4f6; color: #4b5563; }

.actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-hover);
}

.btn-icon.warning:hover { background: #fee2e2; }
.btn-icon.success:hover { background: #d1fae5; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-lg {
  max-width: 600px;
}

.user-profile {
  padding: 8px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.profile-info h4 {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
}

.profile-info p {
  margin: 0 0 8px 0;
  color: var(--text-muted);
}

.profile-badges {
  display: flex;
  gap: 8px;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-box {
  background: var(--bg-body);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.profile-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Action Menu Dropdown */
.action-menu-wrapper {
  position: relative;
}

.action-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: left;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: var(--bg-body);
}

.menu-item.item-danger {
  color: #dc3545;
}

.menu-item.item-danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

.menu-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.menu-icon {
  font-size: 1rem;
}

/* Temp Password Display */
.temp-password {
  background: var(--bg-body);
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.temp-password label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.temp-password code {
  display: block;
  background: var(--bg-card);
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 1.125rem;
  word-break: break-all;
  margin-bottom: 8px;
}

.btn-copy {
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-copy:hover {
  opacity: 0.9;
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
