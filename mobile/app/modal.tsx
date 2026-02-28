import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  X, 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  ChevronRight,
  LogOut,
  Trash2,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Card } from '@/src/components';

/**
 * Global Modal Example
 * 
 * Demonstrates modal presentation pattern for settings,
 * notifications, confirmations, and other overlay content.
 * 
 * This modal can be presented from any screen using:
 * router.push('/modal')
 * 
 * For iOS 13+ style modals, configure in _layout.tsx with:
 * presentation: 'modal'
 */
export default function ModalScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const { user, signOut } = useAuth();
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            console.log('Account deletion requested');
          }
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Select your preferred language',
      [
        { text: 'English', onPress: () => console.log('English selected') },
        { text: 'Français', onPress: () => console.log('French selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.backgroundDark }]}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <Card style={{ padding: 16, marginBottom: spacing.lg }}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.backgroundDark }]}>
                <Text style={[styles.roleText, { color: colors.primary }]}>
                  {user?.role || 'User'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Notifications Section */}
        <Section title="Notifications" icon={Bell}>
          <SettingItem
            label="Push Notifications"
            description="Receive alerts on your device"
            icon={Bell}
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={pushNotifications ? colors.primary : '#f4f3f4'}
              />
            }
          />
          <SettingItem
            label="Email Notifications"
            description="Receive updates via email"
            icon={Bell}
            showBorder={false}
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={emailNotifications ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </Section>

        {/* Appearance Section */}
        <Section title="Appearance" icon={Moon}>
          <SettingItem
            label="Dark Mode"
            description="Use dark theme throughout the app"
            icon={Moon}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={darkMode ? colors.primary : '#f4f3f4'}
              />
            }
          />
          <SettingItem
            label="Language"
            description="English"
            icon={Globe}
            showBorder={false}
            onPress={handleLanguageChange}
            showChevron
          />
        </Section>

        {/* Security Section */}
        <Section title="Security" icon={Shield}>
          <SettingItem
            label="Biometric Login"
            description="Use Face ID or fingerprint to sign in"
            icon={Shield}
            rightElement={
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={biometricLogin ? colors.primary : '#f4f3f4'}
              />
            }
          />
          <SettingItem
            label="Change Password"
            description="Update your account password"
            icon={Shield}
            showBorder={false}
            onPress={() => console.log('Change password')}
            showChevron
          />
        </Section>

        {/* About Section */}
        <Section title="About" icon={Info}>
          <SettingItem
            label="App Version"
            description="1.0.0"
            icon={Info}
          />
          <SettingItem
            label="Terms of Service"
            showBorder={false}
            onPress={() => console.log('Terms')}
            showChevron
          />
        </Section>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { marginTop: spacing.lg }]}>
          <TouchableOpacity
            style={[
              styles.dangerButton,
              { borderColor: colors.border, borderRadius: borderRadius.md }
            ]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              { borderColor: colors.error, borderRadius: borderRadius.md, marginTop: spacing.md }
            ]}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  const { colors, spacing } = useTheme();
  
  return (
    <View style={[styles.section, { marginBottom: spacing.lg }]}>
      <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
        <Icon size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
        {children}
      </View>
    </View>
  );
}

interface SettingItemProps {
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  rightElement?: React.ReactNode;
  showBorder?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
}

function SettingItem({
  label,
  description,
  icon: Icon,
  rightElement,
  showBorder = true,
  showChevron = false,
  onPress,
}: SettingItemProps) {
  const { colors, spacing, borderRadius } = useTheme();
  
  const content = (
    <View style={[
      styles.settingItem,
      showBorder && { borderBottomColor: colors.border, borderBottomWidth: 1 }
    ]}>
      <View style={styles.settingItemLeft}>
        {Icon && (
          <View style={[styles.settingIcon, { backgroundColor: colors.backgroundDark }]}>
            <Icon size={18} color={colors.primary} />
          </View>
        )}
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightElement}
        {showChevron && <ChevronRight size={20} color={colors.textMuted} />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  userCard: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerSection: {},
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
