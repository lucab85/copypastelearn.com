---
title: "Kubernetes Deployment Strategies"
slug: "kubernetes-deployment-strategies"
date: "2026-01-18"
category: "DevOps"
tags: ["Kubernetes", "Deployments", "Rolling Update", "Canary", "Blue-Green"]
excerpt: "Deploy safely with Kubernetes. Rolling updates, blue-green, canary, and recreate strategies with rollback procedures."
description: "Deploy safely with Kubernetes strategies. Rolling updates, blue-green, canary releases, recreate mode, and automated rollback."
---

How you deploy matters as much as what you deploy. The right strategy depends on your tolerance for downtime, risk appetite, and infrastructure budget.

## Rolling Update (Default)

Gradually replaces old pods with new ones:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 1 extra pod during update
      maxUnavailable: 0  # Never reduce below desired count
  template:
    spec:
      containers:
        - name: api
          image: my-api:v2.0
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            periodSeconds: 5
```

**Update flow** (4 replicas, maxSurge=1, maxUnavailable=0):

```
Step 1: v1 v1 v1 v1 + v2 (new)    → 5 pods, waiting for v2 ready
Step 2: v1 v1 v1 v2               → v1 terminated after v2 ready
Step 3: v1 v1 v2 + v2 (new)       → repeat
Step 4: v1 v2 v2 v2
Step 5: v2 v2 v2 v2               → done
```

| Setting | Effect |
|---|---|
| `maxSurge: 25%` | Up to 25% extra pods during rollout |
| `maxUnavailable: 25%` | Up to 25% pods can be down |
| `maxSurge: 1, maxUnavailable: 0` | Zero downtime, slower rollout |
| `maxSurge: 0, maxUnavailable: 1` | No extra resources, some downtime |

## Recreate

Kill all old pods, then create new ones. Simple but causes downtime:

```yaml
strategy:
  type: Recreate
```

```
Step 1: v1 v1 v1 v1 → all terminated
Step 2: (downtime)
Step 3: v2 v2 v2 v2 → all created
```

Use when:
- You cannot run two versions simultaneously
- Database schema changes require it
- Development/testing environments

## Blue-Green Deployment

Run both versions, switch traffic at once:

```yaml
# Blue (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-blue
  labels:
    version: blue
spec:
  replicas: 4
  selector:
    matchLabels:
      app: api
      version: blue
  template:
    metadata:
      labels:
        app: api
        version: blue
    spec:
      containers:
        - name: api
          image: my-api:v1.0
---
# Green (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-green
  labels:
    version: green
spec:
  replicas: 4
  selector:
    matchLabels:
      app: api
      version: green
  template:
    metadata:
      labels:
        app: api
        version: green
    spec:
      containers:
        - name: api
          image: my-api:v2.0
---
# Service — switch by changing selector
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
    version: blue   # ← Change to "green" to switch
  ports:
    - port: 80
      targetPort: 3000
```

Switch traffic:

```bash
# Test green
kubectl exec test-pod -- curl http://api-green:3000/health

# Switch production traffic
kubectl patch service api -p '{"spec":{"selector":{"version":"green"}}}'

# Instant rollback
kubectl patch service api -p '{"spec":{"selector":{"version":"blue"}}}'
```

**Pros**: Instant rollback, test before switching.
**Cons**: Double the resources.

## Canary Deployment

Route a small percentage of traffic to the new version:

### Simple Canary (Replica Count)

```yaml
# Stable: 9 replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: api
      track: stable
  template:
    metadata:
      labels:
        app: api
        track: stable
    spec:
      containers:
        - name: api
          image: my-api:v1.0
---
# Canary: 1 replica (~10% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
      track: canary
  template:
    metadata:
      labels:
        app: api
        track: canary
    spec:
      containers:
        - name: api
          image: my-api:v2.0
---
# Service selects both
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api      # Matches both stable and canary
  ports:
    - port: 80
      targetPort: 3000
```

Gradually shift: increase canary replicas, decrease stable.

### Canary with Ingress (Nginx)

```yaml
# Stable ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-stable
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-stable
                port:
                  number: 80
---
# Canary ingress (10% traffic)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-canary
                port:
                  number: 80
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/api

# Rollback to previous
kubectl rollout undo deployment/api

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=3

# Check rollout status
kubectl rollout status deployment/api

# Pause/resume rollout
kubectl rollout pause deployment/api
kubectl rollout resume deployment/api
```

## Comparison

| Strategy | Downtime | Risk | Resources | Rollback |
|---|---|---|---|---|
| Rolling Update | None | Medium | Normal + surge | Slow (re-roll) |
| Recreate | Yes | Low | Normal | Slow |
| Blue-Green | None | Low | 2x | Instant |
| Canary | None | Lowest | Normal + canary | Instant |

## What's Next?

Our **Docker Fundamentals** course covers container deployment patterns. **MLflow for Kubernetes MLOps** teaches ML model deployment strategies. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

