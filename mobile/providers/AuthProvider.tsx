import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/src/services/auth.service';
import { getAccessToken } from '@/src/services/api-client';
import {
  initializePushNotifications,
  removeNotificationListeners,
  unregisterPushToken,
  getDeepLinkPathFromNotification,
  clearAllNotifications,
  NotificationData,
} from '@/src/services/notifications.service';

// SecureStore is native-only, use AsyncStorage for web
let SecureStore: any;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

import type { UserRole as ApiUserRole, User as ApiUser } from '@/src/types/api';

export type UserRole = ApiUserRole;

/**
 * App-specific User interface mapped from API User.
 * This is a simplified shape optimized for frontend app state.
 * For API operations, use User from '@/src/types/api'.
 */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** @deprecated Use AppUser instead to avoid confusion with API User type */
export type User = AppUser;

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    initializeNotifications();

    return () => {
      // Cleanup notification listeners on unmount
      removeNotificationListeners();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  async function checkAuth() {
    try {
      // Check if we have a stored access token
      const token = await getAccessToken();
      if (token) {
        // Try to get the current user profile from the backend
        try {
          const profileData = await authService.getCurrentUser();
          const appUser = mapBackendUser(profileData);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(appUser));
          setUser(appUser);
        } catch (profileError) {
          // Token is invalid/expired — try refresh
          try {
            await authService.refreshToken();
            const profileData = await authService.getCurrentUser();
            const appUser = mapBackendUser(profileData);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(appUser));
            setUser(appUser);
          } catch {
            // Refresh also failed — clear stored data
            await AsyncStorage.removeItem(USER_KEY);
          }
        }
      }
    } catch (error) {
      console.log('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Initialize push notifications
  const initializeNotifications = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const token = await initializePushNotifications(
      // Handle received notification (foreground)
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // Could show in-app toast/snackbar here
      },
      // Handle notification tap
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        const path = getDeepLinkPathFromNotification(data);
        
        if (path) {
          // Navigate to the relevant screen
          setTimeout(() => {
            router.push(path as any);
          }, 500);
        }
      }
    );

    if (token) {
      setPushToken(token);
    }
  }, [router]);

  async function signIn(email: string, password: string, role?: string) {
    // Call the real backend auth endpoint
    const response = await authService.login(email, password, role as UserRole | undefined);

    // Map the backend user object to our app User shape
    const appUser = mapBackendUser(response.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(appUser));
    setUser(appUser);
  }

  async function signOut() {
    try {
      // Unregister push token
      if (pushToken) {
                await unregisterPushToken();
        setPushToken(null);
      }
      
      // Clear notifications
      await clearAllNotifications();
      
      await authService.logout();
    } catch {
      // Server logout may fail if token is already expired — that's OK
    }
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }

  if (isLoading) {
    return null; // Or show splash screen
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Map backend API User to AppUser for frontend state.
 * This transforms the complex backend shape (firstName/lastName/roles[])
 * into a simpler app-friendly shape (name/role).
 */
function mapBackendUser(backendUser: ApiUser & { name?: string; role?: string; roles?: any[] }): AppUser {
  const firstName = backendUser.firstName || '';
  const lastName = backendUser.lastName || '';
  const name = backendUser.name || `${firstName} ${lastName}`.trim() || backendUser.email;

  // Backend may return roles as an array of { role: { name } } objects
  let role: UserRole = 'student';
  if (backendUser.role) {
    role = backendUser.role as UserRole;
  } else if (backendUser.roles && backendUser.roles.length > 0) {
    role = ((backendUser.roles[0] as any)?.role?.name || (backendUser.roles[0] as any)?.name || 'student') as UserRole;
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    name,
    role,
    firstName,
    lastName,
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
