<template>
  <header class="page-header">
    <div class="page-header-content">
      <div class="page-title-section">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions" />
      </div>
    </div>
    
    <div v-if="$slots.default" class="page-header-body">
      <slot />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.page-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: var(--space-6);
}

.page-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin-top: var(--space-1);
  margin-bottom: 0;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.page-header-body {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--space-4);
  }
  
  .page-header-content {
    flex-direction: column;
  }
  
  .page-actions {
    width: 100%;
  }
  
  .page-actions :deep(.btn) {
    flex: 1;
  }
}
</style>
