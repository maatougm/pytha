import { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentRoom?: string;
  typingIn?: string;
}

export interface CollaborationRoom {
  id: string;
  name: string;
  type: 'document' | 'whiteboard' | 'code' | 'chat';
  participants: string[];
  createdAt: Date;
  data?: any;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface WhiteboardStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  userId: string;
  timestamp: number;
}

export type CollaborationEvent =
  | { type: 'user_joined'; userId: string; roomId: string }
  | { type: 'user_left'; userId: string; roomId: string }
  | { type: 'presence_updated'; presence: UserPresence }
  | { type: 'cursor_moved'; cursor: CursorPosition }
  | { type: 'document_operation'; operation: DocumentOperation }
  | { type: 'whiteboard_stroke'; stroke: WhiteboardStroke }
  | { type: 'typing_started'; userId: string; channelId: string }
  | { type: 'typing_stopped'; userId: string; channelId: string };

class CollaborationService {
  private socket: Socket | null = null;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private presence: Map<string, UserPresence> = new Map();
  private cursors: Map<string, CursorPosition> = new Map();
  private eventHandlers: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize collaboration service with socket
   */
  initialize(socket: Socket): void {
    this.socket = socket;
    this.setupEventListeners();
    console.log('[Collaboration] Service initialized');
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Presence events
    this.socket.on('presence:update', (presence: UserPresence) => {
      this.presence.set(presence.userId, presence);
      this.emit('presence_updated', { type: 'presence_updated', presence });
    });

    this.socket.on('presence:batch', (presences: UserPresence[]) => {
      presences.forEach(p => this.presence.set(p.userId, p));
    });

    // Room events
    this.socket.on('room:user_joined', ({ userId, roomId }: { userId: string; roomId: string }) => {
      const room = this.rooms.get(roomId);
      if (room && !room.participants.includes(userId)) {
        room.participants.push(userId);
      }
      this.emit('user_joined', { type: 'user_joined', userId, roomId });
    });

    this.socket.on('room:user_left', ({ userId, roomId }: { userId: string; roomId: string }) => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter(id => id !== userId);
      }
      this.emit('user_left', { type: 'user_left', userId, roomId });
    });

    // Cursor events
    this.socket.on('cursor:moved', (cursor: CursorPosition) => {
      this.cursors.set(cursor.userId, cursor);
      this.emit('cursor_moved', { type: 'cursor_moved', cursor });
    });

    // Document collaboration
    this.socket.on('doc:operation', (operation: DocumentOperation) => {
      this.emit('document_operation', { type: 'document_operation', operation });
    });

    // Whiteboard
    this.socket.on('whiteboard:stroke', (stroke: WhiteboardStroke) => {
      this.emit('whiteboard_stroke', { type: 'whiteboard_stroke', stroke });
    });

    // Typing indicators
    this.socket.on('typing:started', ({ userId, channelId }: { userId: string; channelId: string }) => {
      this.emit('typing_started', { type: 'typing_started', userId, channelId });
    });

    this.socket.on('typing:stopped', ({ userId, channelId }: { userId: string; channelId: string }) => {
      this.emit('typing_stopped', { type: 'typing_stopped', userId, channelId });
    });
  }

  /**
   * Update user presence
   */
  updatePresence(status: UserPresence['status'], currentRoom?: string): void {
    if (!this.socket) return;

    const presence: UserPresence = {
      userId: this.socket.id || 'unknown',
      status,
      lastSeen: new Date(),
      currentRoom,
    };

    this.socket.emit('presence:update', presence);
    this.presence.set(presence.userId, presence);
  }

  /**
   * Join a collaboration room
   */
  joinRoom(roomId: string, roomType: CollaborationRoom['type'] = 'chat'): void {
    if (!this.socket) return;

    this.socket.emit('room:join', { roomId, type: roomType });
    
    // Create local room state
    this.rooms.set(roomId, {
      id: roomId,
      name: roomId,
      type: roomType,
      participants: [],
      createdAt: new Date(),
    });

    console.log('[Collaboration] Joined room:', roomId);
  }

  /**
   * Leave a collaboration room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket) return;

    this.socket.emit('room:leave', { roomId });
    this.rooms.delete(roomId);
    
    // Clear cursors for this room
    this.cursors.clear();
    
    console.log('[Collaboration] Left room:', roomId);
  }

  /**
   * Send cursor position
   */
  sendCursorPosition(roomId: string, x: number, y: number): void {
    if (!this.socket) return;

    const cursor: CursorPosition = {
      userId: this.socket.id || 'unknown',
      x,
      y,
      color: this.getUserColor(this.socket.id || ''),
      name: 'You',
    };

    this.socket.emit('cursor:move', { roomId, cursor });
  }

  /**
   * Send document operation
   */
  sendDocumentOperation(roomId: string, operation: Omit<DocumentOperation, 'userId' | 'timestamp'>): void {
    if (!this.socket) return;

    const fullOperation: DocumentOperation = {
      ...operation,
      userId: this.socket.id || 'unknown',
      timestamp: Date.now(),
    };

    this.socket.emit('doc:operation', { roomId, operation: fullOperation });
  }

  /**
   * Send whiteboard stroke
   */
  sendWhiteboardStroke(roomId: string, stroke: Omit<WhiteboardStroke, 'id' | 'userId' | 'timestamp'>): void {
    if (!this.socket) return;

    const fullStroke: WhiteboardStroke = {
      ...stroke,
      id: uuidv4(),
      userId: this.socket.id || 'unknown',
      timestamp: Date.now(),
    };

    this.socket.emit('whiteboard:stroke', { roomId, stroke: fullStroke });
  }

  /**
   * Send typing indicator
   */
  sendTypingStarted(channelId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:started', { channelId });
  }

  /**
   * Send typing stopped
   */
  sendTypingStopped(channelId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:stopped', { channelId });
  }

  /**
   * Subscribe to collaboration events
   */
  subscribe(eventType: CollaborationEvent['type'], handler: (event: CollaborationEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit(eventType: CollaborationEvent['type'], event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('[Collaboration] Handler error:', error);
        }
      });
    }
  }

  /**
   * Get user presence
   */
  getPresence(userId: string): UserPresence | undefined {
    return this.presence.get(userId);
  }

  /**
   * Get all presence
   */
  getAllPresence(): UserPresence[] {
    return Array.from(this.presence.values());
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return this.getAllPresence().filter(p => p.status === 'online');
  }

  /**
   * Get room participants
   */
  getRoomParticipants(roomId: string): string[] {
    return this.rooms.get(roomId)?.participants || [];
  }

  /**
   * Get cursor positions
   */
  getCursors(): CursorPosition[] {
    return Array.from(this.cursors.values());
  }

  /**
   * Get user color for cursors
   */
  private getUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Set user as away
   */
  setAway(): void {
    this.updatePresence('away');
  }

  /**
   * Set user as busy
   */
  setBusy(): void {
    this.updatePresence('busy');
  }

  /**
   * Set user as online
   */
  setOnline(): void {
    this.updatePresence('online');
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.eventHandlers.clear();
    this.rooms.clear();
    this.presence.clear();
    this.cursors.clear();
  }
}

// Export singleton
export const collaborationService = new CollaborationService();
export default collaborationService;
