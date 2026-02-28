import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Table schemas
const SCHEMA = {
  syncQueue: `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending'
    )
  `,
  cachedData: `
    CREATE TABLE IF NOT EXISTS cached_data (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      expires_at INTEGER
    )
  `,
  messages: `
    CREATE TABLE IF NOT EXISTS offline_messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT,
      created_at INTEGER NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      local_only INTEGER DEFAULT 1
    )
  `,
  files: `
    CREATE TABLE IF NOT EXISTS offline_files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      uri TEXT NOT NULL,
      size INTEGER,
      mime_type TEXT,
      upload_status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0
    )
  `,
  userData: `
    CREATE TABLE IF NOT EXISTS user_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
};

// Type definitions
interface SyncQueueItem {
  id: number;
  operation: string;
  entity_type: string;
  entity_id: string | null;
  payload: string;
  created_at: number;
  retry_count: number;
  status: string;
}

interface CacheRow {
  key: string;
  data: string;
  cached_at: number;
  expires_at: number | null;
}

interface OfflineMessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  attachments: string | null;
  created_at: number;
  sync_status: string;
  local_only: number;
}

interface OfflineFileRow {
  id: string;
  name: string;
  uri: string;
  size: number | null;
  mime_type: string | null;
  upload_status: string;
  progress: number;
  created_at: number;
  retry_count: number;
}

interface UserDataRow {
  key: string;
  value: string;
  updated_at: number;
}

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

class OfflineDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('school_hub_offline.db');
      
      // Create tables
      for (const [name, sql] of Object.entries(SCHEMA)) {
        await this.db.execAsync(sql);
        console.log(`[OfflineDB] Table ${name} initialized`);
      }

      this.isInitialized = true;
      console.log('[OfflineDB] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineDB] Failed to initialize:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  // Sync Queue Operations
  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string | null,
    payload: any
  ): Promise<number> {
    await this.ensureInitialized();
    
    const result = await this.db!.runAsync(
      `INSERT INTO sync_queue (operation, entity_type, entity_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [operation, entityType, entityId, JSON.stringify(payload), Date.now()]
    );

    return result.lastInsertRowId;
  }

  async getPendingSyncItems(): Promise<PendingSyncItem[]> {
    await this.ensureInitialized();
    
    const rows = await this.db!.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 50`
    );

    return rows.map(row => ({
      id: row.id,
      operation: row.operation,
      entityType: row.entity_type,
      entityId: row.entity_id,
      payload: JSON.parse(row.payload),
      createdAt: row.created_at,
      retryCount: row.retry_count,
      status: row.status,
    }));
  }

  async markSyncItemCompleted(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      'UPDATE sync_queue SET status = ? WHERE id = ?',
      ['completed', id]
    );
  }

  async markSyncItemFailed(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE sync_queue 
       SET retry_count = retry_count + 1,
           status = CASE WHEN retry_count >= 5 THEN 'failed' ELSE 'pending' END
       WHERE id = ?`,
      [id]
    );
  }

  async removeSyncItem(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async clearSyncQueue(): Promise<void> {
    await this.ensureInitialized();
    await this.db!.execAsync("DELETE FROM sync_queue WHERE status = 'completed'");
  }

  // Cache Operations
  async setCache(key: string, data: any, ttlMinutes?: number): Promise<void> {
    await this.ensureInitialized();
    
    const expiresAt = ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null;
    
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO cached_data (key, data, cached_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [key, JSON.stringify(data), Date.now(), expiresAt]
    );
  }

  async getCache<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();
    
    const row = await this.db!.getFirstAsync<CacheRow>(
      `SELECT data, expires_at FROM cached_data WHERE key = ?`,
      [key]
    );

    if (!row) return null;

    // Check expiration
    if (row.expires_at && Date.now() > row.expires_at) {
      await this.db!.runAsync('DELETE FROM cached_data WHERE key = ?', [key]);
      return null;
    }

    return JSON.parse(row.data) as T;
  }

  async clearCache(): Promise<void> {
    await this.ensureInitialized();
    await this.db!.execAsync('DELETE FROM cached_data');
  }

  async clearExpiredCache(): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      'DELETE FROM cached_data WHERE expires_at IS NOT NULL AND expires_at < ?',
      [Date.now()]
    );
  }

  // Offline Messages
  async saveOfflineMessage(message: {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    attachments?: any[];
    createdAt: number;
  }): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO offline_messages 
       (id, channel_id, sender_id, content, attachments, created_at, sync_status, local_only)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.channelId,
        message.senderId,
        message.content,
        message.attachments ? JSON.stringify(message.attachments) : null,
        message.createdAt,
        'pending',
        1
      ]
    );
  }

  async getOfflineMessages(channelId: string): Promise<OfflineMessage[]> {
    await this.ensureInitialized();
    
    const rows = await this.db!.getAllAsync<OfflineMessageRow>(
      `SELECT * FROM offline_messages 
       WHERE channel_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [channelId]
    );

    return rows.map(row => ({
      id: row.id,
      channelId: row.channel_id,
      senderId: row.sender_id,
      content: row.content,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      createdAt: row.created_at,
      syncStatus: row.sync_status,
      localOnly: row.local_only === 1,
    }));
  }

  async markMessageSynced(messageId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE offline_messages 
       SET sync_status = 'synced', local_only = 0 
       WHERE id = ?`,
      [messageId]
    );
  }

  async deleteOfflineMessage(messageId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync('DELETE FROM offline_messages WHERE id = ?', [messageId]);
  }

  // Offline Files
  async saveOfflineFile(file: {
    id: string;
    name: string;
    uri: string;
    size?: number;
    mimeType?: string;
  }): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO offline_files 
       (id, name, uri, size, mime_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [file.id, file.name, file.uri, file.size || null, file.mimeType || null, Date.now()]
    );
  }

  // User Data
  async setUserData(key: string, value: any): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO user_data (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [key, JSON.stringify(value), Date.now()]
    );
  }

  async getUserData<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();
    
    const row = await this.db!.getFirstAsync<UserDataRow>(
      'SELECT value FROM user_data WHERE key = ?',
      [key]
    );

    return row ? JSON.parse(row.value) as T : null;
  }

  async removeUserData(key: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync('DELETE FROM user_data WHERE key = ?', [key]);
  }

  // File upload queue
  async addFileToQueue(file: {
    id: string;
    name: string;
    uri: string;
    size: number;
    mimeType: string;
  }): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO offline_files (id, name, uri, size, mime_type, upload_status, progress, created_at, retry_count) 
       VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, 0)`,
      [file.id, file.name, file.uri, file.size, file.mimeType, Date.now()]
    );
  }

  async removeFileFromQueue(fileId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync('DELETE FROM offline_files WHERE id = ?', [fileId]);
  }

  async getOfflineFiles(): Promise<OfflineFileRow[]> {
    await this.ensureInitialized();
    return await this.db!.getAllAsync<OfflineFileRow>(
      `SELECT * FROM offline_files WHERE upload_status = 'pending' ORDER BY created_at ASC`
    );
  }

  async markFileUploaded(fileId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE offline_files SET upload_status = 'completed' WHERE id = ?`,
      [fileId]
    );
  }

  async updateFileUploadProgress(fileId: string, progress: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE offline_files SET progress = ? WHERE id = ?`,
      [progress, fileId]
    );
  }

  // Stats
  async getPendingSyncCount(): Promise<{
    pendingSync: number;
    offlineMessages: number;
    pendingFiles: number;
  }> {
    await this.ensureInitialized();
    
    const syncRow = await this.db!.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
    );
    
    const messagesRow = await this.db!.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM offline_messages WHERE sync_status = 'pending'`
    );
    
    const filesRow = await this.db!.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM offline_files WHERE upload_status = 'pending'`
    );

    return {
      pendingSync: syncRow?.count || 0,
      offlineMessages: messagesRow?.count || 0,
      pendingFiles: filesRow?.count || 0,
    };
  }

  async getOfflineMessageCount(): Promise<number> {
    await this.ensureInitialized();
    
    const row = await this.db!.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM offline_messages WHERE sync_status = 'pending'`
    );

    return row?.count || 0;
  }

  // Cleanup
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    
    await this.db!.execAsync(`
      DELETE FROM sync_queue;
      DELETE FROM cached_data;
      DELETE FROM offline_messages;
      DELETE FROM offline_files;
      DELETE FROM user_data;
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const offlineDatabase = new OfflineDatabase();
export default offlineDatabase;
