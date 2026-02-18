<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="subtitle">System overview and management</p>
      </div>
      <div class="header-actions">
        <select v-model="timeRange" @change="onTimeRangeChange" class="select">
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
        <button @click="refresh" class="btn btn-secondary" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner" style="width:16px;height:16px;border-width:2px;"></span>
          <span v-else>🔄 Refresh</span>
        </button>
        <span class="connection-status" :class="{ connected: isConnected }">
          {{ isConnected ? '● Live' : '● Offline' }}
        </span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <StatCard
        title="Total Users"
        :value="formatNumber(totalUsers)"
        :change="metrics?.users?.newToday"
        change-label="new today"
        icon="👥"
        color="blue"
      />
      <StatCard
        title="Active Users"
        :value="formatNumber(activeUsers)"
        :percentage="Math.round((activeUsers / totalUsers) * 100)"
        icon="🟢"
        color="green"
      />
      <StatCard
        title="Total Messages"
        :value="formatNumber(totalMessages)"
        :change="metrics?.messages?.today"
        change-label="today"
        icon="💬"
        color="purple"
      />
      <StatCard
        title="Courses"
        :value="formatNumber(metrics?.courses?.total)"
        :change="metrics?.courses?.active"
        change-label="active"
        icon="📚"
        color="orange"
      />
      <StatCard
        title="Storage Used"
        :value="formatBytes(metrics?.files?.totalSize)"
        :change="metrics?.files?.today"
        change-label="files today"
        icon="💾"
        color="red"
      />
      <StatCard
        title="System Uptime"
        :value="formattedUptime"
        :percentage="100 - memoryUsage"
        percentage-label="Memory Available"
        icon="⏱️"
        color="teal"
      />
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <h3>Activity Timeline</h3>
          <div class="legend">
            <span class="legend-item"><span class="dot" style="background:#6366f1"></span> Messages</span>
            <span class="legend-item"><span class="dot" style="background:#22c55e"></span> New Users</span>
            <span class="legend-item"><span class="dot" style="background:#f59e0b"></span> Logins</span>
          </div>
        </div>
        <LineChart
          v-if="timeline?.datasets"
          :chart-data="chartData"
          :options="chartOptions"
          style="height: 300px"
        />
        <div v-else class="loading-placeholder">
          <div class="loading-spinner"></div>
        </div>
      </div>

      <div class="chart-card small">
        <h3>Users by Role</h3>
        <DoughnutChart
          v-if="roleChartData"
          :chart-data="roleChartData"
          :options="{ responsive: true, maintainAspectRatio: false }"
          style="height: 250px"
        />
        <div v-else class="loading-placeholder">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <!-- Recent Activity -->
      <div class="panel">
        <div class="panel-header">
          <h3>🕐 Real-time Activity</h3>
        </div>
        <div class="activity-list">
          <div v-if="!realtimeStats" class="empty-state">
            <p>Connecting to real-time updates...</p>
          </div>
          <template v-else>
            <ActivityItem
              icon="💬"
              :value="realtimeStats.todayMessages"
              label="Messages Today"
              trend="up"
            />
            <ActivityItem
              icon="👁️"
              :value="realtimeStats.activeChannels"
              label="Active Channels (1h)"
              trend="stable"
            />
            <ActivityItem
              icon="📁"
              :value="realtimeStats.onlineUsers"
              label="Online Users"
              trend="up"
            />
          </template>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="panel">
        <div class="panel-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div class="quick-actions">
          <button @click="$router.push('/admin/users')" class="action-btn">
            <span class="icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button @click="$router.push('/admin/moderation')" class="action-btn">
            <span class="icon">🛡️</span>
            <span>Moderation Queue</span>
          </button>
          <button @click="$router.push('/admin/audit')" class="action-btn">
            <span class="icon">📋</span>
            <span>Audit Logs</span>
          </button>
          <button @click="$router.push('/admin/settings')" class="action-btn">
            <span class="icon">⚙️</span>
            <span>System Settings</span>
          </button>
          <button @click="$router.push('/admin/classes')" class="action-btn">
            <span class="icon">🏫</span>
            <span>Class Attendance</span>
          </button>
          <button @click="$router.push('/admin/teacher-allocations')" class="action-btn">
            <span class="icon">👨‍🏫</span>
            <span>Teacher Allocations</span>
          </button>
        </div>
      </div>

      <!-- System Health -->
      <div class="panel">
        <div class="panel-header">
          <h3>🏥 System Health</h3>
        </div>
        <div class="health-metrics">
          <HealthBar
            label="Memory Usage"
            :value="memoryUsage"
            :max="100"
            unit="%"
            :color="memoryUsage > 80 ? 'red' : memoryUsage > 60 ? 'yellow' : 'green'"
          />
          <HealthBar
            label="Database"
            value="100"
            :max="100"
            unit="%"
            color="green"
          />
          <HealthBar
            label="API Response"
            :value="98"
            :max="100"
            unit="%"
            color="green"
          />
        </div>
      </div>
    </div>
    <!-- Debug Panel -->
    <div v-if="true" style="margin-top: 20px; padding: 20px; background: #333; color: #0f0; border-radius: 8px; font-family: monospace;">
      <h3>Debug Info</h3>
      <p>Is Loading: {{ isLoading }}</p>
      <p>Socket Connected: {{ isConnected }}</p>
      <p>Error: {{ error }}</p>
      <details>
        <summary>Raw Metrics Data</summary>
        <pre>{{ JSON.stringify(metrics, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../stores/admin'
import StatCard from '../components/admin/StatCard.vue'
import ActivityItem from '../components/admin/ActivityItem.vue'
import HealthBar from '../components/admin/HealthBar.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const adminStore = useAdminStore()
const timeRange = ref('week')

const {
  metrics,
  timeline,
  realtimeStats,
  totalUsers,
  activeUsers,
  totalMessages,
  formattedUptime,
  memoryUsage,
  isLoading,
  isConnected,
  error
} = storeToRefs(adminStore)

// Safe Chart Data wrapper
const chartData = computed(() => {
  if (!timeline?.value?.labels || !timeline.value.datasets) return null
  
  return {
    labels: timeline.value.labels,
    datasets: timeline.value.datasets.map(ds => ({
      label: ds.name,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color + '20',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: { size: 13 },
      bodyFont: { size: 12 }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 11 }, color: '#9ca3af' }
    }
  }
}

const roleChartData = computed(() => {
  const byRole = metrics?.value?.users?.byRole
  if (!byRole || Object.keys(byRole).length === 0) return null
  
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
  
  return {
    labels: Object.keys(byRole).map(r => r.charAt(0).toUpperCase() + r.slice(1)),
    datasets: [{
      data: Object.values(byRole),
      backgroundColor: colors,
      borderWidth: 0
    }]
  }
})

// Helper functions
function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i]
}

async function refresh() {
  await adminStore.refreshDashboard()
}

function onTimeRangeChange() {
  adminStore.setTimeRange(timeRange.value)
}

onMounted(async () => {
  console.log('[AdminDashboard] Mounted')
  console.log('DEBUG REFS:', { 
    metrics: metrics, 
    timeline: timeline, 
    typeOfMetrics: typeof metrics,
    isAdminStoreObject: !!adminStore
  })

  adminStore.connectSocket()
  await refresh()
})

// Debug Watchers
watch(metrics, (newVal) => {
  console.log('[AdminDashboard] Metrics updated:', newVal)
})

watch(isConnected, (newVal) => {
  console.log('[AdminDashboard] Socket connected:', newVal)
})

watch(error, (newVal) => {
  if (newVal) console.error('[AdminDashboard] Error:', newVal)
})

onUnmounted(() => {
  adminStore.disconnectSocket()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
}

.connection-status {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--danger);
  padding: 4px 8px;
  background: var(--danger-light);
  border-radius: 20px;
}

.connection-status.connected {
  color: var(--success);
  background: var(--success-light);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.chart-card.small {
  min-width: 300px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bottom-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.panel-header {
  margin-bottom: 16px;
}

.panel-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-body);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
}

.action-btn .icon {
  font-size: 1.25rem;
}

.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 250px;
}

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
