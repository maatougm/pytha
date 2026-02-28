/**
 * Messaging Service
 * 
 * Handles messaging REST API operations including channels,
 * messages, reactions, read receipts, and search.
 */

import apiClient from './api-client';
import type {
  Channel,
  ChannelMember,
  Message,
  Reaction,
  TypingIndicator,
  MessageRead,
  CreateChannelRequest,
  SendMessageRequest,
  EditMessageRequest,
  MarkMessagesReadRequest,
  AddReactionRequest,
  SearchMessagesRequest,
  ReportChannelRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types/api';

// ============================================================
// CHANNEL OPERATIONS
// ============================================================

/**
 * Get all channels for the current user
 * @returns Promise with array of channels with unread counts
 */
export async function getChannels(): Promise<Channel[]> {
  return apiClient.get<Channel[]>('/channels/my');
}

/**
 * Get channel details by ID
 * @param channelId - Channel ID
 * @returns Promise with channel data
 */
export async function getChannel(channelId: string): Promise<Channel> {
  return apiClient.get<Channel>(`/channels/${channelId}`);
}

/**
 * Create a new channel
 * @param data - Channel creation data
 * @returns Promise with created channel
 */
export async function createChannel(data: CreateChannelRequest): Promise<Channel> {
  return apiClient.post<Channel>('/channels', data);
}

/**
 * Get members of a channel
 * @param channelId - Channel ID
 * @returns Promise with array of channel members
 */
export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  return apiClient.get<ChannelMember[]>(`/channels/${channelId}/members`);
}

/**
 * Add a member to a channel
 * @param channelId - Channel ID
 * @param userId - User ID to add
 * @param role - Member role in the channel
 * @returns Promise with added member data
 */
export async function addChannelMember(
  channelId: string,
  userId: string,
  role: string = 'member'
): Promise<ChannelMember> {
  return apiClient.post<ChannelMember>(`/channels/${channelId}/members`, {
    userId,
    role,
  });
}

/**
 * Remove a member from a channel
 * @param channelId - Channel ID
 * @param userId - User ID to remove
 * @returns Promise that resolves when member is removed
 */
export async function removeChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  return apiClient.delete<void>(`/channels/${channelId}/members/${userId}`);
}

/**
 * Report a channel
 * @param channelId - Channel ID
 * @param reason - Reason for the report
 * @returns Promise with report data
 */
export async function reportChannel(
  channelId: string,
  reason: string
): Promise<{ id: string; status: string }> {
  const data: ReportChannelRequest = { reason };
  return apiClient.post<{ id: string; status: string }>(
    `/channels/${channelId}/report`,
    data
  );
}

// ============================================================
// MESSAGE OPERATIONS
// ============================================================

/**
 * Get messages for a channel with pagination
 * @param channelId - Channel ID
 * @param params - Pagination parameters (cursor-based)
 * @returns Promise with paginated messages
 */
export async function getChannelMessages(
  channelId: string,
  params?: { cursor?: string; limit?: number }
): Promise<{ messages: Message[]; nextCursor?: string }> {
  const queryParams = new URLSearchParams();
  
  if (params?.cursor) {
    queryParams.append('cursor', params.cursor);
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<{ messages: Message[]; nextCursor?: string }>(
    `/channels/${channelId}/messages${query ? `?${query}` : ''}`
  );
}

/**
 * Get messages with read receipts included
 * @param channelId - Channel ID
 * @param params - Pagination parameters
 * @returns Promise with messages including read receipts
 */
export async function getMessagesWithReadReceipts(
  channelId: string,
  params?: { cursor?: string; limit?: number }
): Promise<{ messages: Message[]; nextCursor?: string }> {
  const queryParams = new URLSearchParams();
  
  if (params?.cursor) {
    queryParams.append('cursor', params.cursor);
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<{ messages: Message[]; nextCursor?: string }>(
    `/channels/${channelId}/messages/with-receipts${query ? `?${query}` : ''}`
  );
}

/**
 * Send a message to a channel
 * @param channelId - Channel ID
 * @param content - Message content
 * @param options - Optional replyToId and attachmentIds
 * @returns Promise with created message
 */
export async function sendMessage(
  channelId: string,
  content: string,
  options?: { replyToId?: string; attachmentIds?: string[] }
): Promise<Message> {
  const data: SendMessageRequest = {
    content,
    replyToId: options?.replyToId,
    attachmentIds: options?.attachmentIds,
  };
  
  return apiClient.post<Message>(`/channels/${channelId}/messages`, data);
}

/**
 * Edit an existing message
 * @param messageId - Message ID
 * @param content - New content
 * @returns Promise with updated message
 */
export async function editMessage(
  messageId: string,
  content: string
): Promise<Message> {
  const data: EditMessageRequest = { content };
  return apiClient.patch<Message>(`/channels/messages/${messageId}`, data);
}

/**
 * Delete a message
 * @param messageId - Message ID
 * @returns Promise that resolves when message is deleted
 */
export async function deleteMessage(messageId: string): Promise<void> {
  return apiClient.delete<void>(`/channels/messages/${messageId}`);
}

/**
 * Mark a channel as read
 * @param channelId - Channel ID
 * @returns Promise that resolves when marked as read
 */
export async function markChannelAsRead(channelId: string): Promise<void> {
  return apiClient.post<void>(`/channels/${channelId}/read`, {});
}

/**
 * Mark specific messages as read
 * @param channelId - Channel ID
 * @param messageIds - Array of message IDs
 * @returns Promise with read receipt data
 */
export async function markMessagesAsRead(
  channelId: string,
  messageIds: string[]
): Promise<MessageRead[]> {
  const data: MarkMessagesReadRequest = { messageIds };
  return apiClient.post<MessageRead[]>(`/channels/${channelId}/messages/read`, data);
}

/**
 * Mark a single message as read
 * @param messageId - Message ID
 * @returns Promise with read receipt
 */
export async function markMessageAsRead(messageId: string): Promise<MessageRead> {
  return apiClient.post<MessageRead>(`/channels/messages/${messageId}/read`, {});
}

/**
 * Get read receipts for a message
 * @param messageId - Message ID
 * @returns Promise with array of read receipts
 */
export async function getMessageReadReceipts(messageId: string): Promise<MessageRead[]> {
  return apiClient.get<MessageRead[]>(`/channels/messages/${messageId}/read-receipts`);
}

/**
 * Get read status for all messages in a channel
 * @param channelId - Channel ID
 * @returns Promise with read status data
 */
export async function getChannelReadStatus(
  channelId: string
): Promise<Record<string, MessageRead[]>> {
  return apiClient.get<Record<string, MessageRead[]>>(`/channels/${channelId}/read-status`);
}

// ============================================================
// REACTION OPERATIONS
// ============================================================

/**
 * Add a reaction to a message
 * @param messageId - Message ID
 * @param emoji - Emoji to react with
 * @returns Promise with created reaction
 */
export async function addReaction(
  messageId: string,
  emoji: string
): Promise<Reaction> {
  const data: AddReactionRequest = { emoji };
  return apiClient.post<Reaction>(`/channels/messages/${messageId}/reactions`, data);
}

/**
 * Remove a reaction from a message
 * @param messageId - Message ID
 * @param emoji - Emoji to remove
 * @returns Promise that resolves when reaction is removed
 */
export async function removeReaction(messageId: string, emoji: string): Promise<void> {
  return apiClient.delete<void>(`/channels/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
}

/**
 * Get all reactions for a message
 * @param messageId - Message ID
 * @returns Promise with array of reactions
 */
export async function getReactions(messageId: string): Promise<Reaction[]> {
  return apiClient.get<Reaction[]>(`/channels/messages/${messageId}/reactions`);
}

// ============================================================
// TYPING INDICATORS
// ============================================================

/**
 * Get currently typing users in a channel
 * @param channelId - Channel ID
 * @returns Promise with array of typing indicators
 */
export async function getTypingUsers(channelId: string): Promise<TypingIndicator[]> {
  // This endpoint might not exist on the backend, 
  // typing is typically handled via WebSocket
  // This is a placeholder for REST API fallback
  return apiClient.get<TypingIndicator[]>(`/channels/${channelId}/typing`);
}

// ============================================================
// SEARCH
// ============================================================

/**
 * Search messages in a channel
 * @param channelId - Channel ID
 * @param query - Search query
 * @param params - Pagination parameters
 * @returns Promise with search results
 */
export async function searchMessages(
  channelId: string,
  query: string,
  params?: { cursor?: string; limit?: number }
): Promise<{ messages: Message[]; nextCursor?: string }> {
  const queryParams = new URLSearchParams();
  
  queryParams.append('query', query);
  if (params?.cursor) {
    queryParams.append('cursor', params.cursor);
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  return apiClient.get<{ messages: Message[]; nextCursor?: string }>(
    `/channels/${channelId}/search?${queryParams.toString()}`
  );
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const messagingService = {
  // Channel operations
  getChannels,
  getChannel,
  createChannel,
  getChannelMembers,
  addChannelMember,
  removeChannelMember,
  reportChannel,
  
  // Message operations
  getChannelMessages,
  getMessagesWithReadReceipts,
  sendMessage,
  editMessage,
  deleteMessage,
  markChannelAsRead,
  markMessagesAsRead,
  markMessageAsRead,
  getMessageReadReceipts,
  getChannelReadStatus,
  
  // Reactions
  addReaction,
  removeReaction,
  getReactions,
  
  // Typing
  getTypingUsers,
  
  // Search
  searchMessages,
};

export default messagingService;
