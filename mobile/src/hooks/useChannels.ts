/**
 * useChannels Hook
 *
 * Real-time channel management hook that:
 * - Loads channels via REST API
 * - Listens for message:new to update last message preview
 * - Updates unread counts in real-time
 * - Sorts channels by most recent activity
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socketService, Message } from '@/src/services/socket.service';
import { messagingService } from '@/src/services/messaging.service';
import { Channel } from '@/types/api';

// ============================================================
// TYPES
// ============================================================

interface ChannelWithActivity extends Channel {
  lastActivityAt?: string;
  localUnreadCount?: number;
  lastMessage?: {
    id?: string;
    text: string;
    senderName?: string;
    timestamp?: string;
  };
}

// ============================================================
// HOOK
// ============================================================

export function useChannels(userId: string) {
  const queryClient = useQueryClient();
  const [realtimeUpdates, setRealtimeUpdates] = useState<Map<string, Partial<ChannelWithActivity>>>(new Map());

  // ============================================================
  // QUERY
  // ============================================================

  const channelsQuery = useQuery({
    queryKey: ['channels', userId],
    queryFn: async () => {
      const channels = await messagingService.getChannels();
      return channels;
    },
    enabled: !!userId,
  });

  // ============================================================
  // REAL-TIME UPDATES
  // ============================================================

  // Listen for new messages to update channel previews
  useEffect(() => {
    const unsubscribe = socketService.onEvent<Message>('message:new', (message) => {
      // Update the channel's last message preview
      setRealtimeUpdates((prev) => {
        const next = new Map(prev);
        next.set(message.channelId, {
          lastMessage: {
            id: message.id,
            text: message.content,
            senderName: message.sender?.firstName
              ? `${message.sender.firstName} ${message.sender.lastName}`
              : undefined,
            timestamp: formatTimestamp(message.createdAt),
          },
          lastActivityAt: message.createdAt,
          localUnreadCount: (next.get(message.channelId)?.localUnreadCount || 0) + 1,
        });
        return next;
      });

      // Invalidate the channels query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    });

    return unsubscribe;
  }, [queryClient]);

  // Listen for message updates
  useEffect(() => {
    const unsubscribe = socketService.onEvent<Message>('message:updated', (message) => {
      setRealtimeUpdates((prev) => {
        const channelUpdate = prev.get(message.channelId);
        if (channelUpdate?.lastMessage?.id === message.id) {
          const next = new Map(prev);
          next.set(message.channelId, {
            ...channelUpdate,
            lastMessage: {
              ...channelUpdate.lastMessage,
              text: message.content,
            },
          });
          return next;
        }
        return prev;
      });
    });

    return unsubscribe;
  }, []);

  // Listen for read receipts to update unread counts
  useEffect(() => {
    const unsubscribe = socketService.onEvent<{
      messageId: string;
      userId: string;
      readAt: string;
    }>('message:read_receipt', (receipt) => {
      // Decrement unread count when a message is read
      if (receipt.userId === userId) {
        setRealtimeUpdates((prev) => {
          const next = new Map(prev);
          // Find channel containing this message
          channelsQuery.data?.forEach((channel) => {
            const update = next.get(channel.id) || {};
            next.set(channel.id, {
              ...update,
              localUnreadCount: Math.max(0, (update.localUnreadCount || channel.unreadCount || 0) - 1),
            });
          });
          return next;
        });

        // Invalidate to get fresh data
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      }
    });

    return unsubscribe;
  }, [userId, channelsQuery.data, queryClient]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const clearUnreadCount = useCallback((channelId: string) => {
    setRealtimeUpdates((prev) => {
      const next = new Map(prev);
      const update = next.get(channelId) || {};
      next.set(channelId, {
        ...update,
        localUnreadCount: 0,
      });
      return next;
    });

    // Also update via API
    messagingService.markChannelAsRead(channelId);
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['channels'] });
  }, [queryClient]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================

  const channels = useMemo(() => {
    if (!channelsQuery.data) return [];

    return channelsQuery.data.map((channel) => {
      const realtimeUpdate = realtimeUpdates.get(channel.id);

      return {
        ...channel,
        ...realtimeUpdate,
        unreadCount: realtimeUpdate?.localUnreadCount ?? channel.unreadCount ?? 0,
      } as ChannelWithActivity;
    });
  }, [channelsQuery.data, realtimeUpdates]);

  // Sort channels by most recent activity
  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => {
      const aTime = new Date(a.lastActivityAt || a.updatedAt).getTime();
      const bTime = new Date(b.lastActivityAt || b.updatedAt).getTime();
      return bTime - aTime; // Descending order
    });
  }, [channels]);

  // Group channels by type
  const groupedChannels = useMemo(() => {
    const groups: Record<string, ChannelWithActivity[]> = {
      classroom: [],
      direct_message: [],
      teacher_parent: [],
      admin_broadcast: [],
      group: [],
      other: [],
    };

    sortedChannels.forEach((channel) => {
      const type = channel.type in groups ? channel.type : 'other';
      groups[type].push(channel);
    });

    return groups;
  }, [sortedChannels]);

  // Total unread count
  const totalUnreadCount = useMemo(() => {
    return channels.reduce((sum, channel) => sum + (channel.unreadCount || 0), 0);
  }, [channels]);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    channels: sortedChannels,
    groupedChannels,
    isLoading: channelsQuery.isLoading,
    isError: channelsQuery.isError,
    error: channelsQuery.error,
    refetch: channelsQuery.refetch,
    refresh,
    clearUnreadCount,
    totalUnreadCount,
  };
}

// ============================================================
// SEARCH HOOK
// ============================================================

export function useSearchChannels(query: string) {
  return useQuery({
    queryKey: ['channels', 'search', query],
    queryFn: async () => {
      // Note: This would need a backend endpoint for channel search
      // For now, we filter locally
      const allChannels = await messagingService.getChannels();
      const lowerQuery = query.toLowerCase();
      return allChannels.filter(
        (channel) =>
          channel.name?.toLowerCase().includes(lowerQuery) ||
          channel.description?.toLowerCase().includes(lowerQuery)
      );
    },
    enabled: query.length > 0,
  });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default useChannels;
