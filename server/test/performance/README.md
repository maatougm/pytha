# School Hub Performance Testing Suite

Comprehensive performance and load testing suite for the School Hub backend.

## Overview

This testing suite provides three main categories of performance tests:

1. **Load Tests** (`load-test.spec.ts`) - Tests system behavior under expected load
2. **Stress Tests** (`stress-test.spec.ts`) - Tests system limits and breaking points
3. **Benchmarks** (`benchmark.spec.ts`) - Provides baseline metrics and regression detection

## Test Files

### 1. Load Test Suite (`load-test.spec.ts`)

Tests the system under expected production load conditions.

**Configuration:**
- 100 concurrent users
- 500 simultaneous WebSocket connections
- 60-second ramp-up period
- 5-minute sustained load

**Endpoints Tested:**
- `GET /api/users` (pagination)
- `GET /api/courses`
- `POST /api/auth/login`
- `POST /api/messaging` (via WebSocket)
- `GET /api/grading/assignments`
- `POST /api/attendance/bulk-mark`

**Metrics Captured:**
- Response time (p50, p95, p99)
- Throughput (req/sec)
- Error rate
- Memory usage
- CPU utilization
- Database connection pool usage
- Redis memory

**External Tool Configurations:**
The file exports configurations for:
- Artillery.js
- k6

### 2. Stress Test Suite (`stress-test.spec.ts`)

Pushes the system beyond normal limits to identify breaking points.

**Test Phases:**
1. **Gradual Ramp-up** - Increase to 1000 concurrent users in 10 steps
2. **Spike Testing** - Sudden surge to 1500 users
3. **Endurance Testing** - 10-minute sustained high load
4. **Recovery Testing** - System behavior after stress

**Detections:**
- Breaking point identification
- Memory leak detection
- Event loop blocking detection
- Database deadlock detection
- Connection pool exhaustion

**Reports Include:**
- Phase-by-phase performance analysis
- Breaking point details
- Memory growth analysis
- Recovery time measurement
- Optimization recommendations

### 3. Benchmark Suite (`benchmark.spec.ts`)

Provides baseline performance metrics for regression detection.

**Benchmarks:**
- HTTP API endpoints (100 iterations each)
- Database queries (1000 iterations each)
- Cache operations (10000 iterations each)
- WebSocket latency (1000 iterations)
- File uploads (50 iterations per size)

**Features:**
- Baseline comparison from `benchmark-baseline.json`
- Slow query identification (>100ms)
- N+1 query detection
- Cache hit/miss ratio analysis
- Regression severity classification

**Regression Thresholds:**
- Critical: >50% slower
- Moderate: 30-50% slower
- Minor: 5-30% slower

### 4. Performance Interceptor (`src/common/interceptors/performance.interceptor.ts`)

NestJS interceptor for real-time performance monitoring.

**Features:**
- Automatic request timing
- Query count tracking
- Cache hit/miss tracking
- Memory usage delta
- Slow request logging (>1000ms)
- Excessive query detection (>20 queries/request)
- Prometheus metrics integration

**Usage:**
```typescript
// In your module
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
```

## Running the Tests

### Prerequisites

1. Ensure test database is running:
```bash
docker-compose -f docker-compose.backend-only.yml up -d postgres redis
```

2. Run database migrations:
```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

### Run All Performance Tests

```bash
cd server
npm test -- --testPathPattern=performance
```

### Run Specific Test Suite

```bash
# Load tests only
npm test -- load-test

# Stress tests only
npm test -- stress-test

# Benchmarks only
npm test -- benchmark
```

### Run with Coverage

```bash
npm test -- --testPathPattern=performance --coverage
```

## Using External Tools

### Artillery.js

1. Install Artillery:
```bash
npm install -g artillery
```

2. Run load test:
```bash
artillery run server/test/performance/artillery-config.yml
```

3. Generate HTML report:
```bash
artillery run --output report.json server/test/performance/artillery-config.yml
artillery report report.json
```

### k6

1. Install k6 (see https://k6.io/docs/getting-started/installation/)

2. Run k6 script:
```bash
k6 run --env API_BASE_URL=http://localhost:3000 server/test/performance/k6-script.js
```

3. Run with more VUs:
```bash
k6 run --vus 100 --duration 5m server/test/performance/k6-script.js
```

## Interpreting Results

### Load Test Report

Reports are saved to `test-reports/load-test-report-{timestamp}.txt`

Key sections:
- **HTTP Endpoints Performance** - Response times and throughput per endpoint
- **WebSocket Performance** - Connection success rate and message latency
- **Database Metrics** - Query count, slow queries, connection usage
- **Redis Metrics** - Memory usage, hit rates, command throughput
- **System Resource Usage** - Memory and CPU utilization
- **Bottlenecks** - Identified performance issues with recommendations

### Stress Test Report

Reports are saved to `test-reports/stress-test-report-{timestamp}.txt`

Key sections:
- **Stress Test Phases** - Performance at each load level
- **Breaking Point Analysis** - When and why the system failed
- **Memory Leak Analysis** - Memory growth detection
- **Event Loop Analysis** - Blocking operation identification
- **Database Stress Analysis** - Deadlocks and pool exhaustion
- **Recovery Analysis** - Time to recover after stress

### Benchmark Report

Reports are saved to `test-reports/benchmark-report-{timestamp}.txt`

Key sections:
- **HTTP API Benchmarks** - Response time statistics per endpoint
- **Database Benchmarks** - Query performance with index usage
- **Cache Benchmarks** - Operation latency and hit rates
- **WebSocket Benchmarks** - Connection and message latency
- **Regression Analysis** - Comparison against baseline
- **Slow Query Identification** - Queries exceeding 100ms
- **N+1 Query Detection** - Inefficient query patterns

## CI/CD Integration

### GitHub Actions

The benchmark suite includes a GitHub Actions workflow configuration. Add to `.github/workflows/benchmark.yml`:

```yaml
name: Performance Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly

jobs:
  benchmark:
    runs-on: ubuntu-latest
    # See benchmark.spec.ts for complete configuration
```

### Automated Alerts

Set up alerts for:
- P95 latency > 500ms
- Error rate > 1%
- Memory growth > 50% during test
- Regression > 20% from baseline

## Performance Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| HTTP P95 Latency | >500ms | >1000ms |
| HTTP P99 Latency | >1000ms | >3000ms |
| Error Rate | >1% | >5% |
| DB Query Time | >50ms | >100ms |
| Cache Hit Rate | <80% | <60% |
| Memory Growth | >50% | >100% |
| WS Latency | >50ms | >100ms |

## Optimization Recommendations

### Database
- Add indexes for frequently queried columns
- Use Prisma `include` to avoid N+1 queries
- Implement query result caching
- Use database connection pooling

### API
- Implement response caching (Redis)
- Use pagination for large datasets
- Enable gzip compression
- Implement rate limiting

### WebSocket
- Use Redis adapter for horizontal scaling
- Implement message batching
- Optimize message serialization
- Monitor connection limits

### Memory
- Implement request timeouts
- Stream large responses
- Use object pooling for frequent allocations
- Monitor for memory leaks

## Troubleshooting

### Tests Timeout
Increase Jest timeout in test file or run with:
```bash
npm test -- --testTimeout=600000
```

### Database Connection Errors
Ensure test database is accessible:
```bash
docker-compose ps
```

### Redis Connection Errors
Verify Redis is running:
```bash
docker-compose exec redis redis-cli ping
```

### High Memory Usage
Run tests individually:
```bash
npm test -- --testNamePattern="Load Test"
```

## Contributing

When adding new performance tests:

1. Follow existing test structure
2. Add proper warmup iterations
3. Include assertions for thresholds
4. Update this README
5. Export external tool configurations

## License

MIT License - See LICENSE file for details
