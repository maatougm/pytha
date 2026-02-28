/**
 * SocketProvider
 *
 * Context provider that wraps the app with WebSocket connection.
 * Provides socket instance to children, handles global socket events,
 * shows connection status banner when disconnected, and manages
 * channel subscriptions.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { WifiOff, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  socketService,
  ConnectionState,
  Message,
  Reaction,
} from '@/src/services/socket.service';
import { useQueryClient } from '@tanstack/react-query';

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

interface SocketContextType {
  socket: ReturnType<typeof socketService.getSocket>;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  reconnect: () => Promise<void>;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
  subscribedChannels: Set<string>;
}

// ============================================================
// CONTEXT
// ============================================================

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}

// ============================================================
// CONNECTION BANNER COMPONENT
// ============================================================

interface ConnectionBannerProps {
  connectionState: ConnectionState;
  onReconnect: () => void;
}

function ConnectionBanner({ connectionState, onReconnect }: ConnectionBannerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const shouldShow = connectionState === 'disconnected' || connectionState === 'error';
    const useNativeDriver = Platform.OS !== 'web';
    
    if (shouldShow && !visible) {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver,
        friction: 8,
      }).start();
    } else if (!shouldShow && visible) {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 300,
        useNativeDriver,
      }).start(() => setVisible(false));
    }
  }, [connectionState, visible, translateY]);

  if (!visible) return null;

  const isError = connectionState === 'error';
  const backgroundColor = isError ? colors.error : colors.warning || '#f59e0b';
  const Icon = isError ? AlertCircle : WifiOff;
  const message = isError ? 'Connection error' : 'Connecting...';

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.bannerContent}>
        <Icon size={18} color="#fff" />
        <Text style={styles.bannerText}>{message}</Text>
        {isError && (
          <TouchableOpacity onPress={onReconnect} style={styles.reconnectButton}>
            <Text style={styles.reconnectText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  const socketRef = useRef(socketService.getSocket());

  // Initialize socket connection
  const initializeConnection = useCallback(async () => {
    if (!user) {
      socketService.disconnectSocket();
      setConnectionState('disconnected');
      return;
    }

    try {
      setConnectionState('connecting');
      await socketService.initializeSocket();
      setConnectionState('connected');
      socketRef.current = socketService.getSocket();
    } catch (error) {
      console.error('[SocketProvider] Connection failed:', error);
      setConnectionState('error');
    }
  }, [user]);

  // Reconnect handler
  const reconnect = useCallback(async () => {
    setConnectionState('connecting');
    try {
      await socketService.reconnectWithToken();
      setConnectionState('connected');
      socketRef.current = socketService.getSocket();
      
      // Re-subscribe to all channels
      subscribedChannels.forEach((channelId) => {
        socketService.emitJoinChannel(channelId);
      });
    } catch (error) {
      console.error('[SocketProvider] Reconnect failed:', error);
      setConnectionState('error');
    }
  }, [subscribedChannels]);

  // Subscribe to a channel
  const subscribeToChannel = useCallback((channelId: string) => {
    if (!channelId) return;
    
    setSubscribedChannels((prev) => {
      if (prev.has(channelId)) return prev;
      
      // Join channel room
      try {
        socketService.emitJoinChannel(channelId);
      } catch (error) {
        console.warn('[SocketProvider] Failed to join channel:', error);
      }
      
      return new Set([...prev, channelId]);
    });
  }, []);

  // Unsubscribe from a channel
  const unsubscribeFromChannel = useCallback((channelId: string) => {
    setSubscribedChannels((prev) => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
  }, []);

  // Poll connection state
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const state = socketService.getConnectionState();
      setConnectionState(state);
      socketRef.current = socketService.getSocket();
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Initialize on mount / user change
  useEffect(() => {
    initializeConnection();

    return () => {
      // Cleanup on unmount - only if user is null (logout)
      if (!user) {
        socketService.disconnectSocket();
      }
    };
  }, [user, initializeConnection]);

  // Global event handlers
  useEffect(() => {
    if (!user || connectionState !== 'connected') return;

    // Handle new messages - invalidate queries
    const unsubscribeNewMessage = socketService.onEvent<Message>('message:new', (message) => {
      // Invalidate channel messages
      queryClient.invalidateQueries({ queryKey: ['messages', message.channelId] });
      
      // Invalidate channels list to update last message preview
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      
      // Update unread count for the channel
      const currentChannel = queryClient.getQueryData<{ id: string }>(['current-channel']);
      if (currentChannel?.id !== message.channelId) {
        queryClient.setQueryData(['unread-count', message.channelId], (old: number = 0) => old + 1);
      }
    });

    // Handle message updates
    const unsubscribeUpdated = socketService.onEvent<Message>('message:updated', (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.channelId] });
    });

    // Handle message deletions
    const unsubscribeDeleted = socketService.onEvent<{ messageId: string }>(
      'message:deleted',
      ({ messageId }) => {
        // Find and update the message in cache
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    );

    // Handle read receipts
    const unsubscribeReadReceipt = socketService.onEvent<{
      messageId: string;
      userId: string;
      readAt: string;
    }>('message:read_receipt', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    // Handle reactions
    const unsubscribeReactionAdded = socketService.onEvent<{
      messageId: string;
      reaction: Reaction;
    }>('message:reaction_added', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    const unsubscribeReactionRemoved = socketService.onEvent<{
      messageId: string;
      reactionId: string;
    }>('message:reaction_removed', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    // Handle typing indicators
    const unsubscribeTyping = socketService.onEvent<TypingUpdate>('typing:update', (data) => {
      // Store typing state in query cache for components to access
      queryClient.setQueryData(['typing', data.channelId], data.users);
    });

    // Handle user presence
    const unsubscribeOnline = socketService.onEvent<{ userId: string }>(
      'user:online',
      ({ userId }) => {
        queryClient.setQueryData(['user-presence', userId], 'online');
      }
    );

    const unsubscribeOffline = socketService.onEvent<{ userId: string }>(
      'user:offline',
      ({ userId }) => {
        queryClient.setQueryData(['user-presence', userId], 'offline');
      }
    );

    // Handle server errors
    const unsubscribeError = socketService.onEvent<{ message: string; code?: string }>(
      'error',
      (error) => {
        console.error('[SocketProvider] Server error:', error);
      }
    );

    return () => {
      unsubscribeNewMessage();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeReadReceipt();
      unsubscribeReactionAdded();
      unsubscribeReactionRemoved();
      unsubscribeTyping();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeError();
    };
  }, [user, connectionState, queryClient]);

  const value: SocketContextType = {
    socket: socketRef.current,
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    reconnect,
    subscribeToChannel,
    unsubscribeFromChannel,
    subscribedChannels,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      <ConnectionBanner connectionState={connectionState} onReconnect={reconnect} />
    </SocketContext.Provider>
  );
}

// ============================================================
// STYLES
// ============================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width,
    zIndex: 9999,
    elevation: 9999,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    gap: 8,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reconnectButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  reconnectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SocketProvider;
