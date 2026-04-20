---
title: "Kubernetes HPA Autoscaling Guide"
slug: "kubernetes-hpa-autoscaling-guide"
date: "2026-03-01"
category: "DevOps"
tags: ["Kubernetes", "HPA", "Autoscaling", "DevOps", "Performance"]
excerpt: "Configure Kubernetes Horizontal Pod Autoscaler. CPU, memory, and custom metric scaling with practical YAML examples."
description: "Configure Kubernetes HPA autoscaling for production workloads. CPU and memory scaling, custom metric-based policies, and practical YAML examples for real-world deployments."
---

The Horizontal Pod Autoscaler (HPA) automatically adjusts the number of pod replicas based on observed metrics. Your application scales up during traffic spikes and scales down when demand drops.

## How HPA Works

```
Metrics Server collects CPU/memory from kubelets
  → HPA controller checks metrics every 15 seconds
    → Compares current vs target utilization
      → Scales replicas up or down
```

## Prerequisites

```bash
# Metrics Server must be installed
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl top nodes
kubectl top pods
```

## Basic HPA: CPU Scaling

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: app
          image: my-app:latest
          resources:
            requests:
              cpu: 200m      # HPA needs requests defined!
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

When average CPU across all pods exceeds 70% of the requested 200m (140m), HPA adds more pods.

## Multi-Metric HPA

Scale on both CPU and memory:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

The `behavior` section prevents flapping:
- **Scale up**: Wait 60s, then add up to 50% more pods per minute
- **Scale down**: Wait 5 minutes of stable low usage, then remove up to 10% per minute

## Custom Metrics HPA

Scale on application-specific metrics (requires Prometheus Adapter):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 50
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
    - type: Object
      object:
        metric:
          name: queue_depth
        describedObject:
          apiVersion: v1
          kind: Service
          name: rabbitmq
        target:
          type: Value
          value: "50"
```

This scales when:
- Each pod handles more than 100 req/s
- OR the RabbitMQ queue depth exceeds 50 messages

## KEDA: Event-Driven Autoscaling

For more advanced scaling (queue depth, Kafka lag, cron schedules):

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker
spec:
  scaleTargetRef:
    name: worker-deployment
  minReplicaCount: 0    # Scale to zero!
  maxReplicaCount: 50
  triggers:
    - type: rabbitmq
      metadata:
        queueName: tasks
        host: amqp://guest:guest@rabbitmq:5672/
        queueLength: "10"
    - type: cron
      metadata:
        timezone: Europe/Rome
        start: 0 8 * * *
        end: 0 20 * * *
        desiredReplicas: "5"
```

KEDA can scale to zero — no pods running when there is no work.

## Load Testing Your HPA

```bash
# Generate load
kubectl run load-test --image=busybox --rm -it -- \
  sh -c "while true; do wget -q -O- http://web-app; done"

# Watch HPA in action
kubectl get hpa web-app --watch

# Watch pods scaling
kubectl get pods -l app=web-app --watch
```

## Monitoring HPA

```bash
# Current status
kubectl get hpa

# Detailed info
kubectl describe hpa web-app

# Events
kubectl get events --field-selector involvedObject.name=web-app
```

Key Prometheus metrics:

```promql
# Current vs desired replicas
kube_horizontalpodautoscaler_status_current_replicas
kube_horizontalpodautoscaler_status_desired_replicas

# HPA condition
kube_horizontalpodautoscaler_status_condition{condition="ScalingActive"}
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| No resource requests | HPA needs `requests` to calculate utilization |
| Min replicas = 1 | Use min 2 for high availability |
| No scale-down stabilization | Add `stabilizationWindowSeconds` to prevent flapping |
| Scaling on memory for JVM apps | JVM rarely releases memory; use CPU or custom metrics |
| Max too low | Set max high enough for peak traffic |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers autoscaling ML inference workloads on Kubernetes. **Docker Fundamentals** builds the container foundation. First lessons are free.
