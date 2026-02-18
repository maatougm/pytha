import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * Composable for PWA functionality
 * Handles install prompts, updates, and online/offline status
 */
export function usePWA() {
  // State
  const isInstalled = ref(false);
  const isInstallable = ref(false);
  const isOnline = ref(navigator.onLine);
  const isUpdating = ref(false);
  const updateAvailable = ref(false);
  const swRegistration = ref(null);
  const installPrompt = ref(null);
  const updateError = ref(null);
  
  // Computed
  const canInstall = computed(() => isInstallable.value && !isInstalled.value);
  const connectionStatus = computed(() => isOnline.value ? 'online' : 'offline');
  
  // Event handlers
  let beforeInstallPromptHandler = null;
  let appInstalledHandler = null;
  let onlineHandler = null;
  let offlineHandler = null;
  let controllerChangeHandler = null;
  let messageHandler = null;
  
  /**
   * Register the service worker
   */
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported');
      return false;
    }
    
    try {
      // Check if already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      
      if (existingRegistration) {
        console.log('[PWA] Service worker already registered');
        swRegistration.value = existingRegistration;
        checkForUpdate(existingRegistration);
        return true;
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });
      
      console.log('[PWA] Service worker registered:', registration.scope);
      swRegistration.value = registration;
      
      // Handle registration events
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[PWA] New service worker available');
              updateAvailable.value = true;
            } else {
              // First install
              console.log('[PWA] Service worker installed for first time');
            }
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      updateError.value = error.message;
      return false;
    }
  };
  
  /**
   * Check for service worker updates
   */
  const checkForUpdate = async (registration) => {
    if (!registration) return;
    
    try {
      await registration.update();
      console.log('[PWA] Checked for service worker update');
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  };
  
  /**
   * Update the service worker
   */
  const updateServiceWorker = async () => {
    if (!swRegistration.value || !swRegistration.value.waiting) {
      return false;
    }
    
    isUpdating.value = true;
    
    return new Promise((resolve) => {
      // Listen for controller change
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        isUpdating.value = false;
        updateAvailable.value = false;
        resolve(true);
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      
      // Tell the waiting service worker to skip waiting
      swRegistration.value.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        isUpdating.value = false;
        resolve(false);
      }, 10000);
    });
  };
  
  /**
   * Handle beforeinstallprompt event
   */
  const handleBeforeInstallPrompt = (event) => {
    console.log('[PWA] Before install prompt fired');
    event.preventDefault();
    installPrompt.value = event;
    isInstallable.value = true;
  };
  
  /**
   * Handle appinstalled event
   */
  const handleAppInstalled = () => {
    console.log('[PWA] App installed');
    isInstalled.value = true;
    isInstallable.value = false;
    installPrompt.value = null;
  };
  
  /**
   * Trigger the install prompt
   */
  const promptInstall = async () => {
    if (!installPrompt.value) {
      console.log('[PWA] No install prompt available');
      return { outcome: 'dismissed', platform: '' };
    }
    
    // Show the prompt
    installPrompt.value.prompt();
    
    // Wait for user choice
    const result = await installPrompt.value.userChoice;
    console.log('[PWA] Install prompt result:', result.outcome);
    
    // Clear the saved prompt
    installPrompt.value = null;
    isInstallable.value = false;
    
    return result;
  };
  
  /**
   * Dismiss the install prompt without installing
   */
  const dismissInstall = () => {
    installPrompt.value = null;
    isInstallable.value = false;
  };
  
  /**
   * Handle online event
   */
  const handleOnline = () => {
    console.log('[PWA] App is online');
    isOnline.value = true;
    
    // Trigger background sync if available
    if (swRegistration.value && 'sync' in swRegistration.value) {
      swRegistration.value.sync.register('sync-messages').catch(console.error);
    }
  };
  
  /**
   * Handle offline event
   */
  const handleOffline = () => {
    console.log('[PWA] App is offline');
    isOnline.value = false;
  };
  
  /**
   * Handle service worker messages
   */
  const handleMessage = (event) => {
    if (!event.data) return;
    
    switch (event.data.type) {
      case 'MESSAGE_SYNCED':
        console.log('[PWA] Message synced:', event.data.messageId);
        break;
        
      case 'NOTIFICATION_CLICKED':
        console.log('[PWA] Notification clicked, navigate to:', event.data.url);
        break;
        
      case 'SW_UPDATE':
        updateAvailable.value = true;
        break;
    }
  };
  
  /**
   * Send message to service worker
   */
  const sendMessageToSW = async (message) => {
    if (!navigator.serviceWorker.controller) {
      console.log('[PWA] No service worker controller');
      return null;
    }
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    });
  };
  
  /**
   * Get service worker version
   */
  const getSWVersion = async () => {
    const response = await sendMessageToSW({ type: 'GET_VERSION' });
    return response?.version || null;
  };
  
  /**
   * Schedule background sync
   */
  const scheduleSync = async () => {
    const response = await sendMessageToSW({ type: 'SCHEDULE_SYNC' });
    return response?.scheduled || false;
  };
  
  /**
   * Cache specific URLs
   */
  const cacheUrls = async (urls) => {
    const response = await sendMessageToSW({ type: 'CACHE_URLS', urls });
    return response?.cached || false;
  };
  
  /**
   * Check if app is running as installed PWA
   */
  const checkIsInstalled = () => {
    // Check display mode
    const displayMode = window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: window-controls-overlay)').matches;
    
    // Check if launched from home screen (iOS)
    const isIOSStandalone = window.navigator.standalone === true;
    
    isInstalled.value = displayMode || isIOSStandalone;
    return isInstalled.value;
  };
  
  /**
   * Get install related information (experimental API)
   */
  const getInstallRelatedInfo = async () => {
    if (!navigator.getInstalledRelatedApps) {
      return [];
    }
    
    try {
      const relatedApps = await navigator.getInstalledRelatedApps();
      return relatedApps;
    } catch (error) {
      console.error('[PWA] Failed to get installed related apps:', error);
      return [];
    }
  };
  
  // Initialize
  onMounted(() => {
    // Check if already installed
    checkIsInstalled();
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      isInstalled.value = e.matches;
    });
    
    // Register service worker
    registerServiceWorker();
    
    // Listen for install prompt
    beforeInstallPromptHandler = handleBeforeInstallPrompt;
    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    
    // Listen for install completion
    appInstalledHandler = handleAppInstalled;
    window.addEventListener('appinstalled', appInstalledHandler);
    
    // Listen for online/offline
    onlineHandler = handleOnline;
    offlineHandler = handleOffline;
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      messageHandler = handleMessage;
      navigator.serviceWorker.addEventListener('message', messageHandler);
    }
    
    // Listen for controller changes (updates)
    controllerChangeHandler = () => {
      console.log('[PWA] Service worker controller changed');
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', controllerChangeHandler);
  });
  
  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    window.removeEventListener('appinstalled', appInstalledHandler);
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
    navigator.serviceWorker?.removeEventListener('message', messageHandler);
    navigator.serviceWorker?.removeEventListener('controllerchange', controllerChangeHandler);
  });
  
  return {
    // State
    isInstalled,
    isInstallable,
    isOnline,
    isUpdating,
    updateAvailable,
    swRegistration,
    installPrompt,
    updateError,
    
    // Computed
    canInstall,
    connectionStatus,
    
    // Methods
    promptInstall,
    dismissInstall,
    updateServiceWorker,
    checkForUpdate,
    getSWVersion,
    scheduleSync,
    cacheUrls,
    getInstallRelatedInfo,
    checkIsInstalled
  };
}

export default usePWA;
