import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export type SkeletonType = 'text' | 'card' | 'circle' | 'custom';

export interface SkeletonProps {
  type?: SkeletonType;
  width?: number | string;
  height?: number;
  lines?: number;
  style?: ViewStyle;
  animate?: boolean;
}

export function Skeleton({
  type = 'text',
  width,
  height,
  lines = 1,
  style,
  animate = true,
}: SkeletonProps) {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animate, shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const getDefaultDimensions = (): { width: number | string; height: number } => {
    switch (type) {
      case 'text':
        return { width: width || '100%', height: height || 16 };
      case 'card':
        return { width: width || '100%', height: height || 120 };
      case 'circle':
        return {
          width: width || 48,
          height: height || 48,
        };
      case 'custom':
        return {
          width: width || '100%',
          height: height || 48,
        };
      default:
        return { width: width || '100%', height: height || 16 };
    }
  };

  const dims = getDefaultDimensions();

  const renderSkeleton = () => {
    const baseStyle: ViewStyle = {
      width: dims.width as ViewStyle['width'],
      height: dims.height as ViewStyle['height'],
      backgroundColor: `${theme.colors.textMuted}30`,
      borderRadius: type === 'circle' ? (dims.height as number) / 2 : 4,
      overflow: 'hidden',
    };

    return (
      <View style={[baseStyle, style]}>
        {animate && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        )}
      </View>
    );
  };

  if (type === 'text' && lines > 1) {
    return (
      <View style={styles.linesContainer}>
        {Array.from({ length: lines }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.line,
              index === lines - 1 && styles.lastLine,
            ]}
          >
            {renderSkeleton()}
          </View>
        ))}
      </View>
    );
  }

  return renderSkeleton();
}

const styles = StyleSheet.create({
  linesContainer: {
    width: '100%',
  },
  line: {
    marginBottom: 8,
  },
  lastLine: {
    marginBottom: 0,
    width: '80%',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default Skeleton;
