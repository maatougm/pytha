import { useState, useEffect, useCallback, useRef } from 'react';
import { collaborationService, CollaborationRoom, UserPresence, CursorPosition } from '@/src/services/collaborationService';
import { useSocket } from './useSocket';

export interface CollaborationState {
  isConnected: boolean;
  currentRoom: string | null;
  participants: string[];
  onlineUsers: UserPresence[];
  cursors: CursorPosition[];
  typingUsers: Map<string, string>; // userId -> channelId
}

export interface CollaborationActions {
  joinRoom: (roomId: string, type?: CollaborationRoom['type']) => void;
  leaveRoom: () => void;
  updatePresence: (status: UserPresence['status']) => void;
  sendCursorPosition: (x: number, y: number) => void;
  sendTypingStarted: (channelId: string) => void;
  sendTypingStopped: (channelId: string) => void;
  subscribeToPresence: (handler: (users: UserPresence[]) => void) => () => void;
  subscribeToCursors: (handler: (cursors: CursorPosition[]) => void) => () => void;
  subscribeToTyping: (handler: (userId: string, isTyping: boolean, channelId: string) => void) => () => void;
}

/**
 * Hook for real-time collaboration features
 */
export function useCollaboration(roomId?: string): CollaborationState & CollaborationActions {
  const socket = useSocket();
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    currentRoom: roomId || null,
    participants: [],
    onlineUsers: [],
    cursors: [],
    typingUsers: new Map(),
  });

  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize collaboration service when socket connects
  useEffect(() => {
    if (socket?.isConnected) {
      collaborationService.initialize(socket.socket!);
      setState(prev => ({ ...prev, isConnected: true }));
      collaborationService.updatePresence('online');
    }

    return () => {
      if (state.currentRoom) {
        collaborationService.leaveRoom(state.currentRoom);
      }
      collaborationService.cleanup();
    };
  }, [socket?.isConnected]);

  // Auto-join room if provided
  useEffect(() => {
    if (roomId && socket?.isConnected) {
      joinRoom(roomId);
    }
  }, [roomId, socket?.isConnected]);

  /**
   * Join a collaboration room
   */
  const joinRoom = useCallback((roomId: string, type?: CollaborationRoom['type']) => {
    collaborationService.joinRoom(roomId, type);
    
    setState(prev => ({
      ...prev,
      currentRoom: roomId,
      participants: collaborationService.getRoomParticipants(roomId),
    }));

    // Subscribe to room events
    const unsubscribeJoined = collaborationService.subscribe('user_joined', (event) => {
      if (event.type === 'user_joined' && event.roomId === roomId) {
        setState(prev => ({
          ...prev,
          participants: [...prev.participants, event.userId],
        }));
      }
    });

    const unsubscribeLeft = collaborationService.subscribe('user_left', (event) => {
      if (event.type === 'user_left' && event.roomId === roomId) {
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(id => id !== event.userId),
        }));
      }
    });

    return () => {
      unsubscribeJoined();
      unsubscribeLeft();
    };
  }, []);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    if (state.currentRoom) {
      collaborationService.leaveRoom(state.currentRoom);
      setState(prev => ({
        ...prev,
        currentRoom: null,
        participants: [],
        cursors: [],
      }));
    }
  }, [state.currentRoom]);

  /**
   * Update user presence
   */
  const updatePresence = useCallback((status: UserPresence['status']) => {
    collaborationService.updatePresence(status, state.currentRoom || undefined);
  }, [state.currentRoom]);

  /**
   * Send cursor position
   */
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (state.currentRoom) {
      collaborationService.sendCursorPosition(state.currentRoom, x, y);
    }
  }, [state.currentRoom]);

  /**
   * Send typing started
   */
  const sendTypingStarted = useCallback((channelId: string) => {
    // Clear existing timeout
    const existingTimeout = typingTimeouts.current.get(channelId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    collaborationService.sendTypingStarted(channelId);

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      sendTypingStopped(channelId);
    }, 3000);

    typingTimeouts.current.set(channelId, timeout);
  }, []);

  /**
   * Send typing stopped
   */
  const sendTypingStopped = useCallback((channelId: string) => {
    const timeout = typingTimeouts.current.get(channelId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeouts.current.delete(channelId);
    }

    collaborationService.sendTypingStopped(channelId);
  }, []);

  /**
   * Subscribe to presence updates
   */
  const subscribeToPresence = useCallback((handler: (users: UserPresence[]) => void) => {
    const updatePresence = () => {
      handler(collaborationService.getOnlineUsers());
    };

    const unsubscribe = collaborationService.subscribe('presence_updated', updatePresence);
    updatePresence(); // Initial call

    return unsubscribe;
  }, []);

  /**
   * Subscribe to cursor updates
   */
  const subscribeToCursors = useCallback((handler: (cursors: CursorPosition[]) => void) => {
    const updateCursors = () => {
      handler(collaborationService.getCursors());
    };

    const unsubscribe = collaborationService.subscribe('cursor_moved', updateCursors);
    updateCursors(); // Initial call

    return unsubscribe;
  }, []);

  /**
   * Subscribe to typing indicators
   */
  const subscribeToTyping = useCallback(
    (handler: (userId: string, isTyping: boolean, channelId: string) => void) => {
      const unsubscribeStarted = collaborationService.subscribe('typing_started', (event) => {
        if (event.type === 'typing_started') {
          handler(event.userId, true, event.channelId);
        }
      });

      const unsubscribeStopped = collaborationService.subscribe('typing_stopped', (event) => {
        if (event.type === 'typing_stopped') {
          handler(event.userId, false, event.channelId);
        }
      });

      return () => {
        unsubscribeStarted();
        unsubscribeStopped();
      };
    },
    []
  );

  return {
    ...state,
    joinRoom,
    leaveRoom,
    updatePresence,
    sendCursorPosition,
    sendTypingStarted,
    sendTypingStopped,
    subscribeToPresence,
    subscribeToCursors,
    subscribeToTyping,
  };
}

/**
 * Hook for typing indicators in a specific channel
 */
export function useTypingIndicator(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const collaboration = useCollaboration();

  useEffect(() => {
    const unsubscribe = collaboration.subscribeToTyping((userId, isTyping, cid) => {
      if (cid !== channelId) return;

      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    });

    return unsubscribe;
  }, [channelId, collaboration]);

  const notifyTyping = useCallback(() => {
    collaboration.sendTypingStarted(channelId);
  }, [channelId, collaboration]);

  return { typingUsers, notifyTyping };
}

/**
 * Hook for user presence
 */
export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const collaboration = useCollaboration();

  useEffect(() => {
    const unsubscribe = collaboration.subscribeToPresence(setOnlineUsers);
    return unsubscribe;
  }, [collaboration]);

  return {
    onlineUsers,
    isUserOnline: (userId: string) => onlineUsers.some(u => u.userId === userId && u.status === 'online'),
    getUserStatus: (userId: string) => onlineUsers.find(u => u.userId === userId)?.status || 'offline',
  };
}

export default useCollaboration;
