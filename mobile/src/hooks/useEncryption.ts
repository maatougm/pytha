import { useState, useEffect, useCallback } from 'react';
import { encryptionService, EncryptedMessage } from '@/src/services/encryptionService';

export interface EncryptionState {
  isReady: boolean;
  publicKey: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface EncryptionActions {
  encrypt: (message: string, recipientPublicKey: string) => Promise<EncryptedMessage | null>;
  decrypt: (encryptedMessage: EncryptedMessage) => Promise<string | null>;
  importContactKey: (contactId: string, publicKey: string) => Promise<void>;
  getContactKey: (contactId: string) => Promise<string | null>;
  rotateKeys: () => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * Hook for end-to-end encryption
 */
export function useEncryption(): EncryptionState & EncryptionActions {
  const [state, setState] = useState<EncryptionState>({
    isReady: false,
    publicKey: null,
    isLoading: true,
    error: null,
  });

  // Initialize encryption on mount
  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      await encryptionService.initialize();
      setState({
        isReady: encryptionService.isReady(),
        publicKey: encryptionService.getPublicKey(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        isReady: false,
        publicKey: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize encryption',
      });
    }
  };

  /**
   * Encrypt a message
   */
  const encrypt = useCallback(
    async (message: string, recipientPublicKey: string): Promise<EncryptedMessage | null> => {
      try {
        return await encryptionService.encryptMessage(message, recipientPublicKey);
      } catch (error) {
        console.error('[useEncryption] Failed to encrypt:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Encryption failed',
        }));
        return null;
      }
    },
    []
  );

  /**
   * Decrypt a message
   */
  const decrypt = useCallback(
    async (encryptedMessage: EncryptedMessage): Promise<string | null> => {
      try {
        return await encryptionService.decryptMessage(encryptedMessage);
      } catch (error) {
        console.error('[useEncryption] Failed to decrypt:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Decryption failed',
        }));
        return null;
      }
    },
    []
  );

  /**
   * Import a contact's public key
   */
  const importContactKey = useCallback(async (contactId: string, publicKey: string): Promise<void> => {
    try {
      await encryptionService.importContactKey(contactId, publicKey);
    } catch (error) {
      console.error('[useEncryption] Failed to import contact key:', error);
      throw error;
    }
  }, []);

  /**
   * Get a contact's public key
   */
  const getContactKey = useCallback(async (contactId: string): Promise<string | null> => {
    try {
      return await encryptionService.getContactKey(contactId);
    } catch (error) {
      console.error('[useEncryption] Failed to get contact key:', error);
      return null;
    }
  }, []);

  /**
   * Rotate encryption keys
   */
  const rotateKeys = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await encryptionService.rotateKeys();
      setState({
        isReady: encryptionService.isReady(),
        publicKey: encryptionService.getPublicKey(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rotate keys',
      }));
    }
  }, []);

  /**
   * Reset encryption (clear all keys)
   */
  const reset = useCallback(async (): Promise<void> => {
    try {
      await encryptionService.clear();
      setState({
        isReady: false,
        publicKey: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to reset encryption',
      }));
    }
  }, []);

  return {
    ...state,
    encrypt,
    decrypt,
    importContactKey,
    getContactKey,
    rotateKeys,
    reset,
  };
}

/**
 * Hook to check if encryption is enabled for a conversation
 */
export function useEncryptedChat(contactId: string) {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkKey();
  }, [contactId]);

  const checkKey = async () => {
    setIsLoading(true);
    const key = await encryptionService.getContactKey(contactId);
    setHasKey(!!key);
    setIsLoading(false);
  };

  const enableEncryption = async (publicKey: string) => {
    await encryptionService.importContactKey(contactId, publicKey);
    setHasKey(true);
  };

  return { hasKey, isLoading, enableEncryption, refresh: checkKey };
}
