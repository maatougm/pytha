import apiClient from './api-client';
import offlineDB from './offlineDatabase';
import * as FileSystem from 'expo-file-system';

export interface UploadTask {
  id: string;
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
  metadata?: {
    courseId?: string;
    assignmentId?: string;
    description?: string;
  };
}

export interface UploadProgress {
  taskId: string;
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: UploadProgress | null;
  result: UploadResult | null;
  retryCount: number;
}

class FileUploadService {
  private activeUploads: Map<string, AbortController> = new Map();
  private uploadStates: Map<string, UploadState> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Upload a file with progress tracking
   */
  async upload(task: UploadTask, onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
    const { id } = task;

    // Initialize state
    this.uploadStates.set(id, {
      status: 'uploading',
      progress: null,
      result: null,
      retryCount: 0,
    });

    if (onProgress) {
      this.progressCallbacks.set(id, onProgress);
    }

    this.startTimes.set(id, Date.now());

    // Create abort controller for cancellation
    const abortController = new AbortController();
    this.activeUploads.set(id, abortController);

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(task.file.uri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const totalSize = fileInfo.size || task.file.size;

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: task.file.uri,
        name: task.file.name,
        type: task.file.type,
      } as any);

      // Add metadata
      if (task.metadata) {
        formData.append('metadata', JSON.stringify(task.metadata));
      }

      // Upload with progress tracking
      const response = await apiClient.post<{ id: string; url: string }>('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortController.signal,
        onUploadProgress: (progressEvent: any) => {
          this.handleProgress(id, progressEvent.loaded, totalSize);
        },
      });

      // Mark as completed
      this.uploadStates.set(id, {
        status: 'completed',
        progress: this.uploadStates.get(id)?.progress || null,
        result: { success: true, fileId: response.id, url: response.url },
        retryCount: 0,
      });

      this.cleanup(id);

      return { success: true, fileId: response.id, url: response.url };
    } catch (error) {
      // Handle cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        this.uploadStates.set(id, {
          status: 'paused',
          progress: this.uploadStates.get(id)?.progress || null,
          result: null,
          retryCount: 0,
        });
        return { success: false, error: 'Upload cancelled' };
      }

      // Handle error
      console.error(`[FileUpload] Upload failed for ${id}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      this.uploadStates.set(id, {
        status: 'error',
        progress: this.uploadStates.get(id)?.progress || null,
        result: { success: false, error: errorMessage },
        retryCount: (this.uploadStates.get(id)?.retryCount || 0) + 1,
      });

      this.cleanup(id);

      // Queue for offline if needed
      await this.queueForOffline(task);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle upload progress
   */
  private handleProgress(taskId: string, loaded: number, total: number) {
    const startTime = this.startTimes.get(taskId) || Date.now();
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    
    const percentage = Math.round((loaded / total) * 100);
    const speed = elapsed > 0 ? loaded / elapsed : 0;
    const remaining = speed > 0 ? (total - loaded) / speed : 0;

    const progress: UploadProgress = {
      taskId,
      loaded,
      total,
      percentage,
      speed,
      timeRemaining: remaining,
    };

    // Update state
    const state = this.uploadStates.get(taskId);
    if (state) {
      state.progress = progress;
    }

    // Call callback
    const callback = this.progressCallbacks.get(taskId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Cancel an upload
   */
  cancel(taskId: string): void {
    const controller = this.activeUploads.get(taskId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(taskId);
    }
  }

  /**
   * Pause an upload (cancel with intention to resume)
   */
  pause(taskId: string): void {
    this.cancel(taskId);
    
    const state = this.uploadStates.get(taskId);
    if (state) {
      state.status = 'paused';
    }
  }

  /**
   * Retry a failed upload
   */
  async retry(task: UploadTask, onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
    // Remove from offline queue if present
    await offlineDB.removeFileFromQueue(task.id);
    
    // Retry upload
    return this.upload(task, onProgress);
  }

  /**
   * Queue file for offline upload
   */
  private async queueForOffline(task: UploadTask): Promise<void> {
    try {
      await offlineDB.addFileToQueue({
        id: task.id,
        name: task.file.name,
        uri: task.file.uri,
        size: task.file.size,
        mimeType: task.file.type,
      });
      console.log(`[FileUpload] Queued for offline: ${task.id}`);
    } catch (error) {
      console.error('[FileUpload] Failed to queue for offline:', error);
    }
  }

  /**
   * Get upload state
   */
  getState(taskId: string): UploadState | undefined {
    return this.uploadStates.get(taskId);
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  /**
   * Clean up after upload completes/fails
   */
  private cleanup(taskId: string): void {
    this.activeUploads.delete(taskId);
    this.progressCallbacks.delete(taskId);
    this.startTimes.delete(taskId);
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Format time to human readable
   */
  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  /**
   * Validate file before upload
   */
  async validateFile(uri: string, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): Promise<{ valid: boolean; error?: string }> {
    const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      if (!info.exists) {
        return { valid: false, error: 'File does not exist' };
      }

      if (info.size && info.size > maxSize) {
        return { 
          valid: false, 
          error: `File too large. Max size: ${this.formatBytes(maxSize)}` 
        };
      }

      // Check file type if specified
      if (allowedTypes && info.uri) {
        const extension = info.uri.split('.').pop()?.toLowerCase();
        const mimeType = this.getMimeType(extension || '');
        
        if (!allowedTypes.includes(mimeType)) {
          return { valid: false, error: 'File type not allowed' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate file' };
    }
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Clear all upload states
   */
  clearAll(): void {
    // Cancel all active uploads
    for (const [id, controller] of this.activeUploads) {
      controller.abort();
    }

    this.activeUploads.clear();
    this.uploadStates.clear();
    this.progressCallbacks.clear();
    this.startTimes.clear();
  }
}

// Export singleton
export const fileUploadService = new FileUploadService();
export default fileUploadService;
