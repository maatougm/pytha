import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Users,
  BookOpen,
  Clock,
  Trash2,
  GraduationCap,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useChildren } from '@/src/hooks/useProfile';
import { useRouter } from 'expo-router';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const { data: children, isLoading: childrenLoading } = useChildren();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return '#00897b';
      case 'parent':
        return '#ff6b6b';
      case 'admin':
        return '#6b4ee6';
      default:
        return '#2196f3';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap size={16} color="#fff" />;
      case 'parent':
        return <Users size={16} color="#fff" />;
      case 'admin':
        return <Shield size={16} color="#fff" />;
      default:
        return <BookOpen size={16} color="#fff" />;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
      {title.toUpperCase()}
    </Text>
  );

  const renderSettingsRow = (
    icon: React.ReactNode,
    label: string,
    value?: string,
    onPress?: () => void,
    showSwitch?: boolean,
    switchValue?: boolean,
    onSwitchChange?: (value: boolean) => void
  ) => (
    <TouchableOpacity
      style={[styles.settingsRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}10` }]}>
        {icon}
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsLabel, { color: colors.text }]}>{label}</Text>
        {value && <Text style={[styles.settingsValue, { color: colors.textMuted }]}>{value}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: `${colors.primary}50` }}
          thumbColor={switchValue ? colors.primary : '#f4f3f4'}
        />
      ) : (
        <ChevronRight size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const renderChildCard = (child: any) => (
    <TouchableOpacity
      key={child.id}
      style={[styles.childCard, { backgroundColor: colors.backgroundDark, borderColor: colors.border }]}
    >
      <View style={[styles.childAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.childAvatarText}>
          {child.name.split(' ').map((n: string) => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={[styles.childName, { color: colors.text }]}>{child.name}</Text>
        <Text style={[styles.childGrade, { color: colors.textSecondary }]}>
          {child.grade} • {child.class}
        </Text>
        <View style={styles.childStats}>
          <View style={styles.childStat}>
            <Text style={[styles.childStatValue, { color: colors.success }]}>{child.attendance}%</Text>
            <Text style={[styles.childStatLabel, { color: colors.textMuted }]}>Attendance</Text>
          </View>
          <View style={styles.childStat}>
            <Text style={[styles.childStatValue, { color: colors.warning }]}>{child.upcomingAssignments}</Text>
            <Text style={[styles.childStatLabel, { color: colors.textMuted }]}>Assignments</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: colors.surface,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#fff',
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
      gap: 6,
    },
    roleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    emailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 12,
      marginLeft: 4,
    },
    sectionContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    settingsIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsContent: {
      flex: 1,
      marginLeft: 12,
    },
    settingsLabel: {
      fontSize: 16,
    },
    settingsValue: {
      fontSize: 13,
      marginTop: 2,
    },
    childrenSection: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    childrenHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    childrenTitle: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    addButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: `${colors.primary}10`,
    },
    addButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    childCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    childAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    childAvatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    childInfo: {
      flex: 1,
      marginLeft: 14,
    },
    childName: {
      fontSize: 16,
      fontWeight: '600',
    },
    childGrade: {
      fontSize: 13,
      marginTop: 2,
    },
    childStats: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 16,
    },
    childStat: {
      alignItems: 'center',
    },
    childStatValue: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    childStatLabel: {
      fontSize: 11,
    },
    dangerSection: {
      marginTop: 32,
      paddingHorizontal: 20,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.error,
      gap: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
    deleteButton: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    deleteText: {
      fontSize: 14,
      color: colors.error,
    },
    versionContainer: {
      alignItems: 'center',
      marginTop: 24,
      paddingBottom: 20,
    },
    versionText: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.split(' ').map((n) => n[0]).join('') || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Camera size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || 'student') }]}>
            {getRoleIcon(user?.role || 'student')}
            <Text style={styles.roleText}>{user?.role || 'Student'}</Text>
          </View>
          <View style={styles.emailContainer}>
            <Mail size={14} color={colors.textMuted} />
            <Text style={styles.email}>{user?.email || 'user@school.com'}</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          {renderSectionHeader('Preferences')}
          <View style={styles.sectionContent}>
            {renderSettingsRow(
              <Bell size={20} color={colors.primary} />,
              'Notifications',
              undefined,
              undefined,
              true,
              notifications,
              setNotifications
            )}
            {renderSettingsRow(
              <Moon size={20} color={colors.primary} />,
              'Dark Mode',
              undefined,
              undefined,
              true,
              darkMode,
              setDarkMode
            )}
            {renderSettingsRow(
              <Globe size={20} color={colors.primary} />,
              'Language',
              language
            )}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          {renderSectionHeader('Account')}
          <View style={styles.sectionContent}>
            {renderSettingsRow(
              <Settings size={20} color={colors.primary} />,
              'Settings',
              undefined,
              () => router.push('/(app)/settings')
            )}
            {renderSettingsRow(
              <Shield size={20} color={colors.primary} />,
              'Privacy Settings'
            )}
            {renderSettingsRow(
              <HelpCircle size={20} color={colors.primary} />,
              'Help & Support'
            )}
          </View>
        </View>

        {/* Children Section (for Parents) */}
        {user?.role === 'parent' && children && children.length > 0 && (
          <View style={styles.childrenSection}>
            <View style={styles.childrenHeader}>
              <Text style={styles.childrenTitle}>MY CHILDREN</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {children.map(renderChildCard)}
          </View>
        )}

        {/* Teaching Section (for Teachers) */}
        {user?.role === 'teacher' && (
          <View style={styles.section}>
            {renderSectionHeader('Teaching')}
            <View style={styles.sectionContent}>
              {renderSettingsRow(
                <BookOpen size={20} color={colors.primary} />,
                'My Classes',
                '5 Classes'
              )}
              {renderSettingsRow(
                <Clock size={20} color={colors.primary} />,
                'Office Hours',
                'Mon-Fri 2-4pm'
              )}
              {renderSettingsRow(
                <GraduationCap size={20} color={colors.primary} />,
                'Grading Settings'
              )}
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>School Hub v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
