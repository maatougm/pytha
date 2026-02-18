<template>
  <!-- Install Prompt Banner -->
  <Transition name="slide-up">
    <div
      v-if="showInstallBanner"
      class="pwa-install-banner"
      role="alert"
      aria-live="polite"
    >
      <div class="pwa-install-content">
        <div class="pwa-install-icon">
          <img
            src="/icons/icon-72x72.png"
            alt="School Hub"
            width="48"
            height="48"
          />
        </div>
        <div class="pwa-install-text">
          <h3 class="pwa-install-title">Install School Hub</h3>
          <p class="pwa-install-description">
            Add to your home screen for quick access and offline support
          </p>
        </div>
        <div class="pwa-install-actions">
          <button
            class="pwa-btn pwa-btn-install"
            @click="handleInstall"
            :disabled="isInstalling"
          >
            <span v-if="isInstalling" class="pwa-spinner"></span>
            <span v-else>Install</span>
          </button>
          <button
            class="pwa-btn pwa-btn-dismiss"
            @click="dismissBanner"
            aria-label="Dismiss install prompt"
          >
            <span class="material-icons-round">close</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Update Available Banner -->
  <Transition name="slide-down">
    <div
      v-if="showUpdateBanner"
      class="pwa-update-banner"
      role="alert"
      aria-live="polite"
    >
      <div class="pwa-update-content">
        <span class="material-icons-round pwa-update-icon">update</span>
        <span class="pwa-update-text">A new version is available!</span>
        <button
          class="pwa-btn pwa-btn-update"
          @click="handleUpdate"
          :disabled="isUpdating"
        >
          <span v-if="isUpdating" class="pwa-spinner"></span>
          <span v-else>Update Now</span>
        </button>
        <button
          class="pwa-btn pwa-btn-later"
          @click="dismissUpdate"
          aria-label="Update later"
        >
          Later
        </button>
      </div>
    </div>
  </Transition>

  <!-- Offline Indicator -->
  <Transition name="fade">
    <div
      v-if="!isOnline"
      class="pwa-offline-indicator"
      role="status"
      aria-live="polite"
    >
      <span class="material-icons-round">wifi_off</span>
      <span>You're offline. Some features may be limited.</span>
    </div>
  </Transition>

  <!-- Install Modal -->
  <Transition name="fade">
    <div
      v-if="showInstallModal"
      class="pwa-modal-overlay"
      @click.self="closeModal"
    >
      <div class="pwa-modal" role="dialog" aria-labelledby="pwa-modal-title">
        <div class="pwa-modal-header">
          <img
            src="/icons/icon-192x192.png"
            alt="School Hub"
            class="pwa-modal-icon"
            width="80"
            height="80"
          />
          <h2 id="pwa-modal-title" class="pwa-modal-title">
            Install School Hub
          </h2>
          <button
            class="pwa-modal-close"
            @click="closeModal"
            aria-label="Close modal"
          >
            <span class="material-icons-round">close</span>
          </button>
        </div>
        
        <div class="pwa-modal-body">
          <p class="pwa-modal-description">
            Install School Hub on your device for the best experience:
          </p>
          <ul class="pwa-feature-list">
            <li class="pwa-feature-item">
              <span class="material-icons-round pwa-feature-icon">bolt</span>
              <span>Quick access from your home screen</span>
            </li>
            <li class="pwa-feature-item">
              <span class="material-icons-round pwa-feature-icon">wifi_off</span>
              <span>Work offline with cached data</span>
            </li>
            <li class="pwa-feature-item">
              <span class="material-icons-round pwa-feature-icon">notifications</span>
              <span>Receive push notifications</span>
            </li>
            <li class="pwa-feature-item">
              <span class="material-icons-round pwa-feature-icon">fullscreen</span>
              <span>Full-screen app experience</span>
            </li>
          </ul>
        </div>
        
        <div class="pwa-modal-footer">
          <button
            class="pwa-btn pwa-btn-secondary"
            @click="closeModal"
          >
            Not Now
          </button>
          <button
            class="pwa-btn pwa-btn-primary"
            @click="handleInstall"
            :disabled="isInstalling"
          >
            <span v-if="isInstalling" class="pwa-spinner"></span>
            <span v-else>Install App</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePWA } from '@/composables/usePWA';

const emit = defineEmits(['installed', 'dismissed', 'updated']);

// PWA composable
const {
  isInstalled,
  isInstallable,
  isOnline,
  updateAvailable,
  promptInstall,
  updateServiceWorker,
  checkIsInstalled
} = usePWA();

// Local state
const showInstallBanner = ref(false);
const showInstallModal = ref(false);
const showUpdateBanner = ref(false);
const isInstalling = ref(false);
const isUpdating = ref(false);
const bannerDismissed = ref(false);
const updateDismissed = ref(false);

// Computed
const shouldShowBanner = computed(() => {
  return isInstallable.value && 
         !isInstalled.value && 
         !bannerDismissed.value &&
         !localStorage.getItem('pwa-install-dismissed');
});

const shouldShowUpdate = computed(() => {
  return updateAvailable.value && !updateDismissed.value;
});

// Methods
const checkAndShowBanner = () => {
  // Delay showing the banner for better UX
  setTimeout(() => {
    if (shouldShowBanner.value) {
      showInstallBanner.value = true;
    }
  }, 3000);
};

const dismissBanner = () => {
  showInstallBanner.value = false;
  bannerDismissed.value = true;
  localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  emit('dismissed');
};

const openInstallModal = () => {
  showInstallBanner.value = false;
  showInstallModal.value = true;
};

const closeModal = () => {
  showInstallModal.value = false;
  // Show banner again if modal is closed without installing
  if (!isInstalled.value && !bannerDismissed.value) {
    setTimeout(() => {
      showInstallBanner.value = true;
    }, 1000);
  }
};

const handleInstall = async () => {
  isInstalling.value = true;
  
  try {
    const result = await promptInstall();
    
    if (result.outcome === 'accepted') {
      console.log('[PWA] User accepted install');
      showInstallBanner.value = false;
      showInstallModal.value = false;
      emit('installed');
    } else {
      console.log('[PWA] User dismissed install');
      dismissBanner();
    }
  } catch (error) {
    console.error('[PWA] Install failed:', error);
    // Fallback to showing instructions
    showManualInstallInstructions();
  } finally {
    isInstalling.value = false;
  }
};

const showManualInstallInstructions = () => {
  // Detect platform and show appropriate instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructions = '';
  if (isIOS) {
    instructions = 'Tap the Share button and then "Add to Home Screen"';
  } else if (isAndroid) {
    instructions = 'Tap the menu button and then "Add to Home Screen"';
  } else {
    instructions = 'Click the install icon in your browser address bar';
  }
  
  alert(`To install School Hub:\n\n${instructions}`);
};

const dismissUpdate = () => {
  showUpdateBanner.value = false;
  updateDismissed.value = true;
};

const handleUpdate = async () => {
  isUpdating.value = true;
  
  try {
    const updated = await updateServiceWorker();
    
    if (updated) {
      showUpdateBanner.value = false;
      emit('updated');
    }
  } catch (error) {
    console.error('[PWA] Update failed:', error);
  } finally {
    isUpdating.value = false;
  }
};

// Watch for update availability
onMounted(() => {
  checkIsInstalled();
  checkAndShowBanner();
  
  // Watch for updates
  const checkUpdate = setInterval(() => {
    if (shouldShowUpdate.value && !showUpdateBanner.value) {
      showUpdateBanner.value = true;
    }
  }, 5000);
  
  // Cleanup
  return () => {
    clearInterval(checkUpdate);
  };
});

// Expose methods for programmatic control
defineExpose({
  showInstallPrompt: openInstallModal,
  dismiss: dismissBanner,
  checkForUpdate: () => { showUpdateBanner.value = shouldShowUpdate.value; }
});
</script>

<style scoped>
/* Install Banner */
.pwa-install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-color, #ffffff);
  border-top: 1px solid var(--border-color, #e0e0e0);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  padding: 16px;
}

.pwa-install-content {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 16px;
}

.pwa-install-icon img {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pwa-install-text {
  flex: 1;
}

.pwa-install-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary, #1a1a1a);
}

.pwa-install-description {
  font-size: 14px;
  margin: 0;
  color: var(--text-secondary, #666666);
}

.pwa-install-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Update Banner */
.pwa-update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--primary-color, #1976d2);
  color: white;
  z-index: 9999;
  padding: 12px 16px;
}

.pwa-update-content {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 12px;
}

.pwa-update-icon {
  font-size: 20px;
}

.pwa-update-text {
  font-weight: 500;
}

/* Offline Indicator */
.pwa-offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #f57c00;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  z-index: 9998;
}

/* Modal */
.pwa-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.pwa-modal {
  background: var(--surface-color, #ffffff);
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.pwa-modal-header {
  position: relative;
  padding: 32px 24px 16px;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-light, #E3F2FD) 0%, var(--surface-color, #ffffff) 100%);
}

.pwa-modal-icon {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pwa-modal-title {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 0;
  color: var(--text-primary, #1a1a1a);
}

.pwa-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: var(--text-secondary, #666666);
  transition: background-color 0.2s;
}

.pwa-modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.pwa-modal-body {
  padding: 24px;
}

.pwa-modal-description {
  font-size: 16px;
  color: var(--text-secondary, #666666);
  margin: 0 0 20px 0;
}

.pwa-feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pwa-feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 14px;
  color: var(--text-primary, #1a1a1a);
}

.pwa-feature-icon {
  color: var(--primary-color, #1976d2);
  font-size: 20px;
}

.pwa-modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

/* Buttons */
.pwa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.pwa-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pwa-btn-install {
  background: var(--primary-color, #1976d2);
  color: white;
}

.pwa-btn-install:hover:not(:disabled) {
  background: var(--primary-dark, #1565c0);
}

.pwa-btn-dismiss {
  background: transparent;
  color: var(--text-secondary, #666666);
  padding: 8px;
}

.pwa-btn-dismiss:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary, #1a1a1a);
}

.pwa-btn-update {
  background: white;
  color: var(--primary-color, #1976d2);
}

.pwa-btn-update:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
}

.pwa-btn-later {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.pwa-btn-later:hover {
  color: white;
}

.pwa-btn-primary {
  flex: 1;
  background: var(--primary-color, #1976d2);
  color: white;
}

.pwa-btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #1565c0);
}

.pwa-btn-secondary {
  flex: 1;
  background: transparent;
  color: var(--text-secondary, #666666);
  border: 1px solid var(--border-color, #e0e0e0);
}

.pwa-btn-secondary:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Spinner */
.pwa-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .pwa-install-content {
    flex-wrap: wrap;
  }
  
  .pwa-install-text {
    flex: 1 1 calc(100% - 80px);
  }
  
  .pwa-install-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
  
  .pwa-modal {
    margin: 16px;
  }
}
</style>
