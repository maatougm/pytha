import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type ViewProps,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: CardPadding;
  shadow?: boolean;
  border?: boolean;
  borderColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
}

export function Card({
  children,
  padding = 'md',
  shadow = true,
  border = false,
  borderColor,
  onPress,
  style,
  activeOpacity = 0.8,
  ...props
}: CardProps) {
  const theme = useTheme();

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return 8;
      case 'md':
        return 16;
      case 'lg':
        return 24;
      case 'xl':
        return 32;
      default:
        return 16;
    }
  };

  const cardStyles = [
    styles.card,
    {
      padding: getPadding(),
      backgroundColor: theme.colors.surface,
      borderColor: borderColor || theme.colors.border,
    },
    shadow && styles.shadow,
    border && styles.border,
    style,
  ];

  if (onPress) {
    const { onBlur, ...touchableProps } = props as any;
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={cardStyles}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  border: {
    borderWidth: 1,
  },
});

export default Card;
