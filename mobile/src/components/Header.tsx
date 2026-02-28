import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LucideIcon } from 'lucide-react-native';

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: LucideIcon;
    onPress: () => void;
    label?: string;
  };
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

export function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
  containerStyle,
  titleStyle,
}: HeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
        containerStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text },
              titleStyle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={rightAction.label}
            >
              <rightAction.icon size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  actionButton: {
    padding: 4,
  },
});

export default Header;
