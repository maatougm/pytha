import { useEffect, useState, useCallback } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  AccessibilityActionEvent,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';

/**
 * Hook for screen reader / accessibility features
 */
export function useScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  return { isEnabled, announce };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setIsReducedMotion);

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setIsReducedMotion
    );

    return () => subscription?.remove();
  }, []);

  return isReducedMotion;
}

/**
 * Hook for bold text preference
 */
export function useBoldText() {
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isBoldTextEnabled?.().then(setIsBoldTextEnabled);

    const subscription = AccessibilityInfo.addEventListener?.(
      'boldTextChanged',
      setIsBoldTextEnabled
    );

    return () => subscription?.remove();
  }, []);

  return isBoldTextEnabled;
}

/**
 * Generate accessibility props for common components
 */
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityActions?: Array<{ name: string; label?: string }>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

export function createAccessibilityProps(props: AccessibilityProps): AccessibilityProps {
  return {
    accessible: true,
    ...props,
  };
}

/**
 * Accessibility props for buttons
 */
export function buttonAccessibility(label: string, hint?: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  });
}

/**
 * Accessibility props for inputs
 */
export function inputAccessibility(label: string, hint?: string, state?: AccessibilityState): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'text',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
  });
}

/**
 * Accessibility props for switches
 */
export function switchAccessibility(label: string, checked: boolean, hint?: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { checked },
  });
}

/**
 * Accessibility props for list items
 */
export function listItemAccessibility(label: string, index: number, total: number): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityLabel: `${label}, item ${index + 1} of ${total}`,
    accessibilityRole: 'button',
  });
}

/**
 * Accessibility props for tabs
 */
export function tabAccessibility(label: string, selected: boolean): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'tab',
    accessibilityLabel: label,
    accessibilityState: { selected },
  });
}

/**
 * Accessibility props for headers
 */
export function headerAccessibility(level: 1 | 2 | 3 | 4 = 1): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'header',
    accessibilityLabel: `Heading level ${level}`,
  });
}

/**
 * Accessibility props for images
 */
export function imageAccessibility(description: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'image',
    accessibilityLabel: description,
  });
}

/**
 * Accessibility props for links
 */
export function linkAccessibility(label: string, hint?: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'link',
    accessibilityLabel: label,
    accessibilityHint: hint,
  });
}

/**
 * Accessibility props for checkboxes
 */
export function checkboxAccessibility(label: string, checked: boolean, hint?: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { checked },
  });
}

/**
 * Accessibility props for radio buttons
 */
export function radioAccessibility(label: string, selected: boolean, hint?: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'radio',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { selected },
  });
}

/**
 * Accessibility props for alerts/messages
 */
export function alertAccessibility(type: 'error' | 'warning' | 'success' | 'info', message: string): AccessibilityProps {
  return createAccessibilityProps({
    accessibilityRole: 'alert',
    accessibilityLabel: `${type}: ${message}`,
  });
}

/**
 * Hook to set accessibility focus
 */
export function useAccessibilityFocus() {
  const setFocus = useCallback((ref: React.RefObject<any>) => {
    const node = findNodeHandle(ref.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);

  return setFocus;
}

/**
 * Format numbers for screen readers
 */
export function formatNumberForScreenReader(num: number): string {
  return num.toLocaleString();
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Truncate text for accessibility (adds "more content available" if truncated)
 */
export function truncateForAccessibility(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}... more content available`;
}

/**
 * Create accessibility label for progress
 */
export function progressAccessibility(value: number, max: number, label?: string): string {
  const percentage = Math.round((value / max) * 100);
  const baseLabel = label || 'Progress';
  return `${baseLabel}: ${percentage} percent, ${value} of ${max}`;
}

/**
 * Create accessibility label for ratings
 */
export function ratingAccessibility(rating: number, maxRating: number = 5): string {
  return `Rating: ${rating} out of ${maxRating} stars`;
}

/**
 * Create accessibility label for badges/counts
 */
export function badgeAccessibility(count: number, itemName: string): string {
  return `${count} ${itemName}${count !== 1 ? 's' : ''}`;
}
