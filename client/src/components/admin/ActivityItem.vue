<template>
  <div class="activity-item">
    <div class="activity-icon">{{ icon }}</div>
    <div class="activity-content">
      <span class="activity-value">{{ formatNumber(value) }}</span>
      <span class="activity-label">{{ label }}</span>
    </div>
    <div class="activity-trend" :class="trend">
      <span v-if="trend === 'up'">↑</span>
      <span v-else-if="trend === 'down'">↓</span>
      <span v-else>→</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  value: Number,
  label: String,
  trend: {
    type: String,
    default: 'stable'
  }
})

function formatNumber(num) {
  if (!num && num !== 0) return '-'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
</script>

<style scoped>
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-body);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  background: var(--bg-card);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.activity-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.activity-trend {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.activity-trend.up {
  background: var(--success-light);
  color: var(--success);
}

.activity-trend.down {
  background: var(--danger-light);
  color: var(--danger);
}

.activity-trend.stable {
  background: var(--bg-hover);
  color: var(--text-muted);
}
</style>
