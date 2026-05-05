---
title: "Telepresence Local Kubernetes Dev"
date: "2026-02-19"
description: "Telepresence connects your local machine to a remote Kubernetes cluster for fast development. Learn how to intercept traffic, debug services locally, and skip the build-push-deploy cycle."
category: "DevOps"
tags: ["telepresence", "kubernetes", "Development", "Debugging", "developer-experience", "microservices"]
author: "Luca Berton"
---

Change code. Build image. Push to registry. Wait for deployment. Check logs. Repeat. This cycle takes 5-15 minutes per iteration. Telepresence cuts it to seconds by routing cluster traffic to your local machine.

## How It Works

```
Without Telepresence:
  Code → Build → Push → Deploy → Test → 10 min

With Telepresence:
  Code → Save → Test → 2 sec
```

Telepresence creates a two-way network connection between your laptop and the Kubernetes cluster. Your local process receives traffic as if it were running in the cluster.

## Setup

```bash
# Install CLI
brew install datawire/blackbird/telepresence2

# Connect to cluster
telepresence connect

# Verify connection
telepresence status
# Connected to context: production-cluster
# Namespace: default
```

Your local machine can now resolve Kubernetes DNS names:

```bash
curl http://order-api.production.svc:8080/health
# {"status": "ok"}
```

## Intercept Traffic

Route traffic from a cluster service to your local process:

```bash
# Start your local service
cd order-api
npm run dev  # Running on localhost:3000

# Intercept the cluster service
telepresence intercept order-api \
  --port 3000:8080 \
  --namespace production
```

All traffic hitting `order-api:8080` in the cluster now routes to `localhost:3000` on your laptop. Your local debugger, hot reload, and IDE all work.

## Personal Intercepts

In a team environment, intercept only your traffic:

```bash
telepresence intercept order-api \
  --port 3000:8080 \
  --http-header x-telepresence-id=alice
```

Only requests with `x-telepresence-id: alice` route to your laptop. Other developers and production traffic are unaffected.

## Environment Variables

Your local process needs the same environment as the cluster:

```bash
# Get the pod's environment
telepresence intercept order-api \
  --port 3000:8080 \
  --env-file order-api.env

# Source them
source order-api.env

# Or run with them
telepresence intercept order-api \
  --port 3000:8080 \
  -- npm run dev
```

`DATABASE_URL`, `REDIS_URL`, and every other env var from the pod is available locally.

## Volume Mounts

Access mounted volumes from the pod:

```bash
telepresence intercept order-api \
  --port 3000:8080 \
  --mount /tmp/telepresence

# Pod's /etc/config is now at /tmp/telepresence/etc/config
ls /tmp/telepresence/var/run/secrets/kubernetes.io/serviceaccount/
# ca.crt  namespace  token
```

ConfigMaps, Secrets, and ServiceAccount tokens are available locally.

## Debugging Workflow

```bash
# 1. Connect
telepresence connect

# 2. Start local service with debugger
node --inspect order-api/src/index.js

# 3. Intercept
telepresence intercept order-api --port 3000:8080

# 4. Attach VS Code debugger to localhost:9229

# 5. Hit the service from the cluster
# kubectl exec -it test-pod -- curl http://order-api:8080/api/orders

# 6. Breakpoint hits in VS Code
```

Debug production-like traffic with your local IDE. Step through code, inspect variables, set breakpoints.

## Docker Compose Integration

For services that need Docker:

```bash
telepresence intercept order-api \
  --port 3000:8080 \
  --docker-run -- \
  --rm -v $(pwd):/app -p 3000:3000 node:20 npm run dev
```

## Leave and Quit

```bash
# Stop intercepting (restore cluster routing)
telepresence leave order-api

# Disconnect from cluster
telepresence quit
```

## When to Use Telepresence

**Good fit:**
- Microservices that depend on other cluster services
- Debugging issues that only reproduce with real cluster data
- Services with slow build-push-deploy cycles
- Testing against real databases, caches, and queues

**Not needed:**
- Standalone services with no cluster dependencies
- Unit tests that mock all external services
- Simple web frontends (hot reload is enough)

**Team tip:** Personal intercepts let multiple developers work on the same service simultaneously without conflicts.

---

Ready to go deeper? Master Kubernetes development workflows with hands-on courses at [CopyPasteLearn](/courses).
