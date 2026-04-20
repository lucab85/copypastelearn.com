---
title: "Redis for Developers Quick Start"
slug: "redis-developers-quick-start"
date: "2026-02-17"
category: "Development"
tags: ["Redis", "Caching", "Database", "Development", "Performance"]
excerpt: "Get started with Redis. Data types, caching patterns, pub/sub, sessions, rate limiting, and production deployment with persistence."
description: "Get started with Redis. Data types, caching patterns, pub/sub messaging, session management, rate limiting, and deployment practices."
---

Redis is an in-memory data store used for caching, sessions, rate limiting, queues, and real-time features. It handles millions of operations per second with sub-millisecond latency.

## Quick Start

```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Connect
docker exec -it redis redis-cli
```

## Data Types

### Strings

```redis
SET user:1:name "Alice"
GET user:1:name           # "Alice"

SET counter 0
INCR counter              # 1
INCRBY counter 10         # 11

SET session:abc123 '{"userId":1}' EX 3600  # Expires in 1 hour
TTL session:abc123        # Seconds remaining
```

### Hashes

```redis
HSET user:1 name "Alice" email "alice&#64;example.com" role "admin"
HGET user:1 name          # "Alice"
HGETALL user:1            # All fields
HINCRBY user:1 login_count 1
```

### Lists

```redis
LPUSH queue:emails '{"to":"alice","subject":"Welcome"}'
LPUSH queue:emails '{"to":"bob","subject":"Welcome"}'
RPOP queue:emails          # Process oldest first (FIFO)
LLEN queue:emails          # Queue length
```

### Sets

```redis
SADD tags:post:1 "devops" "kubernetes" "docker"
SMEMBERS tags:post:1       # All tags
SISMEMBER tags:post:1 "kubernetes"  # 1 (true)
SINTER tags:post:1 tags:post:2     # Common tags
```

### Sorted Sets

```redis
ZADD leaderboard 100 "alice" 85 "bob" 92 "charlie"
ZREVRANGE leaderboard 0 2 WITHSCORES  # Top 3
ZINCRBY leaderboard 15 "bob"           # Update score
ZRANK leaderboard "alice"              # Rank (0-based)
```

## Caching Patterns

### Cache-Aside (Lazy Loading)

```typescript
async function getUser(id: string) {
  // 1. Check cache
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — fetch from database
  const user = await db.users.findUnique({ where: { id } });

  // 3. Store in cache with TTL
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);

  return user;
}
```

### Write-Through

```typescript
async function updateUser(id: string, data: Partial<User>) {
  // 1. Update database
  const user = await db.users.update({ where: { id }, data });

  // 2. Update cache immediately
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);

  return user;
}
```

### Cache Invalidation

```typescript
async function deleteUser(id: string) {
  await db.users.delete({ where: { id } });
  await redis.del(`user:${id}`);
  // Also invalidate related caches
  await redis.del(`user:${id}:posts`);
  await redis.del(`user:${id}:settings`);
}
```

## Session Storage

```typescript
import RedisStore from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }, // 24 hours
}));
```

## Rate Limiting

```typescript
async function rateLimit(ip: string, limit = 100, windowSec = 60) {
  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSec);
  }

  if (current > limit) {
    const ttl = await redis.ttl(key);
    throw new Error(`Rate limited. Retry in ${ttl}s`);
  }

  return { remaining: limit - current, limit };
}
```

### Sliding Window (More Precise)

```typescript
async function slidingWindowRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;

  await redis
    .multi()
    .zremrangebyscore(key, 0, windowStart)  // Remove old entries
    .zadd(key, now, `${now}`)               // Add current request
    .zcard(key)                              // Count requests in window
    .expire(key, Math.ceil(windowMs / 1000))
    .exec();

  const count = await redis.zcard(key);
  return count <= limit;
}
```

## Pub/Sub

```typescript
// Publisher
await redis.publish('notifications', JSON.stringify({
  userId: 1,
  message: 'Your build completed',
}));

// Subscriber
const subscriber = redis.duplicate();
await subscriber.connect();

subscriber.subscribe('notifications', (message) => {
  const data = JSON.parse(message);
  console.log(`Notification for user ${data.userId}: ${data.message}`);
});
```

## Production Configuration

```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1       # Save if 1 key changed in 900s
save 300 10      # Save if 10 keys changed in 300s
appendonly yes
appendfsync everysec

# Security
requirepass your-strong-password
rename-command FLUSHALL ""
rename-command FLUSHDB ""
```

### Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  redis-data:
```

## Monitoring

```bash
redis-cli INFO stats    # Hit rate, connections, memory
redis-cli INFO memory   # Memory breakdown
redis-cli SLOWLOG GET   # Slow queries
redis-cli MONITOR       # Live command stream (debug only!)
```

Key metrics to track:
- `used_memory` — Current memory usage
- `keyspace_hits / keyspace_misses` — Cache hit ratio
- `connected_clients` — Active connections
- `evicted_keys` — Keys removed due to memory pressure

## What's Next?

Our **Node.js REST APIs** course covers Redis caching, sessions, and rate limiting in production Node.js apps. **Docker Fundamentals** teaches containerized Redis deployment. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

