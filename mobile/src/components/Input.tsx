import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  onIconRightPress?: () => void;
  iconRightAccessibilityLabel?: string;
  secure?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helper,
  iconLeft: IconLeft,
  iconRight: IconRight,
  onIconRightPress,
  secure = false,
  required = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  helperStyle,
  editable = true,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isSecure, setIsSecure] = useState(secure);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isDisabled = editable === false;

  const toggleSecure = () => setIsSecure(!isSecure);

  const getBorderColor = () => {
    if (hasError) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: theme.colors.text }, labelStyle]}>
            {label}
            {required && (
              <Text style={[styles.required, { color: theme.colors.error }]}>
                {' *'}
              </Text>
            )}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: isDisabled
              ? theme.colors.backgroundDark
              : theme.colors.surface,
          },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {IconLeft && (
          <IconLeft
            size={20}
            color={hasError ? theme.colors.error : theme.colors.textSecondary}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: isDisabled ? theme.colors.textMuted : theme.colors.text,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isSecure}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secure ? (
          <TouchableOpacity
            onPress={toggleSecure}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            {isSecure ? (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : IconRight ? (
          <TouchableOpacity
            onPress={onIconRightPress}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!onIconRightPress}
            accessibilityRole={onIconRightPress ? 'button' : 'none'}
            accessibilityLabel={props.iconRightAccessibilityLabel}
          >
            <IconRight
              size={20}
              color={hasError ? theme.colors.error : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <Text
          style={[styles.error, { color: theme.colors.error }, errorStyle]}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={[
            styles.helper,
            { color: theme.colors.textSecondary },
            helperStyle,
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  required: {
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  iconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  iconRight: {
    marginLeft: 10,
    padding: 4,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
  },
  helper: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default Input;
