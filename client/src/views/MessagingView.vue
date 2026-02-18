<template>
  <div class="messaging-page">
    <!-- Channels Sidebar -->
    <aside class="channels-sidebar">
      <div class="sidebar-header">
        <h2>{{ $t('messaging.channels') }}</h2>
        <button class="btn-icon" @click="openCreateModal">+</button>
      </div>

      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="$t('common.search')"
          class="input"
        />
      </div>

      <div v-if="loadingChannels" class="loading-mini">
        <div class="spinner-small"></div>
      </div>

      <div v-else-if="filteredChannels.length === 0" class="empty-mini">
        {{ $t('messaging.noChannels') }}
      </div>

      <div v-else class="channels-list">
        <div 
          v-for="channel in filteredChannels" 
          :key="channel.id"
          :class="['channel-item', { active: activeChannel?.id === channel.id }]"
          @click="selectChannel(channel)"
        >
          <div class="channel-avatar" :style="{ background: getChannelColor(channel) }">
            {{ channel.name?.[0] || '💬' }}
          </div>
          <div class="channel-info">
            <div class="channel-name">{{ channel.name || $t('messaging.unnamed') }}</div>
            <div class="channel-preview">
              {{ channel.lastMessage?.content?.substring(0, 30) || $t('messaging.noMessagesYet') }}
            </div>
          </div>
          <div class="channel-meta">
            <span class="channel-time">{{ formatTime(channel.lastMessage?.createdAt) }}</span>
            <span v-if="channel.unreadCount > 0" class="unread-badge">{{ channel.unreadCount }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-area">
      <template v-if="activeChannel">
        <!-- Chat Header -->
        <header class="chat-header">
          <div class="channel-info">
            <h3>{{ activeChannel.name }}</h3>
            <span class="member-count">{{ $t('messaging.memberCount', { count: channelMembers.length }) }}</span>
          </div>
          <div class="header-actions">
            <button class="btn-report" @click="openReportModal" :title="$t('messaging.report')">
              🚩 {{ $t('messaging.report') }}
            </button>
            <span :class="['connection-status', { online: wsConnected }]">
              {{ wsConnected ? '● ' + $t('messaging.live') : '● ' + $t('messaging.offline') }}
            </span>
          </div>
        </header>

        <!-- Messages -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="loadingMessages" class="loading-messages">
            <div class="spinner"></div>
          </div>

          <div v-else-if="messages.length === 0" class="empty-chat">
            <div class="empty-icon">💬</div>
            <h4>{{ $t('messaging.noMessages') }}</h4>
            <p>{{ $t('messaging.startConversation') }}</p>
          </div>

          <template v-else>
            <div 
              v-for="message in messages" 
              :key="message.id"
              :class="['message', { own: message.senderId === currentUserId, deleted: message.isDeleted }]"
            >
              <div class="message-avatar" :style="{ background: getUserColor(message.senderId) }">
                {{ message.sender?.firstName?.[0] || '?' }}
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ message.sender?.firstName }} {{ message.sender?.lastName }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                  <span v-if="message.editedAt" class="edited-tag">(edited)</span>
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div v-if="message.senderId === currentUserId && !message.isDeleted" class="message-actions">
                  <button @click="editMessage(message)">✏️</button>
                  <button @click="deleteMessage(message)">🗑️</button>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="typingUsers.length > 0" class="typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>{{ $t('messaging.typingUsers', { users: typingUsers.join(', '), count: typingUsers.length }) }}</span>
            </div>
          </template>
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <div class="input-wrapper">
            <textarea
              v-model="newMessage"
              :placeholder="$t('messaging.typeMessage')"
              rows="1"
              @keydown.enter.prevent="sendMessage"
              @input="handleInput"
              ref="messageInput"
              :disabled="sending"
            ></textarea>
            <button 
              class="send-btn"
              :disabled="!newMessage.trim() || sending"
              @click="sendMessage"
            >
              <svg v-if="!sending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              <div v-else class="spinner-small"></div>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="no-channel">
        <div class="no-channel-icon">💬</div>
        <h3>{{ $t('messaging.noChannel') }}</h3>
        <p>{{ $t('messaging.noChannelDescription') }}</p>
      </div>
    </main>
  </div>

  <!-- Create Channel Modal -->
  <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h3>{{ $t('messaging.createChannel') }}</h3>
        <button class="btn-close" @click="closeCreateModal">&times;</button>
      </div>
      
      <!-- Step 1: Basic Info -->
      <div v-if="createStep === 1" class="modal-body">
        <div class="form-group">
          <label>{{ $t('messaging.channelType') }}</label>
          <div class="channel-type-options">
            <div 
              v-for="type in channelTypes" 
              :key="type.value"
              :class="['channel-type-card', { active: newChannelData.type === type.value }]"
              @click="newChannelData.type = type.value"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <div class="type-info">
                <span class="type-label">{{ type.label }}</span>
                <span class="type-desc">{{ type.description }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ $t('messaging.channelName') }}</label>
          <input 
            v-model="newChannelData.name" 
            type="text" 
            class="input"
            :placeholder="$t('common.search') + '...'"
            maxlength="100"
          />
        </div>
        
        <div class="form-group">
          <label>{{ $t('messaging.channelDescription') }}</label>
          <textarea 
            v-model="newChannelData.description" 
            class="input"
            rows="2"
            :placeholder="$t('messaging.channelDescription')"
            maxlength="500"
          ></textarea>
        </div>
      </div>
      
      <!-- Step 2: Member Selection -->
      <div v-else class="modal-body">
        <div class="selected-members-bar">
          <label>{{ $t('messaging.selectMembers') }} ({{ selectedMembers.length }})</label>
          <div class="selected-chips">
            <span v-if="selectedMembers.length === 0" class="no-selection">{{ $t('messaging.noMembersSelected') }}</span>
            <span 
              v-for="member in selectedMembers" 
              :key="member.id"
              class="member-chip"
            >
              {{ member.firstName }} {{ member.lastName }}
              <button @click="toggleUserSelection(member)">&times;</button>
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ $t('messaging.searchUsers') }}</label>
          <input 
            v-model="userSearchQuery" 
            type="text" 
            class="input"
            :placeholder="$t('messaging.searchUsers') + '...'"
          />
        </div>
        
        <div class="users-list">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            :class="['user-item', { selected: isUserSelected(user) }]"
            @click="toggleUserSelection(user)"
          >
            <div class="user-avatar" :style="{ background: getUserColor(user.id) }">
              {{ user.firstName?.[0] || '?' }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <span v-if="isUserSelected(user)" class="check-icon">✓</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="createStep === 1 ? closeCreateModal() : goToStep(1)">
          {{ createStep === 1 ? $t('common.cancel') : $t('common.back') }}
        </button>
        <button v-if="createStep === 1" class="btn btn-primary" @click="goToStep(2)">
          {{ $t('common.next') }}: {{ $t('messaging.selectMembers') }}
        </button>
        <button 
          v-else 
          class="btn btn-primary" 
          :disabled="creatingChannel || (newChannelData.type === 'group' && selectedMembers.length === 0)"
          @click="createChannel"
        >
          <span v-if="creatingChannel" class="spinner-small"></span>
          <span v-else>{{ $t('messaging.create') }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Report Channel Modal -->
  <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ $t('messaging.report') }}</h3>
        <button class="btn-close" @click="closeReportModal">&times;</button>
      </div>
      <div class="modal-body">
        <p>{{ $t('common.confirm') }} <strong>{{ activeChannel?.name }}</strong>?</p>
        <div class="form-group">
          <label>{{ $t('messaging.reportReason') }} *</label>
          <textarea 
            v-model="reportReason" 
            class="input" 
            rows="4" 
            :placeholder="$t('messaging.reportReason') + '...'"
            maxlength="1000"
          ></textarea>
          <small class="char-count">{{ reportReason.length }}/1000</small>
        </div>
        <div v-if="reportError" class="error-message">
          {{ reportError }}
        </div>
        <div v-if="reportSuccess" class="success-message">
          ✓ {{ $t('messaging.reportSuccess') }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeReportModal" :disabled="reporting">
          {{ $t('common.cancel') }}
        </button>
        <button 
          class="btn btn-danger" 
          @click="submitReport"
          :disabled="!reportReason.trim() || reporting || reportSuccess"
        >
          <span v-if="reporting" class="spinner-small"></span>
          <span v-else>{{ $t('common.submit') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { messagingApi, messagingSocket } from '../services/messaging'
import { usersApi } from '../services/users'
import { showToast } from '../composables/useToast'

const auth = useAuthStore()
const { t, locale } = useI18n()

const channels = ref([])
const activeChannel = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
const messageInput = ref(null)
const searchQuery = ref('')
const loadingChannels = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const wsConnected = ref(false)
const channelMembers = ref([])
const typingUsers = ref([])
const typingTimeout = ref(null)

const currentUserId = auth.user?.id

const filteredChannels = computed(() => {
  if (!searchQuery.value) return channels.value
  return channels.value.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Color generator for avatars
const colorMap = new Map()
const colors = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

function getUserColor(userId) {
  if (!colorMap.has(userId)) {
    const index = colorMap.size % colors.length
    colorMap.set(userId, colors[index])
  }
  return colorMap.get(userId)
}

function getChannelColor(channel) {
  if (channel.type === 'teacher_parent') return '#0ea5e9'
  if (channel.type === 'class_broadcast') return '#10b981'
  if (channel.type === 'teacher_admin') return '#8b5cf6'
  return '#0ea5e9'
}

async function selectChannel(channel) {
  activeChannel.value = channel
  loadingMessages.value = true
  messages.value = []
  typingUsers.value = []
  
  try {
    // Join WebSocket room
    if (wsConnected.value) {
      messagingSocket.joinChannel(channel.id)
    }
    
    // Fetch messages
    const res = await messagingApi.getChannelMessages(channel.id, { limit: 50 })
    messages.value = res.data?.messages || []
    
    // Fetch members
    const membersRes = await messagingApi.getChannelMembers(channel.id)
    channelMembers.value = membersRes.data || []
    
    // Mark as read
    if (channel.unreadCount > 0) {
      channel.unreadCount = 0
    }
    
    nextTick(() => scrollToBottom())
  } catch (err) {
    console.error('Failed to load channel:', err)
    showToast(t('errors.loadMessages'), 'error')
  } finally {
    loadingMessages.value = false
  }
}

function handleInput() {
  autoResize()
  
  // Send typing indicator
  if (wsConnected.value && activeChannel.value) {
    messagingSocket.startTyping(activeChannel.value.id)
    
    // Clear previous timeout
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }
    
    // Stop typing after 3 seconds
    typingTimeout.value = setTimeout(() => {
      messagingSocket.stopTyping(activeChannel.value.id)
    }, 3000)
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !activeChannel.value) return
  
  const content = newMessage.value.trim()
  newMessage.value = ''
  autoResize()
  
  sending.value = true
  
  try {
    if (wsConnected.value) {
      // Send via WebSocket
      messagingSocket.sendMessage(activeChannel.value.id, content)
    } else {
      // Fallback to REST API
      await messagingApi.sendMessageREST(activeChannel.value.id, content)
      // Refresh messages
      const res = await messagingApi.getChannelMessages(activeChannel.value.id, { limit: 50 })
      messages.value = res.data?.messages || []
      nextTick(() => scrollToBottom())
    }
  } catch (err) {
    console.error('Failed to send message:', err)
    showToast(t('errors.sendMessage'), 'error')
  } finally {
    sending.value = false
  }
}

async function editMessage(message) {
  const newContent = prompt(t('messaging.editMessagePrompt'), message.content)
  if (!newContent || newContent === message.content) return
  
  try {
    if (wsConnected.value) {
      messagingSocket.editMessage(message.id, newContent)
    } else {
      await messagingApi.editMessage(message.id, newContent)
      message.content = newContent
      message.editedAt = new Date().toISOString()
    }
  } catch (err) {
    console.error('Failed to edit message:', err)
    showToast(t('errors.editMessage'), 'error')
  }
}

async function deleteMessage(message) {
  if (!confirm(t('messaging.deleteMessageConfirm'))) return
  
  try {
    if (wsConnected.value) {
      messagingSocket.deleteMessage(message.id)
    } else {
      await messagingApi.deleteMessage(message.id)
      message.isDeleted = true
      message.content = t('messaging.deletedMessage')
    }
  } catch (err) {
    console.error('Failed to delete message:', err)
    showToast(t('errors.deleteMessage'), 'error')
  }
}

// ─── REPORT MODAL ──────────────────────────────────────────

const showReportModal = ref(false)
const reportReason = ref('')
const reportError = ref('')
const reportSuccess = ref(false)
const reporting = ref(false)

function openReportModal() {
  if (!activeChannel.value) return
  showReportModal.value = true
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = false
}

function closeReportModal() {
  showReportModal.value = false
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = false
}

async function submitReport() {
  if (!reportReason.value.trim() || !activeChannel.value) return
  
  reporting.value = true
  reportError.value = ''
  
  try {
    await messagingApi.reportChannel(activeChannel.value.id, reportReason.value)
    reportSuccess.value = true
    showToast('Conversation reported successfully', 'success')
    setTimeout(() => {
      closeReportModal()
    }, 2000)
  } catch (err) {
    reportError.value = err.response?.data?.message || 'Failed to submit report'
    showToast(reportError.value, 'error')
  } finally {
    reporting.value = false
  }
}

function autoResize() {
  const textarea = messageInput.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  const container = messagesContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  
  if (diffDays === 0) {
    return d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return t('time.yesterday')
  } else if (diffDays < 7) {
    return d.toLocaleDateString(locale.value, { weekday: 'short' })
  }
  return d.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
}

// Channel creation modal state
const showCreateModal = ref(false)
const createStep = ref(1) // 1: basic info, 2: member selection
const newChannelData = ref({
  name: '',
  type: 'group',
  description: ''
})
const selectedMembers = ref([])
const availableUsers = ref([])
const userSearchQuery = ref('')
const creatingChannel = ref(false)

const channelTypes = [
  { value: 'group', label: t('messaging.groupChat'), icon: '👥', description: t('messaging.groupChat') },
  { value: 'direct_message', label: t('messaging.directMessage'), icon: '💬', description: t('messaging.directMessage') },
]

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return availableUsers.value
  const query = userSearchQuery.value.toLowerCase()
  return availableUsers.value.filter(u => 
    u.firstName?.toLowerCase().includes(query) ||
    u.lastName?.toLowerCase().includes(query) ||
    u.email?.toLowerCase().includes(query)
  )
})

function openCreateModal() {
  showCreateModal.value = true
  createStep.value = 1
  newChannelData.value = { name: '', type: 'group', description: '' }
  selectedMembers.value = []
  userSearchQuery.value = ''
  fetchAvailableUsers()
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function fetchAvailableUsers() {
  try {
    const { data } = await usersApi.getAll()
    // Filter out current user
    availableUsers.value = (data || []).filter(u => u.id !== currentUserId)
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

function toggleUserSelection(user) {
  const index = selectedMembers.value.findIndex(m => m.id === user.id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    if (newChannelData.value.type === 'direct_message' && selectedMembers.value.length >= 1) {
      // Only allow one member for DM
      selectedMembers.value = [user]
    } else {
      selectedMembers.value.push(user)
    }
  }
}

function isUserSelected(user) {
  return selectedMembers.value.some(m => m.id === user.id)
}

async function goToStep(step) {
  if (step === 2 && !newChannelData.value.name.trim()) {
    showToast(t('messaging.channelName'), 'error')
    return
  }
  createStep.value = step
  
  // Fetch users when entering step 2
  if (step === 2) {
    await fetchAvailableUsers()
  }
}

async function createChannel() {
  if (!newChannelData.value.name.trim()) {
    showToast(t('messaging.channelName'), 'error')
    return
  }
  
  if (newChannelData.value.type === 'direct_message' && selectedMembers.value.length !== 1) {
    showToast(t('messaging.selectMembers'), 'error')
    return
  }
  
  creatingChannel.value = true
  
  try {
    const memberIds = selectedMembers.value.map(m => m.id)
    
    const { data } = await messagingApi.createChannel({
      name: newChannelData.value.name,
      type: newChannelData.value.type,
      description: newChannelData.value.description,
      memberIds
    })
    
    showToast(t('common.success'), 'success')
    closeCreateModal()
    
    // Add new channel to list and select it
    channels.value.unshift({
      ...data,
      unreadCount: 0,
      lastMessage: null
    })
    
    // Select the new channel
    selectChannel(data)
  } catch (err) {
    console.error('Failed to create channel:', err)
    showToast(err.response?.data?.message || t('common.error'), 'error')
  } finally {
    creatingChannel.value = false
  }
}

async function fetchChannels() {
  loadingChannels.value = true
  try {
    const res = await messagingApi.getMyChannels()
    channels.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch channels:', err)
    showToast(t('common.error'), 'error')
  } finally {
    loadingChannels.value = false
  }
}

async function connectWebSocket() {
  const token = localStorage.getItem('sms_access_token')
  if (!token) return
  
  try {
    await messagingSocket.connect(token)
    wsConnected.value = true
    
    // Set up message handler
    messagingSocket.onMessage((data) => {
      if (data.type === 'deleted') {
        const msg = messages.value.find(m => m.id === data.messageId)
        if (msg) {
          msg.isDeleted = true
          msg.content = t('messaging.deletedMessage')
        }
      } else if (data.type === 'updated') {
        const msg = messages.value.find(m => m.id === data.messageId)
        if (msg) {
          msg.content = data.content
          msg.editedAt = data.editedAt
        }
      } else {
        // New message
        if (data.channelId === activeChannel.value?.id) {
          messages.value.push(data)
          nextTick(() => scrollToBottom())
        } else {
          // Update unread count
          const channel = channels.value.find(c => c.id === data.channelId)
          if (channel) {
            channel.unreadCount = (channel.unreadCount || 0) + 1
            channel.lastMessage = data
          }
        }
      }
    })
    
    // Set up typing handler
    messagingSocket.onTyping((data) => {
      if (data.channelId !== activeChannel.value?.id) return
      
      const userName = data.userName || t('common.someone')
      if (data.type === 'start') {
        if (!typingUsers.value.includes(userName)) {
          typingUsers.value.push(userName)
        }
      } else {
        const index = typingUsers.value.indexOf(userName)
        if (index > -1) {
          typingUsers.value.splice(index, 1)
        }
      }
    })
    
    // Join active channel if any
    if (activeChannel.value) {
      messagingSocket.joinChannel(activeChannel.value.id)
    }
  } catch (err) {
    console.warn('WebSocket connection failed:', err)
    wsConnected.value = false
  }
}

onMounted(async () => {
  await fetchChannels()
  await connectWebSocket()
})

onUnmounted(() => {
  messagingSocket.disconnect()
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})
</script>

<style scoped>
.messaging-page {
  display: flex;
  height: calc(100vh - 64px);
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Channels Sidebar */
.channels-sidebar {
  width: 320px;
  background: #fafafa;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
}

[dir="rtl"] .channels-sidebar {
  border-right: none;
  border-left: 1px solid #e5e5e5;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #0ea5e9;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #0284c7;
  transform: scale(1.05);
}

.search-box {
  padding: 1rem 1.5rem;
}

.search-box input {
  background: white;
}

.loading-mini {
  text-align: center;
  padding: 2rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e5e5;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-mini {
  text-align: center;
  padding: 2rem;
  color: #a3a3a3;
}

.channels-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.75rem 1rem;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-item:hover,
.channel-item.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.channel-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-name {
  font-weight: 600;
  color: #171717;
  margin-bottom: 0.25rem;
}

.channel-preview {
  font-size: 0.875rem;
  color: #737373;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-meta {
  text-align: right;
}

[dir="rtl"] .channel-meta {
  text-align: left;
}

.channel-time {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: #0ea5e9;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  margin-top: 0.25rem;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  background: white;
}

.channel-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.member-count {
  font-size: 0.875rem;
  color: #737373;
}

.connection-status {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a3a3a3;
}

.connection-status.online {
  color: #10b981;
}

.loading-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-chat,
.no-channel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #737373;
}

.empty-icon,
.no-channel-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.message {
  display: flex;
  gap: 0.875rem;
  max-width: 70%;
}

.message.own {
  margin-left: auto;
  flex-direction: row-reverse;
}

[dir="rtl"] .message.own {
  margin-left: 0;
  margin-right: auto;
}

.message.deleted {
  opacity: 0.6;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  background: #f5f5f5;
  padding: 0.875rem 1rem;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  position: relative;
}

[dir="rtl"] .message-content {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}

.message.own .message-content {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}

[dir="rtl"] .message.own .message-content {
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.sender-name {
  font-size: 0.875rem;
  font-weight: 600;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
}

.edited-tag {
  font-size: 0.75rem;
  opacity: 0.7;
  font-style: italic;
}

.message-text {
  font-size: 0.9375rem;
  line-height: 1.5;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.message-actions button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #737373;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #a3a3a3;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

/* Input Area */
.input-area {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
  background: white;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: #f5f5f5;
  border-radius: 24px;
  padding: 0.5rem;
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  resize: none;
  max-height: 120px;
  min-height: 44px;
  font-family: inherit;
}

.input-wrapper textarea:focus {
  outline: none;
}

.input-wrapper textarea:disabled {
  opacity: 0.6;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #0ea5e9;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0284c7;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

/* Create Channel Modal Styles */
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

.modal-lg {
  max-width: 600px;
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
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #171717;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
  justify-content: flex-end;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #171717;
  margin-bottom: 0.5rem;
}

.channel-type-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.channel-type-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-type-card:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.channel-type-card.active {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.type-icon {
  font-size: 1.5rem;
}

.type-info {
  display: flex;
  flex-direction: column;
}

.type-label {
  font-weight: 600;
  color: #171717;
}

.type-desc {
  font-size: 0.75rem;
  color: #737373;
}

.selected-members-bar {
  margin-bottom: 1rem;
}

.selected-members-bar label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 32px;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.no-selection {
  color: #a3a3a3;
  font-size: 0.875rem;
}

.member-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #0ea5e9;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.875rem;
}

.member-chip button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.users-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background: #f5f5f5;
}

.user-item.selected {
  background: #f0f9ff;
}

.user-item .user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-item .user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #171717;
}

.user-email {
  font-size: 0.75rem;
  color: #737373;
}

.check-icon {
  width: 24px;
  height: 24px;
  background: #0ea5e9;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

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

.btn-secondary {
  background: #f5f5f5;
  color: #171717;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #0ea5e9;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0284c7;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 1024px) {
  .messaging-page {
    border-radius: 0;
    box-shadow: none;
  }

  .channels-sidebar {
    display: none;
  }
  
  .modal {
    max-height: 90vh;
    margin: 1rem;
  }
}

/* Report Button */
.btn-report {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
}

.btn-report:hover {
  background: #ef4444;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.char-count {
  display: block;
  text-align: right;
  color: #999;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Empty state for users list */
.users-list:empty::after {
  content: 'No users found';
  display: block;
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>
