import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Logo } from '@/src/components/Logo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Shield,
  BookOpen,
  Users,
  GraduationCap,
  Check,
  Fingerprint,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  authenticateWithBiometric,
  getBiometricLabel,
  getBiometricType,
  enableBiometric,
} from '@/src/services/biometric.service';

type Role = 'admin' | 'teacher' | 'parent' | 'student';

interface RoleOption {
  value: Role;
  label: string;
  icon: React.ReactNode;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, spacing, borderRadius } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [biometricStatus, setBiometricStatus] = useState<{
    available: boolean;
    enabled: boolean;
    label: string;
  }>({ available: false, enabled: false, label: 'Biometric' });

  const roles: RoleOption[] = [
    { value: 'admin', label: 'Admin', icon: <Shield size={20} color={colors.accent} /> },
    { value: 'teacher', label: 'Teacher', icon: <BookOpen size={20} color={colors.accent} /> },
    { value: 'parent', label: 'Parent', icon: <Users size={20} color={colors.accent} /> },
    { value: 'student', label: 'Student', icon: <GraduationCap size={20} color={colors.accent} /> },
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signIn(email, password, selectedRole);
      
      // Offer to enable biometric after successful login
      if (biometricStatus.available && !biometricStatus.enabled) {
        await enableBiometricAfterLogin();
      }
      
      // AuthProvider handles navigation to (tabs) on success
    } catch (error) {
      setErrors({
        general: 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedRoleLabel = () => {
    return roles.find((r) => r.value === selectedRole)?.label || 'Select Role';
  };

  const getSelectedRoleIcon = () => {
    return roles.find((r) => r.value === selectedRole)?.icon;
  };

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const available = await isBiometricAvailable();
    const enabled = available ? await isBiometricEnabled() : false;
    const type = available ? await getBiometricType() : null;
    const label = getBiometricLabel(type);

    setBiometricStatus({ available, enabled, label });
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!biometricStatus.available) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    if (!biometricStatus.enabled) {
      Alert.alert(
        'Biometric Not Enabled',
        'Please sign in with your email and password first, then enable biometric authentication in settings.'
      );
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const credentials = await authenticateWithBiometric();
      
      if (!credentials) {
        setErrors({
          general: 'Biometric authentication failed. Please use your email and password.',
        });
        return;
      }

      await signIn(credentials.email, credentials.password, credentials.role);
      // AuthProvider handles navigation on success
    } catch (error) {
      setErrors({
        general: 'Authentication failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enable biometric after successful login
  const enableBiometricAfterLogin = useCallback(async () => {
    if (!biometricStatus.available || biometricStatus.enabled) return;

    const shouldEnable = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Enable Biometric Login?',
        `Would you like to use ${biometricStatus.label} for faster login next time?`,
        [
          { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Enable', onPress: () => resolve(true) },
        ]
      );
    });

    if (shouldEnable) {
      const success = await enableBiometric({
        email,
        password,
        role: selectedRole,
      });

      if (success) {
        setBiometricStatus(prev => ({ ...prev, enabled: true }));
        Alert.alert('Success', `${biometricStatus.label} has been enabled for future logins.`);
      }
    }
  }, [biometricStatus.available, biometricStatus.enabled, biometricStatus.label, email, password, selectedRole]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Logo size="xl" />
            <Text style={[styles.appName, { color: colors.primary }]}>School Hub</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Connect. Learn. Grow.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Error Banner */}
            {!!errors.general && (
              <View style={[styles.errorBanner, { backgroundColor: '#fef2f2', borderColor: colors.error }]}>
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{errors.general}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.backgroundDark,
                    borderColor: errors.email ? colors.error : colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Mail size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email address"
                />
                {!!email && validateEmail(email) && (
                  <Check size={20} color={colors.success} style={styles.validationIcon} />
                )}
              </View>
              {!!errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.backgroundDark,
                    borderColor: errors.password ? colors.error : colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Lock size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  accessibilityLabel="Password"
                  accessibilityHint="Enter your password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textMuted} />
                  ) : (
                    <Eye size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
              {!!errors.password && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
              )}
            </View>

            {/* Biometric Option */}
            {biometricStatus.available && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
                accessibilityLabel={`Sign in with ${biometricStatus.label}`}
              >
                <Fingerprint size={20} color={colors.primary} />
                <Text style={[styles.biometricText, { color: colors.primary }]}>
                  Sign in with {biometricStatus.label}
                </Text>
              </TouchableOpacity>
            )}

            {/* Role Selector */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Role</Text>
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.backgroundDark,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                disabled={isLoading}
                accessibilityLabel="Select your role"
                accessibilityRole="button"
              >
                <View style={styles.inputIcon}>{getSelectedRoleIcon()}</View>
                <Text style={[styles.roleText, { color: colors.text }]}>{getSelectedRoleLabel()}</Text>
                <ChevronDown
                  size={20}
                  color={colors.textMuted}
                  style={[styles.chevron, showRoleDropdown && styles.chevronUp]}
                />
              </Pressable>

              {/* Dropdown Menu */}
              {showRoleDropdown && (
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.md,
                      shadowColor: '#000',
                    },
                  ]}
                >
                  {roles.map((role) => (
                    <Pressable
                      key={role.value}
                      style={[
                        styles.dropdownItem,
                        selectedRole === role.value && { backgroundColor: colors.backgroundDark },
                      ]}
                      onPress={() => {
                        setSelectedRole(role.value);
                        setShowRoleDropdown(false);
                      }}
                      accessibilityLabel={`Select ${role.label} role`}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.dropdownIcon}>{role.icon}</View>
                      <Text style={[styles.dropdownText, { color: colors.text }]}>{role.label}</Text>
                      {selectedRole === role.value && <Check size={16} color={colors.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Remember Me */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
                accessibilityLabel="Remember me"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberMe ? colors.primary : colors.border,
                      backgroundColor: rememberMe ? colors.primary : colors.background,
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                >
                  {rememberMe && <Check size={14} color="#ffffff" />}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                disabled={isLoading}
                accessibilityLabel="Forgot password"
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Login Buttons (For Testing/Seed Data) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => { setEmail('admin@academy.edu'); setPassword('VJyhbuFmnPSiuEzpCz2CAa1!'); setSelectedRole('admin'); }}
                style={[styles.quickLoginBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              >
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEmail('j.rodriguez@academy.edu'); setPassword('VJyhbuFmnPSiuEzpCz2CAa1!'); setSelectedRole('teacher'); }}
                style={[styles.quickLoginBtn, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}
              >
                <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEmail('m.chen@academy.edu'); setPassword('VJyhbuFmnPSiuEzpCz2CAa1!'); setSelectedRole('parent'); }}
                style={[styles.quickLoginBtn, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}
              >
                <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEmail('carlos.garcia@student.academy.edu'); setPassword('VJyhbuFmnPSiuEzpCz2CAa1!'); setSelectedRole('student'); }}
                style={[styles.quickLoginBtn, { backgroundColor: colors.info || '#0ea5e9' + '15', borderColor: (colors.info || '#0ea5e9') + '30' }]}
              >
                <Text style={{ color: colors.info || '#0ea5e9', fontSize: 12, fontWeight: '600' }}>Student</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: colors.textSecondary }]}>
                {"Don't have an account? "}
              </Text><TouchableOpacity onPress={() => router.push('/role-select')} disabled={isLoading}>
                <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  // Logo component handles its own styling
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  errorBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  validationIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleText: {
    flex: 1,
    fontSize: 16,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 14,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickLoginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
});
