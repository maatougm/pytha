import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'wimax' | 'vpn' | 'other' | 'unknown' | 'none';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isMetered: boolean | null;
}

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: 'unknown',
    isWifi: false,
    isCellular: false,
    isMetered: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateStatus);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(updateStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  const updateStatus = useCallback((state: NetInfoState) => {
    setStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: (state.type as ConnectionType) || 'unknown',
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
      isMetered: (state as any).details?.isConnectionExpensive ?? null,
    });
  }, []);

  return status;
}

/**
 * Hook to detect when device comes back online
 */
export function useOnlineCallback(callback: () => void) {
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      
      if (wasOffline && isOnline) {
        callback();
      }
      
      setWasOffline(!isOnline);
    });

    return () => unsubscribe();
  }, [callback, wasOffline]);
}

/**
 * Hook to check if we're on unmetered connection (wifi)
 */
export function useUnmeteredConnection(): boolean {
  const status = useNetworkStatus();
  return status.isConnected && status.isWifi;
}

/**
 * Hook to force refresh network status
 */
export function useRefreshNetworkStatus() {
  return useCallback(async () => {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
    };
  }, []);
}
