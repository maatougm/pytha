import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchX, Home, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

/**
 * 404 Not Found Screen
 * 
 * Displayed when navigating to a route that doesn't exist.
 * Provides friendly messaging and navigation options.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: colors.backgroundDark,
            marginBottom: spacing.xl,
          }
        ]}>
          <SearchX size={64} color={colors.primary} strokeWidth={1.5} />
        </View>

        {/* Main Message */}
        <Text style={[
          styles.title, 
          { 
            color: colors.text,
            marginBottom: spacing.sm,
          }
        ]}>
          Page Not Found
        </Text>

        <Text style={[
          styles.description, 
          { 
            color: colors.textSecondary,
            marginBottom: spacing.xl,
          }
        ]}>
          Oops! The page you&apos;re looking for seems to have wandered off campus. 
          It might have been moved, deleted, or never existed.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                marginBottom: spacing.md,
              },
            ]}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.text} />
            <Text style={[styles.buttonText, styles.secondaryButtonText, { color: colors.text }]}>
              Go Back
            </Text>
          </TouchableOpacity>

          {/* Home Button */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => router.replace('/(tabs)')}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
          >
            <Home size={20} color="#ffffff" />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={[
          styles.helpText, 
          { 
            color: colors.textMuted,
            marginTop: spacing.xl,
          }
        ]}>
          Error Code: 404
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 1,
  },
  primaryButton: {
    borderColor: 'transparent',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {},
  helpText: {
    fontSize: 12,
  },
});
