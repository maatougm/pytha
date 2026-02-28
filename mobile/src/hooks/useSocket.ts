/**
 * useSocket Hook
 *
 * WebSocket hook for managing Socket.IO connection with:
 * - JWT authentication in handshake
 * - Auto-reconnect with exponential backoff
 * - Connection state management
 * - Event subscription management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  socketService,
  ConnectionState,
  ServerToClientEvents,
  Message,
  Reaction,
} from '@/src/services/socket.service';
import { useAuth } from '@/providers/AuthProvider';

// ============================================================
// TYPES
// ============================================================

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
}

interface TypingUpdate {
  channelId: string;
  users: TypingUser[];
}

interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
}

// ============================================================
// HOOK
// ============================================================

export function useSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef(socketService.getSocket());
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (isConnecting || socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    try {
      const socket = await socketService.initializeSocket();
      socketRef.current = socket;
      setConnectionState('connected');
    } catch (error) {
      console.error('[useSocket] Failed to connect:', error);
      setConnectionState('error');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    socketService.disconnectSocket();
    socketRef.current = null;
    setConnectionState('disconnected');
  }, []);

  // Reconnect with new token
  const reconnect = useCallback(async () => {
    setConnectionState('connecting');
    try {
      await socketService.reconnectWithToken();
      setConnectionState('connected');
    } catch (error) {
      console.error('[useSocket] Reconnect failed:', error);
      setConnectionState('error');
    }
  }, []);

  // Subscribe to connection state changes
  useEffect(() => {
    if (!user) {
      disconnect();
      return;
    }

    connect();

    // Poll connection state
    const interval = setInterval(() => {
      const state = socketService.getConnectionState();
      setConnectionState(state);
      socketRef.current = socketService.getSocket();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount - let the provider manage lifecycle
    };
  }, []);

  return {
    socket: socketRef.current,
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
    hasError: connectionState === 'error',
    connect,
    disconnect,
    reconnect,
  };
}

// ============================================================
// MESSAGE EVENTS HOOK
// ============================================================

export function useMessageEvents(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to new messages
    const unsubscribeNew = socketService.onEvent<Message>('message:new', (message) => {
      if (message.channelId === channelId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Invalidate channel messages cache
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      }
    });

    // Subscribe to message updates
    const unsubscribeUpdated = socketService.onEvent<Message>('message:updated', (message) => {
      if (message.channelId === channelId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    });

    // Subscribe to message deletions
    const unsubscribeDeleted = socketService.onEvent<{ messageId: string }>(
      'message:deleted',
      ({ messageId }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: '[Message deleted]' }
              : m
          )
        );
      }
    );

    // Subscribe to read receipts
    const unsubscribeReadReceipt = socketService.onEvent<ReadReceipt>(
      'message:read_receipt',
      (receipt) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === receipt.messageId
              ? {
                  ...m,
                  readReceipts: [
                    ...(m.readReceipts || []),
                    {
                      id: `temp-${Date.now()}`,
                      messageId: receipt.messageId,
                      userId: receipt.userId,
                      readAt: receipt.readAt,
                    },
                  ],
                }
              : m
          )
        );
      }
    );

    // Subscribe to reaction changes
    const unsubscribeReactionAdded = socketService.onEvent<{
      messageId: string;
      reaction: Reaction;
    }>('message:reaction_added', ({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), reaction] }
            : m
        )
      );
    });

    const unsubscribeReactionRemoved = socketService.onEvent<{
      messageId: string;
      reactionId: string;
    }>('message:reaction_removed', ({ messageId, reactionId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter((r) => r.id !== reactionId),
              }
            : m
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeReadReceipt();
      unsubscribeReactionAdded();
      unsubscribeReactionRemoved();
    };
  }, [channelId, queryClient]);

  return { messages, setMessages };
}

// ============================================================
// TYPING INDICATOR HOOK
// ============================================================

export function useTypingIndicator(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const unsubscribe = socketService.onEvent<TypingUpdate>(
      'typing:update',
      (data) => {
        if (data.channelId === channelId) {
          setTypingUsers(data.users);
        }
      }
    );

    return unsubscribe;
  }, [channelId]);

  const startTyping = useCallback(() => {
    try {
      socketService.emitTypingStart(channelId);
    } catch (error) {
      console.warn('[useTypingIndicator] Failed to start typing:', error);
    }
  }, [channelId]);

  const stopTyping = useCallback(() => {
    try {
      socketService.emitTypingStop(channelId);
    } catch (error) {
      console.warn('[useTypingIndicator] Failed to stop typing:', error);
    }
  }, [channelId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}

// ============================================================
// USER PRESENCE HOOK
// ============================================================

export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeOnline = socketService.onEvent<{ userId: string }>(
      'user:online',
      ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      }
    );

    const unsubscribeOffline = socketService.onEvent<{ userId: string }>(
      'user:offline',
      ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    );

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
  };
}

// ============================================================
// EMIT HOOKS
// ============================================================

export function useMessageEmitters() {
  const sendMessage = useCallback(
    (
      channelId: string,
      content: string,
      options?: { replyToId?: string; attachments?: string[] }
    ) => {
      try {
        socketService.emitSendMessage(channelId, content, options);
        return true;
      } catch (error) {
        console.error('[useMessageEmitters] Failed to send message:', error);
        return false;
      }
    },
    []
  );

  const editMessage = useCallback((messageId: string, content: string) => {
    try {
      socketService.emitEditMessage(messageId, content);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to edit message:', error);
      return false;
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    try {
      socketService.emitDeleteMessage(messageId);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to delete message:', error);
      return false;
    }
  }, []);

  const markAsRead = useCallback((messageId: string) => {
    try {
      socketService.emitMessageRead(messageId);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to mark as read:', error);
      return false;
    }
  }, []);

  const markMultipleAsRead = useCallback((messageIds: string[]) => {
    try {
      socketService.emitMessagesRead(messageIds);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to mark messages as read:', error);
      return false;
    }
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    try {
      socketService.emitAddReaction(messageId, emoji);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to add reaction:', error);
      return false;
    }
  }, []);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    try {
      socketService.emitRemoveReaction(messageId, emoji);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to remove reaction:', error);
      return false;
    }
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    try {
      socketService.emitJoinChannel(channelId);
      return true;
    } catch (error) {
      console.error('[useMessageEmitters] Failed to join channel:', error);
      return false;
    }
  }, []);

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    markMultipleAsRead,
    addReaction,
    removeReaction,
    joinChannel,
  };
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useSocket;
