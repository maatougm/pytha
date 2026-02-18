import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export function useToast() {
  function showToast(message, type = 'success', duration = 3000) {
    const id = ++idCounter
    const toast = { id, message, type }
    toasts.value.push(toast)
    
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return toast
  }
  
  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  return {
    toasts,
    showToast,
    removeToast,
  }
}

// Singleton for global access
let globalToasts = []

export function showToast(message, type = 'success', duration = 3000) {
  const id = ++idCounter
  const toast = { id, message, type }
  globalToasts.push(toast)
  
  // Dispatch custom event for ToastContainer
  window.dispatchEvent(new CustomEvent('toast', { detail: toast }))
  
  setTimeout(() => {
    const index = globalToasts.findIndex(t => t.id === id)
    if (index > -1) {
      globalToasts.splice(index, 1)
    }
    window.dispatchEvent(new CustomEvent('toast-remove', { detail: { id } }))
  }, duration)
  
  return toast
}

export default useToast
