import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseApiReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic API hook for making authenticated API calls
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const result = await apiFunction(...args);
        setState({ data: result, isLoading: false, error: null });
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, isLoading: false, error: errorObj });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for making authenticated API requests with automatic token handling
 */
export function useAuthenticatedApi() {
  const { user } = useAuth();

  const makeRequest = useCallback(
    async <T = any>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${user.id}` } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    [user]
  );

  return { makeRequest };
}
