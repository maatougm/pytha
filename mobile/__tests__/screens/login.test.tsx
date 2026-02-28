import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/login';

// Mock the providers and hooks
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
  }),
}));

jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      primary: '#3b82f6',
      accent: '#8b5cf6',
      background: '#ffffff',
      backgroundDark: '#f3f4f6',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#0ea5e9',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/src/services/biometric.service', () => ({
  isBiometricAvailable: jest.fn().mockResolvedValue(false),
  isBiometricEnabled: jest.fn().mockResolvedValue(false),
  authenticateWithBiometric: jest.fn(),
  getBiometricLabel: jest.fn().mockReturnValue('Biometric'),
  getBiometricType: jest.fn().mockResolvedValue(null),
  enableBiometric: jest.fn(),
}));

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByLabelText } = render(<LoginScreen />);
    
    expect(getByText('School Hub')).toBeTruthy();
    expect(getByText('Connect. Learn. Grow.')).toBeTruthy();
    expect(getByLabelText('Email address')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByLabelText, getByText, findByText } = render(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const signInButton = getByText('Sign In');
    
    // Enter invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);
    
    // Check for validation error
    const errorMessage = await findByText('Please enter a valid email address');
    expect(errorMessage).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText, findByText } = render(<LoginScreen />);
    
    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);
    
    // Check for required field errors
    const emailError = await findByText('Email is required');
    expect(emailError).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const { getByLabelText } = render(<LoginScreen />);
    
    const toggleButton = getByLabelText('Show password');
    expect(toggleButton).toBeTruthy();
    
    fireEvent.press(toggleButton);
    
    // After toggle, should show "Hide password"
    const hideButton = getByLabelText('Hide password');
    expect(hideButton).toBeTruthy();
  });

  it('has role selector dropdown', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);
    
    const roleSelector = getByLabelText('Select your role');
    expect(roleSelector).toBeTruthy();
    
    // Open dropdown
    fireEvent.press(roleSelector);
    
    // Check for role options
    expect(getByLabelText('Select Admin role')).toBeTruthy();
    expect(getByLabelText('Select Teacher role')).toBeTruthy();
    expect(getByLabelText('Select Parent role')).toBeTruthy();
    expect(getByLabelText('Select Student role')).toBeTruthy();
  });

  it('has remember me checkbox', () => {
    const { getByLabelText } = render(<LoginScreen />);
    
    const rememberMeCheckbox = getByLabelText('Remember me');
    expect(rememberMeCheckbox).toBeTruthy();
    
    // Toggle checkbox
    fireEvent.press(rememberMeCheckbox);
    expect(rememberMeCheckbox.props.accessibilityState.checked).toBe(true);
  });

  it('has forgot password link', () => {
    const { getByLabelText } = render(<LoginScreen />);
    
    const forgotPasswordLink = getByLabelText('Forgot password');
    expect(forgotPasswordLink).toBeTruthy();
  });

  it('has sign up link', () => {
    const { getByText } = render(<LoginScreen />);
    
    const signUpLink = getByText('Sign Up');
    expect(signUpLink).toBeTruthy();
  });
});
