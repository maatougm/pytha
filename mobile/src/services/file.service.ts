/**
 * File Service
 * 
 * Handles file uploads, downloads, previews, and management.
 */

import apiClient from './api-client';
import type {
  FileInfo,
  FilePermission,
  UploadQuota,
  AllowedFileTypes,
  UploadFileResponse,
  SetFilePermissionRequest,
  FileFilters,
  FileCategory,
} from '../types/api';

// ============================================================
// UPLOAD OPERATIONS
// ============================================================

/**
 * Upload a file to the server
 * @param file - File object to upload
 * @param options - Optional metadata (relatedId, relatedType, description)
 * @returns Promise with upload response
 */
export async function uploadFile(
  file: File | Blob,
  options?: {
    relatedId?: string;
    relatedType?: string;
    description?: string;
    fileName?: string;
  }
): Promise<UploadFileResponse> {
  const formData = new FormData();
  
  // Handle different file types
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    // For Blob, create a File-like object
    const fileName = options?.fileName || 'upload';
    formData.append('file', file, fileName);
  }
  
  if (options?.relatedId) {
    formData.append('relatedId', options.relatedId);
  }
  if (options?.relatedType) {
    formData.append('relatedType', options.relatedType);
  }
  if (options?.description) {
    formData.append('description', options.description);
  }
  
  return apiClient.post<UploadFileResponse>('/files/upload', formData);
}

/**
 * Get upload quota information for current user
 * @returns Promise with quota data
 */
export async function getUploadQuota(): Promise<UploadQuota> {
  return apiClient.get<UploadQuota>('/files/quota');
}

/**
 * Get allowed file types for upload
 * @returns Promise with allowed types configuration
 */
export async function getAllowedFileTypes(): Promise<AllowedFileTypes> {
  return apiClient.get<AllowedFileTypes>('/files/allowed-types');
}

// ============================================================
// FILE RETRIEVAL
// ============================================================

/**
 * Get all files with optional filters
 * @param filters - Filter options
 * @returns Promise with array of files
 */
export async function getFiles(filters?: FileFilters): Promise<FileInfo[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.category) {
    queryParams.append('category', filters.category);
  }
  if (filters?.uploaderId) {
    queryParams.append('uploaderId', filters.uploaderId);
  }
  if (filters?.relatedId) {
    queryParams.append('relatedId', filters.relatedId);
  }
  if (filters?.relatedType) {
    queryParams.append('relatedType', filters.relatedType);
  }
  if (filters?.search) {
    queryParams.append('search', filters.search);
  }
  
  const query = queryParams.toString();
  return apiClient.get<FileInfo[]>(`/files${query ? `?${query}` : ''}`);
}

/**
 * Get current user's files
 * @returns Promise with array of files
 */
export async function getMyFiles(): Promise<FileInfo[]> {
  return apiClient.get<FileInfo[]>('/files/my');
}

/**
 * Get file metadata by ID
 * @param fileId - File ID
 * @returns Promise with file info
 */
export async function getFile(fileId: string): Promise<FileInfo> {
  return apiClient.get<FileInfo>(`/files/${fileId}`);
}

/**
 * Get storage statistics
 * @param userId - Optional user ID (admin only)
 * @returns Promise with storage stats
 */
export async function getStorageStats(userId?: string): Promise<{
  totalFiles: number;
  totalSize: number;
  byCategory: Record<FileCategory, { count: number; size: number }>;
}> {
  const queryParams = new URLSearchParams();
  
  if (userId) {
    queryParams.append('userId', userId);
  }
  
  const query = queryParams.toString();
  return apiClient.get<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<FileCategory, { count: number; size: number }>;
  }>(`/files/stats${query ? `?${query}` : ''}`);
}

// ============================================================
// DOWNLOAD & PREVIEW
// ============================================================

/**
 * Get download URL for a file
 * Note: In React Native, you'll typically want to use this with
 * a download library like rn-fetch-blob or expo-file-system
 * @param fileId - File ID
 * @returns Promise with download URL
 */
export async function getDownloadUrl(fileId: string): Promise<string> {
  // The actual download endpoint returns the file directly
  // This is a helper to get the URL for external download handling
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  return `${baseUrl}/files/${fileId}/download`;
}

/**
 * Download a file
 * Note: This returns the raw response. In React Native, you may want
 * to use a library like rn-fetch-blob for better file handling.
 * @param fileId - File ID
 * @returns Promise with Blob data
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(await getDownloadUrl(fileId), {
    headers: {
      'Authorization': `Bearer ${await apiClient.getAccessToken() || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  
  return response.blob();
}

/**
 * Get preview URL for a file (images only)
 * @param fileId - File ID
 * @param options - Optional width and height for preview
 * @returns Promise with preview URL
 */
export async function getFilePreviewUrl(
  fileId: string,
  options?: { width?: number; height?: number }
): Promise<string> {
  const queryParams = new URLSearchParams();
  
  if (options?.width) {
    queryParams.append('width', options.width.toString());
  }
  if (options?.height) {
    queryParams.append('height', options.height.toString());
  }
  
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const query = queryParams.toString();
  return `${baseUrl}/files/${fileId}/preview${query ? `?${query}` : ''}`;
}

/**
 * Get thumbnail URL for a file
 * @param fileId - File ID
 * @returns Promise with thumbnail URL
 */
export async function getFileThumbnailUrl(fileId: string): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  return `${baseUrl}/files/${fileId}/thumbnail`;
}

/**
 * Get file preview (for images)
 * @param fileId - File ID
 * @param options - Optional width and height
 * @returns Promise with Blob data
 */
export async function getFilePreview(
  fileId: string,
  options?: { width?: number; height?: number }
): Promise<Blob> {
  const queryParams = new URLSearchParams();
  
  if (options?.width) {
    queryParams.append('width', options.width.toString());
  }
  if (options?.height) {
    queryParams.append('height', options.height.toString());
  }
  
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const query = queryParams.toString();
  const url = `${baseUrl}/files/${fileId}/preview${query ? `?${query}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${await apiClient.getAccessToken() || ''}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Preview failed: ${response.statusText}`);
  }
  
  return response.blob();
}

// ============================================================
// FILE MANAGEMENT
// ============================================================

/**
 * Delete a file
 * @param fileId - File ID
 * @returns Promise that resolves when file is deleted
 */
export async function deleteFile(fileId: string): Promise<void> {
  return apiClient.delete<void>(`/files/${fileId}`);
}

/**
 * Validate file integrity (admin only)
 * @param fileId - File ID
 * @returns Promise with validation results
 */
export async function validateFile(fileId: string): Promise<{
  valid: boolean;
  fileId: string;
  checks: {
    metadata: boolean;
    hash: boolean;
    physicalFile: boolean;
  };
}> {
  return apiClient.post<{
    valid: boolean;
    fileId: string;
    checks: {
      metadata: boolean;
      hash: boolean;
      physicalFile: boolean;
    };
  }>(`/files/${fileId}/validate`, {});
}

// ============================================================
// PERMISSIONS
// ============================================================

/**
 * Set file permission (admin/teacher only)
 * @param fileId - File ID
 * @param data - Permission data
 * @returns Promise with created permission
 */
export async function setFilePermission(
  fileId: string,
  data: SetFilePermissionRequest
): Promise<FilePermission> {
  return apiClient.post<FilePermission>(`/files/${fileId}/permissions`, data);
}

/**
 * Get file permissions (owner or admin only)
 * @param fileId - File ID
 * @returns Promise with array of permissions
 */
export async function getFilePermissions(fileId: string): Promise<FilePermission[]> {
  return apiClient.get<FilePermission[]>(`/files/${fileId}/permissions`);
}

/**
 * Remove file permission (admin/teacher only)
 * @param permissionId - Permission ID
 * @returns Promise that resolves when permission is removed
 */
export async function removeFilePermission(permissionId: string): Promise<void> {
  return apiClient.delete<void>(`/files/permissions/${permissionId}`);
}

// ============================================================
// MAINTENANCE (ADMIN ONLY)
// ============================================================

/**
 * Clean up deleted files (admin only)
 * @param olderThanDays - Delete files soft-deleted more than this many days ago
 * @returns Promise with cleanup results
 */
export async function cleanupFiles(
  olderThanDays: number = 30
): Promise<{ deleted: number; errors: string[] }> {
  return apiClient.post<{ deleted: number; errors: string[] }>(
    `/files/cleanup?olderThanDays=${olderThanDays}`,
    {}
  );
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const fileService = {
  // Upload
  uploadFile,
  getUploadQuota,
  getAllowedFileTypes,
  
  // Retrieval
  getFiles,
  getMyFiles,
  getFile,
  getStorageStats,
  
  // Download & Preview
  getDownloadUrl,
  downloadFile,
  getFilePreviewUrl,
  getFileThumbnailUrl,
  getFilePreview,
  
  // Management
  deleteFile,
  validateFile,
  
  // Permissions
  setFilePermission,
  getFilePermissions,
  removeFilePermission,
  
  // Maintenance
  cleanupFiles,
};

export default fileService;
