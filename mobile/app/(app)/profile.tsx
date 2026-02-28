import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Shield,
  BookOpen,
  Users,
  GraduationCap,
  Bell,
  Palette,
  Globe,
  Accessibility,
  Fingerprint,
  ChevronRight,
  LogOut,
  Edit3,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Header } from '@/src/components/Header';
import { Card } from '@/src/components/Card';
import { useBiometric } from '@/src/hooks/useBiometric';
import { useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

// Menu item types
type MenuItem = 
  | {
      icon: LucideIcon;
      label: string;
      value?: string;
      onPress: () => void;
      showArrow: boolean;
      toggle?: never;
      toggleValue?: never;
      onToggle?: never;
      disabled?: never;
    }
  | {
      icon: LucideIcon;
      label: string;
      toggle: boolean;
      toggleValue: boolean;
      onToggle: (enable: boolean) => Promise<void> | void;
      disabled: boolean;
      showArrow: boolean;
      value?: never;
      onPress?: never;
    };

type MenuSection = {
  section: string;
  items: MenuItem[];
};

const roleConfig = {
  admin: { label: 'Administrator', icon: Shield, color: '#ef4444' },
  teacher: { label: 'Teacher', icon: BookOpen, color: '#22c55e' },
  parent: { label: 'Parent', icon: Users, color: '#f59e0b' },
  student: { label: 'Student', icon: GraduationCap, color: '#3b82f6' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const { user, signOut } = useAuth();
  const {
    isAvailable,
    isEnrolled,
    isEnabled,
    getBiometricDisplayName,
    toggleBiometric,
  } = useBiometric();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const role = user?.role || 'student';
  const roleInfo = roleConfig[role];
  const RoleIcon = roleInfo.icon;

  const menuItems: MenuSection[] = [
    {
      section: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          value: 'On',
          onPress: () => router.push('/notifications'),
          showArrow: true,
        },
        {
          icon: Palette,
          label: 'Appearance',
          value: 'Light',
          onPress: () => router.push('/accessibility'),
          showArrow: true,
        },
        {
          icon: Globe,
          label: 'Language',
          value: 'English',
          onPress: () => router.push('/language'),
          showArrow: true,
        },
        {
          icon: Accessibility,
          label: 'Accessibility',
          onPress: () => router.push('/accessibility'),
          showArrow: true,
        },
      ],
    },
    {
      section: 'Security',
      items: [
        {
          icon: Fingerprint,
          label: getBiometricDisplayName(),
          toggle: isAvailable && isEnrolled,
          toggleValue: isEnabled,
          onToggle: async (enable: boolean) => { await toggleBiometric(enable); },
          disabled: !isAvailable || !isEnrolled,
          showArrow: false,
        },
      ],
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarText: {
      fontFamily: fonts.bold,
      fontSize: 36,
      color: colors.primary,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.xl,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    email: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.base,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: roleInfo.color + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
    },
    roleText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: roleInfo.color,
    },
    editButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
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
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    menuText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    menuValue: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error + '15',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    signOutText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Profile" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>

          <Text style={styles.name}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email?.split('@')[0]}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <RoleIcon size={16} color={roleInfo.color} />
            <Text style={styles.roleText}>{roleInfo.label}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <item.icon size={18} color={colors.primary} />
                    </View>
                    <Text
                      style={[
                        styles.menuText,
                        item.disabled && { color: colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.toggle && (
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#ffffff"
                      />
                    )}
                    {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                    {item.showArrow && (
                      <ChevronRight size={20} color={colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
