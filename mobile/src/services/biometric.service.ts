/**
 * Biometric Authentication Service
 * 
 * Provides Face ID / Touch ID authentication using expo-local-authentication.
 * Credentials are securely stored in expo-secure-store after first successful login.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

interface BiometricCredentials {
  email: string;
  password: string;
  role: string;
}

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Biometric availability check error:', error);
    return false;
  }
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<LocalAuthentication.SecurityLevel | null> {
  if (Platform.OS === 'web') return null;

  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level;
  } catch (error) {
    console.error('Biometric type check error:', error);
    return null;
  }
}

/**
 * Get human-readable label for biometric type
 */
export function getBiometricLabel(type: LocalAuthentication.SecurityLevel | null): string {
  switch (type) {
    case LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG:
      return Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';
    case LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK:
      return 'Biometric';
    case LocalAuthentication.SecurityLevel.SECRET:
      return 'Device Passcode';
    default:
      return 'Biometric';
  }
}

/**
 * Check if biometric authentication is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Biometric enabled check error:', error);
    return false;
  }
}

/**
 * Enable biometric authentication and store credentials securely
 */
export async function enableBiometric(credentials: BiometricCredentials): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    // First authenticate with biometrics to verify user
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable Face ID / Touch ID',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    // Store credentials securely
    const credentialsJson = JSON.stringify(credentials);
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentialsJson);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

    return true;
  } catch (error) {
    console.error('Enable biometric error:', error);
    return false;
  }
}

/**
 * Disable biometric authentication and remove stored credentials
 */
export async function disableBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('Disable biometric error:', error);
    return false;
  }
}

/**
 * Authenticate with biometrics and return stored credentials
 */
export async function authenticateWithBiometric(): Promise<BiometricCredentials | null> {
  if (Platform.OS === 'web') return null;

  try {
    // Check if biometrics is enabled
    const enabled = await isBiometricEnabled();
    if (!enabled) return null;

    // Authenticate with biometrics
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in with Face ID / Touch ID',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (!result.success) {
      return null;
    }

    // Retrieve stored credentials
    const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!credentialsJson) return null;

    return JSON.parse(credentialsJson) as BiometricCredentials;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return null;
  }
}

/**
 * Update stored biometric credentials (e.g., after password change)
 */
export async function updateBiometricCredentials(credentials: BiometricCredentials): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const enabled = await isBiometricEnabled();
    if (!enabled) return false;

    const credentialsJson = JSON.stringify(credentials);
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentialsJson);
    return true;
  } catch (error) {
    console.error('Update biometric credentials error:', error);
    return false;
  }
}

/**
 * Check biometric status - comprehensive check
 */
export async function getBiometricStatus(): Promise<{
  available: boolean;
  enabled: boolean;
  type: LocalAuthentication.SecurityLevel | null;
  label: string;
}> {
  const available = await isBiometricAvailable();
  const enabled = available ? await isBiometricEnabled() : false;
  const type = available ? await getBiometricType() : null;
  const label = getBiometricLabel(type);

  return {
    available,
    enabled,
    type,
    label,
  };
}
