import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, BookOpen, Users, GraduationCap, ArrowLeft, Info, X } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

type Role = 'admin' | 'teacher' | 'parent' | 'student';

interface RoleCard {
  value: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
  permissions: string[];
}

export default function RoleSelectScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showTooltip, setShowTooltip] = useState<Role | null>(null);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const roles: RoleCard[] = [
    {
      value: 'admin',
      title: 'Administrator',
      description: 'Manage school operations',
      icon: <Shield size={32} color={colors.accent} />,
      permissions: ['Manage users', 'View analytics', 'Configure settings', 'Access all data'],
    },
    {
      value: 'teacher',
      title: 'Teacher',
      description: 'Create courses & assignments',
      icon: <BookOpen size={32} color={colors.accent} />,
      permissions: ['Create courses', 'Grade assignments', 'Message students & parents', 'Track attendance'],
    },
    {
      value: 'parent',
      title: 'Parent',
      description: "Track your child's progress",
      icon: <Users size={32} color={colors.accent} />,
      permissions: ['View child progress', 'Message teachers', 'View grades', 'Track attendance'],
    },
    {
      value: 'student',
      title: 'Student',
      description: 'Access courses & submit work',
      icon: <GraduationCap size={32} color={colors.accent} />,
      permissions: ['Access courses', 'Submit assignments', 'View grades', 'Message teachers'],
    },
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setAttemptedSubmit(false);
    // Trigger subtle scale animation
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (!selectedRole) {
      setAttemptedSubmit(true);
      // Shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Navigate to registration with selected role
    router.push({
      pathname: '/login',
      params: { role: selectedRole },
    });
  };

  const getCardScale = (role: Role) => {
    if (selectedRole === role) {
      return shakeAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.02],
      });
    }
    return 1;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Role</Text>
        <Text style={styles.headerSubtitle}>Select how you&apos;ll use School Hub</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Grid */}
        <Animated.View
          style={[
            styles.grid,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {roles.map((role) => (
            <Animated.View
              key={role.value}
              style={[
                styles.cardWrapper,
                { transform: [{ scale: getCardScale(role.value) }] },
              ]}
            >
              <Pressable
                style={[
                  styles.card,
                  {
                    backgroundColor: selectedRole === role.value ? colors.primary + '10' : colors.background,
                    borderColor: selectedRole === role.value ? colors.accent : colors.border,
                    borderRadius: borderRadius.lg,
                    borderWidth: selectedRole === role.value ? 2 : 1,
                  },
                ]}
                onPress={() => handleRoleSelect(role.value)}
                accessibilityLabel={`Select ${role.title} role`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedRole === role.value }}
              >
                {/* Info Button */}
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setShowTooltip(showTooltip === role.value ? null : role.value)}
                  accessibilityLabel={`View ${role.title} permissions`}
                  accessibilityRole="button"
                >
                  <Info size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: selectedRole === role.value ? colors.primary + '20' : colors.backgroundDark,
                    },
                  ]}
                >
                  {role.icon}
                </View>

                {/* Title */}
                <Text style={[styles.cardTitle, { color: colors.text }]}>{role.title}</Text>

                {/* Description */}
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {role.description}
                </Text>

                {/* Tooltip */}
                {showTooltip === role.value && (
                  <View
                    style={[
                      styles.tooltip,
                      {
                        backgroundColor: colors.surfaceDark,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.tooltipClose}
                      onPress={() => setShowTooltip(null)}
                    >
                      <X size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.tooltipTitle}>Permissions:</Text>
                    {role.permissions.map((permission, index) => (
                      <Text key={index} style={styles.tooltipItem}>
                        • {permission}
                      </Text>
                    ))}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {attemptedSubmit && !selectedRole && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Please select a role to continue
          </Text>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedRole ? colors.primary : colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          accessibilityLabel="Continue"
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedRole }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signinContainer}>
          <Text style={[styles.signinText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/login')} accessibilityLabel="Sign in">
            <Text style={[styles.signinLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    justifyContent: 'center',
  },
  tooltipClose: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tooltipTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  tooltipItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signinText: {
    fontSize: 14,
  },
  signinLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
