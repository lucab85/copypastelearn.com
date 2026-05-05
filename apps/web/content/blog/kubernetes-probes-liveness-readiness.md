---
title: "Kubernetes Probes Liveness Readiness"
slug: "kubernetes-probes-liveness-readiness"
date: "2026-01-27"
category: "DevOps"
tags: ["kubernetes", "Probes", "Health Checks", "DevOps", "Reliability"]
excerpt: "Configure Kubernetes liveness, readiness, and startup probes. HTTP, TCP, exec checks with proper timing to avoid cascading failures."
description: "Configure Kubernetes liveness, readiness, and startup probes. HTTP, TCP, exec checks with proper timing and misconfiguration fixes."
author: "Luca Berton"
---

Probes tell Kubernetes whether your application is alive, ready for traffic, and done starting up. Bad probe configuration causes either cascading restarts or traffic to broken pods.

## The Three Probe Types

| Probe | Question | Action on Failure |
|---|---|---|
| **Startup** | Has the app finished starting? | Kill and restart pod |
| **Liveness** | Is the app still running? | Kill and restart pod |
| **Readiness** | Can the app handle traffic? | Remove from service endpoints |

## Startup Probe

For slow-starting applications (loading ML models, warming caches):

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  failureThreshold: 30     # 30 × 10s = 300s max startup time
  periodSeconds: 10
```

Until the startup probe succeeds, liveness and readiness probes are disabled. This prevents Kubernetes from killing a pod that is still starting.

## Liveness Probe

Detects if the application has crashed or deadlocked:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 15
  timeoutSeconds: 3
  failureThreshold: 3      # 3 failures = restart
  successThreshold: 1
```

**Be careful**: An overly aggressive liveness probe kills healthy pods under load. If your app is slow because of high CPU, restarting it makes things worse.

### When Liveness Restarts Help

- Deadlocked threads
- Memory leak (app hung, not OOMKilled)
- Stuck event loop
- Corrupted internal state

### When Liveness Restarts Hurt

- High CPU load (temporary)
- Slow dependency (database overloaded)
- Garbage collection pause

## Readiness Probe

Controls whether a pod receives traffic:

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 3
  successThreshold: 1
```

When readiness fails:
- Pod stays running (not restarted)
- Removed from Service endpoints
- No traffic routed to it
- Re-added when probe passes again

### Separate Health and Ready Endpoints

```typescript
// /health — liveness (is the process alive?)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// /ready — readiness (can we handle requests?)
app.get('/ready', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');
    // Check Redis
    await redis.ping();
    // Check critical dependencies
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

**Key difference**: Liveness should NOT check dependencies. If the database is down, restarting your app will not fix the database — it will only cause a restart storm.

## Check Mechanisms

### HTTP GET

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
    httpHeaders:
      - name: Authorization
        value: Bearer internal-token
```

### TCP Socket

```yaml
livenessProbe:
  tcpSocket:
    port: 5432
```

Good for databases and services without HTTP endpoints.

### Exec Command

```yaml
livenessProbe:
  exec:
    command:
      - /bin/sh
      - -c
      - pg_isready -U postgres
```

Good for custom health checks.

### gRPC

```yaml
livenessProbe:
  grpc:
    port: 50051
    service: my.health.v1.Health
```

## Complete Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: my-api:v2.0
          ports:
            - containerPort: 3000

          # Wait up to 5 minutes for startup
          startupProbe:
            httpGet:
              path: /health
              port: 3000
            failureThreshold: 30
            periodSeconds: 10

          # Check if process is alive (every 15s)
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3

          # Check if ready for traffic (every 5s)
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 3

          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
```

## Timing Guide

| Setting | Startup | Liveness | Readiness |
|---|---|---|---|
| `initialDelaySeconds` | 0 | 0 (use startup probe) | 0 (use startup probe) |
| `periodSeconds` | 5-10 | 10-30 | 3-10 |
| `timeoutSeconds` | 3-5 | 3-5 | 2-3 |
| `failureThreshold` | 10-30 | 3-5 | 2-3 |
| `successThreshold` | 1 | 1 | 1-2 |

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Liveness checks database | DB down → restart storm | Only check app process health |
| No startup probe for slow apps | Killed during startup | Add startup probe with high failureThreshold |
| Too aggressive liveness | Kills pods under load | Increase period and failureThreshold |
| Same endpoint for both probes | Can't distinguish alive from ready | Separate `/health` and `/ready` |
| Timeout too short | Healthy app fails under load | Increase timeout to 3-5s |
| No readiness probe | Traffic to starting pods | Always add readiness probe |

## Debugging

```bash
# Check probe status
kubectl describe pod my-pod | grep -A10 "Liveness\|Readiness\|Startup"

# Check events for probe failures
kubectl get events --field-selector involvedObject.name=my-pod

# Test endpoint manually
kubectl exec my-pod -- curl -sf http://localhost:3000/health
kubectl exec my-pod -- curl -sf http://localhost:3000/ready
```

## What's Next?

Our **Docker Fundamentals** course covers health checks in Docker and Kubernetes. **Node.js REST APIs** teaches building production health endpoints. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

