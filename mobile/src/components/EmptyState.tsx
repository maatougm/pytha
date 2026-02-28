import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from './Button';
import { LucideIcon, Package } from 'lucide-react-native';

export interface EmptyStateProps {
  icon?: LucideIcon;
  iconSize?: number;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  containerStyle?: ViewStyle;
  iconContainerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

export function EmptyState({
  icon: Icon = Package,
  iconSize = 48,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  containerStyle,
  iconContainerStyle,
  titleStyle,
  descriptionStyle,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${theme.colors.primary}15`,
          },
          iconContainerStyle,
        ]}
      >
        <Icon size={iconSize} color={theme.colors.primary} />
      </View>

      <Text style={[styles.title, { color: theme.colors.text }, titleStyle]}>
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.description,
            { color: theme.colors.textSecondary },
            descriptionStyle,
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button variant={actionVariant} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionContainer: {
    minWidth: 150,
  },
});

export default EmptyState;
