import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { LucideIcon } from 'lucide-react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  iconSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  iconSize,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: theme.colors.primary },
          text: { color: '#ffffff' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: theme.colors.backgroundDark },
          text: { color: theme.colors.text },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: theme.colors.primary },
        };
      case 'danger':
        return {
          container: { backgroundColor: theme.colors.error },
          text: { color: '#ffffff' },
        };
      default:
        return {
          container: { backgroundColor: theme.colors.primary },
          text: { color: '#ffffff' },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; icon: number } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 12 },
          text: { fontSize: 14 },
          icon: iconSize || 16,
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24 },
          text: { fontSize: 18 },
          icon: iconSize || 24,
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 16 },
          text: { fontSize: 16 },
          icon: iconSize || 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.button,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: 0.6 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <View style={styles.content}>
          {IconLeft && (
            <IconLeft
              size={sizeStyles.icon}
              color={variantStyles.text.color}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
                textStyle,
            ]}
          >
            {children}
          </Text>
          {IconRight && (
            <IconRight
              size={sizeStyles.icon}
              color={variantStyles.text.color}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
