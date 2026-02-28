/**
 * Authentication Service
 * 
 * Handles user authentication including login, registration,
 * token refresh, password reset, and logout.
 */

import apiClient, { storeTokens, clearTokens } from './api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  UserRole,
} from '../types/api';

/**
 * Login with email and password
 * @param email - User email address
 * @param password - User password
 * @param role - Optional role hint for the login
 * @returns Promise with user data and access token
 */
export async function login(
  email: string,
  password: string,
  role?: UserRole
): Promise<LoginResponse> {
  const data: LoginRequest = { email, password };
  const response = await apiClient.post<LoginResponse>('/auth/login', data, {
    skipAuth: true,
  });
  
  // Store tokens securely
  await storeTokens({
    accessToken: response.accessToken,
  });
  
  return response;
}

/**
 * Register a new user account
 * @param data - Registration data including email, password, name, and role
 * @returns Promise with created user data and access token
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data, {
    skipAuth: true,
  });
  
  // Store tokens securely
  await storeTokens({
    accessToken: response.accessToken,
  });
  
  return response;
}

/**
 * Refresh the access token using the stored refresh token
 * @returns Promise with new access token and user data
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshToken = await apiClient.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await apiClient.post<RefreshTokenResponse>(
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true }
  );
  
  // Store new access token
  await storeTokens({
    accessToken: response.accessToken,
  });
  
  return response;
}

/**
 * Logout the current user and invalidate tokens
 * @returns Promise that resolves when logout is complete
 */
export async function logout(): Promise<{ message: string }> {
  try {
    const refreshToken = await apiClient.getRefreshToken();
    
    await apiClient.post('/auth/logout', { refreshToken });
  } finally {
    // Always clear local tokens even if server request fails
    await clearTokens();
  }
  
  return { message: 'Logout successful' };
}

/**
 * Request a password reset email
 * @param email - User email address
 * @returns Promise with success message
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const data: ForgotPasswordRequest = { email };
  
  return apiClient.post<{ message: string }>('/auth/forgot-password', data, {
    skipAuth: true,
  });
}

/**
 * Reset password using token from email
 * @param token - Reset token from email
 * @param password - New password
 * @returns Promise with success message
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const data: ResetPasswordRequest = { token, password };
  
  return apiClient.post<{ message: string }>('/auth/reset-password', data, {
    skipAuth: true,
  });
}

/**
 * Get current user profile
 * @returns Promise with current user data
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/auth/profile');
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const authService = {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};

export default authService;
