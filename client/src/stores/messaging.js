import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useMessagingStore = defineStore('messaging', () => {
    const channels = ref([])
    const activeChannelId = ref(null)
    const activeChannel = ref(null)
    const messages = ref([])
    const loading = ref(false)
    const typingUsers = ref(new Map()) // channelId -> Set of userIds

    const sortedChannels = computed(() => {
        return [...channels.value].sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || a.createdAt
            const bTime = b.lastMessage?.createdAt || b.createdAt
            return new Date(bTime) - new Date(aTime)
        })
    })

    async function fetchChannels() {
        loading.value = true
        try {
            const { data } = await api.get('/channels')
            channels.value = data
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        } finally {
            loading.value = false
        }
    }

    async function fetchChannel(channelId) {
        try {
            const { data } = await api.get(`/channels/${channelId}`)
            activeChannel.value = data
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function fetchMessages(channelId, cursor) {
        try {
            const params = cursor ? { cursor, limit: 50 } : { limit: 50 }
            const { data } = await api.get(`/channels/${channelId}/messages`, { params })
            if (cursor) {
                messages.value = [...data.messages, ...messages.value]
            } else {
                messages.value = data.messages
            }
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function sendMessage(channelId, content, replyTo) {
        try {
            const { data } = await api.post(`/channels/${channelId}/messages`, {
                content,
                replyTo,
            })
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function createChannel(payload) {
        try {
            const { data } = await api.post('/channels', payload)
            channels.value.unshift(data)
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function editMessage(messageId, content) {
        try {
            const { data } = await api.patch(`/channels/messages/${messageId}`, { content })
            return { success: true, data }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function deleteMessage(messageId) {
        try {
            await api.delete(`/channels/messages/${messageId}`)
            return { success: true }
        } catch (error) {
            return { success: false, error }
        }
    }

    async function reportChannel(channelId, reason) {
        try {
            await api.post(`/channels/${channelId}/report`, { reason })
            return { success: true }
        } catch (error) {
            return { success: false, error }
        }
    }

    function addMessage(message) {
        // Avoid duplicates
        if (!messages.value.find(m => m.id === message.id)) {
            messages.value.push(message)
        }
        // Update channel preview
        const ch = channels.value.find(c => c.id === message.channelId)
        if (ch) {
            ch.lastMessage = message
            ch.updatedAt = message.createdAt
        }
    }

    function updateMessage(updatedMessage) {
        const idx = messages.value.findIndex(m => m.id === updatedMessage.id)
        if (idx !== -1) {
            messages.value[idx] = { ...messages.value[idx], ...updatedMessage }
        }
    }

    function removeMessage(messageId) {
        const idx = messages.value.findIndex(m => m.id === messageId)
        if (idx !== -1) {
            messages.value[idx].isDeleted = true
            messages.value[idx].content = 'This message has been deleted'
        }
    }

    function setActiveChannel(channelId) {
        activeChannelId.value = channelId
    }

    function setTyping(channelId, userId, isTyping) {
        if (!typingUsers.value.has(channelId)) {
            typingUsers.value.set(channelId, new Set())
        }
        if (isTyping) {
            typingUsers.value.get(channelId).add(userId)
        } else {
            typingUsers.value.get(channelId).delete(userId)
        }
    }

    function getTypingUsers(channelId) {
        return typingUsers.value.get(channelId) || new Set()
    }

    function clearMessages() {
        messages.value = []
    }

    function reset() {
        channels.value = []
        activeChannelId.value = null
        activeChannel.value = null
        messages.value = []
        typingUsers.value = new Map()
    }

    return {
        channels,
        activeChannelId,
        activeChannel,
        messages,
        loading,
        sortedChannels,
        fetchChannels,
        fetchChannel,
        fetchMessages,
        sendMessage,
        createChannel,
        editMessage,
        deleteMessage,
        reportChannel,
        addMessage,
        updateMessage,
        removeMessage,
        setActiveChannel,
        setTyping,
        getTypingUsers,
        clearMessages,
        reset,
    }
})
