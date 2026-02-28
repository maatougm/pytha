import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  text,
  variant = 'default',
  size = 'md',
  rounded = false,
  style,
  textStyle,
}: BadgeProps) {
  const theme = useTheme();

  const getVariantStyles = (): { backgroundColor: string; textColor: string } => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: `${theme.colors.success}20`, // 20% opacity
          textColor: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: `${theme.colors.warning}20`,
          textColor: theme.colors.warning,
        };
      case 'error':
        return {
          backgroundColor: `${theme.colors.error}20`,
          textColor: theme.colors.error,
        };
      case 'info':
        return {
          backgroundColor: `${theme.colors.info}20`,
          textColor: theme.colors.info,
        };
      case 'default':
      default:
        return {
          backgroundColor: `${theme.colors.primary}20`,
          textColor: theme.colors.primary,
        };
    }
  };

  const getSizeStyles = (): { padding: { vertical: number; horizontal: number }; fontSize: number } => {
    switch (size) {
      case 'sm':
        return {
          padding: { vertical: 2, horizontal: 8 },
          fontSize: 11,
        };
      case 'md':
      default:
        return {
          padding: { vertical: 4, horizontal: 12 },
          fontSize: 12,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          paddingVertical: sizeStyles.padding.vertical,
          paddingHorizontal: sizeStyles.padding.horizontal,
          borderRadius: rounded ? 9999 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
