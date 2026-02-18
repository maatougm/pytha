<template>
  <div>
    <!-- Keyboard shortcut to open help -->
    <kbd 
      class="help-trigger"
      @click="showHelp = true"
      title="Press ? for keyboard shortcuts"
      tabindex="0"
      role="button"
      aria-label="Open keyboard shortcuts help"
      @keydown.enter="showHelp = true"
      @keydown.space.prevent="showHelp = true"
    >
      ?
    </kbd>

    <!-- Help Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showHelp" 
          class="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-shortcuts-title"
          @click.self="showHelp = false"
          ref="modalRef"
        >
          <div class="modal-content">
            <header class="modal-header">
              <h2 id="keyboard-shortcuts-title">
                ⌨️ {{ $t('a11y.keyboardShortcuts') || 'Keyboard Shortcuts' }}
              </h2>
              <button 
                class="btn-close"
                @click="showHelp = false"
                aria-label="Close keyboard shortcuts help"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div class="modal-body">
              <section 
                v-for="category in shortcutCategories" 
                :key="category.name"
                class="shortcut-category"
              >
                <h3>{{ category.name }}</h3>
                <dl class="shortcuts-list">
                  <div 
                    v-for="shortcut in category.shortcuts" 
                    :key="shortcut.key"
                    class="shortcut-item"
                  >
                    <dt>
                      <kbd>{{ formatKey(shortcut.key) }}</kbd>
                    </dt>
                    <dd>{{ shortcut.description }}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <footer class="modal-footer">
              <button class="btn btn-secondary" @click="showHelp = false">
                {{ $t('common.close') || 'Close' }}
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFocusTrap } from '../composables/useA11y'

const showHelp = ref(false)
const modalRef = ref(null)

const focusTrap = useFocusTrap(modalRef, {
  escapeCloses: true,
  onClose: () => { showHelp.value = false }
})

// Watch for modal open/close to manage focus trap
watch(showHelp, (isOpen) => {
  if (isOpen) {
    focusTrap.activate()
  } else {
    focusTrap.deactivate()
  }
})

// Global keyboard shortcut listener
function handleKeydown(event) {
  // Open help with ? key (but not when typing in input/textarea)
  if (event.key === '?' && !event.shiftKey) {
    const tagName = event.target.tagName.toLowerCase()
    const isEditable = event.target.isContentEditable
    const isInput = ['input', 'textarea', 'select'].includes(tagName)
    
    if (!isInput && !isEditable) {
      event.preventDefault()
      showHelp.value = true
    }
  }
  
  // Close help with Escape
  if (event.key === 'Escape' && showHelp.value) {
    showHelp.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const shortcutCategories = [
  {
    name: 'Navigation',
    shortcuts: [
      { key: 'Tab', description: 'Move to next focusable element' },
      { key: 'Shift+Tab', description: 'Move to previous focusable element' },
      { key: 'Enter/Space', description: 'Activate focused button or link' },
      { key: 'Escape', description: 'Close modal or cancel action' },
      { key: '?', description: 'Open this keyboard shortcuts help' },
    ]
  },
  {
    name: 'Messaging',
    shortcuts: [
      { key: 'Ctrl+Enter', description: 'Send message' },
      { key: 'Arrow Up', description: 'Navigate to previous message' },
      { key: 'Arrow Down', description: 'Navigate to next message' },
      { key: 'Alt+N', description: 'Create new channel' },
      { key: 'Alt+S', description: 'Focus search box' },
    ]
  },
  {
    name: 'Lists & Menus',
    shortcuts: [
      { key: '↑/↓', description: 'Navigate up/down in lists' },
      { key: 'Home', description: 'Jump to first item' },
      { key: 'End', description: 'Jump to last item' },
      { key: 'Enter', description: 'Select/activate item' },
    ]
  }
]

function formatKey(key) {
  // Replace modifiers with symbols for display
  return key
    .replace('Ctrl', '⌃')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace('Enter', '↵')
}
</script>

<style scoped>
.help-trigger {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 50%;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #737373;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 50;
}

.help-trigger:hover,
.help-trigger:focus {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: white;
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #737373;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover,
.btn-close:focus {
  background: #f5f5f5;
  color: #171717;
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.shortcut-category {
  margin-bottom: 1.5rem;
}

.shortcut-category:last-child {
  margin-bottom: 0;
}

.shortcut-category h3 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a3a3a3;
  margin: 0 0 0.75rem 0;
}

.shortcuts-list {
  margin: 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item dt {
  flex-shrink: 0;
  min-width: 100px;
}

.shortcut-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.5rem;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-family: system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #404040;
  box-shadow: 0 2px 0 #e5e5e5;
}

.shortcut-item dd {
  margin: 0;
  font-size: 0.9375rem;
  color: #737373;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e5e5;
}

.btn {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #171717;
}

.btn-secondary:hover,
.btn-secondary:focus {
  background: #e5e5e5;
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-content,
  .modal-leave-active .modal-content {
    transition: none;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .help-trigger {
    display: none;
  }
  
  .modal-content {
    max-height: 90vh;
    margin: 1rem;
  }
  
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
