import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * Composable for push notification functionality
 * Handles permission requests, subscriptions, and message handling
 */
export function usePushNotifications() {
  // State
  const isSupported = ref(false);
  const permission = ref('default');
  const subscription = ref(null);
  const isSubscribing = ref(false);
  const error = ref(null);
  const swRegistration = ref(null);
  const notifications = ref([]);
  
  // Computed
  const isPermissionGranted = computed(() => permission.value === 'granted');
  const isPermissionDenied = computed(() => permission.value === 'denied');
  const canSubscribe = computed(() => 
    isSupported.value && 
    permission.value === 'granted' && 
    !subscription.value
  );
  const canRequestPermission = computed(() => 
    isSupported.value && 
    permission.value === 'default'
  );
  
  // VAPID public key for push notifications
  // In production, this should come from environment variables
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  
  /**
   * Check if push notifications are supported
   */
  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    isSupported.value = supported;
    return supported;
  };
  
  /**
   * Get current permission state
   */
  const getPermissionState = () => {
    if (!('Notification' in window)) {
      permission.value = 'unsupported';
      return 'unsupported';
    }
    
    permission.value = Notification.permission;
    return Notification.permission;
  };
  
  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      error.value = 'Notifications not supported';
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      console.log('[Push] Permission result:', result);
      return result === 'granted';
    } catch (err) {
      console.error('[Push] Permission request failed:', err);
      error.value = err.message;
      return false;
    }
  };
  
  /**
   * Convert base64 string to Uint8Array
   */
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };
  
  /**
   * Subscribe to push notifications
   */
  const subscribe = async () => {
    if (!checkSupport()) {
      error.value = 'Push notifications not supported';
      return null;
    }
    
    if (!VAPID_PUBLIC_KEY) {
      error.value = 'VAPID public key not configured';
      return null;
    }
    
    if (permission.value !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        error.value = 'Permission denied';
        return null;
      }
    }
    
    isSubscribing.value = true;
    error.value = null;
    
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      swRegistration.value = registration;
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('[Push] Already subscribed');
        subscription.value = existingSubscription;
        isSubscribing.value = false;
        return existingSubscription;
      }
      
      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      console.log('[Push] Subscribed successfully');
      subscription.value = newSubscription;
      
      // Send subscription to server
      await sendSubscriptionToServer(newSubscription);
      
      return newSubscription;
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
      error.value = err.message;
      return null;
    } finally {
      isSubscribing.value = false;
    }
  };
  
  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async () => {
    if (!subscription.value) {
      return true;
    }
    
    try {
      const result = await subscription.value.unsubscribe();
      
      if (result) {
        console.log('[Push] Unsubscribed successfully');
        
        // Remove subscription from server
        await removeSubscriptionFromServer(subscription.value);
        
        subscription.value = null;
      }
      
      return result;
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
      error.value = err.message;
      return false;
    }
  };
  
  /**
   * Send subscription to server
   */
  const sendSubscriptionToServer = async (sub) => {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          platform: navigator.platform
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
      
      console.log('[Push] Subscription saved to server');
    } catch (err) {
      console.error('[Push] Failed to save subscription:', err);
      // Don't throw - subscription still works locally
    }
  };
  
  /**
   * Remove subscription from server
   */
  const removeSubscriptionFromServer = async (sub) => {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: sub.endpoint
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
      
      console.log('[Push] Subscription removed from server');
    } catch (err) {
      console.error('[Push] Failed to remove subscription:', err);
    }
  };
  
  /**
   * Check existing subscription
   */
  const checkSubscription = async () => {
    if (!checkSupport()) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      swRegistration.value = registration;
      
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        subscription.value = existingSubscription;
        console.log('[Push] Found existing subscription');
      }
      
      return existingSubscription;
    } catch (err) {
      console.error('[Push] Check subscription failed:', err);
      return null;
    }
  };
  
  /**
   * Display a local notification
   */
  const showNotification = async (title, options = {}) => {
    if (permission.value !== 'granted') {
      console.log('[Push] Cannot show notification - permission not granted');
      return false;
    }
    
    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {}
    };
    
    const notificationOptions = { ...defaultOptions, ...options };
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, notificationOptions);
      
      // Add to local notifications list
      notifications.value.push({
        id: Date.now(),
        title,
        ...notificationOptions,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (err) {
      console.error('[Push] Show notification failed:', err);
      return false;
    }
  };
  
  /**
   * Show a local message notification
   */
  const showMessageNotification = (message, sender) => {
    return showNotification(`New message from ${sender?.name || 'School Hub'}`, {
      body: message.content || 'You have a new message',
      icon: sender?.avatar || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `message-${message.id || 'new'}`,
      requireInteraction: true,
      actions: [
        {
          action: 'reply',
          title: 'Reply'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        type: 'message',
        url: '/messaging',
        messageId: message.id,
        channelId: message.channelId
      }
    });
  };
  
  /**
   * Show an assignment notification
   */
  const showAssignmentNotification = (assignment) => {
    return showNotification('New Assignment', {
      body: `${assignment.title} - Due ${new Date(assignment.dueDate).toLocaleDateString()}`,
      icon: '/icons/assignments-96x96.png',
      badge: '/icons/icon-72x72.png',
      tag: `assignment-${assignment.id}`,
      data: {
        type: 'assignment',
        url: `/assignments/${assignment.id}`,
        assignmentId: assignment.id
      }
    });
  };
  
  /**
   * Show a grade notification
   */
  const showGradeNotification = (grade) => {
    return showNotification('Grade Posted', {
      body: `You received ${grade.score}/${grade.maxScore} on ${grade.assignmentTitle}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `grade-${grade.id}`,
      data: {
        type: 'grade',
        url: '/assignments',
        gradeId: grade.id
      }
    });
  };
  
  /**
   * Clear all notifications
   */
  const clearNotifications = async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.getNotifications().then(notifications => {
      notifications.forEach(notification => notification.close());
    });
    notifications.value = [];
  };
  
  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification) => {
    const data = notification.data || {};
    
    // Navigate to appropriate page
    if (data.url) {
      window.location.href = data.url;
    }
    
    notification.close();
  };
  
  /**
   * Test push notification (for development)
   */
  const testNotification = async () => {
    return showNotification('Test Notification', {
      body: 'This is a test notification from School Hub',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: '/',
        type: 'test'
      }
    });
  };
  
  // Initialize
  onMounted(() => {
    checkSupport();
    getPermissionState();
    checkSubscription();
    
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          handleNotificationClick(event.data);
        }
      });
    }
  });
  
  return {
    // State
    isSupported,
    permission,
    subscription,
    isSubscribing,
    error,
    notifications,
    
    // Computed
    isPermissionGranted,
    isPermissionDenied,
    canSubscribe,
    canRequestPermission,
    
    // Methods
    checkSupport,
    getPermissionState,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
    showNotification,
    showMessageNotification,
    showAssignmentNotification,
    showGradeNotification,
    clearNotifications,
    testNotification
  };
}

export default usePushNotifications;
