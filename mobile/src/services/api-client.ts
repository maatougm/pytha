/**
 * API Client for School Hub Mobile App
 * 
 * Configured fetch client with:
 * - Base URL from environment variables
 * - Request interceptor to add JWT token
 * - Response interceptor for token refresh on 401
 * - Error handling with custom ApiError class
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// SecureStore is native-only, use AsyncStorage for web
let SecureStore: any;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Cross-platform storage helpers
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ============================================================
// CONFIGURATION
// ============================================================

// Your computer's IP address - UPDATE THIS to match your network
const COMPUTER_IP = '10.181.191.47';

// Use IP for native devices, localhost for web
const DEFAULT_API_HOST = Platform.OS === 'web' ? 'localhost:3000' : `${COMPUTER_IP}:3000`;

const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || process.env.EXPO_PUBLIC_API_URL 
  || `http://${DEFAULT_API_HOST}/api`;

const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

// ============================================================
// CUSTOM ERROR CLASS
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

interface TokenData {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Store authentication tokens securely
 */
export async function storeTokens(tokens: TokenData): Promise<void> {
  try {
    await storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
}

/**
 * Retrieve access token from secure storage
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await storage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Retrieve refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await storage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Clear all stored tokens
 */
export async function clearTokens(): Promise<void> {
  try {
    await storage.deleteItem(ACCESS_TOKEN_KEY);
    await storage.deleteItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

// ============================================================
// REQUEST INTERCEPTORS
// ============================================================

const DEFAULT_TIMEOUT = 15000; // 15 seconds

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  retryCount?: number;
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void;
  params?: Record<string, any>;
}

/**
 * Apply request interceptors (add auth header, etc.)
 */
async function applyRequestInterceptors(
  url: string,
  config: RequestConfig
): Promise<{ url: string; config: RequestConfig }> {
  const headers = new Headers(config.headers || {});
  
  // Set default content type if not present and not FormData
  if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add auth token if not skipped
  if (!config.skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  return {
    url,
    config: {
      ...config,
      headers,
    },
  };
}

// ============================================================
// TOKEN REFRESH LOGIC
// ============================================================

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

async function performTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Wait for existing refresh to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }
  
  isRefreshing = true;
  
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    // Store new tokens
    await storeTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
    });
    
    onTokenRefreshed(data.accessToken);
    return data.accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    await clearTokens();
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ============================================================
// RESPONSE HANDLING
// ============================================================

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }
  
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.message || 'Request failed',
        response.status,
        errorData.code,
        errorData.errors
      );
    }
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  
  if (!isJson) {
    return (await response.text()) as unknown as T;
  }
  
  return await response.json() as T;
}

// ============================================================
// MAIN API CLIENT
// ============================================================

/**
 * Make an HTTP request with interceptors and error handling
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || DEFAULT_TIMEOUT);

  // Apply request interceptors
  const { url: finalUrl, config: finalConfig } = await applyRequestInterceptors(url, { ...config, signal: controller.signal });
  
  try {
    const response = await fetch(finalUrl, finalConfig);
    clearTimeout(timeoutId);
    
    // Handle 401 - Token expired
    if (response.status === 401 && !config.skipAuth) {
      if (!config.retryCount || config.retryCount === 0) {
        const newToken = await performTokenRefresh();

        if (newToken) {
          // Retry the request with new token
          return request<T>(endpoint, {
            ...config,
            retryCount: (config.retryCount || 0) + 1,
          });
        }
      }
      
      // Refresh failed or already retried, clear tokens and throw
      await clearTokens();
      throw new ApiError('Session expired. Please login again.', 401, 'SESSION_EXPIRED');
    }
    
    return await handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, 'REQUEST_TIMEOUT');
    }

    // Network errors or other fetch failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// ============================================================
// HTTP METHODS
// ============================================================

/**
 * HTTP GET request
 */
export function get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'GET' });
}

/**
 * HTTP POST request
 */
export function post<T>(
  endpoint: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * HTTP PUT request
 */
export function put<T>(
  endpoint: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * HTTP PATCH request
 */
export function patch<T>(
  endpoint: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * HTTP DELETE request
 */
export function del<T>(endpoint: string, config?: RequestConfig): Promise<T> {
  return request<T>(endpoint, { ...config, method: 'DELETE' });
}

// ============================================================
// EXPORT DEFAULT CLIENT
// ============================================================

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
};

export default apiClient;
