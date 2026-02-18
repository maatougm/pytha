<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
        @click="remove(toast.id)"
      >
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const toasts = ref([])
let idCounter = 0

function addToast(message, type = 'success', duration = 3000) {
  const id = ++idCounter
  const toast = { id, message, type }
  toasts.value.push(toast)
  
  setTimeout(() => {
    remove(id)
  }, duration)
}

function remove(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function handleToastEvent(e) {
  addToast(e.detail.message, e.detail.type)
}

function handleToastRemoveEvent(e) {
  remove(e.detail.id)
}

onMounted(() => {
  window.addEventListener('toast', handleToastEvent)
  window.addEventListener('toast-remove', handleToastRemoveEvent)
})

onUnmounted(() => {
  window.removeEventListener('toast', handleToastEvent)
  window.removeEventListener('toast-remove', handleToastRemoveEvent)
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  min-width: 300px;
}

.toast.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.toast.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.toast.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.toast.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  flex: 1;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@media (max-width: 640px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
    transform: none;
  }
  
  .toast {
    min-width: auto;
  }
}
</style>
