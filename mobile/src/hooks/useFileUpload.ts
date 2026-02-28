import { useState, useCallback, useRef } from 'react';
import { fileUploadService, UploadTask, UploadProgress, UploadResult } from '@/src/services/fileUploadService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export interface FileUploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  result: UploadResult | null;
  error: string | null;
}

export interface FileUploadActions {
  upload: (task: UploadTask) => Promise<UploadResult>;
  cancel: () => void;
  retry: () => Promise<UploadResult>;
  pickDocument: () => Promise<UploadTask | null>;
  pickImage: (options?: { camera?: boolean; allowsMultiple?: boolean }) => Promise<UploadTask | UploadTask[] | null>;
  reset: () => void;
}

/**
 * Hook for file uploads with progress tracking
 */
export function useFileUpload(): FileUploadState & FileUploadActions {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: null,
    result: null,
    error: null,
  });

  const currentTask = useRef<UploadTask | null>(null);

  /**
   * Upload a file
   */
  const upload = useCallback(async (task: UploadTask): Promise<UploadResult> => {
    currentTask.current = task;

    setState({
      isUploading: true,
      progress: null,
      result: null,
      error: null,
    });

    const result = await fileUploadService.upload(task, (progress) => {
      setState(prev => ({ ...prev, progress }));
    });

    setState({
      isUploading: false,
      progress: state.progress,
      result,
      error: result.success ? null : result.error || 'Upload failed',
    });

    return result;
  }, []);

  /**
   * Cancel current upload
   */
  const cancel = useCallback(() => {
    if (currentTask.current) {
      fileUploadService.cancel(currentTask.current.id);
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: 'Upload cancelled',
      }));
    }
  }, []);

  /**
   * Retry failed upload
   */
  const retry = useCallback(async (): Promise<UploadResult> => {
    if (!currentTask.current) {
      return { success: false, error: 'No upload to retry' };
    }

    setState({
      isUploading: true,
      progress: null,
      result: null,
      error: null,
    });

    const result = await fileUploadService.retry(currentTask.current, (progress) => {
      setState(prev => ({ ...prev, progress }));
    });

    setState({
      isUploading: false,
      progress: state.progress,
      result,
      error: result.success ? null : result.error || 'Upload failed',
    });

    return result;
  }, [state.progress]);

  /**
   * Pick a document
   */
  const pickDocument = useCallback(async (): Promise<UploadTask | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
        file: {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        },
      };
    } catch (error) {
      console.error('[useFileUpload] Failed to pick document:', error);
      return null;
    }
  }, []);

  /**
   * Pick an image
   */
  const pickImage = useCallback(
    async (options: { camera?: boolean; allowsMultiple?: boolean } = {}): Promise<
      UploadTask | UploadTask[] | null
    > => {
      try {
        let result;

        if (options.camera) {
          // Request camera permissions
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Camera permission not granted');
          }

          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });
        } else {
          // Request media library permissions
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Media library permission not granted');
          }

          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            allowsMultipleSelection: options.allowsMultiple,
            quality: 0.8,
          });
        }

        if (result.canceled) return null;

        const createTask = (asset: any): UploadTask => ({
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
          },
        });

        if (options.allowsMultiple) {
          return result.assets.map(createTask);
        }

        return createTask(result.assets[0]);
      } catch (error) {
        console.error('[useFileUpload] Failed to pick image:', error);
        return null;
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    currentTask.current = null;
    setState({
      isUploading: false,
      progress: null,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    upload,
    cancel,
    retry,
    pickDocument,
    pickImage,
    reset,
  };
}

/**
 * Hook for managing multiple file uploads
 */
export function useMultipleFileUpload() {
  const [uploads, setUploads] = useState<Map<string, FileUploadState>>(new Map());

  const upload = useCallback(async (tasks: UploadTask[]) => {
    // Initialize states
    const initialStates = new Map<string, FileUploadState>();
    tasks.forEach(task => {
      initialStates.set(task.id, {
        isUploading: false,
        progress: null,
        result: null,
        error: null,
      });
    });
    setUploads(initialStates);

    // Upload all files
    const promises = tasks.map(async (task) => {
      setUploads(prev => {
        const next = new Map(prev);
        const state = next.get(task.id);
        if (state) {
          state.isUploading = true;
        }
        return next;
      });

      const result = await fileUploadService.upload(task, (progress) => {
        setUploads(prev => {
          const next = new Map(prev);
          const state = next.get(task.id);
          if (state) {
            state.progress = progress;
          }
          return next;
        });
      });

      setUploads(prev => {
        const next = new Map(prev);
        const state = next.get(task.id);
        if (state) {
          state.isUploading = false;
          state.result = result;
          state.error = result.success ? null : result.error || 'Upload failed';
        }
        return next;
      });

      return { taskId: task.id, result };
    });

    return Promise.all(promises);
  }, []);

  const getState = useCallback(
    (taskId: string): FileUploadState | undefined => {
      return uploads.get(taskId);
    },
    [uploads]
  );

  const getAllStates = useCallback((): Map<string, FileUploadState> => {
    return uploads;
  }, [uploads]);

  const clear = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    upload,
    getState,
    getAllStates,
    clear,
  };
}

export default useFileUpload;
