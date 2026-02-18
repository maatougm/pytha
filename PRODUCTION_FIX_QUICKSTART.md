# Production Fix Quick-Start Guide
## Immediate Actions for Critical Issues

**⚠️ DO NOT DEPLOY TO PRODUCTION BEFORE COMPLETING THESE FIXES**

---

## 🚨 Priority 1: Fix Today (Blocks Production)

### 1. Fix Database Connection Pool (30 minutes)

**File:** `server/src/prisma/prisma.service.ts`

**Replace the entire file:**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            datasources: {
                db: { url: process.env.DATABASE_URL },
            },
            // ADD THESE LINES:
            connection_limit: 20,
            pool_timeout: 10,
            query_timeout: 30000,
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
```

**Add to `.env`:**
```bash
DB_CONNECTION_LIMIT=20
```

---

### 2. Remove Weak JWT Defaults (15 minutes)

**File:** `docker-compose.yml`

**REMOVE weak defaults:**
```yaml
# BEFORE (DANGEROUS):
JWT_SECRET: ${JWT_SECRET:-super_secret_jwt_key}
JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-super_secret_refresh_key}

# AFTER (SAFE):
JWT_SECRET: ${JWT_SECRET}
JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
```

**Generate secure secrets:**
```bash
# Run this command
cd server && node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Add to `.env`:**
```bash
# Paste the generated values here
JWT_SECRET=your-64-char-generated-secret
JWT_REFRESH_SECRET=your-64-char-generated-refresh-secret
```

---

### 3. Fix Critical N+1 Query (1 hour)

**File:** `server/src/messaging/messaging.service.ts`

**Replace the `getUserChannelsWithUnread` method:**
```typescript
async getUserChannelsWithUnread(userId: string) {
    // Use single optimized query instead of N+1
    const result = await this.prisma.$queryRaw`
        WITH user_channels AS (
            SELECT 
                c.id,
                c.type,
                c.name,
                c.updated_at,
                cm.last_read_at,
                cm.role as member_role,
                cm.joined_at
            FROM channels c
            JOIN channel_members cm ON c.id = cm.channel_id
            WHERE cm.user_id = ${userId}
            AND cm.is_banned = false
            AND c.is_archived = false
            AND c.deleted_at IS NULL
        ),
        unread_counts AS (
            SELECT 
                uc.id as channel_id,
                COUNT(m.id)::int as unread_count
            FROM user_channels uc
            LEFT JOIN messages m ON m.channel_id = uc.id
                AND m.is_deleted = false
                AND m.sender_id != ${userId}
                AND (uc.last_read_at IS NULL OR m.created_at > uc.last_read_at)
            GROUP BY uc.id
        )
        SELECT 
            uc.*,
            COALESCE(uc_unread.unread_count, 0) as unread_count,
            (
                SELECT json_build_object(
                    'id', m.id,
                    'content', m.content,
                    'createdAt', m.created_at,
                    'sender', json_build_object(
                        'id', u.id,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    )
                )
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.channel_id = uc.id AND m.is_deleted = false
                ORDER BY m.created_at DESC
                LIMIT 1
            ) as last_message
        FROM user_channels uc
        LEFT JOIN unread_counts uc_unread ON uc.id = uc_unread.channel_id
        ORDER BY uc.updated_at DESC
        LIMIT 100
    `;

    return result;
}
```

---

## 🔧 Priority 2: Fix This Week (Before Production)

### 4. Add Redis Rate Limiting

**Install dependency:**
```bash
cd server && npm install ioredis
```

**Create file:** `server/src/common/redis/redis-rate-limit.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisRateLimitService {
    private redis = new Redis(process.env.REDIS_URL);

    async checkLimit(key: string, limit: number, windowMs: number) {
        const now = Date.now();
        const redisKey = `rate_limit:${key}`;
        
        const pipeline = this.redis.pipeline();
        pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
        pipeline.zcard(redisKey);
        pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
        pipeline.pexpire(redisKey, windowMs);
        
        const results = await pipeline.exec();
        const currentCount = results[1][1] as number;
        
        return {
            allowed: currentCount < limit,
            remaining: Math.max(0, limit - currentCount - 1),
        };
    }
}
```

---

### 5. Fix Memory Leaks

**Create file:** `server/src/common/utils/memory-store.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MemoryStoreService implements OnModuleInit, OnModuleDestroy {
    private stores = new Map();
    private cleanupInterval: NodeJS.Timeout;

    onModuleInit() {
        // Cleanup every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    onModuleDestroy() {
        clearInterval(this.cleanupInterval);
    }

    private cleanup() {
        const now = Date.now();
        for (const [name, store] of this.stores) {
            for (const [key, entry] of store) {
                if (entry.expiresAt < now) store.delete(key);
            }
        }
    }

    set(storeName: string, key: string, value: any, ttlMs: number = 300000) {
        if (!this.stores.has(storeName)) {
            this.stores.set(storeName, new Map());
        }
        this.stores.get(storeName).set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    get(storeName: string, key: string) {
        const store = this.stores.get(storeName);
        if (!store) return undefined;
        const entry = store.get(key);
        if (!entry || entry.expiresAt < Date.now()) {
            store.delete(key);
            return undefined;
        }
        return entry.value;
    }
}
```

**Update `FilesService`:**
```typescript
// In constructor:
constructor(private memoryStore: MemoryStoreService) {}

// Replace checkRateLimit method:
checkRateLimit(userId: string) {
    const key = `upload:${userId}`;
    const record = this.memoryStore.get('upload_rate', key);
    const now = Date.now();
    
    if (!record || record.resetTime < now) {
        this.memoryStore.set('upload_rate', key, { count: 1, resetTime: now + 60000 }, 60000);
        return { allowed: true, remaining: 4 };
    }
    
    if (record.count >= 5) {
        return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    this.memoryStore.set('upload_rate', key, record, 60000);
    return { allowed: true, remaining: 5 - record.count };
}
```

---

### 6. Add Request Timeouts

**Create file:** `server/src/common/interceptors/timeout.interceptor.ts`
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(30000), // 30 second timeout
            catchError(err => {
                if (err.name === 'TimeoutError') {
                    return throwError(() => new RequestTimeoutException());
                }
                return throwError(() => err);
            }),
        );
    }
}
```

**Apply in `main.ts`:**
```typescript
app.useGlobalInterceptors(new TimeoutInterceptor());
```

---

## 🧪 Priority 3: Test Before Launch

### 7. Load Test

**Install k6:**
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6
```

**Create quick test:** `load-test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
    },
};

export default function () {
    const res = http.get('http://localhost:3000/api/health');
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
```

**Run test:**
```bash
k6 run load-test.js
```

---

## ✅ Pre-Production Checklist

### Critical (Must Have)
- [ ] Database connection pool configured (20 connections)
- [ ] Strong JWT secrets generated and set
- [ ] N+1 queries fixed
- [ ] Redis-based rate limiting implemented
- [ ] Memory leaks fixed with cleanup
- [ ] Request timeouts added
- [ ] Load test passed at 200+ concurrent users

### Security (Must Have)
- [ ] API versioning added (`/api/v1/`)
- [ ] CORS properly configured
- [ ] No weak default secrets
- [ ] Input validation on all endpoints

### Monitoring (Should Have)
- [ ] Health check endpoint working
- [ ] Error logging configured
- [ ] Performance metrics visible

---

## 📋 Quick Commands

```bash
# 1. Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Test database connection
npx prisma db pull

# 3. Run load test
k6 run load-test.js

# 4. Check for N+1 queries (development mode)
DEBUG="prisma:*" npm run dev

# 5. Build for production
npm run build

# 6. Start with production config
NODE_ENV=production npm start
```

---

## 🆘 Emergency Contacts

If something breaks during deployment:

1. **Rollback:** `docker-compose down && git checkout last-known-good`
2. **Check logs:** `docker-compose logs -f server`
3. **Database status:** `docker-compose exec postgres pg_isready`
4. **Redis status:** `docker-compose exec redis redis-cli ping`

---

**Estimated Total Time:** 3-4 days for all critical fixes  
**Minimum Before Production:** 1 day (fixes 1-3 only)
