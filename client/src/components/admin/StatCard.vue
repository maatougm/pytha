<template>
  <div class="stat-card" :class="`stat-${color}`">
    <div class="stat-icon">{{ icon }}</div>
    <div class="stat-content">
      <h3 class="stat-value">{{ value }}</h3>
      <p class="stat-title">{{ title }}</p>
      <div v-if="change !== undefined || percentage !== undefined" class="stat-meta">
        <span v-if="change !== undefined" class="stat-change">
          +{{ formatNumber(change) }} {{ changeLabel }}
        </span>
        <span v-if="percentage !== undefined" class="stat-percentage">
          {{ percentage }}% {{ percentageLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: String,
  change: Number,
  changeLabel: String,
  percentage: Number,
  percentageLabel: String,
  icon: String,
  color: {
    type: String,
    default: 'blue'
  }
})

function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}
</script>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: var(--bg-body);
}

.stat-blue .stat-icon { background: #eef2ff; }
.stat-green .stat-icon { background: #f0fdf4; }
.stat-purple .stat-icon { background: #faf5ff; }
.stat-orange .stat-icon { background: #fff7ed; }
.stat-red .stat-icon { background: #fef2f2; }
.stat-teal .stat-icon { background: #f0fdfa; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  line-height: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.stat-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.stat-change {
  color: var(--success);
  font-weight: 600;
}

.stat-percentage {
  color: var(--text-muted);
}
</style>
