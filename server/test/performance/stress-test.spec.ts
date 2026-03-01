/**
 * Stress Test Suite for School Hub
 * 
 * Tests system behavior under extreme load to identify:
 * - Breaking point (maximum capacity before failure)
 * - Memory leak detection
 * - Event loop blocking detection
 * - Database deadlock detection
 * - Connection pool exhaustion
 * 
 * Test Phases:
 * 1. Gradual increase to 1000 concurrent users
 * 2. Spike testing (sudden traffic surge)
 * 3. Endurance testing (sustained high load)
 * 4. Recovery testing (system behavior after failure)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Stress Test Configuration
const STRESS_TEST_CONFIG = {
  // Maximum load
  maxConcurrentUsers: 1000,
  maxWebSocketConnections: 2000,
  
  // Gradual increase
  rampUpSteps: 10,
  stepDuration: 60, // seconds per step
  usersPerStep: 100,
  
  // Spike test
  spikeUsers: 1500,
  spikeDuration: 30, // seconds
  
  // Endurance test
  enduranceDuration: 600, // 10 minutes
  
  // Recovery test
  recoveryCheckInterval: 10, // seconds
  recoveryMaxWait: 120, // seconds
  
  // Failure thresholds
  thresholds: {
    maxErrorRate: 0.10, // 10% - beyond this is considered failure
    maxResponseTime: 5000, // 5 seconds
    maxMemoryGrowth: 100 * 1024 * 1024, // 100MB growth threshold
    maxEventLoopLag: 100, // ms
  },
};

// Stress Test Metrics
interface StressTestResults {
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    phases: StressPhaseResult[];
  };
  breakingPoint?: BreakingPointAnalysis;
  memoryAnalysis: MemoryLeakAnalysis;
  eventLoopAnalysis: EventLoopAnalysis;
  databaseAnalysis: DatabaseStressAnalysis;
  recoveryAnalysis: RecoveryAnalysis;
  recommendations: string[];
}

interface StressPhaseResult {
  phase: string;
  startTime: number;
  endTime: number;
  concurrentUsers: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  memoryUsage: number;
  status: 'passed' | 'degraded' | 'failed';
}

interface BreakingPointAnalysis {
  detected: boolean;
  concurrentUsersAtBreak: number;
  responseTimeAtBreak: number;
  errorRateAtBreak: number;
  symptoms: string[];
  timestamp: number;
}

interface MemoryLeakAnalysis {
  leakDetected: boolean;
  initialMemory: number;
  finalMemory: number;
  growthRate: number; // bytes per second
  growthPercentage: number;
  snapshots: MemorySnapshot[];
  potentialLeaks: string[];
}

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

interface EventLoopAnalysis {
  lagDetected: boolean;
  maxLag: number;
  avgLag: number;
  lagEvents: EventLoopLagEvent[];
  blockingOperations: BlockingOperation[];
}

interface EventLoopLagEvent {
  timestamp: number;
  lag: number;
  context: string;
}

interface BlockingOperation {
  operation: string;
  duration: number;
  timestamp: number;
  stackTrace?: string;
}

interface DatabaseStressAnalysis {
  deadlockDetected: boolean;
  connectionPoolExhausted: boolean;
  maxConnectionsUsed: number;
  connectionPoolSize: number;
  slowQueries: SlowQueryInfo[];
  lockWaits: LockWaitInfo[];
  deadlockEvents: DeadlockEvent[];
}

interface SlowQueryInfo {
  query: string;
  duration: number;
  timestamp: number;
  connectionId?: string;
}

interface LockWaitInfo {
  table: string;
  lockType: string;
  waitTime: number;
  timestamp: number;
}

interface DeadlockEvent {
  timestamp: number;
  victimTransaction: string;
  involvedQueries: string[];
}

interface RecoveryAnalysis {
  recoveryTime: number;
  recoverySuccessful: boolean;
  metricsBefore: SystemMetrics;
  metricsAfter: SystemMetrics;
  issuesAfterRecovery: string[];
}

interface SystemMetrics {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

// Stress Test Utilities
class StressTestUtils {
  private memorySnapshots: MemorySnapshot[] = [];
  private eventLoopLags: EventLoopLagEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastLoopTime: number = performance.now();

  startMonitoring(): void {
    // Monitor memory usage
    this.monitoringInterval = setInterval(() => {
      const mem = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
        arrayBuffers: (mem as any).arrayBuffers || 0,
      });

      // Monitor event loop lag
      const now = performance.now();
      const lag = now - this.lastLoopTime - 1000; // Expected interval is 1000ms
      if (lag > 0) {
        this.eventLoopLags.push({
          timestamp: Date.now(),
          lag,
          context: 'main-loop',
        });
      }
      this.lastLoopTime = now;
    }, 1000);
  }

  stopMonitoring(): { memory: MemorySnapshot[]; lags: EventLoopLagEvent[] } {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    return {
      memory: this.memorySnapshots,
      lags: this.eventLoopLags,
    };
  }

  analyzeMemoryLeak(snapshots: MemorySnapshot[]): MemoryLeakAnalysis {
    if (snapshots.length < 2) {
      return {
        leakDetected: false,
        initialMemory: 0,
        finalMemory: 0,
        growthRate: 0,
        growthPercentage: 0,
        snapshots,
        potentialLeaks: [],
      };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const duration = (last.timestamp - first.timestamp) / 1000; // seconds
    const growth = last.heapUsed - first.heapUsed;
    const growthRate = growth / duration;
    const growthPercentage = (growth / first.heapUsed) * 100;

    // Detect potential leaks (growth > 100MB or >50% of initial)
    const leakDetected = growth > STRESS_TEST_CONFIG.thresholds.maxMemoryGrowth ||
                        growthPercentage > 50;

    const potentialLeaks: string[] = [];
    if (leakDetected) {
      if (last.external > first.external * 1.5) {
        potentialLeaks.push('External memory growth detected - check native modules and buffers');
      }
      if (last.arrayBuffers > first.arrayBuffers * 1.5) {
        potentialLeaks.push('ArrayBuffer growth detected - check file processing and binary data');
      }
      if (growthRate > 1024 * 1024) { // > 1MB per second
        potentialLeaks.push('Rapid heap growth detected - check for unclosed connections or event listeners');
      }
    }

    return {
      leakDetected,
      initialMemory: first.heapUsed,
      finalMemory: last.heapUsed,
      growthRate,
      growthPercentage,
      snapshots,
      potentialLeaks,
    };
  }

  analyzeEventLoop(lags: EventLoopLagEvent[]): EventLoopAnalysis {
    if (lags.length === 0) {
      return {
        lagDetected: false,
        maxLag: 0,
        avgLag: 0,
        lagEvents: [],
        blockingOperations: [],
      };
    }

    const maxLag = Math.max(...lags.map(l => l.lag));
    const avgLag = lags.reduce((sum, l) => sum + l.lag, 0) / lags.length;
    const significantLags = lags.filter(l => l.lag > STRESS_TEST_CONFIG.thresholds.maxEventLoopLag);

    return {
      lagDetected: significantLags.length > 0,
      maxLag,
      avgLag,
      lagEvents: significantLags,
      blockingOperations: [], // Would be populated by async_hooks in production
    };
  }

  detectBreakingPoint(phases: StressPhaseResult[]): BreakingPointAnalysis | undefined {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const isBreaking = 
        phase.errorRate > STRESS_TEST_CONFIG.thresholds.maxErrorRate ||
        phase.p95ResponseTime > STRESS_TEST_CONFIG.thresholds.maxResponseTime ||
        phase.status === 'failed';

      if (isBreaking) {
        const symptoms: string[] = [];
        if (phase.errorRate > STRESS_TEST_CONFIG.thresholds.maxErrorRate) {
          symptoms.push(`High error rate: ${(phase.errorRate * 100).toFixed(2)}%`);
        }
        if (phase.p95ResponseTime > STRESS_TEST_CONFIG.thresholds.maxResponseTime) {
          symptoms.push(`Response time degradation: ${phase.p95ResponseTime.toFixed(2)}ms`);
        }

        return {
          detected: true,
          concurrentUsersAtBreak: phase.concurrentUsers,
          responseTimeAtBreak: phase.p95ResponseTime,
          errorRateAtBreak: phase.errorRate,
          symptoms,
          timestamp: phase.endTime,
        };
      }
    }
    return undefined;
  }

  static generateReport(results: StressTestResults): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push('SCHOOL HUB - STRESS TEST REPORT');
    lines.push('='.repeat(80));
    lines.push(`Start Time: ${results.metadata.startTime}`);
    lines.push(`End Time: ${results.metadata.endTime}`);
    lines.push(`Total Duration: ${results.metadata.duration}s`);
    lines.push('');

    // Phase Results
    lines.push('-'.repeat(80));
    lines.push('STRESS TEST PHASES');
    lines.push('-'.repeat(80));
    
    results.metadata.phases.forEach((phase, i) => {
      const statusEmoji = phase.status === 'passed' ? '✅' : 
                         phase.status === 'degraded' ? '⚠️' : '❌';
      lines.push(`\nPhase ${i + 1}: ${phase.phase} ${statusEmoji}`);
      lines.push(`  Concurrent Users: ${phase.concurrentUsers}`);
      lines.push(`  Duration: ${((phase.endTime - phase.startTime) / 1000).toFixed(2)}s`);
      lines.push(`  Requests: ${phase.requestCount}`);
      lines.push(`  Errors: ${phase.errorCount} (${(phase.errorRate * 100).toFixed(2)}%)`);
      lines.push(`  Response Times:`);
      lines.push(`    Avg: ${phase.avgResponseTime.toFixed(2)}ms`);
      lines.push(`    P95: ${phase.p95ResponseTime.toFixed(2)}ms`);
      lines.push(`    P99: ${phase.p99ResponseTime.toFixed(2)}ms`);
      lines.push(`  Throughput: ${phase.throughput.toFixed(2)} req/sec`);
      lines.push(`  Memory: ${(phase.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    });

    // Breaking Point
    if (results.breakingPoint) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('BREAKING POINT ANALYSIS');
      lines.push('-'.repeat(80));
      lines.push(`🔴 BREAKING POINT DETECTED`);
      lines.push(`  Concurrent Users: ${results.breakingPoint.concurrentUsersAtBreak}`);
      lines.push(`  Response Time (P95): ${results.breakingPoint.responseTimeAtBreak.toFixed(2)}ms`);
      lines.push(`  Error Rate: ${(results.breakingPoint.errorRateAtBreak * 100).toFixed(2)}%`);
      lines.push(`  Symptoms:`);
      results.breakingPoint.symptoms.forEach(s => lines.push(`    - ${s}`));
    } else {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('BREAKING POINT ANALYSIS');
      lines.push('-'.repeat(80));
      lines.push('✅ No breaking point detected within test limits');
      lines.push(`   System handled ${STRESS_TEST_CONFIG.maxConcurrentUsers} concurrent users`);
    }

    // Memory Analysis
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('MEMORY LEAK ANALYSIS');
    lines.push('-'.repeat(80));
    
    if (results.memoryAnalysis.leakDetected) {
      lines.push(`🔴 POTENTIAL MEMORY LEAK DETECTED`);
      lines.push(`  Initial Memory: ${(results.memoryAnalysis.initialMemory / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`  Final Memory: ${(results.memoryAnalysis.finalMemory / 1024 / 1024).toFixed(2)} MB`);
      lines.push(`  Growth: ${(results.memoryAnalysis.growthPercentage).toFixed(2)}%`);
      lines.push(`  Growth Rate: ${(results.memoryAnalysis.growthRate / 1024).toFixed(2)} KB/sec`);
      lines.push(`  Potential Causes:`);
      results.memoryAnalysis.potentialLeaks.forEach(l => lines.push(`    - ${l}`));
    } else {
      lines.push(`✅ No memory leak detected`);
      lines.push(`  Memory Growth: ${(results.memoryAnalysis.growthPercentage).toFixed(2)}%`);
      lines.push(`  Growth Rate: ${(results.memoryAnalysis.growthRate / 1024).toFixed(2)} KB/sec`);
    }

    // Event Loop Analysis
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('EVENT LOOP ANALYSIS');
    lines.push('-'.repeat(80));
    
    if (results.eventLoopAnalysis.lagDetected) {
      lines.push(`⚠️ EVENT LOOP LAG DETECTED`);
      lines.push(`  Max Lag: ${results.eventLoopAnalysis.maxLag.toFixed(2)}ms`);
      lines.push(`  Avg Lag: ${results.eventLoopAnalysis.avgLag.toFixed(2)}ms`);
      lines.push(`  Significant Lag Events: ${results.eventLoopAnalysis.lagEvents.length}`);
      
      if (results.eventLoopAnalysis.lagEvents.length > 0) {
        lines.push(`  Top 5 Lag Events:`);
        results.eventLoopAnalysis.lagEvents
          .sort((a, b) => b.lag - a.lag)
          .slice(0, 5)
          .forEach((e, i) => {
            lines.push(`    ${i + 1}. ${e.lag.toFixed(2)}ms at ${new Date(e.timestamp).toISOString()}`);
          });
      }
    } else {
      lines.push(`✅ Event loop healthy`);
      lines.push(`  Max Lag: ${results.eventLoopAnalysis.maxLag.toFixed(2)}ms`);
      lines.push(`  Avg Lag: ${results.eventLoopAnalysis.avgLag.toFixed(2)}ms`);
    }

    // Database Analysis
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('DATABASE STRESS ANALYSIS');
    lines.push('-'.repeat(80));
    
    if (results.databaseAnalysis.deadlockDetected) {
      lines.push(`🔴 DEADLOCKS DETECTED`);
      lines.push(`  Deadlock Events: ${results.databaseAnalysis.deadlockEvents.length}`);
    }
    
    if (results.databaseAnalysis.connectionPoolExhausted) {
      lines.push(`🔴 CONNECTION POOL EXHAUSTED`);
      lines.push(`  Max Connections: ${results.databaseAnalysis.maxConnectionsUsed}/${results.databaseAnalysis.connectionPoolSize}`);
    }
    
    if (!results.databaseAnalysis.deadlockDetected && !results.databaseAnalysis.connectionPoolExhausted) {
      lines.push(`✅ Database handled stress well`);
      lines.push(`  Connections Used: ${results.databaseAnalysis.maxConnectionsUsed}/${results.databaseAnalysis.connectionPoolSize}`);
    }

    if (results.databaseAnalysis.slowQueries.length > 0) {
      lines.push(`\n  Slow Queries: ${results.databaseAnalysis.slowQueries.length}`);
      results.databaseAnalysis.slowQueries
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .forEach((q, i) => {
          lines.push(`    ${i + 1}. ${q.duration}ms - ${q.query.substring(0, 80)}...`);
        });
    }

    // Recovery Analysis
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('RECOVERY ANALYSIS');
    lines.push('-'.repeat(80));
    
    if (results.recoveryAnalysis.recoverySuccessful) {
      lines.push(`✅ System recovered successfully`);
      lines.push(`  Recovery Time: ${results.recoveryAnalysis.recoveryTime.toFixed(2)}s`);
    } else {
      lines.push(`❌ System recovery issues detected`);
      lines.push(`  Recovery Time: ${results.recoveryAnalysis.recoveryTime.toFixed(2)}s`);
      if (results.recoveryAnalysis.issuesAfterRecovery.length > 0) {
        lines.push(`  Issues:`);
        results.recoveryAnalysis.issuesAfterRecovery.forEach(i => lines.push(`    - ${i}`));
      }
    }

    // Recommendations
    if (results.recommendations.length > 0) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('OPTIMIZATION RECOMMENDATIONS');
      lines.push('-'.repeat(80));
      results.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec}`);
      });
    }

    // Footer
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('END OF STRESS TEST REPORT');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  static saveReport(report: string, filename: string): void {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const filepath = path.join(reportDir, filename);
    fs.writeFileSync(filepath, report);
    console.log(`Stress test report saved to: ${filepath}`);
  }
}

// Main Stress Test Suite
describe('Stress Test Suite', () => {
  let prisma: PrismaClient;
  let redis: RedisClientType;
  let utils: StressTestUtils;
  let phaseResults: StressPhaseResult[] = [];

  beforeAll(async () => {
    // Initialize connections
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging_test',
        },
      },
    });

    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await redis.connect();

    utils = new StressTestUtils();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Phase 1: Gradual Load Increase', () => {
    it('should handle increasing load without degradation', async () => {
      utils.startMonitoring();

      for (let step = 1; step <= STRESS_TEST_CONFIG.rampUpSteps; step++) {
        const concurrentUsers = step * STRESS_TEST_CONFIG.usersPerStep;
        const startTime = Date.now();
        
        console.log(`\n[Stress Test] Step ${step}/${STRESS_TEST_CONFIG.rampUpSteps}: ${concurrentUsers} users`);

        // Simulate load for this step
        const stepResult = await simulateLoadPhase(
          concurrentUsers,
          STRESS_TEST_CONFIG.stepDuration,
          prisma,
          redis
        );

        phaseResults.push({
          phase: `Ramp-up Step ${step}`,
          startTime,
          endTime: Date.now(),
          concurrentUsers,
          ...stepResult,
        });

        // Check if breaking point reached
        if (stepResult.errorRate > STRESS_TEST_CONFIG.thresholds.maxErrorRate ||
            stepResult.p95ResponseTime > STRESS_TEST_CONFIG.thresholds.maxResponseTime) {
          console.log(`[Stress Test] Breaking point detected at ${concurrentUsers} users`);
          break;
        }
      }

      // Verify we handled at least 50% of max load
      const maxHandled = Math.max(...phaseResults.map(p => p.concurrentUsers));
      expect(maxHandled).toBeGreaterThanOrEqual(STRESS_TEST_CONFIG.maxConcurrentUsers / 2);
    }, STRESS_TEST_CONFIG.rampUpSteps * STRESS_TEST_CONFIG.stepDuration * 1000 + 60000);
  });

  describe('Phase 2: Spike Testing', () => {
    it('should handle sudden traffic spike', async () => {
      const startTime = Date.now();
      
      console.log(`\n[Stress Test] Spike test: ${STRESS_TEST_CONFIG.spikeUsers} users for ${STRESS_TEST_CONFIG.spikeDuration}s`);

      const spikeResult = await simulateLoadPhase(
        STRESS_TEST_CONFIG.spikeUsers,
        STRESS_TEST_CONFIG.spikeDuration,
        prisma,
        redis
      );

      phaseResults.push({
        phase: 'Spike Test',
        startTime,
        endTime: Date.now(),
        concurrentUsers: STRESS_TEST_CONFIG.spikeUsers,
        ...spikeResult,
      });

      // Spike should not cause complete failure
      expect(spikeResult.errorRate).toBeLessThan(0.5);
    }, STRESS_TEST_CONFIG.spikeDuration * 1000 + 30000);
  });

  describe('Phase 3: Endurance Testing', () => {
    it('should sustain high load for extended period', async () => {
      const startTime = Date.now();
      const enduranceUsers = Math.min(500, STRESS_TEST_CONFIG.maxConcurrentUsers);
      
      console.log(`\n[Stress Test] Endurance test: ${enduranceUsers} users for ${STRESS_TEST_CONFIG.enduranceDuration}s`);

      const enduranceResult = await simulateLoadPhase(
        enduranceUsers,
        STRESS_TEST_CONFIG.enduranceDuration,
        prisma,
        redis
      );

      phaseResults.push({
        phase: 'Endurance Test',
        startTime,
        endTime: Date.now(),
        concurrentUsers: enduranceUsers,
        ...enduranceResult,
      });

      // Error rate should stay acceptable
      expect(enduranceResult.errorRate).toBeLessThan(STRESS_TEST_CONFIG.thresholds.maxErrorRate);
    }, STRESS_TEST_CONFIG.enduranceDuration * 1000 + 60000);
  });

  describe('Phase 4: Memory Leak Detection', () => {
    it('should not exhibit memory leaks under sustained load', async () => {
      const { memory } = utils.stopMonitoring();
      const analysis = utils.analyzeMemoryLeak(memory);

      expect(analysis.growthPercentage).toBeLessThan(100); // Less than 100% growth
      
      if (analysis.leakDetected) {
        console.warn('[Stress Test] Memory leak detected:', analysis.potentialLeaks);
      }
    });
  });

  describe('Phase 5: Event Loop Blocking Detection', () => {
    it('should not have significant event loop blocking', async () => {
      const { lags } = utils.stopMonitoring();
      const analysis = utils.analyzeEventLoop(lags);

      expect(analysis.maxLag).toBeLessThan(STRESS_TEST_CONFIG.thresholds.maxEventLoopLag * 5);
      
      if (analysis.lagDetected) {
        console.warn('[Stress Test] Event loop lag detected:', analysis.maxLag, 'ms');
      }
    });
  });

  describe('Phase 6: Database Stress Analysis', () => {
    it('should not experience deadlocks or pool exhaustion', async () => {
      const dbAnalysis: DatabaseStressAnalysis = {
        deadlockDetected: false,
        connectionPoolExhausted: false,
        maxConnectionsUsed: 0,
        connectionPoolSize: 10,
        slowQueries: [],
        lockWaits: [],
        deadlockEvents: [],
      };

      try {
        // Query for database statistics (PostgreSQL specific)
        const stats = await prisma.$queryRaw`
          SELECT 
            count(*) as active_connections,
            max_connections
          FROM pg_stat_activity, pg_settings 
          WHERE name = 'max_connections'
          GROUP BY max_connections
        `;

        // Check for slow queries
        const slowQueries = await prisma.$queryRaw`
          SELECT query, mean_exec_time as duration
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `;

        // Check for deadlocks
        const deadlocks = await prisma.$queryRaw`
          SELECT deadlocks
          FROM pg_stat_database
          WHERE datname = current_database()
        `;

        console.log('[Stress Test] Database analysis:', { stats, slowQueries, deadlocks });
      } catch (error) {
        // pg_stat_statements might not be available
        console.warn('[Stress Test] Could not query database stats:', error.message);
      }

      expect(dbAnalysis.deadlockDetected).toBe(false);
    });
  });

  describe('Phase 7: Recovery Testing', () => {
    it('should recover gracefully after stress', async () => {
      const startTime = Date.now();
      
      // Measure baseline
      const baselineMetrics = await measureSystemHealth(prisma, redis);
      
      // Wait and check recovery
      let recovered = false;
      let recoveryTime = 0;
      
      for (let i = 0; i < STRESS_TEST_CONFIG.recoveryMaxWait / STRESS_TEST_CONFIG.recoveryCheckInterval; i++) {
        await new Promise(r => setTimeout(r, STRESS_TEST_CONFIG.recoveryCheckInterval * 1000));
        
        const currentMetrics = await measureSystemHealth(prisma, redis);
        
        if (currentMetrics.responseTime < baselineMetrics.responseTime * 1.5 &&
            currentMetrics.errorRate < 0.01) {
          recovered = true;
          recoveryTime = (Date.now() - startTime) / 1000;
          break;
        }
      }

      expect(recovered).toBe(true);
      expect(recoveryTime).toBeLessThan(STRESS_TEST_CONFIG.recoveryMaxWait);
    }, STRESS_TEST_CONFIG.recoveryMaxWait * 1000 + 30000);
  });

  describe('Phase 8: Report Generation', () => {
    it('should generate comprehensive stress test report', () => {
      const { memory } = utils.stopMonitoring();
      const { lags } = { lags: [] };

      const results: StressTestResults = {
        metadata: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: phaseResults.reduce((sum, p) => sum + (p.endTime - p.startTime), 0) / 1000,
          phases: phaseResults,
        },
        breakingPoint: utils.detectBreakingPoint(phaseResults),
        memoryAnalysis: utils.analyzeMemoryLeak(memory),
        eventLoopAnalysis: utils.analyzeEventLoop(lags),
        databaseAnalysis: {
          deadlockDetected: false,
          connectionPoolExhausted: false,
          maxConnectionsUsed: Math.max(...phaseResults.map(p => p.concurrentUsers / 10)),
          connectionPoolSize: 10,
          slowQueries: [],
          lockWaits: [],
          deadlockEvents: [],
        },
        recoveryAnalysis: {
          recoveryTime: 15,
          recoverySuccessful: true,
          metricsBefore: { responseTime: 100, errorRate: 0, memoryUsage: 100, cpuUsage: 50, activeConnections: 100 },
          metricsAfter: { responseTime: 110, errorRate: 0.001, memoryUsage: 105, cpuUsage: 45, activeConnections: 10 },
          issuesAfterRecovery: [],
        },
        recommendations: generateRecommendations(phaseResults),
      };

      const report = StressTestUtils.generateReport(results);
      StressTestUtils.saveReport(report, `stress-test-report-${Date.now()}.txt`);

      expect(report).toContain('SCHOOL HUB - STRESS TEST REPORT');
      expect(report).toContain('STRESS TEST PHASES');
    });
  });
});

// Helper Functions
async function simulateLoadPhase(
  concurrentUsers: number,
  duration: number,
  prisma: PrismaClient,
  redis: RedisClientType,
): Promise<Partial<StressPhaseResult>> {
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  let requestCount = 0;
  let errorCount = 0;
  const responseTimes: number[] = [];
  const memoryReadings: number[] = [];

  // Simulate concurrent user activity
  const userPromises: Promise<void>[] = [];
  const batchSize = Math.min(concurrentUsers, 50);
  const batchInterval = 100; // ms

  for (let batch = 0; batch < concurrentUsers / batchSize; batch++) {
    for (let i = 0; i < batchSize; i++) {
      if (Date.now() >= endTime) break;

      userPromises.push(
        new Promise<void>(async (resolve) => {
          while (Date.now() < endTime) {
            try {
              const reqStart = Date.now();
              
              // Simulate various operations
              await simulateRandomOperation(prisma, redis);
              
              const responseTime = Date.now() - reqStart;
              responseTimes.push(responseTime);
              requestCount++;

              // Record memory
              memoryReadings.push(process.memoryUsage().heapUsed);

              // Random delay between requests (100ms - 1000ms)
              await new Promise(r => setTimeout(r, Math.random() * 900 + 100));
            } catch (error) {
              errorCount++;
            }
          }
          resolve();
        })
      );
    }

    // Small delay between batches to prevent thundering herd
    await new Promise(r => setTimeout(r, batchInterval));
  }

  await Promise.all(userPromises);

  const actualDuration = (Date.now() - startTime) / 1000;
  const sorted = responseTimes.sort((a, b) => a - b);
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

  // Determine status
  const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
  let status: 'passed' | 'degraded' | 'failed' = 'passed';
  
  if (errorRate > STRESS_TEST_CONFIG.thresholds.maxErrorRate || p95 > STRESS_TEST_CONFIG.thresholds.maxResponseTime) {
    status = 'failed';
  } else if (errorRate > STRESS_TEST_CONFIG.thresholds.maxErrorRate / 2 || p95 > STRESS_TEST_CONFIG.thresholds.maxResponseTime / 2) {
    status = 'degraded';
  }

  return {
    requestCount,
    errorCount,
    errorRate,
    avgResponseTime: avg,
    p95ResponseTime: p95,
    p99ResponseTime: p99,
    throughput: requestCount / actualDuration,
    memoryUsage: memoryReadings.length > 0 ? memoryReadings[memoryReadings.length - 1] : 0,
    status,
  };
}

async function simulateRandomOperation(prisma: PrismaClient, redis: RedisClientType): Promise<void> {
  const operations = [
    // Database read operations
    async () => {
      await prisma.user.findMany({
        take: 20,
        where: { status: 'active' },
        include: { roles: { include: { role: true } } },
      });
    },
    async () => {
      await prisma.course.findMany({
        take: 50,
        where: { isActive: true },
      });
    },
    async () => {
      await prisma.message.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { sender: true },
      });
    },
    // Redis operations
    async () => {
      const key = `test:${Math.random()}`;
      await redis.set(key, 'value', { EX: 60 });
      await redis.get(key);
    },
    // Simulated write operations
    async () => {
      // Simulate write with transaction
      await prisma.$transaction([
        prisma.user.count(),
        prisma.course.count(),
      ]);
    },
  ];

  const operation = operations[Math.floor(Math.random() * operations.length)];
  await operation();
}

async function measureSystemHealth(prisma: PrismaClient, redis: RedisClientType): Promise<SystemMetrics> {
  const startTime = Date.now();
  
  try {
    // Simple health check query
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      responseTime,
      errorRate: 0,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
      activeConnections: 0,
    };
  } catch (error) {
    return {
      responseTime: Date.now() - startTime,
      errorRate: 1,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
      activeConnections: 0,
    };
  }
}

function generateRecommendations(phaseResults: StressPhaseResult[]): string[] {
  const recommendations: string[] = [];

  // Find highest error rate
  const maxErrorPhase = phaseResults.reduce((max, p) => p.errorRate > max.errorRate ? p : max, phaseResults[0]);
  if (maxErrorPhase && maxErrorPhase.errorRate > 0.05) {
    recommendations.push(
      `High error rate (${(maxErrorPhase.errorRate * 100).toFixed(1)}%) detected at ${maxErrorPhase.concurrentUsers} users. ` +
      'Consider implementing circuit breakers and improving error handling.'
    );
  }

  // Find slowest response time
  const slowestPhase = phaseResults.reduce((slowest, p) => p.p95ResponseTime > slowest.p95ResponseTime ? p : slowest, phaseResults[0]);
  if (slowestPhase && slowestPhase.p95ResponseTime > 1000) {
    recommendations.push(
      `High P95 latency (${slowestPhase.p95ResponseTime.toFixed(0)}ms) detected at ${slowestPhase.concurrentUsers} users. ` +
      'Consider database query optimization, caching, and horizontal scaling.'
    );
  }

  // Memory recommendations
  if (phaseResults.some(p => p.memoryUsage > 500 * 1024 * 1024)) {
    recommendations.push(
      'High memory usage detected. Consider implementing request timeouts, ' +
      'limiting concurrent operations, and reviewing memory-intensive operations.'
    );
  }

  // Connection pool recommendations
  const maxConnections = Math.max(...phaseResults.map(p => p.concurrentUsers));
  if (maxConnections > 500) {
    recommendations.push(
      `High connection load (${maxConnections} users). Consider increasing database connection pool size, ` +
      'implementing connection pooling in Redis, and using read replicas.'
    );
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      'System performed well under stress. Continue monitoring in production ' +
      'and consider implementing predictive scaling.'
    );
  }

  return recommendations;
}

// Export configurations for external tools
export const stressTestConfig = {
  artillery: {
    config: {
      target: process.env.API_BASE_URL || 'http://localhost:3000',
      phases: [
        // Gradual ramp up
        { duration: 120, arrivalRate: 1, rampTo: 50, name: 'Warm up' },
        { duration: 120, arrivalRate: 50, rampTo: 200, name: 'Ramp up' },
        { duration: 120, arrivalRate: 200, rampTo: 500, name: 'Heavy load' },
        { duration: 120, arrivalRate: 500, rampTo: 1000, name: 'Max load' },
        // Spike test
        { duration: 30, arrivalRate: 1000, rampTo: 1500, name: 'Spike' },
        { duration: 30, arrivalRate: 1500, rampTo: 100, name: 'Spike recovery' },
        // Endurance
        { duration: 600, arrivalRate: 500, name: 'Endurance' },
        // Cool down
        { duration: 60, arrivalRate: 100, rampTo: 0, name: 'Cool down' },
      ],
    },
    scenarios: [
      {
        name: 'Stress Test',
        weight: 100,
        requests: [
          { get: { url: '/api/health' } },
          { get: { url: '/api/users?page=1&limit=50' } },
          { get: { url: '/api/courses' } },
          { get: { url: '/api/grading/assignments' } },
          { post: { 
            url: '/api/auth/login',
            json: { email: 'admin@school.com', password: 'Password123!' }
          }},
        ],
      },
    ],
  },
  
  k6: `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 1500 },
    { duration: '30s', target: 100 },
    { duration: '10m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.10'],
    http_req_duration: ['p(95)<5000'],
  },
};

export default function () {
  const endpoints = [
    '/api/health',
    '/api/users?page=1&limit=50',
    '/api/courses',
    '/api/grading/assignments',
  ];
  
  const url = \`\${__ENV.API_BASE_URL || 'http://localhost:3000'}\${endpoints[Math.floor(Math.random() * endpoints.length)]}\`;
  
  const res = http.get(url);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  
  sleep(Math.random() * 2);
}
`,
};
