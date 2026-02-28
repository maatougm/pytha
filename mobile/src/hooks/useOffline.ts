import { useState, useEffect, useCallback, useRef } from 'react';
import offlineDatabase from '@/src/services/offlineDatabase';
import { syncService, SyncResult } from '@/src/services/syncService';
import { useNetworkStatus } from './useNetworkStatus';
import { AppState, AppStateStatus } from 'react-native';

export interface OfflineState {
  isOnline: boolean;
  isWifi: boolean;
  isSyncing: boolean;
  pendingItems: number;
  pendingMessages: number;
  pendingFiles: number;
  lastSyncTime: Date | null;
  syncError: string | null;
}

export interface OfflineActions {
  sync: () => Promise<SyncResult>;
  queueItem: (
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string | null,
    payload: any
  ) => Promise<number>;
  saveMessage: (message: {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    attachments?: any[];
  }) => Promise<void>;
  getMessages: (channelId: string) => Promise<any[]>;
  queueFile: (file: {
    id: string;
    name: string;
    uri: string;
    size: number;
    mimeType: string;
  }) => Promise<void>;
  cacheData: <T>(key: string, data: T, ttlMinutes?: number) => Promise<void>;
  getCachedData: <T>(key: string) => Promise<T | null>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing offline functionality
 */
export function useOffline(): OfflineState & OfflineActions {
  const networkStatus = useNetworkStatus();
  const [state, setState] = useState<OfflineState>({
    isOnline: networkStatus.isConnected && (networkStatus.isInternetReachable ?? true),
    isWifi: networkStatus.isWifi,
    isSyncing: false,
    pendingItems: 0,
    pendingMessages: 0,
    pendingFiles: 0,
    lastSyncTime: null,
    syncError: null,
  });

  const initialized = useRef(false);

  // Initialize offline database
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      offlineDatabase.initialize().then(() => {
        console.log('[useOffline] Database initialized');
        refreshStats();
      });
    }
  }, []);

  // Update online status
  useEffect(() => {
    const isOnline = networkStatus.isConnected && (networkStatus.isInternetReachable ?? true);
    setState(prev => ({
      ...prev,
      isOnline,
      isWifi: networkStatus.isWifi,
    }));
  }, [networkStatus]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && !state.isSyncing && state.pendingItems > 0) {
      // Debounce auto-sync
      const timeout = setTimeout(() => {
        sync();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [state.isOnline, state.pendingItems]);

  // Sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && state.isOnline && !state.isSyncing) {
        refreshStats();
      }
    });

    return () => subscription.remove();
  }, [state.isOnline, state.isSyncing]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const stats = await syncService.getStats();
      setState(prev => ({
        ...prev,
        isSyncing: stats.isSyncing,
        pendingItems: stats.pendingItems,
        pendingMessages: stats.pendingMessages,
        pendingFiles: stats.pendingFiles,
      }));
    } catch (error) {
      console.error('[useOffline] Failed to refresh stats:', error);
    }
  }, []);

  // Sync all pending data
  const sync = useCallback(async (): Promise<SyncResult> => {
    if (state.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!state.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: ['Device is offline'] };
    }

    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const result = await syncService.syncAll((progress) => {
        console.log(`[useOffline] Sync progress: ${progress.completed}/${progress.total} - ${progress.currentItem}`);
      });

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        syncError: result.success ? null : result.errors.join(', '),
      }));

      await refreshStats();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
      return { success: false, synced: 0, failed: 0, errors: [errorMessage] };
    }
  }, [state.isSyncing, state.isOnline, refreshStats]);

  // Queue an item for sync
  const queueItem = useCallback(
    async (
      operation: 'create' | 'update' | 'delete',
      entityType: string,
      entityId: string | null,
      payload: any
    ): Promise<number> => {
      const id = await syncService.queueItem(operation, entityType, entityId, payload);
      await refreshStats();
      return id;
    },
    [refreshStats]
  );

  // Save message offline
  const saveMessage = useCallback(
    async (message: {
      id: string;
      channelId: string;
      senderId: string;
      content: string;
      attachments?: any[];
    }): Promise<void> => {
      await offlineDatabase.saveOfflineMessage({
        ...message,
        createdAt: Date.now(),
      });
      await refreshStats();
    },
    [refreshStats]
  );

  // Get offline messages
  const getMessages = useCallback(async (channelId: string): Promise<any[]> => {
    return await offlineDatabase.getOfflineMessages(channelId);
  }, []);

  // Queue file for upload
  const queueFile = useCallback(
    async (file: {
      id: string;
      name: string;
      uri: string;
      size: number;
      mimeType: string;
    }): Promise<void> => {
      await offlineDatabase.addFileToQueue(file);
      await refreshStats();
    },
    [refreshStats]
  );

  // Cache data
  const cacheData = useCallback(
    async <T>(key: string, data: T, ttlMinutes?: number): Promise<void> => {
      await offlineDatabase.setCache(key, data, ttlMinutes);
    },
    []
  );

  // Get cached data
  const getCachedData = useCallback(async <T>(key: string): Promise<T | null> => {
    return await offlineDatabase.getCache<T>(key);
  }, []);

  // Refresh all stats
  const refresh = useCallback(async (): Promise<void> => {
    await refreshStats();
  }, [refreshStats]);

  return {
    ...state,
    sync,
    queueItem,
    saveMessage,
    getMessages,
    queueFile,
    cacheData,
    getCachedData,
    refresh,
  };
}

/**
 * Hook to check if operation should be queued for offline
 */
export function useOfflineQueue() {
  const network = useNetworkStatus();

  const shouldQueue = useCallback((): boolean => {
    return !network.isConnected || network.isInternetReachable === false;
  }, [network]);

  return { shouldQueue, isOnline: network.isConnected };
}

/**
 * Hook to cache API responses
 */
export function useCachedQuery<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttlMinutes?: number; enabled?: boolean } = {}
) {
  const { ttlMinutes = 5, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const network = useNetworkStatus();

  const fetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = await offlineDatabase.getCache<T>(key);
      
      if (cached && !network.isConnected) {
        // Use cached data when offline
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data if online
      if (network.isConnected) {
        const fresh = await fetchFn();
        await offlineDatabase.setCache(key, fresh, ttlMinutes);
        setData(fresh);
      } else if (cached) {
        setData(cached);
      } else {
        throw new Error('No cached data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttlMinutes, enabled, network.isConnected]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
