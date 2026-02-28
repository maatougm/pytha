import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BiometricType = 'fingerprint' | 'facial-recognition' | 'iris' | 'none';

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
  isLoading: boolean;
}

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_PROMPT_SHOWN_KEY = '@biometric_prompt_shown';

/**
 * Hook for biometric authentication
 */
export function useBiometric() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: 'none',
    isEnabled: false,
    isLoading: true,
  });

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check if hardware supports biometric
      const compatible = await LocalAuthentication.hasHardwareAsync();
      
      if (!compatible) {
        setState({
          isAvailable: false,
          isEnrolled: false,
          biometricType: 'none',
          isEnabled: false,
          isLoading: false,
        });
        return;
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Map to our type
      let type: BiometricType = 'none';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        type = 'facial-recognition';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        type = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        type = 'iris';
      }

      // Check if user has enabled biometric in app settings
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

      setState({
        isAvailable: compatible,
        isEnrolled: enrolled,
        biometricType: type,
        isEnabled: enabled === 'true',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Get display name for biometric type
  const getBiometricDisplayName = useCallback((): string => {
    switch (state.biometricType) {
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'facial-recognition':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }, [state.biometricType]);

  // Get icon name for biometric type
  const getBiometricIcon = useCallback((): string => {
    switch (state.biometricType) {
      case 'fingerprint':
        return 'fingerprint';
      case 'facial-recognition':
        return 'scan-face';
      case 'iris':
        return 'eye';
      default:
        return 'lock';
    }
  }, [state.biometricType]);

  // Authenticate with biometric
  const authenticate = useCallback(async (
    promptMessage?: string,
    fallbackLabel?: string
  ): Promise<boolean> => {
    if (!state.isAvailable || !state.isEnrolled) {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${getBiometricDisplayName()}`,
        fallbackLabel: fallbackLabel || 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }, [state.isAvailable, state.isEnrolled, getBiometricDisplayName]);

  // Enable biometric authentication
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable || !state.isEnrolled) {
      Alert.alert(
        'Biometric Not Available',
        'Please ensure biometric authentication is set up on your device.'
      );
      return false;
    }

    // First authenticate to verify
    const authenticated = await authenticate(
      'Confirm to enable biometric authentication'
    );

    if (authenticated) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setState(prev => ({ ...prev, isEnabled: true }));
      return true;
    }

    return false;
  }, [state.isAvailable, state.isEnrolled, authenticate]);

  // Disable biometric authentication
  const disableBiometric = useCallback(async (): Promise<void> => {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    setState(prev => ({ ...prev, isEnabled: false }));
  }, []);

  // Toggle biometric authentication
  const toggleBiometric = useCallback(async (enable: boolean): Promise<boolean> => {
    if (enable) {
      return await enableBiometric();
    } else {
      await disableBiometric();
      return true;
    }
  }, [enableBiometric, disableBiometric]);

  // Check if should prompt user to enable biometric
  const shouldPromptForBiometric = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable || !state.isEnrolled || state.isEnabled) {
      return false;
    }

    const promptShown = await AsyncStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY);
    return promptShown !== 'true';
  }, [state.isAvailable, state.isEnrolled, state.isEnabled]);

  // Mark biometric prompt as shown
  const markPromptShown = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, 'true');
  }, []);

  // Show enable biometric prompt
  const showEnablePrompt = useCallback((onEnable: () => void, onDismiss?: () => void) => {
    const biometricName = getBiometricDisplayName();
    
    Alert.alert(
      `Enable ${biometricName}?`,
      `Sign in faster and more securely with ${biometricName}.`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            markPromptShown();
            onDismiss?.();
          },
        },
        {
          text: 'Enable',
          onPress: async () => {
            markPromptShown();
            const success = await enableBiometric();
            if (success) {
              onEnable();
            }
          },
        },
      ]
    );
  }, [getBiometricDisplayName, enableBiometric, markPromptShown]);

  return {
    ...state,
    getBiometricDisplayName,
    getBiometricIcon,
    authenticate,
    enableBiometric,
    disableBiometric,
    toggleBiometric,
    shouldPromptForBiometric,
    showEnablePrompt,
    refresh: checkBiometricAvailability,
  };
}

/**
 * Hook for secure app lock with biometric
 */
export function useAppLock() {
  const biometric = useBiometric();
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Lock the app
  const lock = useCallback(() => {
    if (biometric.isEnabled) {
      setIsLocked(true);
    }
  }, [biometric.isEnabled]);

  // Unlock the app
  const unlock = useCallback(async (): Promise<boolean> => {
    if (!biometric.isEnabled || !isLocked) {
      return true;
    }

    setIsAuthenticating(true);
    const success = await biometric.authenticate('Unlock School Hub');
    setIsAuthenticating(false);

    if (success) {
      setIsLocked(false);
    }

    return success;
  }, [biometric, isLocked]);

  // Auto-lock after inactivity
  const setupAutoLock = useCallback((timeoutMs: number = 60000) => {
    // This would be implemented with AppState
    // For now, just return the lock function
    return { lock };
  }, [lock]);

  return {
    isLocked,
    isAuthenticating,
    isEnabled: biometric.isEnabled,
    lock,
    unlock,
    setupAutoLock,
  };
}

export default useBiometric;
