<template>
  <div 
    class="loading-spinner"
    :class="{ inline, overlay, small, large }"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div 
      class="spinner"
      :aria-label="label || $t('common.loading') || 'Loading'"
      role="img"
    >
      <svg 
        v-if="type === 'spinner'"
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle 
          class="spinner-track" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="2"
          opacity="0.25"
        />
        <path 
          class="spinner-head"
          d="M12 2C6.477 2 2 6.477 2 12"
          stroke="currentColor" 
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      
      <div v-else-if="type === 'dots'" class="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div v-else-if="type === 'pulse'" class="pulse"></div>
    </div>
    
    <span v-if="showText && text" class="loading-text">
      {{ text }}
    </span>
    
    <!-- Visually hidden text for screen readers -->
    <span class="sr-only">
      {{ label || text || $t('common.loading') || 'Loading, please wait' }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'spinner',
    validator: (v) => ['spinner', 'dots', 'pulse'].includes(v)
  },
  inline: Boolean,
  overlay: Boolean,
  small: Boolean,
  large: Boolean,
  showText: Boolean,
  text: String,
  label: String,
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-spinner.inline {
  display: inline-flex;
  flex-direction: row;
}

.loading-spinner.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 100;
}

.spinner {
  display: inline-flex;
  color: #0ea5e9;
}

.spinner svg {
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.spinner.small svg {
  width: 16px;
  height: 16px;
}

.spinner.large svg {
  width: 64px;
  height: 64px;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-head {
  transform-origin: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dots animation */
.dots {
  display: flex;
  gap: 4px;
}

.dots span {
  width: 8px;
  height: 8px;
  background: #0ea5e9;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Pulse animation */
.pulse {
  width: 40px;
  height: 40px;
  background: #0ea5e9;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.loading-text {
  font-size: 0.875rem;
  color: #737373;
  font-weight: 500;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner svg,
  .dots span,
  .pulse {
    animation: none;
  }
  
  .dots span {
    opacity: 0.5;
  }
  
  .pulse {
    opacity: 0.5;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .spinner {
    color: #000;
  }
  
  .spinner-track {
    opacity: 0.5;
    stroke: #000;
  }
  
  .dots span,
  .pulse {
    background: #000;
  }
}
</style>
