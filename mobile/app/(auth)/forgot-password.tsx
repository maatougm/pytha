import { useState, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft, CheckCircle, Key, Clock, Shield, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isSuccess) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isSuccess, fadeAnim]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSuccess, countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    // Reset states
    setError(null);

    // Validate email
    if (!email) {
      setError('Please enter your email address');
      triggerShake();
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate random error for demo (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Network error');
      }

      setIsSuccess(true);
      setCanResend(false);
      setCountdown(30);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setIsSuccess(false);
    setCanResend(false);
    setCountdown(30);
    handleSubmit();
  };

  // Success State
  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Success Content */}
            <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
              {/* Success Icon */}
              <View
                style={[
                  styles.successIconContainer,
                  { backgroundColor: colors.success + '20' },
                ]}
              >
                <CheckCircle size={64} color={colors.success} />
              </View>

              {/* Success Title */}
              <Text style={[styles.successTitle, { color: colors.text }]}>Check your email!</Text>

              {/* Success Message */}
              <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                We&apos;ve sent password reset instructions to:
              </Text>

              {/* Email Preview Card */}
              <View
                style={[
                  styles.emailCard,
                  {
                    backgroundColor: colors.backgroundDark,
                    borderRadius: borderRadius.lg,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={[styles.emailIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Mail size={24} color={colors.primary} />
                </View>
                <Text style={[styles.emailText, { color: colors.text }]}>{email}</Text>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionItem}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    Link expires in 1 hour
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Shield size={16} color={colors.textMuted} />
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    For security, links can only be used once
                  </Text>
                </View>
              </View>

              {/* Resend Section */}
              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                  Didn&apos;t receive it?{' '}
                </Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleResend} accessibilityLabel="Resend email">
                    <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.countdownText, { color: colors.textMuted }]}>
                    Resend in {countdown}s
                  </Text>
                )}
              </View>

              {/* Back to Login Button */}
              <TouchableOpacity
                style={[
                  styles.backToLoginButton,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                onPress={() => router.push('/login')}
                accessibilityLabel="Back to login"
                accessibilityRole="button"
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>

              {/* Support Link */}
              <TouchableOpacity style={styles.supportLink} accessibilityLabel="Contact support">
                <Text style={[styles.supportText, { color: colors.textMuted }]}>
                  Need help?{' '}
                  <Text style={[styles.supportLinkText, { color: colors.primary }]}>Contact support</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Form State
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header Illustration */}
          <View style={styles.header}>
            <View
              style={[
                styles.illustrationContainer,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Key size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email and we&apos;ll send you instructions to reset your password
            </Text>
          </View>

          {/* Form */}
          <Animated.View
            style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
          >
            {/* Error Banner */}
            {error && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.error + '10',
                    borderColor: colors.error,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <AlertCircle size={20} color={colors.error} />
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
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
                    borderColor: error ? colors.error : colors.border,
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
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email address to receive reset instructions"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityLabel="Send reset link"
              accessibilityRole="button"
              accessibilityState={{ busy: isLoading }}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.loadingText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Shield size={14} color={colors.textMuted} />
              <Text style={[styles.securityText, { color: colors.textMuted }]}>
                For security, password reset links expire in 1 hour
              </Text>
            </View>

            {/* Support Link */}
            <TouchableOpacity style={styles.supportLink} accessibilityLabel="Contact support">
              <Text style={[styles.supportText, { color: colors.textMuted }]}>
                Need help?{' '}
                <Text style={[styles.supportLinkText, { color: colors.primary }]}>Contact support</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  illustrationContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 14,
    flex: 1,
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
  submitButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
  },
  supportLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  supportText: {
    fontSize: 14,
  },
  supportLinkText: {
    fontWeight: '500',
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  emailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  instructionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
  },
  backToLoginButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  backToLoginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
