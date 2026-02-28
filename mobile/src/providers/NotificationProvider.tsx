/**
 * Notification Provider
 * 
 * Global notification handler that manages:
 * - Push notification initialization
 * - In-app notification banners
 * - Notification navigation handling
 * - Notification state management
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  initializePushNotifications,
  removeNotificationListeners,
  getDeepLinkPathFromNotification,
  clearAllNotifications,
  NotificationCategory,
  NotificationData,
  registerPushTokenWithBackend,
  unregisterPushToken,
  getPushToken,
  requestNotificationPermissions,
  configureNotificationHandler,
} from '@/src/services/notifications.service';
import { useAuth } from '@/providers/AuthProvider';

// ============================================================
// TYPES
// ============================================================

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationCategory;
  data: NotificationData;
  timestamp: number;
  imageUrl?: string;
}

interface NotificationContextType {
  // Push token
  pushToken: string | null;
  isPushEnabled: boolean;
  
  // In-app notifications
  inAppNotifications: InAppNotification[];
  showInAppNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp'>) => void;
  dismissInAppNotification: (id: string) => void;
  clearInAppNotifications: () => void;
  
  // Permission
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  
  // Actions
  registerToken: () => Promise<string | null>;
  unregisterToken: () => Promise<void>;
  navigateToNotification: (data: NotificationData) => void;
}

// ============================================================
// CONTEXT
// ============================================================

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

interface NotificationProviderProps {
  children: ReactNode;
  /**
   * Enable in-app notification banners for foreground notifications
   * @default true
   */
  enableInAppBanners?: boolean;
  /**
   * Duration in ms to show in-app notifications
   * @default 5000
   */
  bannerDuration?: number;
  /**
   * Callback when notification is tapped
   */
  onNotificationTap?: (data: NotificationData) => void;
}

export function NotificationProvider({
  children,
  enableInAppBanners = true,
  bannerDuration = 5000,
  onNotificationTap,
}: NotificationProviderProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ============================================================
  // INITIALIZATION
  // ============================================================

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Configure notification handler for foreground notifications
    configureNotificationHandler();

    // Initialize push notifications
    const setupNotifications = async () => {
      try {
        // Check permission status
        const permissionGranted = await requestNotificationPermissions();
        setHasPermission(permissionGranted);

        if (permissionGranted) {
          // Get push token
          const token = await getPushToken();
          if (token) {
            setPushToken(token);
            
            // Register with backend if user is logged in
            if (user) {
              await registerPushTokenWithBackend(token);
            }
          }
        }

        // Set up listeners
        initializePushNotifications(
          handleNotificationReceived,
          handleNotificationResponse
        );

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    setupNotifications();

    // Cleanup on unmount
    return () => {
      removeNotificationListeners();
      // Clear all pending timeouts
      notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      notificationTimeouts.current.clear();
    };
  }, [user]);

  // Re-register token when user changes
  useEffect(() => {
    if (pushToken && user && isInitialized) {
      registerPushTokenWithBackend(pushToken).catch(console.error);
    }
  }, [user, pushToken, isInitialized]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - clear badge when user opens app
        clearAllNotifications().catch(console.error);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Handle received notification (foreground)
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    const content = notification.request.content;
    const data = (content.data || {}) as NotificationData;

    // Show in-app banner if enabled
    if (enableInAppBanners) {
      showInAppNotification({
        title: content.title || 'New Notification',
        body: content.body || '',
        type: data.type || NotificationCategory.ANNOUNCEMENT,
        data,
        imageUrl: content.attachments?.[0]?.url,
      });
    }
  }, [enableInAppBanners]);

  /**
   * Handle notification response (user tapped notification)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;
    
    // Call external callback if provided
    onNotificationTap?.(data);
    
    // Navigate to relevant screen
    navigateToNotification(data);
  }, [onNotificationTap]);

  /**
   * Navigate to the appropriate screen based on notification data
   */
  const navigateToNotification = useCallback((data: NotificationData) => {
    const path = getDeepLinkPathFromNotification(data);
    
    if (path) {
      // Small delay to ensure navigation works properly
      setTimeout(() => {
        try {
          router.push(path as any);
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback to main screen
          router.push('/(tabs)' as any);
        }
      }, 300);
    }
  }, [router]);

  // ============================================================
  // ACTIONS
  // ============================================================

  /**
   * Show an in-app notification banner
   */
  const showInAppNotification = useCallback((
    notification: Omit<InAppNotification, 'id' | 'timestamp'>
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: InAppNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    setInAppNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      dismissInAppNotification(id);
    }, bannerDuration);

    notificationTimeouts.current.set(id, timeout);
  }, [bannerDuration]);

  /**
   * Dismiss a specific in-app notification
   */
  const dismissInAppNotification = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = notificationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeouts.current.delete(id);
    }

    setInAppNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Clear all in-app notifications
   */
  const clearInAppNotifications = useCallback(() => {
    // Clear all timeouts
    notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    notificationTimeouts.current.clear();

    setInAppNotifications([]);
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  /**
   * Register push token manually
   */
  const registerToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getPushToken();
      if (token) {
        setPushToken(token);
        await registerPushTokenWithBackend(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Failed to register token:', error);
      return null;
    }
  }, []);

  /**
   * Unregister push token (e.g., on logout)
   */
  const unregisterToken = useCallback(async (): Promise<void> => {
    try {
      await unregisterPushToken();
      setPushToken(null);
    } catch (error) {
      console.error('Failed to unregister token:', error);
    }
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: NotificationContextType = {
    pushToken,
    isPushEnabled: !!pushToken && !!hasPermission,
    inAppNotifications,
    showInAppNotification,
    dismissInAppNotification,
    clearInAppNotifications,
    hasPermission,
    requestPermission,
    registerToken,
    unregisterToken,
    navigateToNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// ============================================================
// IN-APP NOTIFICATION BANNER COMPONENT
// ============================================================

import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Image,
} from 'react-native';
import { X, MessageCircle, FileText, Award, Bell, Calendar } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface InAppNotificationBannerProps {
  notification: InAppNotification;
  onDismiss: () => void;
  onPress: () => void;
}

function getNotificationIcon(type: NotificationCategory) {
  switch (type) {
    case NotificationCategory.MESSAGE:
      return <MessageCircle size={24} color="#3B82F6" />;
    case NotificationCategory.ASSIGNMENT:
      return <FileText size={24} color="#F59E0B" />;
    case NotificationCategory.GRADE:
      return <Award size={24} color="#10B981" />;
    case NotificationCategory.ATTENDANCE:
      return <Calendar size={24} color="#8B5CF6" />;
    default:
      return <Bell size={24} color="#6B7280" />;
  }
}

function getNotificationColor(type: NotificationCategory): string {
  switch (type) {
    case NotificationCategory.MESSAGE:
      return '#3B82F6';
    case NotificationCategory.ASSIGNMENT:
      return '#F59E0B';
    case NotificationCategory.GRADE:
      return '#10B981';
    case NotificationCategory.ATTENDANCE:
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
}

export function InAppNotificationBanner({
  notification,
  onDismiss,
  onPress,
}: InAppNotificationBannerProps) {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: getNotificationColor(notification.type),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          {getNotificationIcon(notification.type)}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        {notification.imageUrl && (
          <Image
            source={{ uri: notification.imageUrl }}
            style={styles.image}
          />
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
// IN-APP NOTIFICATION CONTAINER
// ============================================================

interface InAppNotificationContainerProps {
  children: ReactNode;
}

export function InAppNotificationContainer({ children }: InAppNotificationContainerProps) {
  const { inAppNotifications, dismissInAppNotification, navigateToNotification } = useNotification();

  return (
    <View style={styles.container}>
      {children}
      
      {/* In-app notification banners */}
      <View style={styles.bannerContainer}>
        {inAppNotifications.map((notification, index) => (
          <View
            key={notification.id}
            style={[styles.bannerWrapper, { top: index * 90 }]}
          >
            <InAppNotificationBanner
              notification={notification}
              onDismiss={() => dismissInAppNotification(notification.id)}
              onPress={() => {
                dismissInAppNotification(notification.id);
                navigateToNotification(notification.data);
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  bannerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
