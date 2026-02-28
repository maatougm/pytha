// Type definitions for compatibility
export interface PendingSyncItem {
    id: number;
    operation: string;
    entityType: string;
    entityId: string | null;
    payload: any;
    createdAt: number;
    retryCount: number;
    status: string;
}

export interface OfflineMessage {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    attachments: any[];
    createdAt: number;
    syncStatus: string;
    localOnly: boolean;
}

// Mock implementation for Web
class OfflineDatabaseWeb {
    async initialize(): Promise<void> {
        console.log('[OfflineDB-Web] Mock initialized - Web not fully supported yet');
    }

    // Sync Queue Operations
    async addToSyncQueue(
        operation: 'create' | 'update' | 'delete',
        entityType: string,
        entityId: string | null,
        payload: any
    ): Promise<number> {
        return 1;
    }

    async getPendingSyncItems(): Promise<PendingSyncItem[]> {
        return [];
    }

    async markSyncItemCompleted(id: number): Promise<void> { }

    async markSyncItemFailed(id: number): Promise<void> { }

    async removeSyncItem(id: number): Promise<void> { }

    async clearSyncQueue(): Promise<void> { }

    // Cache Operations
    async setCache(key: string, data: any, ttlMinutes?: number): Promise<void> {
        try {
            localStorage.setItem(`school_hub_cache_${key}`, JSON.stringify({
                data,
                cachedAt: Date.now(),
                expiresAt: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null
            }));
        } catch (e) {
            console.warn('localStorage not available', e);
        }
    }

    async getCache<T>(key: string): Promise<T | null> {
        try {
            const stored = localStorage.getItem(`school_hub_cache_${key}`);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                localStorage.removeItem(`school_hub_cache_${key}`);
                return null;
            }
            return parsed.data as T;
        } catch (e) {
            return null;
        }
    }

    async clearCache(): Promise<void> { }

    async clearExpiredCache(): Promise<void> { }

    // Offline Messages
    async saveOfflineMessage(message: {
        id: string;
        channelId: string;
        senderId: string;
        content: string;
        attachments?: any[];
        createdAt: number;
    }): Promise<void> { }

    async getOfflineMessages(channelId: string): Promise<OfflineMessage[]> {
        return [];
    }

    async markMessageSynced(messageId: string): Promise<void> { }

    async deleteOfflineMessage(messageId: string): Promise<void> { }

    // Offline Files
    async saveOfflineFile(file: {
        id: string;
        name: string;
        uri: string;
        size?: number;
        mimeType?: string;
    }): Promise<void> { }

    // User Data
    async setUserData(key: string, value: any): Promise<void> { }

    async getUserData<T>(key: string): Promise<T | null> {
        return null;
    }

    async removeUserData(key: string): Promise<void> { }

    // File upload queue
    async addFileToQueue(file: {
        id: string;
        name: string;
        uri: string;
        size: number;
        mimeType: string;
    }): Promise<void> { }

    async removeFileFromQueue(fileId: string): Promise<void> { }

    async getOfflineFiles(): Promise<any[]> {
        return [];
    }

    async markFileUploaded(fileId: string): Promise<void> { }

    async updateFileUploadProgress(fileId: string, progress: number): Promise<void> { }

    // Stats
    async getPendingSyncCount(): Promise<{
        pendingSync: number;
        offlineMessages: number;
        pendingFiles: number;
    }> {
        return { pendingSync: 0, offlineMessages: 0, pendingFiles: 0 };
    }

    async getOfflineMessageCount(): Promise<number> {
        return 0;
    }

    // Cleanup
    async clearAllData(): Promise<void> { }

    async close(): Promise<void> { }
}

export const offlineDatabase = new OfflineDatabaseWeb();
export default offlineDatabase;
