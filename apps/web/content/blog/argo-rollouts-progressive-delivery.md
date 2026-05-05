---
title: "Argo Rollouts Progressive Delivery"
date: "2026-03-07"
description: "Argo Rollouts adds canary releases and blue-green deployments to Kubernetes with automated analysis and rollback. Learn how to set up progressive delivery with traffic shifting and metrics-based promotion."
category: "DevOps"
tags: ["argo-rollouts", "kubernetes", "canary", "blue-green", "progressive-delivery", "deployment"]
author: "Luca Berton"
---

Kubernetes Deployments do rolling updates: replace pods one by one. If the new version is broken, you find out after all pods are updated. Argo Rollouts adds canary and blue-green strategies with automated analysis — bad versions are rolled back before they affect all users.

## Installation

```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f \
  https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Install kubectl plugin
brew install argoproj/tap/kubectl-argo-rollouts
```

## Canary Deployment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-api
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 2m }
        - setWeight: 20
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 5m }
        - setWeight: 80
        - pause: { duration: 2m }
  selector:
    matchLabels:
      app: order-api
  template:
    metadata:
      labels:
        app: order-api
    spec:
      containers:
        - name: order-api
          image: myorg/order-api:v2.0.0
          ports:
            - containerPort: 8080
```

Traffic shifts: 5% → wait 2 min → 20% → wait 5 min → 50% → 80% → 100%. At each pause, you can verify metrics or let automated analysis decide.

## Automated Analysis

The real power is metrics-based promotion:

```yaml
strategy:
  canary:
    steps:
      - setWeight: 10
      - pause: { duration: 2m }
      - analysis:
          templates:
            - templateName: success-rate
      - setWeight: 50
      - pause: { duration: 5m }
      - analysis:
          templates:
            - templateName: success-rate
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
    - name: success-rate
      interval: 1m
      count: 5
      successCondition: result[0] >= 0.99
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{
              app="order-api",
              status=~"2..",
              rollouts_pod_template_hash="{{args.canary-hash}}"
            }[2m]))
            /
            sum(rate(http_requests_total{
              app="order-api",
              rollouts_pod_template_hash="{{args.canary-hash}}"
            }[2m]))
```

If the canary's success rate drops below 99%, Argo Rollouts automatically rolls back. No human intervention needed.

## Blue-Green Deployment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-api
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: order-api-active
      previewService: order-api-preview
      autoPromotionEnabled: false
      prePromotionAnalysis:
        templates:
          - templateName: smoke-tests
      scaleDownDelaySeconds: 300
  selector:
    matchLabels:
      app: order-api
  template:
    metadata:
      labels:
        app: order-api
    spec:
      containers:
        - name: order-api
          image: myorg/order-api:v2.0.0
```

The new version runs alongside the old. Preview service lets you test the new version. After analysis passes, traffic switches instantly from old to new.

## Traffic Management

Integrate with service meshes and ingress controllers:

```yaml
strategy:
  canary:
    trafficRouting:
      nginx:
        stableIngress: order-api-ingress
        additionalIngressAnnotations:
          canary-by-header: X-Canary
      # Or with Istio:
      # istio:
      #   virtualService:
      #     name: order-api-vsvc
```

With traffic routing, the weight percentages control actual network traffic — not just pod ratios.

## Monitoring Rollouts

```bash
# Watch rollout status
kubectl argo rollouts get rollout order-api --watch

# Manually promote a paused rollout
kubectl argo rollouts promote order-api

# Abort and rollback
kubectl argo rollouts abort order-api

# Retry after abort
kubectl argo rollouts retry rollout order-api
```

## Dashboard

```bash
kubectl argo rollouts dashboard
# Opens web UI showing rollout status, canary weight, analysis results
```

## When to Use Argo Rollouts

**Good fit:**
- Services where bad deployments cost money (payments, auth, core API)
- Teams with Prometheus metrics for automated analysis
- Organizations needing audit trails for deployment decisions
- High-traffic services where even 5% errors affect thousands of users

**Not needed:**
- Internal tools with low traffic
- Services where a 30-second rolling update is acceptable risk
- Teams without metrics infrastructure for automated analysis

Start with canary on your most critical service. Once you trust the analysis, expand to other services.

---

Ready to go deeper? Master Kubernetes deployment strategies with hands-on courses at [CopyPasteLearn](/courses).
