import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  MessageCircle,
  FileText,
  Award,
  Calendar,
  Megaphone,
  Clock,
  Moon,
  ChevronRight,
  Info,
  Smartphone,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Card } from '@/src/components/Card';
import { Header } from '@/src/components/Header';
import { useNotifications, notificationTemplates } from '@/src/hooks/useNotifications';

const notificationTypes = [
  { key: 'messages', label: 'Messages', icon: MessageCircle, description: 'New chat messages and replies' },
  { key: 'assignments', label: 'Assignments', icon: FileText, description: 'New assignments and due dates' },
  { key: 'grades', label: 'Grades', icon: Award, description: 'When grades are posted' },
  { key: 'attendance', label: 'Attendance', icon: Calendar, description: 'Attendance reminders and updates' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, description: 'School and class announcements' },
  { key: 'reminders', label: 'Reminders', icon: Clock, description: 'Scheduled reminders' },
] as const;

export default function NotificationsScreen() {
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const {
    settings,
    expoPushToken,
    permissionStatus,
    isLoading,
    toggleNotifications,
    updateTypeSetting,
    updateQuietHours,
    presentNotification,
  } = useNotifications();

  const handleTestNotification = async () => {
    const template = notificationTemplates.message('Test User', 'This is a test notification!');
    await presentNotification(template.title, template.body, { type: 'message' });
  };

  const showPermissionInfo = () => {
    Alert.alert(
      'Push Notifications',
      permissionStatus === 'granted'
        ? 'Push notifications are enabled. You will receive alerts even when the app is closed.'
        : 'Push notifications are disabled. Enable them in your device settings to receive alerts.'
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginLeft: spacing.sm,
    },
    masterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    masterToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    masterToggleText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    masterToggleSubtext: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    typeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    typeIconContainer: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    typeText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    typeDescription: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.info + '15',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.info,
      flex: 1,
      marginLeft: spacing.sm,
    },
    testButton: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    testButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.primaryForeground,
    },
    quietHoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    timeDisplay: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Notifications" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Notifications" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <TouchableOpacity style={styles.infoCard} onPress={showPermissionInfo}>
          <Smartphone size={20} color={colors.info} />
          <Text style={styles.infoText}>
            {permissionStatus === 'granted'
              ? `Push notifications enabled${expoPushToken ? '' : ' (token pending)'}`
              : 'Push notifications disabled'}
          </Text>
          <Info size={16} color={colors.info} />
        </TouchableOpacity>

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.masterToggle}>
            <View style={styles.masterToggleLeft}>
              <View style={styles.iconContainer}>
                <Bell size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.masterToggleText}>Push Notifications</Text>
                <Text style={styles.masterToggleSubtext}>
                  {settings.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <Card>
            {notificationTypes.map((type, index) => {
              const Icon = type.icon;
              const isEnabled = settings.types[type.key];
              
              return (
                <View
                  key={type.key}
                  style={[
                    styles.typeItem,
                    index === notificationTypes.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.typeLeft}>
                    <View style={styles.typeIconContainer}>
                      <Icon size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.typeText,
                          !settings.enabled && { color: colors.textMuted },
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={isEnabled && settings.enabled}
                    onValueChange={(value) => updateTypeSetting(type.key, value)}
                    disabled={!settings.enabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              );
            })}

            {/* Quiet Hours */}
            <View style={styles.quietHoursRow}>
              <View style={styles.typeLeft}>
                <View style={styles.typeIconContainer}>
                  <Moon size={18} color={colors.primary} />
                </View>
                <View>
                  <Text
                    style={[
                      styles.typeText,
                      !settings.enabled && { color: colors.textMuted },
                    ]}
                  >
                    Quiet Hours
                  </Text>
                  <Text style={styles.typeDescription}>
                    Pause notifications {settings.quietHours.start} - {settings.quietHours.end}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.quietHours.enabled && settings.enabled}
                onValueChange={(value) => updateQuietHours(value)}
                disabled={!settings.enabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </Card>
        </View>

        {/* Test Button */}
        <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
