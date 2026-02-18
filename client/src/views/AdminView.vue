<template>
  <div class="admin-layout">
    <!-- Header -->
    <div class="admin-header">
      <h2>🛡️ Admin Moderation Panel</h2>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary btn-sm" @click="$router.push('/')">
          <span class="material-icons-round" style="font-size: 16px;">arrow_back</span>
          Back to Messages
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['admin-tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Content -->
    <div class="admin-content">
      <!-- Channels Tab -->
      <template v-if="activeTab === 'channels'">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Type</th>
              <th>Members</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ch in channels" :key="ch.id">
              <td style="font-weight: 600; color: var(--text-primary);">{{ ch.name || 'Unnamed' }}</td>
              <td>
                <span :class="['badge', getTypeBadge(ch.type)]">{{ ch.type.replace('_', ' ') }}</span>
              </td>
              <td>{{ ch.members?.length || 0 }}</td>
              <td>
                <span :class="['badge', ch.isArchived ? 'badge-warning' : 'badge-success']">
                  {{ ch.isArchived ? 'Archived' : 'Active' }}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 4px;">
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="toggleArchive(ch)"
                  >
                    {{ ch.isArchived ? 'Restore' : 'Archive' }}
                  </button>
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="viewMembers(ch)"
                  >
                    Members
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Audit Log Tab -->
      <template v-if="activeTab === 'audit'">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Channel</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log.id">
              <td>{{ formatDateTime(log.createdAt) }}</td>
              <td style="font-weight: 600; color: var(--text-primary);">
                {{ log.actor?.firstName }} {{ log.actor?.lastName }}
              </td>
              <td>
                <span :class="['badge', getActionBadge(log.action)]">{{ log.action }}</span>
              </td>
              <td style="font-size: 0.75rem;">{{ log.channelId?.substring(0, 8) || '-' }}...</td>
              <td style="font-size: 0.75rem;">{{ log.targetId?.substring(0, 8) || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="auditLogs.length === 0" class="empty-state" style="padding: 60px 0;">
          <span class="material-icons-round icon">receipt_long</span>
          <h3>No audit logs yet</h3>
          <p>Moderation actions will appear here</p>
        </div>
      </template>

      <!-- Users Tab -->
      <template v-if="activeTab === 'users'">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td style="font-weight: 600; color: var(--text-primary);">{{ u.firstName }} {{ u.lastName }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span v-for="role in u.roles" :key="role" :class="['badge', getRoleBadge(role)]" style="margin-right: 4px;">
                  {{ role }}
                </span>
              </td>
              <td>
                <span :class="['badge', u.status === 'active' ? 'badge-success' : 'badge-danger']">
                  {{ u.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <!-- Members Modal -->
    <div v-if="showMembers" class="modal-overlay" @click.self="showMembers = false">
      <div class="modal">
        <h3>Channel Members — {{ membersChannel?.name }}</h3>
        <table class="admin-table" style="margin-top: 16px;">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in membersList" :key="m.userId">
              <td style="font-weight: 600; color: var(--text-primary);">
                {{ m.user?.firstName }} {{ m.user?.lastName }}
              </td>
              <td>
                <span v-if="m.isBanned" class="badge badge-danger">Banned</span>
                <span v-else-if="m.isMuted" class="badge badge-warning">Muted</span>
                <span v-else class="badge badge-success">Active</span>
              </td>
              <td>
                <div style="display: flex; gap: 4px;">
                  <button
                    v-if="!m.isMuted && !m.isBanned"
                    class="btn btn-secondary btn-sm"
                    @click="muteUser(m)"
                  >Mute</button>
                  <button
                    v-if="m.isMuted"
                    class="btn btn-secondary btn-sm"
                    @click="unmuteUser(m)"
                  >Unmute</button>
                  <button
                    v-if="!m.isBanned"
                    class="btn btn-danger btn-sm"
                    @click="banUser(m)"
                  >Ban</button>
                  <button
                    v-if="m.isBanned"
                    class="btn btn-secondary btn-sm"
                    @click="unbanUser(m)"
                  >Unban</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 16px; text-align: right;">
          <button class="btn btn-secondary" @click="showMembers = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import api from '../services/api'

const showToast = inject('showToast')

const activeTab = ref('channels')
const tabs = [
  { id: 'channels', label: '📢 Channels' },
  { id: 'audit', label: '📋 Audit Log' },
  { id: 'users', label: '👥 Users' },
]

const channels = ref([])
const auditLogs = ref([])
const users = ref([])
const showMembers = ref(false)
const membersChannel = ref(null)
const membersList = ref([])

onMounted(async () => {
  await Promise.all([
    fetchChannels(),
    fetchAuditLog(),
    fetchUsers(),
  ])
})

async function fetchChannels() {
  try {
    const { data } = await api.get('/channels')
    channels.value = data
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  }
}

async function fetchAuditLog() {
  try {
    const { data } = await api.get('/moderation/audit-log')
    auditLogs.value = data
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
  }
}

async function fetchUsers() {
  try {
    const { data } = await api.get('/users')
    users.value = data
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

async function toggleArchive(ch) {
  try {
    const action = ch.isArchived ? 'unarchive' : 'archive'
    await api.patch(`/moderation/channels/${ch.id}/${action}`)
    ch.isArchived = !ch.isArchived
    showToast(`Channel ${action}d ✅`, 'success')
    fetchAuditLog()
  } catch (err) {
    showToast('Action failed', 'error')
  }
}

async function viewMembers(ch) {
  try {
    const { data } = await api.get(`/moderation/channels/${ch.id}/members`)
    membersList.value = data
    membersChannel.value = ch
    showMembers.value = true
  } catch (err) {
    showToast('Failed to load members', 'error')
  }
}

async function muteUser(m) {
  try {
    await api.patch(`/moderation/channels/${membersChannel.value.id}/mute/${m.userId}`)
    m.isMuted = true
    showToast('User muted 🔇', 'success')
    fetchAuditLog()
  } catch (err) {
    showToast('Failed to mute', 'error')
  }
}

async function unmuteUser(m) {
  try {
    await api.patch(`/moderation/channels/${membersChannel.value.id}/unmute/${m.userId}`)
    m.isMuted = false
    showToast('User unmuted 🔊', 'success')
    fetchAuditLog()
  } catch (err) {
    showToast('Failed to unmute', 'error')
  }
}

async function banUser(m) {
  try {
    await api.patch(`/moderation/channels/${membersChannel.value.id}/ban/${m.userId}`)
    m.isBanned = true
    showToast('User banned ⛔', 'success')
    fetchAuditLog()
  } catch (err) {
    showToast('Failed to ban', 'error')
  }
}

async function unbanUser(m) {
  try {
    await api.patch(`/moderation/channels/${membersChannel.value.id}/unban/${m.userId}`)
    m.isBanned = false
    showToast('User unbanned ✅', 'success')
    fetchAuditLog()
  } catch (err) {
    showToast('Failed to unban', 'error')
  }
}

function getTypeBadge(type) {
  const map = {
    teacher_parent: 'badge-info',
    teacher_admin: 'badge-warning',
    class_broadcast: 'badge-success',
    admin_broadcast: 'badge-danger',
  }
  return map[type] || 'badge-info'
}

function getActionBadge(action) {
  const map = {
    send: 'badge-info',
    edit: 'badge-warning',
    delete: 'badge-danger',
    mute: 'badge-warning',
    unmute: 'badge-success',
    ban: 'badge-danger',
    unban: 'badge-success',
    archive: 'badge-warning',
    unarchive: 'badge-success',
    create_channel: 'badge-info',
  }
  return map[action] || 'badge-info'
}

function getRoleBadge(role) {
  const map = {
    admin: 'badge-danger',
    teacher: 'badge-info',
    parent: 'badge-warning',
    student: 'badge-success',
  }
  return map[role] || 'badge-info'
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
