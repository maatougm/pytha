<template>
  <a 
    href="#main-content" 
    class="skip-link"
    @click.prevent="handleSkip"
  >
    {{ $t('a11y.skipToMain') || 'Skip to main content' }}
  </a>
</template>

<script setup>
import { useSkipLink } from '../composables/useA11y'

const { skipToMainContent } = useSkipLink()

function handleSkip() {
  skipToMainContent()
}
</script>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: #0ea5e9;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0 0 12px 12px;
  font-weight: 600;
  text-decoration: none;
  z-index: 9999;
  transition: top 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.skip-link:focus {
  top: 0;
  outline: 3px solid white;
  outline-offset: -3px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .skip-link {
    background: #000;
    color: #fff;
    border: 2px solid #fff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>
