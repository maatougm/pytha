import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  showOnline?: boolean;
  isOnline?: boolean;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function Avatar({
  uri,
  name,
  size = 'md',
  showOnline = false,
  isOnline = false,
  borderColor,
  borderWidth = 2,
  style,
  backgroundColor,
}: AvatarProps) {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);

  const getSize = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 48;
      case 'lg':
        return 64;
      case 'xl':
        return 96;
      default:
        return 48;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return 10;
      case 'sm':
        return 12;
      case 'md':
        return 16;
      case 'lg':
        return 24;
      case 'xl':
        return 36;
      default:
        return 16;
    }
  };

  const getOnlineIndicatorSize = (): number => {
    switch (size) {
      case 'xs':
        return 6;
      case 'sm':
        return 8;
      case 'md':
        return 12;
      case 'lg':
        return 14;
      case 'xl':
        return 18;
      default:
        return 12;
    }
  };

  const getInitials = useCallback((): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }, [name]);

  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;
    if (!name) return theme.colors.textMuted;
    
    // Generate consistent color based on name
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#f59e0b', // amber
      '#84cc16', // lime
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#d946ef', // fuchsia
      '#f43f5e', // rose
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const dimension = getSize();
  const fontSize = getFontSize();
  const onlineSize = getOnlineIndicatorSize();
  const shouldShowImage = uri && !hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
        },
        borderColor && {
          borderWidth,
          borderColor,
          borderRadius: dimension / 2,
        },
        style,
      ]}
    >
      {shouldShowImage ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          onError={() => setHasError(true)}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                color: '#ffffff',
              },
            ]}
          >
            {getInitials()}
          </Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              backgroundColor: isOnline ? theme.colors.success : theme.colors.textMuted,
              borderWidth: 2,
              borderColor: borderColor || theme.colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default Avatar;
