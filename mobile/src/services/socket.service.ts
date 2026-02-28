/**
 * Socket Service
 *
 * Socket.IO client configuration and event emitters with error handling,
 * reconnection logic, and event type definitions.
 */

import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken } from './api-client';

// ============================================================
// CONFIGURATION
// ============================================================

// Your computer's IP address - UPDATE THIS to match your network
const COMPUTER_IP = '10.181.191.47';

// Use IP for native devices, localhost for web
const DEFAULT_API_HOST = Platform.OS === 'web' ? 'localhost:3000' : `${COMPUTER_IP}:3000`;

const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || process.env.EXPO_PUBLIC_API_URL 
  || `http://${DEFAULT_API_HOST}`;

const WS_URL = Constants.expoConfig?.extra?.wsUrl 
  || process.env.EXPO_PUBLIC_WS_URL 
  || API_URL;

// ============================================================
// EVENT TYPE DEFINITIONS
// ============================================================

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

// Client → Server Events
export interface ClientToServerEvents {
  'message:send': (data: {
    channelId: string;
    content: string;
    replyToId?: string;
    attachments?: string[];
  }) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (data: { messageId: string }) => void;
  'message:read': (data: { messageId: string }) => void;
  'message:read_bulk': (data: { messageIds: string[] }) => void;
  'typing:start': (data: { channelId: string }) => void;
  'typing:stop': (data: { channelId: string }) => void;
  'typing:get': (data: { channelId: string }) => void;
  'channel:join': (data: { channelId: string }) => void;
  'reaction:add': (data: { messageId: string; emoji: string }) => void;
  'reaction:remove': (data: { messageId: string; emoji: string }) => void;
}

// Server → Client Events
export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (data: { messageId: string }) => void;
  'message:read_receipt': (data: {
    messageId: string;
    userId: string;
    readAt: string;
  }) => void;
  'message:reaction_added': (data: {
    messageId: string;
    reaction: Reaction;
  }) => void;
  'message:reaction_removed': (data: {
    messageId: string;
    reactionId: string;
  }) => void;
  'typing:update': (data: {
    channelId: string;
    users: Array<{
      userId: string;
      name: string;
      avatarUrl?: string;
    }>;
  }) => void;
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// ============================================================
// TYPE IMPORTS (from api.ts)
// ============================================================

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  replyTo?: Message;
  attachments?: MessageAttachment[];
  reactions?: Reaction[];
  readReceipts?: MessageRead[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'archived';
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: User;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user?: User;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileId: string;
  file?: FileInfo;
}

export interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

// ============================================================
// SOCKET INSTANCE MANAGEMENT
// ============================================================

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let connectionState: ConnectionState = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 1000; // 1 second

export type SocketEventCallback<T = unknown> = (data: T) => void;

/**
 * Initialize and connect to the Socket.IO server
 */
export async function initializeSocket(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('No access token available for WebSocket authentication');
  }

  connectionState = 'connecting';

  socket = io(`${WS_URL}/messaging`, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY_BASE,
    reconnectionDelayMax: 30000, // Max 30 seconds between attempts
    randomizationFactor: 0.5,
    timeout: 10000,
  });

  // Setup connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    connectionState = 'connected';
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    connectionState = 'disconnected';
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    connectionState = 'error';
    reconnectAttempts++;
  });

  socket.io.on('reconnect', (attemptNumber) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    connectionState = 'connected';
    reconnectAttempts = 0;
  });

  socket.io.on('reconnect_attempt', (attemptNumber) => {
    console.log('[Socket] Reconnection attempt', attemptNumber);
    connectionState = 'connecting';
    reconnectAttempts = attemptNumber;
  });

  socket.io.on('reconnect_error', (error: Error) => {
    console.error('[Socket] Reconnection error:', error.message);
    connectionState = 'error';
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after', MAX_RECONNECT_ATTEMPTS, 'attempts');
    connectionState = 'error';
  });

  // Handle server errors
  socket.on('error', (error) => {
    console.error('[Socket] Server error:', error);
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionState = 'disconnected';
    reconnectAttempts = 0;
  }
}

/**
 * Reconnect socket with new token (after token refresh)
 */
export async function reconnectWithToken(): Promise<void> {
  disconnectSocket();
  await initializeSocket();
}

// ============================================================
// EVENT EMITTERS WITH ERROR HANDLING
// ============================================================

function ensureConnected(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  return socket;
}

/**
 * Send a message to a channel
 */
export function emitSendMessage(
  channelId: string,
  content: string,
  options?: { replyToId?: string; attachments?: string[] }
): boolean {
  try {
    const sock = ensureConnected();
    sock.emit('message:send', {
      channelId,
      content,
      replyToId: options?.replyToId,
      attachments: options?.attachments,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Edit a message
 */
export function emitEditMessage(messageId: string, content: string): boolean {
  try {
    const sock = ensureConnected();
    sock.emit('message:edit', { messageId, content });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a message
 */
export function emitDeleteMessage(messageId: string): boolean {
  try {
    const sock = ensureConnected();
    sock.emit('message:delete', { messageId });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark a message as read
 */
export function emitMessageRead(messageId: string): void {
  const sock = ensureConnected();
  sock.emit('message:read', { messageId });
}

/**
 * Mark multiple messages as read
 */
export function emitMessagesRead(messageIds: string[]): void {
  const sock = ensureConnected();
  sock.emit('message:read_bulk', { messageIds });
}

/**
 * Start typing indicator
 */
export function emitTypingStart(channelId: string): void {
  const sock = ensureConnected();
  sock.emit('typing:start', { channelId });
}

/**
 * Stop typing indicator
 */
export function emitTypingStop(channelId: string): void {
  const sock = ensureConnected();
  sock.emit('typing:stop', { channelId });
}

/**
 * Get currently typing users
 */
export function emitGetTyping(channelId: string): void {
  const sock = ensureConnected();
  sock.emit('typing:get', { channelId });
}

/**
 * Join a channel room
 */
export function emitJoinChannel(channelId: string): void {
  const sock = ensureConnected();
  sock.emit('channel:join', { channelId });
}

/**
 * Add a reaction to a message
 */
export function emitAddReaction(messageId: string, emoji: string): boolean {
  try {
    const sock = ensureConnected();
    sock.emit('reaction:add', { messageId, emoji });
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a reaction from a message
 */
export function emitRemoveReaction(messageId: string, emoji: string): boolean {
  try {
    const sock = ensureConnected();
    sock.emit('reaction:remove', { messageId, emoji });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

/**
 * Subscribe to a socket event
 */
export function onEvent<T>(
  event: keyof ServerToClientEvents | string,
  callback: SocketEventCallback<T>
): () => void {
  if (!socket) {
    console.warn('[Socket] Cannot subscribe to event, socket not initialized');
    return () => {};
  }

  (socket as any).on(event, callback);
  
  // Return unsubscribe function
  return () => {
    (socket as any)?.off(event, callback);
  };
}

/**
 * Unsubscribe from a socket event
 */
export function offEvent<T>(
  event: keyof ServerToClientEvents | string,
  callback?: SocketEventCallback<T>
): void {
  if (!socket) return;
  
  if (callback) {
    (socket as any).off(event, callback);
  } else {
    (socket as any).off(event);
  }
}

/**
 * Subscribe to socket events once
 */
export function onceEvent<T>(
  event: keyof ServerToClientEvents | string,
  callback: SocketEventCallback<T>
): void {
  if (!socket) {
    console.warn('[Socket] Cannot subscribe to event, socket not initialized');
    return;
  }

  (socket as any).once(event, callback);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const socketService = {
  initializeSocket,
  getSocket,
  getConnectionState,
  disconnectSocket,
  reconnectWithToken,
  
  // Emitters
  emitSendMessage,
  emitEditMessage,
  emitDeleteMessage,
  emitMessageRead,
  emitMessagesRead,
  emitTypingStart,
  emitTypingStop,
  emitGetTyping,
  emitJoinChannel,
  emitAddReaction,
  emitRemoveReaction,
  
  // Listeners
  onEvent,
  offEvent,
  onceEvent,
};

export default socketService;
