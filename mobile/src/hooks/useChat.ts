/**
 * useChat Hook
 *
 * Chat management hook that combines REST API and WebSocket for messaging.
 * Features:
 * - Load initial messages via REST
 * - Listen for new messages via WebSocket
 * - Optimistic updates for sending messages
 * - Typing indicator management
 * - Message cache management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import {
  socketService,
  Message,
  Reaction,
  User as SocketUser,
} from '@/src/services/socket.service';
import { messagingService } from '@/src/services/messaging.service';
import { useAuth } from '@/providers/AuthProvider';

// ============================================================
// TYPES
// ============================================================

interface UseChatOptions {
  channelId: string;
  limit?: number;
}

interface SendMessageOptions {
  replyToId?: string;
  attachments?: string[];
}

interface OptimisticMessage extends Message {
  isOptimistic?: boolean;
  error?: string;
}

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
}

// ============================================================
// HOOK
// ============================================================

export function useChat({ channelId, limit = 50 }: UseChatOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // ============================================================
  // QUERIES
  // ============================================================

  // Fetch initial messages via REST
  const messagesQuery = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      const result = await messagingService.getChannelMessages(channelId, { limit });
      return result.messages;
    },
    enabled: !!channelId,
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      options,
    }: {
      content: string;
      options?: SendMessageOptions;
    }) => {
      return messagingService.sendMessage(channelId, content, options);
    },
    onMutate: async ({ content, options }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });

      // Create optimistic message
      const optimisticMessage: OptimisticMessage = {
        id: `optimistic-${Date.now()}`,
        channelId,
        senderId: user?.id || '',
        content,
        replyToId: options?.replyToId,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          status: 'active',
        } as SocketUser : undefined,
        isOptimistic: true,
      };

      // Add to optimistic IDs
      setOptimisticIds((prev) => new Set([...prev, optimisticMessage.id]));

      // Optimistically update messages
      setMessages((prev) => [...prev, optimisticMessage]);

      return { optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === context?.optimisticMessage.id ? { ...data, isOptimistic: false } : m
        )
      );
      
      // Remove from optimistic IDs
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(context?.optimisticMessage.id || '');
        return next;
      });

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (error, variables, context) => {
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === context?.optimisticMessage.id
            ? { ...m, error: 'Failed to send. Tap to retry.' }
            : m
        )
      );
      
      console.error('[useChat] Failed to send message:', error);
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      return messagingService.editMessage(messageId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return messagingService.deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return messagingService.addReaction(messageId, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return messagingService.removeReaction(messageId, emoji);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (messageIds.length === 1) {
        return messagingService.markMessageAsRead(messageIds[0]);
      }
      return messagingService.markMessagesAsRead(channelId, messageIds);
    },
  });

  // ============================================================
  // ACTIONS
  // ============================================================

  const sendMessage = useCallback(
    (content: string, attachments?: string[], replyToId?: string) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        return false;
      }

      // Try WebSocket first for real-time feel
      const wsSuccess = socketService.emitSendMessage(channelId, content, {
        replyToId,
        attachments,
      });

      // If WebSocket fails, fall back to REST
      if (!wsSuccess) {
        sendMessageMutation.mutate({
          content,
          options: { replyToId, attachments },
        });
      } else {
        // Optimistic update for WebSocket
        const optimisticMessage: OptimisticMessage = {
          id: `ws-optimistic-${Date.now()}`,
          channelId,
          senderId: user?.id || '',
          content,
          replyToId,
          isEdited: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sender: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          status: 'active',
        } as SocketUser : undefined,
          isOptimistic: true,
        };
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      return true;
    },
    [channelId, user, sendMessageMutation]
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!content.trim()) return false;

      // Try WebSocket first
      const wsSuccess = socketService.emitEditMessage(messageId, content);

      if (!wsSuccess) {
        editMessageMutation.mutate({ messageId, content });
      }

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content, isEdited: true, editedAt: new Date().toISOString() }
            : m
        )
      );

      return true;
    },
    [editMessageMutation]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      // Try WebSocket first
      const wsSuccess = socketService.emitDeleteMessage(messageId);

      if (!wsSuccess) {
        deleteMessageMutation.mutate(messageId);
      }

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: '[Message deleted]', deletedAt: new Date().toISOString() }
            : m
        )
      );

      return true;
    },
    [deleteMessageMutation]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      // Try WebSocket first
      const wsSuccess = socketService.emitAddReaction(messageId, emoji);

      if (!wsSuccess) {
        addReactionMutation.mutate({ messageId, emoji });
      }

      // Optimistic update
      const optimisticReaction: Reaction = {
        id: `optimistic-${Date.now()}`,
        messageId,
        userId: user?.id || '',
        emoji,
        createdAt: new Date().toISOString(),
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          status: 'active',
        } as SocketUser : undefined,
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), optimisticReaction] }
            : m
        )
      );

      return true;
    },
    [user, addReactionMutation]
  );

  const removeReaction = useCallback(
    (messageId: string, emoji: string) => {
      // Try WebSocket first
      const wsSuccess = socketService.emitRemoveReaction(messageId, emoji);

      if (!wsSuccess) {
        removeReactionMutation.mutate({ messageId, emoji });
      }

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(
                  (r) => !(r.emoji === emoji && r.userId === user?.id)
                ),
              }
            : m
        )
      );

      return true;
    },
    [user, removeReactionMutation]
  );

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (messageIds.length === 0) return;

      // Try WebSocket first
      if (messageIds.length === 1) {
        socketService.emitMessageRead(messageIds[0]);
      } else {
        socketService.emitMessagesRead(messageIds);
      }

      // Also call REST API as fallback
      markAsReadMutation.mutate(messageIds);
    },
    [markAsReadMutation]
  );

  // ============================================================
  // TYPING INDICATORS
  // ============================================================

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      try {
        socketService.emitTypingStart(channelId);
      } catch (error) {
        // Silent fail for typing indicators
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [channelId]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      try {
        socketService.emitTypingStop(channelId);
      } catch (error) {
        // Silent fail for typing indicators
      }
    }
  }, [channelId]);

  // ============================================================
  // SOCKET EVENT LISTENERS
  // ============================================================

  useEffect(() => {
    if (!channelId) return;

    // Join channel
    socketService.emitJoinChannel(channelId);

    // Subscribe to new messages
    const unsubscribeNew = socketService.onEvent<Message>('message:new', (message) => {
      if (message.channelId === channelId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            // Remove optimistic version if exists
            return prev
              .filter((m) => !m.isOptimistic)
              .map((m) => (m.id === message.id ? message : m));
          }
          return [...prev.filter((m) => !m.isOptimistic), message];
        });
      }
    });

    // Subscribe to message updates
    const unsubscribeUpdated = socketService.onEvent<Message>('message:updated', (message) => {
      if (message.channelId === channelId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...message, isOptimistic: false } : m))
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

    // Subscribe to typing updates
    const unsubscribeTyping = socketService.onEvent<{
      channelId: string;
      users: TypingUser[];
    }>('typing:update', (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(data.users.filter((u) => u.userId !== user?.id));
      }
    });

    // Subscribe to read receipts
    const unsubscribeReadReceipt = socketService.onEvent<{
      messageId: string;
      userId: string;
      readAt: string;
    }>('message:read_receipt', (receipt) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === receipt.messageId
            ? {
                ...m,
                readReceipts: [
                  ...(m.readReceipts || []).filter((r) => r.userId !== receipt.userId),
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
    });

    // Subscribe to reactions
    const unsubscribeReactionAdded = socketService.onEvent<{
      messageId: string;
      reaction: Reaction;
    }>('message:reaction_added', ({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && !m.reactions?.some((r) => r.id === reaction.id)
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
            ? { ...m, reactions: (m.reactions || []).filter((r) => r.id !== reactionId) }
            : m
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeTyping();
      unsubscribeReadReceipt();
      unsubscribeReactionAdded();
      unsubscribeReactionRemoved();
      
      // Stop typing when leaving
      stopTyping();
    };
  }, [channelId, user?.id, stopTyping]);

  // ============================================================
  // SYNC WITH QUERY DATA
  // ============================================================

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages((prev) => {
        // Merge server messages with optimistic ones
        const serverMessages = messagesQuery.data;
        const optimisticMessages = prev.filter((m) => m.isOptimistic);
        return [...serverMessages, ...optimisticMessages];
      });
    }
  }, [messagesQuery.data]);

  // Mark messages as read when focusing
  useFocusEffect(
    useCallback(() => {
      const unreadMessageIds = messages
        .filter((m) => m.senderId !== user?.id && !m.readReceipts?.some((r) => r.userId === user?.id))
        .map((m) => m.id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }, [messages, user?.id, markAsRead])
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // Messages
    messages,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
    hasNextPage: false, // TODO: Implement pagination
    fetchNextPage: () => {},

    // Typing
    typingUsers,
    startTyping,
    stopTyping,

    // Actions
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,

    // Mutation states
    isSending: sendMessageMutation.isPending,
    isEditing: editMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
  };
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useChat;
