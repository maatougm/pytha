import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { AlertTriangle, RefreshCw, Send } from 'lucide-react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps & { theme: ReturnType<typeof useTheme> },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { theme: ReturnType<typeof useTheme> }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleReport = () => {
    // In a real app, you would send the error to your error tracking service
    // e.g., Sentry, Bugsnag, etc.
    console.log('Error reported:', this.state.error);
    alert('Error reported. Thank you!');
  };

  render() {
    const { theme, fallback, children } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${theme.colors.error}15` },
              ]}
            >
              <AlertTriangle size={48} color={theme.colors.error} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              Something went wrong
            </Text>

            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
            >
              We apologize for the inconvenience. Please try again or report
              this issue.
            </Text>

            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.backgroundDark },
                ]}
              >
                <Text
                  style={[styles.errorTitle, { color: theme.colors.error }]}
                >
                  Error:
                </Text>
                <Text
                  style={[styles.errorText, { color: theme.colors.text }]}
                  numberOfLines={3}
                >
                  {error.message}
                </Text>
                {__DEV__ && errorInfo && (
                  <Text
                    style={[
                      styles.stackTrace,
                      { color: theme.colors.textMuted },
                    ]}
                    numberOfLines={10}
                  >
                    {errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={this.handleRetry}
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <RefreshCw size={18} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleReport}
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Send
                  size={18}
                  color={theme.colors.text}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Report Issue
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return <>{children}</>;
  }
}

// Wrapper component to provide theme context
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const theme = useTheme();
  return <ErrorBoundaryClass {...props} theme={theme} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  errorContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButton: {},
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
