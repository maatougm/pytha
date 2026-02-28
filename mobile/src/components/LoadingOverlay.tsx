import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  overlayStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export function LoadingOverlay({
  visible,
  text,
  overlayStyle,
  containerStyle,
  textStyle,
}: LoadingOverlayProps) {
  const theme = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          overlayStyle,
        ]}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.surface },
            containerStyle,
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {text && (
            <Text
              style={[
                styles.text,
                { color: theme.colors.text },
                textStyle,
              ]}
            >
              {text}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
