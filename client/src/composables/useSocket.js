/**
 * useSocket composable — wraps the singleton messagingSocket from services/messaging.js
 *
 * Previously this composable created its own Socket.IO connection, resulting in two
 * simultaneous connections per user. Now it delegates to the shared messagingSocket
 * singleton so there is always exactly one connection per browser tab.
 *
 * The `connected` ref is module-level so all component instances share the same value.
 */
import { ref } from 'vue'
import { messagingSocket } from '../services/messaging'
import { useAuthStore } from '../stores/auth'

// Module-level shared reactive state — all composable instances share this ref
const connected = ref(false)

export function useSocket() {
    async function connect() {
        const auth = useAuthStore()
        if (!auth.accessToken) return

        try {
            await messagingSocket.connect(auth.accessToken)
            connected.value = true
        } catch (err) {
            console.error('❌ WebSocket connect error:', err.message)
            connected.value = false
        }
    }

    function disconnect() {
        messagingSocket.disconnect()
        connected.value = false
    }

    function emit(event, data) {
        if (messagingSocket.isConnected()) {
            return messagingSocket.getSocket()?.emit(event, data)
        }
    }

    function on(event, callback) {
        const socket = messagingSocket.getSocket()
        if (socket) {
            socket.on(event, callback)
        }
    }

    function off(event, callback) {
        const socket = messagingSocket.getSocket()
        if (socket) {
            socket.off(event, callback)
        }
    }

    function joinChannel(channelId) {
        messagingSocket.joinChannel(channelId)
    }

    function sendMessage(channelId, content, replyTo) {
        messagingSocket.sendMessage(channelId, content, { replyTo })
    }

    function startTyping(channelId) {
        messagingSocket.startTyping(channelId)
    }

    function stopTyping(channelId) {
        messagingSocket.stopTyping(channelId)
    }

    return {
        connected,
        connect,
        disconnect,
        emit,
        on,
        off,
        joinChannel,
        sendMessage,
        startTyping,
        stopTyping,
    }
}
