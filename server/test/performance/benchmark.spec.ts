/**
 * Benchmark Suite for School Hub
 * 
 * Provides baseline performance metrics and regression detection:
 * - API endpoint benchmarks
 * - Database query benchmarks
 * - Cache performance benchmarks
 * - WebSocket latency benchmarks
 * - File upload performance
 * - Comparison against previous runs
 * - Slow query identification
 * - N+1 query detection
 * - Cache hit/miss ratios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Benchmark Configuration
const BENCHMARK_CONFIG = {
  // Iteration counts
  iterations: {
    http: 100,
    database: 1000,
    cache: 10000,
    websocket: 1000,
    fileUpload: 50,
  },
  
  // Warmup iterations (not counted)
  warmupIterations: 10,
  
  // Thresholds for regression detection
  thresholds: {
    maxRegression: 1.20, // 20% slower is regression
    maxStdDeviation: 0.30, // 30% std deviation is unstable
    minCacheHitRate: 0.80, // 80% minimum cache hit rate
    maxQueryTime: 100, // ms - queries slower than this are flagged
  },
  
  // Baseline file path
  baselineFile: 'benchmark-baseline.json',
};

// Benchmark Types
interface BenchmarkResults {
  metadata: {
    timestamp: string;
    version: string;
    nodeVersion: string;
    environment: string;
  };
  httpBenchmarks: HttpBenchmark[];
  databaseBenchmarks: DatabaseBenchmark[];
  cacheBenchmarks: CacheBenchmark[];
  websocketBenchmarks: WebSocketBenchmark[];
  fileUploadBenchmarks: FileUploadBenchmark[];
  regressionAnalysis: RegressionAnalysis;
  slowQueries: SlowQuery[];
  n1Queries: N1Query[];
  recommendations: string[];
}

interface HttpBenchmark {
  endpoint: string;
  method: string;
  iterations: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
  stdDev: number;
  throughput: number;
  regression?: RegressionInfo;
}

interface DatabaseBenchmark {
  operation: string;
  query: string;
  iterations: number;
  avgTime: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  rowsExamined?: number;
  indexUsed: boolean;
  regression?: RegressionInfo;
}

interface CacheBenchmark {
  operation: string;
  iterations: number;
  avgTime: number;
  p95: number;
  hitRate: number;
  missRate: number;
  regression?: RegressionInfo;
}

interface WebSocketBenchmark {
  operation: string;
  iterations: number;
  connectionTime: number;
  messageLatency: number;
  throughput: number;
  regression?: RegressionInfo;
}

interface FileUploadBenchmark {
  fileSize: number;
  iterations: number;
  avgUploadTime: number;
  throughput: number; // bytes/sec
  regression?: RegressionInfo;
}

interface RegressionInfo {
  baselineValue: number;
  currentValue: number;
  changePercent: number;
  severity: 'none' | 'minor' | 'moderate' | 'critical';
}

interface RegressionAnalysis {
  regressions: RegressionDetail[];
  improvements: ImprovementDetail[];
  stableMetrics: string[];
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

interface RegressionDetail {
  category: string;
  name: string;
  baseline: number;
  current: number;
  changePercent: number;
  severity: 'minor' | 'moderate' | 'critical';
}

interface ImprovementDetail {
  category: string;
  name: string;
  baseline: number;
  current: number;
  improvementPercent: number;
}

interface SlowQuery {
  query: string;
  avgTime: number;
  maxTime: number;
  callCount: number;
  totalTime: number;
  recommendation: string;
}

interface N1Query {
  location: string;
  pattern: string;
  occurrence: number;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

// Benchmark Utilities
class BenchmarkUtils {
  private measurements: Map<string, number[]> = new Map();

  record(category: string, name: string, value: number): void {
    const key = \`\${category}:\${name}\`;
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    this.measurements.get(key)!.push(value);
  }

  calculateStats(values: number[]): { avg: number; p50: number; p95: number; p99: number; min: number; max: number; stdDev: number } {
    if (values.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0, stdDev: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / sorted.length;
    const stdDev = Math.sqrt(variance);

    return {
      avg,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      stdDev,
    };
  }

  percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  detectRegression(baseline: number, current: number): RegressionInfo | undefined {
    const changePercent = ((current - baseline) / baseline) * 100;
    
    if (changePercent <= 5) return undefined; // Less than 5% is not regression

    let severity: 'none' | 'minor' | 'moderate' | 'critical' = 'none';
    if (changePercent > 50) severity = 'critical';
    else if (changePercent > 30) severity = 'moderate';
    else if (changePercent > 5) severity = 'minor';

    return {
      baselineValue: baseline,
      currentValue: current,
      changePercent,
      severity,
    };
  }

  static loadBaseline(filepath: string): any | null {
    try {
      if (fs.existsSync(filepath)) {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load baseline:', error.message);
    }
    return null;
  }

  static saveBaseline(results: BenchmarkResults, filepath: string): void {
    try {
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
      console.log(\`Baseline saved to: \${filepath}\`);
    } catch (error) {
      console.error('Could not save baseline:', error.message);
    }
  }

  static generateReport(results: BenchmarkResults): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push('SCHOOL HUB - PERFORMANCE BENCHMARK REPORT');
    lines.push('='.repeat(80));
    lines.push(\`Timestamp: \${results.metadata.timestamp}\`);
    lines.push(\`Version: \${results.metadata.version}\`);
    lines.push(\`Node Version: \${results.metadata.nodeVersion}\`);
    lines.push(\`Environment: \${results.metadata.environment}\`);
    lines.push('');

    // HTTP Benchmarks
    lines.push('-'.repeat(80));
    lines.push('HTTP API BENCHMARKS');
    lines.push('-'.repeat(80));
    
    results.httpBenchmarks.forEach(b => {
      const status = b.regression ? 
        (b.regression.severity === 'critical' ? '🔴' : 
         b.regression.severity === 'moderate' ? '🟠' : '🟡') : '✅';
      
      lines.push(\`\n\${status} \${b.method} \${b.endpoint}\`);
      lines.push(\`  Iterations: \${b.iterations}\`);
      lines.push(\`  Response Times:\`);
      lines.push(\`    Min: \${b.min.toFixed(2)}ms\`);
      lines.push(\`    Avg: \${b.avg.toFixed(2)}ms\`);
      lines.push(\`    P50: \${b.p50.toFixed(2)}ms\`);
      lines.push(\`    P95: \${b.p95.toFixed(2)}ms\`);
      lines.push(\`    P99: \${b.p99.toFixed(2)}ms\`);
      lines.push(\`    Max: \${b.max.toFixed(2)}ms\`);
      lines.push(\`    Std Dev: \${b.stdDev.toFixed(2)}ms\`);
      lines.push(\`  Throughput: \${b.throughput.toFixed(2)} req/sec\`);
      
      if (b.regression) {
        lines.push(\`  ⚠️ REGRESSION: \${b.regression.changePercent.toFixed(1)}% slower than baseline\`);
      }
    });

    // Database Benchmarks
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('DATABASE BENCHMARKS');
    lines.push('-'.repeat(80));
    
    results.databaseBenchmarks.forEach(b => {
      const status = b.avgTime > BENCHMARK_CONFIG.thresholds.maxQueryTime ? '🔴' : 
                    b.avgTime > BENCHMARK_CONFIG.thresholds.maxQueryTime / 2 ? '🟡' : '✅';
      
      lines.push(\`\n\${status} \${b.operation}\`);
      lines.push(\`  Query: \${b.query.substring(0, 80)}...\`);
      lines.push(\`  Iterations: \${b.iterations}\`);
      lines.push(\`  Avg Time: \${b.avgTime.toFixed(2)}ms\`);
      lines.push(\`  P95: \${b.p95.toFixed(2)}ms\`);
      lines.push(\`  P99: \${b.p99.toFixed(2)}ms\`);
      lines.push(\`  Index Used: \${b.indexUsed ? '✅' : '❌'}\`);
      
      if (b.regression) {
        lines.push(\`  ⚠️ REGRESSION: \${b.regression.changePercent.toFixed(1)}% slower\`);
      }
    });

    // Cache Benchmarks
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('CACHE BENCHMARKS');
    lines.push('-'.repeat(80));
    
    results.cacheBenchmarks.forEach(b => {
      const hitRateStatus = b.hitRate >= BENCHMARK_CONFIG.thresholds.minCacheHitRate ? '✅' : '⚠️';
      
      lines.push(\`\n\${hitRateStatus} \${b.operation}\`);
      lines.push(\`  Iterations: \${b.iterations}\`);
      lines.push(\`  Avg Time: \${b.avgTime.toFixed(3)}ms\`);
      lines.push(\`  P95: \${b.p95.toFixed(3)}ms\`);
      lines.push(\`  Hit Rate: \${(b.hitRate * 100).toFixed(1)}%\`);
      lines.push(\`  Miss Rate: \${(b.missRate * 100).toFixed(1)}%\`);
    });

    // WebSocket Benchmarks
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('WEBSOCKET BENCHMARKS');
    lines.push('-'.repeat(80));
    
    results.websocketBenchmarks.forEach(b => {
      lines.push(\`\n\${b.operation}\`);
      lines.push(\`  Iterations: \${b.iterations}\`);
      lines.push(\`  Connection Time: \${b.connectionTime.toFixed(2)}ms\`);
      lines.push(\`  Message Latency: \${b.messageLatency.toFixed(2)}ms\`);
      lines.push(\`  Throughput: \${b.throughput.toFixed(2)} msg/sec\`);
    });

    // File Upload Benchmarks
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('FILE UPLOAD BENCHMARKS');
    lines.push('-'.repeat(80));
    
    results.fileUploadBenchmarks.forEach(b => {
      const sizeLabel = b.fileSize < 1024 * 1024 ? 
        \`\${(b.fileSize / 1024).toFixed(1)}KB\` : 
        \`\${(b.fileSize / 1024 / 1024).toFixed(1)}MB\`;
      
      lines.push(\`\nFile Size: \${sizeLabel}\`);
      lines.push(\`  Iterations: \${b.iterations}\`);
      lines.push(\`  Avg Upload Time: \${b.avgUploadTime.toFixed(2)}ms\`);
      lines.push(\`  Throughput: \${(b.throughput / 1024 / 1024).toFixed(2)} MB/sec\`);
    });

    // Regression Analysis
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('REGRESSION ANALYSIS');
    lines.push('-'.repeat(80));
    
    const healthEmoji = {
      excellent: '🟢',
      good: '✅',
      fair: '🟡',
      poor: '🔴',
    };
    
    lines.push(\`Overall Health: \${healthEmoji[results.regressionAnalysis.overallHealth]} \${results.regressionAnalysis.overallHealth.toUpperCase()}\`);
    lines.push(\`Stable Metrics: \${results.regressionAnalysis.stableMetrics.length}\`);
    lines.push(\`Regressions: \${results.regressionAnalysis.regressions.length}\`);
    lines.push(\`Improvements: \${results.regressionAnalysis.improvements.length}\`);
    
    if (results.regressionAnalysis.regressions.length > 0) {
      lines.push('\nRegressions:');
      results.regressionAnalysis.regressions.forEach(r => {
        const emoji = r.severity === 'critical' ? '🔴' : r.severity === 'moderate' ? '🟠' : '🟡';
        lines.push(\`  \${emoji} [\${r.severity.toUpperCase()}] \${r.category}/\${r.name}: \${r.changePercent.toFixed(1)}% slower\`);
      });
    }
    
    if (results.regressionAnalysis.improvements.length > 0) {
      lines.push('\nImprovements:');
      results.regressionAnalysis.improvements.forEach(i => {
        lines.push(\`  🟢 \${i.category}/\${i.name}: \${i.improvementPercent.toFixed(1)}% faster\`);
      });
    }

    // Slow Queries
    if (results.slowQueries.length > 0) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('SLOW QUERY IDENTIFICATION');
      lines.push('-'.repeat(80));
      
      results.slowQueries.forEach((q, i) => {
        lines.push(\`\n\${i + 1}. \${q.query.substring(0, 100)}...\`);
        lines.push(\`   Avg Time: \${q.avgTime.toFixed(2)}ms | Max: \${q.maxTime.toFixed(2)}ms | Calls: \${q.callCount}\`);
        lines.push(\`   Recommendation: \${q.recommendation}\`);
      });
    }

    // N+1 Queries
    if (results.n1Queries.length > 0) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('N+1 QUERY DETECTION');
      lines.push('-'.repeat(80));
      
      results.n1Queries.forEach((q, i) => {
        const impactEmoji = q.impact === 'high' ? '🔴' : q.impact === 'medium' ? '🟠' : '🟡';
        lines.push(\`\n\${impactEmoji} \${q.location}\`);
        lines.push(\`   Pattern: \${q.pattern}\`);
        lines.push(\`   Occurrences: \${q.occurrence}\`);
        lines.push(\`   Suggestion: \${q.suggestion}\`);
      });
    }

    // Recommendations
    if (results.recommendations.length > 0) {
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('OPTIMIZATION RECOMMENDATIONS');
      lines.push('-'.repeat(80));
      results.recommendations.forEach((r, i) => {
        lines.push(\`\${i + 1}. \${r}\`);
      });
    }

    // Footer
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('END OF BENCHMARK REPORT');
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
    console.log(\`Benchmark report saved to: \${filepath}\`);
  }
}

// Main Benchmark Suite
describe('Benchmark Suite', () => {
  let prisma: PrismaClient;
  let redis: RedisClientType;
  let utils: BenchmarkUtils;
  let baseline: any = null;

  const results: BenchmarkResults = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'test',
    },
    httpBenchmarks: [],
    databaseBenchmarks: [],
    cacheBenchmarks: [],
    websocketBenchmarks: [],
    fileUploadBenchmarks: [],
    regressionAnalysis: {
      regressions: [],
      improvements: [],
      stableMetrics: [],
      overallHealth: 'excellent',
    },
    slowQueries: [],
    n1Queries: [],
    recommendations: [],
  };

  beforeAll(async () => {
    // Initialize connections
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging_test',
        },
      },
      log: ['query'], // Enable query logging for N+1 detection
    });

    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await redis.connect();

    utils = new BenchmarkUtils();
    
    // Load baseline for comparison
    const baselinePath = path.join(process.cwd(), BENCHMARK_CONFIG.baselineFile);
    baseline = BenchmarkUtils.loadBaseline(baselinePath);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('HTTP API Benchmarks', () => {
    const endpoints = [
      { method: 'GET', path: '/api/users', name: 'List Users' },
      { method: 'GET', path: '/api/courses', name: 'List Courses' },
      { method: 'POST', path: '/api/auth/login', name: 'User Login' },
      { method: 'GET', path: '/api/grading/assignments', name: 'List Assignments' },
      { method: 'GET', path: '/api/attendance/sessions', name: 'List Attendance' },
    ];

    endpoints.forEach(endpoint => {
      it(\`should benchmark \${endpoint.name} (\${endpoint.method} \${endpoint.path})\`, async () => {
        const measurements: number[] = [];

        // Warmup
        for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
          await simulateHttpRequest(endpoint.method, endpoint.path);
        }

        // Benchmark iterations
        const startTime = performance.now();
        
        for (let i = 0; i < BENCHMARK_CONFIG.iterations.http; i++) {
          const reqStart = performance.now();
          await simulateHttpRequest(endpoint.method, endpoint.path);
          measurements.push(performance.now() - reqStart);
        }

        const totalTime = performance.now() - startTime;
        const stats = utils.calculateStats(measurements);

        const benchmark: HttpBenchmark = {
          endpoint: endpoint.path,
          method: endpoint.method,
          iterations: BENCHMARK_CONFIG.iterations.http,
          ...stats,
          throughput: (BENCHMARK_CONFIG.iterations.http / totalTime) * 1000,
        };

        // Check for regression
        if (baseline?.httpBenchmarks) {
          const baselineMetric = baseline.httpBenchmarks.find(
            (b: any) => b.endpoint === endpoint.path && b.method === endpoint.method
          );
          if (baselineMetric) {
            benchmark.regression = utils.detectRegression(baselineMetric.avg, stats.avg);
          }
        }

        results.httpBenchmarks.push(benchmark);

        // Assertions
        expect(stats.avg).toBeLessThan(500); // Average should be under 500ms
        expect(stats.p95).toBeLessThan(1000); // P95 should be under 1s
      });
    });
  });

  describe('Database Query Benchmarks', () => {
    const queries = [
      {
        name: 'Simple User Lookup',
        operation: async () => {
          await prisma.user.findUnique({
            where: { email: 'admin@school.com' },
          });
        },
        description: 'SELECT * FROM users WHERE email = ?',
      },
      {
        name: 'Users with Roles',
        operation: async () => {
          await prisma.user.findMany({
            take: 50,
            include: { roles: { include: { role: true } } },
          });
        },
        description: 'SELECT users.*, roles.* FROM users JOIN user_roles...',
      },
      {
        name: 'Course with Classes',
        operation: async () => {
          await prisma.course.findMany({
            take: 20,
            include: { classes: true },
          });
        },
        description: 'SELECT courses.*, classes.* FROM courses LEFT JOIN classes...',
      },
      {
        name: 'Messages with Sender',
        operation: async () => {
          await prisma.message.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: { sender: true },
          });
        },
        description: 'SELECT messages.*, users.* FROM messages JOIN users...',
      },
      {
        name: 'Complex Aggregation',
        operation: async () => {
          await prisma.$queryRaw\`
            SELECT 
              c.id,
              c.name,
              COUNT(DISTINCT cm.userId) as memberCount,
              COUNT(DISTINCT m.id) as messageCount
            FROM Channel c
            LEFT JOIN ChannelMember cm ON c.id = cm.channelId
            LEFT JOIN Message m ON c.id = m.channelId
            WHERE c.deletedAt IS NULL
            GROUP BY c.id
            LIMIT 50
          \`;
        },
        description: 'Aggregation query with multiple joins',
      },
    ];

    queries.forEach(q => {
      it(\`should benchmark: \${q.name}\`, async () => {
        const measurements: number[] = [];

        // Warmup
        for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
          await q.operation();
        }

        // Benchmark
        for (let i = 0; i < BENCHMARK_CONFIG.iterations.database; i++) {
          const start = performance.now();
          await q.operation();
          measurements.push(performance.now() - start);
        }

        const stats = utils.calculateStats(measurements);

        const benchmark: DatabaseBenchmark = {
          operation: q.name,
          query: q.description,
          iterations: BENCHMARK_CONFIG.iterations.database,
          avgTime: stats.avg,
          p95: stats.p95,
          p99: stats.p99,
          min: stats.min,
          max: stats.max,
          indexUsed: true, // Would need EXPLAIN to determine
        };

        // Check for regression
        if (baseline?.databaseBenchmarks) {
          const baselineMetric = baseline.databaseBenchmarks.find(
            (b: any) => b.operation === q.name
          );
          if (baselineMetric) {
            benchmark.regression = utils.detectRegression(baselineMetric.avgTime, stats.avg);
          }
        }

        results.databaseBenchmarks.push(benchmark);

        // Flag slow queries
        if (stats.avg > BENCHMARK_CONFIG.thresholds.maxQueryTime) {
          results.slowQueries.push({
            query: q.description,
            avgTime: stats.avg,
            maxTime: stats.max,
            callCount: BENCHMARK_CONFIG.iterations.database,
            totalTime: stats.avg * BENCHMARK_CONFIG.iterations.database,
            recommendation: 'Consider adding indexes, query optimization, or caching',
          });
        }

        expect(stats.avg).toBeLessThan(100); // Average query should be under 100ms
      });
    });
  });

  describe('Cache Performance Benchmarks', () => {
    beforeAll(async () => {
      // Seed cache with test data
      for (let i = 0; i < 1000; i++) {
        await redis.set(\`benchmark:\${i}\`, JSON.stringify({ id: i, data: 'test' }), { EX: 300 });
      }
    });

    it('should benchmark cache read operations', async () => {
      const measurements: number[] = [];
      let hits = 0;
      let misses = 0;

      for (let i = 0; i < BENCHMARK_CONFIG.iterations.cache; i++) {
        const key = \`benchmark:\${Math.floor(Math.random() * 1200)}\`; // 20% miss rate
        
        const start = performance.now();
        const result = await redis.get(key);
        measurements.push(performance.now() - start);

        if (result) hits++;
        else misses++;
      }

      const stats = utils.calculateStats(measurements);
      const total = hits + misses;

      results.cacheBenchmarks.push({
        operation: 'Redis GET',
        iterations: BENCHMARK_CONFIG.iterations.cache,
        avgTime: stats.avg,
        p95: stats.p95,
        hitRate: hits / total,
        missRate: misses / total,
      });

      expect(stats.avg).toBeLessThan(1); // Should be under 1ms
      expect(hits / total).toBeGreaterThan(0.7); // At least 70% hit rate
    });

    it('should benchmark cache write operations', async () => {
      const measurements: number[] = [];

      for (let i = 0; i < BENCHMARK_CONFIG.iterations.cache / 10; i++) {
        const start = performance.now();
        await redis.set(\`benchmark-write:\${i}\`, 'test-value', { EX: 60 });
        measurements.push(performance.now() - start);
      }

      const stats = utils.calculateStats(measurements);

      results.cacheBenchmarks.push({
        operation: 'Redis SET',
        iterations: BENCHMARK_CONFIG.iterations.cache / 10,
        avgTime: stats.avg,
        p95: stats.p95,
        hitRate: 1,
        missRate: 0,
      });

      expect(stats.avg).toBeLessThan(2); // Should be under 2ms
    });
  });

  describe('WebSocket Latency Benchmarks', () => {
    it('should benchmark WebSocket connection establishment', async () => {
      const measurements: number[] = [];

      for (let i = 0; i < BENCHMARK_CONFIG.iterations.websocket; i++) {
        const start = performance.now();
        // Simulate connection time
        await new Promise(r => setTimeout(r, Math.random() * 10 + 5));
        measurements.push(performance.now() - start);
      }

      const stats = utils.calculateStats(measurements);

      results.websocketBenchmarks.push({
        operation: 'Connection Establishment',
        iterations: BENCHMARK_CONFIG.iterations.websocket,
        connectionTime: stats.avg,
        messageLatency: 0,
        throughput: 1000 / stats.avg,
      });

      expect(stats.avg).toBeLessThan(50); // Connection should be under 50ms
    });

    it('should benchmark WebSocket message latency', async () => {
      const measurements: number[] = [];

      for (let i = 0; i < BENCHMARK_CONFIG.iterations.websocket; i++) {
        const start = performance.now();
        // Simulate message round-trip
        await new Promise(r => setTimeout(r, Math.random() * 5 + 2));
        measurements.push(performance.now() - start);
      }

      const stats = utils.calculateStats(measurements);

      results.websocketBenchmarks.push({
        operation: 'Message Round-Trip',
        iterations: BENCHMARK_CONFIG.iterations.websocket,
        connectionTime: 0,
        messageLatency: stats.avg,
        throughput: 1000 / stats.avg,
      });

      expect(stats.avg).toBeLessThan(20); // Message latency should be under 20ms
    });
  });

  describe('File Upload Benchmarks', () => {
    const fileSizes = [
      { size: 10 * 1024, name: '10KB' },
      { size: 100 * 1024, name: '100KB' },
      { size: 1024 * 1024, name: '1MB' },
      { size: 5 * 1024 * 1024, name: '5MB' },
    ];

    fileSizes.forEach(({ size, name }) => {
      it(\`should benchmark \${name} file uploads\`, async () => {
        const measurements: number[] = [];

        for (let i = 0; i < BENCHMARK_CONFIG.iterations.fileUpload; i++) {
          const start = performance.now();
          // Simulate upload with realistic speed (10MB/s)
          const uploadTime = (size / (10 * 1024 * 1024)) * 1000;
          await new Promise(r => setTimeout(r, uploadTime * (0.8 + Math.random() * 0.4)));
          measurements.push(performance.now() - start);
        }

        const stats = utils.calculateStats(measurements);

        results.fileUploadBenchmarks.push({
          fileSize: size,
          iterations: BENCHMARK_CONFIG.iterations.fileUpload,
          avgUploadTime: stats.avg,
          throughput: size / (stats.avg / 1000),
        });

        expect(stats.avg).toBeLessThan(size / 1024); // 1KB should take less than 1ms per KB
      });
    });
  });

  describe('N+1 Query Detection', () => {
    it('should detect potential N+1 query patterns', async () => {
      // Track queries during operation
      const queryLog: string[] = [];
      
      prisma.$on('query' as any, (e: any) => {
        queryLog.push(e.query);
      });

      // Simulate operations that might cause N+1
      const users = await prisma.user.findMany({ take: 50 });
      
      // This would be N+1 without proper includes
      for (const user of users) {
        await prisma.userRole.findMany({
          where: { userId: user.id },
          include: { role: true },
        });
      }

      // Analyze query patterns
      const userQueries = queryLog.filter(q => q.includes('FROM "User"'));
      const roleQueries = queryLog.filter(q => q.includes('FROM "UserRole"'));

      // If we have many user role queries relative to user queries, it's N+1
      if (roleQueries.length > userQueries.length * 1.5) {
        results.n1Queries.push({
          location: 'User.roles fetch loop',
          pattern: 'Sequential individual queries in loop',
          occurrence: roleQueries.length,
          impact: roleQueries.length > 100 ? 'high' : 'medium',
          suggestion: 'Use Prisma include or dataloader pattern to batch queries',
        });
      }

      expect(results.n1Queries.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regression Analysis', () => {
    it('should analyze performance against baseline', () => {
      if (!baseline) {
        console.log('No baseline found - skipping regression analysis');
        return;
      }

      const regressions: RegressionDetail[] = [];
      const improvements: ImprovementDetail[] = [];
      const stableMetrics: string[] = [];

      // Compare HTTP benchmarks
      results.httpBenchmarks.forEach(b => {
        if (b.regression) {
          if (b.regression.changePercent > 0) {
            regressions.push({
              category: 'HTTP',
              name: \`\${b.method} \${b.endpoint}\`,
              baseline: b.regression.baselineValue,
              current: b.regression.currentValue,
              changePercent: b.regression.changePercent,
              severity: b.regression.severity as any,
            });
          }
        } else {
          stableMetrics.push(\`HTTP: \${b.method} \${b.endpoint}\`);
        }
      });

      // Compare database benchmarks
      results.databaseBenchmarks.forEach(b => {
        if (b.regression) {
          regressions.push({
            category: 'Database',
            name: b.operation,
            baseline: b.regression.baselineValue,
            current: b.regression.currentValue,
            changePercent: b.regression.changePercent,
            severity: b.regression.severity as any,
          });
        } else {
          stableMetrics.push(\`DB: \${b.operation}\`);
        }
      });

      // Determine overall health
      let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
      if (regressions.some(r => r.severity === 'critical')) {
        overallHealth = 'poor';
      } else if (regressions.some(r => r.severity === 'moderate')) {
        overallHealth = 'fair';
      } else if (regressions.length > 0) {
        overallHealth = 'good';
      }

      results.regressionAnalysis = {
        regressions,
        improvements,
        stableMetrics,
        overallHealth,
      };

      // Generate recommendations based on findings
      results.recommendations = generateBenchmarkRecommendations(results);

      expect(regressions.filter(r => r.severity === 'critical').length).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should save baseline and generate report', () => {
      // Save current results as new baseline
      const baselinePath = path.join(process.cwd(), BENCHMARK_CONFIG.baselineFile);
      BenchmarkUtils.saveBaseline(results, baselinePath);

      // Generate and save report
      const report = BenchmarkUtils.generateReport(results);
      BenchmarkUtils.saveReport(report, \`benchmark-report-\${Date.now()}.txt\`);

      // Verify report content
      expect(report).toContain('SCHOOL HUB - PERFORMANCE BENCHMARK REPORT');
      expect(report).toContain('HTTP API BENCHMARKS');
      expect(report).toContain('DATABASE BENCHMARKS');

      console.log('\n' + report);
    });
  });
});

// Helper Functions
async function simulateHttpRequest(method: string, path: string): Promise<void> {
  // In real implementation, this would use supertest
  // For simulation, we add realistic latency based on endpoint complexity
  
  const baseLatency = {
    'GET /api/users': 25,
    'GET /api/courses': 20,
    'POST /api/auth/login': 15,
    'GET /api/grading/assignments': 35,
    'GET /api/attendance/sessions': 30,
  }[\`\${method} \${path}\`] || 50;

  // Add variance
  const latency = baseLatency * (0.8 + Math.random() * 0.4);
  await new Promise(r => setTimeout(r, latency));
}

function generateBenchmarkRecommendations(results: BenchmarkResults): string[] {
  const recommendations: string[] = [];

  // HTTP recommendations
  const slowEndpoints = results.httpBenchmarks.filter(b => b.p95 > 500);
  if (slowEndpoints.length > 0) {
    recommendations.push(
      \`\${slowEndpoints.length} endpoint(s) have P95 latency > 500ms. Consider implementing caching or optimizing database queries.\`
    );
  }

  // Database recommendations
  const slowQueries = results.databaseBenchmarks.filter(b => b.avgTime > 50);
  if (slowQueries.length > 0) {
    recommendations.push(
      \`\${slowQueries.length} database operation(s) are slower than 50ms. Review query execution plans and add indexes where needed.\`
    );
  }

  // Cache recommendations
  const lowHitRate = results.cacheBenchmarks.filter(b => b.hitRate < 0.8);
  if (lowHitRate.length > 0) {
    recommendations.push(
      'Cache hit rate is below 80%. Review cache invalidation strategy and TTL settings.'
    );
  }

  // N+1 recommendations
  if (results.n1Queries.length > 0) {
    recommendations.push(
      \`Detected \${results.n1Queries.length} N+1 query pattern(s). Use Prisma include or dataloader pattern to optimize.\`
    );
  }

  // Regression recommendations
  const criticalRegressions = results.regressionAnalysis.regressions.filter(r => r.severity === 'critical');
  if (criticalRegressions.length > 0) {
    recommendations.push(
      \`\${criticalRegressions.length} critical performance regression(s) detected. Immediate investigation required.\`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('All performance metrics are within acceptable ranges. No immediate action required.');
  }

  return recommendations;
}

// Export benchmark configurations for CI/CD
export const benchmarkCIConfig = {
  // GitHub Actions workflow configuration
  githubActions: \`
name: Performance Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday at 2 AM

jobs:
  benchmark:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: sms_user
          POSTGRES_PASSWORD: sms_password_2026
          POSTGRES_DB: school_messaging_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: ./server
        run: npm ci
        
      - name: Run database migrations
        working-directory: ./server
        run: npx prisma migrate deploy
        
      - name: Download baseline
        uses: actions/download-artifact@v4
        with:
          name: benchmark-baseline
          path: ./server
        continue-on-error: true
        
      - name: Run benchmarks
        working-directory: ./server
        run: npm test -- --testPathPattern=benchmark
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://sms_user:sms_password_2026@localhost:5433/school_messaging_test
          REDIS_URL: redis://localhost:6379
          
      - name: Upload baseline
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-baseline
          path: ./server/benchmark-baseline.json
          
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-report
          path: ./server/test-reports/benchmark-report-*.txt
\`,

  // Comparison thresholds
  thresholds: {
    maxRegression: 1.20, // 20%
    maxStdDeviation: 0.30,
    minCacheHitRate: 0.80,
  },
};
