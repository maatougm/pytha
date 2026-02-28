import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingService } from '@/src/services/messaging.service';
import type { Channel } from '@/services/api';
import type { Message } from '@/src/services/socket.service';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => messagingService.getChannels(),
  });
}

export function useChannel(channelId: string) {
  return useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => messagingService.getChannel(channelId),
    enabled: !!channelId,
  });
}

export function useChannelMessages(channelId: string, pagination?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['messages', channelId, pagination],
    queryFn: () => messagingService.getChannelMessages(channelId, pagination),
    enabled: !!channelId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, content, replyToId, attachmentIds }: {
      channelId: string;
      content: string;
      replyToId?: string;
      attachmentIds?: string[];
    }) =>
      messagingService.sendMessage(channelId, content, { replyToId, attachmentIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, messageIds }: { channelId: string; messageIds: string[] }) =>
      messagingService.markMessagesAsRead(channelId, messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
