<template>
  <!-- Screen reader only live region for announcements -->
  <div 
    class="sr-only" 
    role="status" 
    aria-live="polite" 
    aria-atomic="true"
  >
    {{ politeMessage }}
  </div>
  <div 
    class="sr-only" 
    role="alert" 
    aria-live="assertive" 
    aria-atomic="true"
  >
    {{ assertiveMessage }}
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { announcement, announcementPoliteness } from '../composables/useA11y'

const politeMessage = ref('')
const assertiveMessage = ref('')

// Watch for announcements and route to appropriate live region
watch(announcement, (newMessage) => {
  if (!newMessage) return
  
  if (announcementPoliteness.value === 'assertive') {
    assertiveMessage.value = ''
    setTimeout(() => {
      assertiveMessage.value = newMessage
    }, 100)
  } else {
    politeMessage.value = ''
    setTimeout(() => {
      politeMessage.value = newMessage
    }, 100)
  }
})
</script>

<style scoped>
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
</style>
