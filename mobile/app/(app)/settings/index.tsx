/**
 * Settings Screen
 * 
 * Allows users to manage app preferences including:
 * - Biometric authentication (Face ID / Touch ID)
 * - Push notifications
 * - Display preferences
 * - Account security
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/src/services/api-client';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Fingerprint,
  Bell,
  Moon,
  Shield,
  Lock,
  Smartphone,
  Trash2,
  ChevronLeft,
  Mail,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Card } from '@/src/components/Card';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  getBiometricLabel,
  getBiometricType,
} from '@/src/services/biometric.service';
import {
  requestNotificationPermissions,
  clearAllNotifications,
  getPushToken,
  registerPushTokenWithBackend,
} from '@/src/services/notifications.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

interface SettingsState {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricLabel: string;
  biometricType: LocalAuthentication.SecurityLevel | null;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const [settings, setSettings] = useState<SettingsState>({
    biometricAvailable: false,
    biometricEnabled: false,
    biometricLabel: 'Biometric',
    biometricType: null,
    notificationsEnabled: false,
    darkModeEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsRefreshing(true);
    try {
      // Check biometric status
      const biometricAvailable = await isBiometricAvailable();
      const biometricEnabled = biometricAvailable ? await isBiometricEnabled() : false;
      const biometricType = biometricAvailable ? await getBiometricType() : null;
      const biometricLabel = getBiometricLabel(biometricType);

      // Load notification preference from storage
      const notificationsPref = await AsyncStorage.getItem('notifications_enabled');
      const notificationsEnabled = notificationsPref === 'true';

      // Load dark mode preference from storage
      const darkModePref = await AsyncStorage.getItem('dark_mode_enabled');
      const darkModeEnabled = darkModePref === 'true';

      setSettings({
        biometricAvailable,
        biometricEnabled,
        biometricLabel,
        biometricType,
        notificationsEnabled,
        darkModeEnabled,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle biometric authentication
  const toggleBiometric = async () => {
    if (!settings.biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    setIsLoading(true);
    try {
      if (settings.biometricEnabled) {
        // Disable biometric - confirm first
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Disable Biometric Login?',
            `Are you sure you want to disable ${settings.biometricLabel}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Disable', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

        if (confirmed) {
          const success = await disableBiometric();
          if (success) {
            setSettings(prev => ({ ...prev, biometricEnabled: false }));
            Alert.alert('Success', `${settings.biometricLabel} has been disabled.`);
          }
        }
      } else {
        // Enable biometric - authenticate first
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Authenticate to enable ${settings.biometricLabel}`,
          fallbackLabel: 'Use passcode',
        });

        if (result.success) {
          // Store current credentials (user will need to re-enter password if they change it)
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            Alert.alert(
              'Enable on Next Login',
              `${settings.biometricLabel} will be offered after your next successful login.`
            );
          }
        }
      }
    } catch (error) {
      console.error('Toggle biometric error:', error);
      Alert.alert('Error', 'Failed to update biometric settings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Push notifications are not available on web.');
      return;
    }

    setIsLoading(true);
    try {
      const newValue = !settings.notificationsEnabled;

      if (newValue) {
        // Request permissions
        const granted = await requestNotificationPermissions();
        if (granted) {
          // Get and register push token
          const token = await getPushToken();
          if (token) {
            await registerPushTokenWithBackend(token);
          }
          
          await AsyncStorage.setItem('notifications_enabled', 'true');
          setSettings(prev => ({ ...prev, notificationsEnabled: true }));
          Alert.alert('Success', 'Push notifications enabled.');
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings.'
          );
        }
      } else {
        await AsyncStorage.setItem('notifications_enabled', 'false');
        setSettings(prev => ({ ...prev, notificationsEnabled: false }));
        Alert.alert('Notifications Disabled', 'You will no longer receive push notifications.');
      }
    } catch (error) {
      console.error('Toggle notifications error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = async () => {
    const newValue = !settings.darkModeEnabled;
    await AsyncStorage.setItem('dark_mode_enabled', newValue ? 'true' : 'false');
    setSettings(prev => ({ ...prev, darkModeEnabled: newValue }));
    Alert.alert(
      'Theme Updated',
      'Dark mode preference saved. Full dark mode support coming soon!'
    );
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Clear All Notifications?',
        'This will remove all notifications from your notification center.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Clear', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (confirmed) {
      await clearAllNotifications();
      Alert.alert('Success', 'All notifications cleared.');
    }
  };

  // Navigate to notifications center
  const handleNotificationCenter = () => {
    router.push('/(app)/notifications');
  };

  // Change password
  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This will redirect you to the password reset flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.push('/(auth)/forgot-password') },
      ]
    );
  };

  // Sign out from all devices
  const handleSignOutAllDevices = () => {
    Alert.alert(
      'Sign Out All Devices?',
      'This will sign you out from all devices where you are currently logged in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Call backend to invalidate all refresh tokens
              // Dynamic import removed
              await apiClient.post('/auth/logout-all', {});
              
              // Sign out locally
              await signOut();
            } catch (error) {
              console.error('Sign out all error:', error);
              Alert.alert('Error', 'Failed to sign out from all devices.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
          
          {settings.biometricAvailable && (
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Fingerprint size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {settings.biometricLabel}
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                      {settings.biometricEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                  disabled={isLoading}
                />
              </View>
            </Card>
          )}

          <Card style={styles.settingCard} onPress={handleChangePassword}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
                  <Lock size={20} color={colors.accent} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </Card>

          <Card style={styles.settingCard} onPress={handleSignOutAllDevices}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
                  <Shield size={20} color={colors.error} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Sign Out All Devices
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    Secure your account
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
          
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
                  <Bell size={20} color={colors.success} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Push Notifications</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#ffffff"
                disabled={isLoading || Platform.OS === 'web'}
              />
            </View>
          </Card>

          <Card style={styles.settingCard} onPress={handleNotificationCenter}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.info + '15' }]}>
                  <Mail size={20} color={colors.info} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Notification Center
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    View all your notifications
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </Card>

          {settings.notificationsEnabled && (
            <Card style={styles.settingCard} onPress={handleClearNotifications}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
                    <Trash2 size={20} color={colors.warning} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Clear All Notifications
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                      Remove all notifications
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </Card>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.info + '15' }]}>
                  <Moon size={20} color={colors.info} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    {settings.darkModeEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.darkModeEnabled}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.info }}
                thumbColor="#ffffff"
                disabled={isLoading}
              />
            </View>
          </Card>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Smartphone size={20} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>App Version</Text>
                  <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                    1.0.0 (Build 100)
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingCard: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});
