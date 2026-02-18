<template>
  <div class="health-bar">
    <div class="health-label">
      <span>{{ label }}</span>
      <span class="health-value" :class="colorClass">{{ Math.round((value / max) * 100) }}%</span>
    </div>
    <div class="health-track">
      <div 
        class="health-fill" 
        :class="colorClass"
        :style="{ width: `${(value / max) * 100}%` }"
      ></div>
    </div>
    <div class="health-meta">
      <span>{{ formatValue(value) }} / {{ formatValue(max) }} {{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: Number,
  max: Number,
  unit: String,
  color: {
    type: String,
    default: 'green'
  }
})

const colorClass = computed(() => `health-${props.color}`)

function formatValue(val) {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'G'
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return val.toString()
}
</script>

<style scoped>
.health-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.health-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.health-value {
  font-weight: 600;
}

.health-track {
  height: 8px;
  background: var(--bg-body);
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.health-green { color: #22c55e; }
.health-green.health-fill { background: #22c55e; }

.health-yellow { color: #f59e0b; }
.health-yellow.health-fill { background: #f59e0b; }

.health-red { color: #ef4444; }
.health-red.health-fill { background: #ef4444; }

.health-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
