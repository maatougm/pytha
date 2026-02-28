import offlineDatabase from './offlineDatabase';
import apiClient from './api-client';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'completed';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export type SyncProgressCallback = (progress: {
  total: number;
  completed: number;
  currentItem: string;
}) => void;

class SyncService {
  private isSyncing = false;
  private abortController: AbortController | null = null;

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    await offlineDatabase.initialize();
    console.log('[SyncService] Initialized');
  }

  /**
   * Check if sync is currently in progress
   */
  get syncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending data to the server
   */
  async syncAll(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    this.abortController = new AbortController();

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log('[SyncService] Starting sync...');

      // Sync queue items
      const queueResult = await this.syncQueue(onProgress);
      result.synced += queueResult.synced;
      result.failed += queueResult.failed;
      result.errors.push(...queueResult.errors);

      // Sync offline messages
      const messageResult = await this.syncMessages(onProgress);
      result.synced += messageResult.synced;
      result.failed += messageResult.failed;
      result.errors.push(...messageResult.errors);

      // Sync pending files
      const fileResult = await this.syncFiles(onProgress);
      result.synced += fileResult.synced;
      result.failed += fileResult.failed;
      result.errors.push(...fileResult.errors);

      // Clean up completed items
      await offlineDatabase.clearSyncQueue();

      console.log('[SyncService] Sync completed:', result);
      return result;
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    } finally {
      this.isSyncing = false;
      this.abortController = null;
    }
  }

  /**
   * Sync queue items
   */
  private async syncQueue(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    const items = await offlineDatabase.getPendingSyncItems();

    if (items.length === 0) return result;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if aborted
      if (this.abortController?.signal.aborted) {
        break;
      }

      onProgress?.({
        total: items.length,
        completed: i,
        currentItem: `${item.operation} ${item.entityType}`,
      });

      try {
        await this.processQueueItem(item);
        await offlineDatabase.markSyncItemCompleted(item.id);
        result.synced++;
      } catch (error) {
        console.error(`[SyncService] Failed to sync item ${item.id}:`, error);
        await offlineDatabase.markSyncItemFailed(item.id);
        result.failed++;
        result.errors.push(`Failed to sync ${item.entityType}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: any): Promise<void> {
    const { operation, entityType, entityId, payload } = item;

    switch (operation) {
      case 'create':
        await apiClient.post(`/api/${entityType}`, payload);
        break;
      case 'update':
        await apiClient.patch(`/api/${entityType}/${entityId}`, payload);
        break;
      case 'delete':
        await apiClient.delete(`/api/${entityType}/${entityId}`);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Sync offline messages
   */
  private async syncMessages(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    
    // Get all unique channel IDs
    const stats = await offlineDatabase.getPendingSyncCount();
    if (stats.offlineMessages === 0) return result;

    // For each channel, get and sync messages
    const channels = await this.getChannelsWithOfflineMessages();
    
    for (let i = 0; i < channels.length; i++) {
      const channelId = channels[i];
      const messages = await offlineDatabase.getOfflineMessages(channelId);
      
      for (const message of messages) {
        if (message.syncStatus === 'synced') continue;

        if (this.abortController?.signal.aborted) {
          break;
        }

        try {
          await apiClient.post('/api/messages', {
            channelId: message.channelId,
            content: message.content,
            attachments: message.attachments,
          });
          
          await offlineDatabase.markMessageSynced(message.id);
          result.synced++;
        } catch (error) {
          console.error(`[SyncService] Failed to sync message ${message.id}:`, error);
          result.failed++;
          result.errors.push(`Failed to sync message: ${error}`);
        }
      }
    }

    return result;
  }

  /**
   * Get channels with offline messages
   */
  private async getChannelsWithOfflineMessages(): Promise<string[]> {
    // This would query distinct channel IDs from the database
    // For now, return empty array
    return [];
  }

  /**
   * Sync pending files
   */
  private async syncFiles(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    const files = await offlineDatabase.getOfflineFiles();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (this.abortController?.signal.aborted) {
        break;
      }

      onProgress?.({
        total: files.length,
        completed: i,
        currentItem: `Uploading ${file.name}`,
      });

      try {
        await this.uploadFile(file);
        await offlineDatabase.markFileUploaded(file.id);
        result.synced++;
      } catch (error) {
        console.error(`[SyncService] Failed to upload file ${file.id}:`, error);
        await offlineDatabase.updateFileUploadProgress(file.id, -1);
        result.failed++;
        result.errors.push(`Failed to upload ${file.name}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Upload a single file
   */
  private async uploadFile(file: any): Promise<void> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mime_type,
    } as any);

    await apiClient.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        offlineDatabase.updateFileUploadProgress(file.id, progress);
      },
    });
  }

  /**
   * Cancel ongoing sync
   */
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isSyncing = false;
    }
  }

  /**
   * Get sync statistics
   */
  async getStats(): Promise<{
    isSyncing: boolean;
    pendingItems: number;
    pendingMessages: number;
    pendingFiles: number;
  }> {
    const dbStats = await offlineDatabase.getPendingSyncCount();
    
    return {
      isSyncing: this.isSyncing,
      pendingItems: dbStats.pendingSync,
      pendingMessages: dbStats.offlineMessages,
      pendingFiles: dbStats.pendingFiles,
    };
  }

  /**
   * Queue an item for sync
   */
  async queueItem(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string | null,
    payload: any
  ): Promise<number> {
    return await offlineDatabase.addToSyncQueue(operation, entityType, entityId, payload);
  }

  /**
   * Clear all sync data
   */
  async clearAll(): Promise<void> {
    await offlineDatabase.clearAllData();
  }
}

export const syncService = new SyncService();
export default syncService;
