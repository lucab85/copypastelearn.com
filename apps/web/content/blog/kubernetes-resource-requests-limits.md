---
title: "Kubernetes Resource Requests Limits"
slug: "kubernetes-resource-requests-limits"
date: "2026-01-24"
category: "DevOps"
tags: ["kubernetes", "Resources", "CPU", "Memory", "DevOps"]
excerpt: "Set Kubernetes CPU and memory requests and limits correctly. QoS classes, OOMKilled troubleshooting, and right-sizing with VPA."
description: "Set Kubernetes CPU and memory requests and limits correctly. QoS classes, OOMKilled troubleshooting, and VPA right-sizing."
author: "Luca Berton"
---

Resource requests and limits control how Kubernetes schedules pods and handles resource contention. Set them wrong and you get OOMKilled pods, throttled CPU, or wasted cluster capacity.

## Requests vs Limits

```yaml
resources:
  requests:
    cpu: 200m       # Guaranteed minimum
    memory: 256Mi   # Guaranteed minimum
  limits:
    cpu: "1"        # Maximum allowed
    memory: 512Mi   # Maximum allowed (OOMKilled if exceeded)
```

| Setting | Purpose | Exceeding It |
|---|---|---|
| **Request** | Scheduling guarantee — node must have this available | N/A (minimum) |
| **Limit** | Maximum usage | CPU: throttled. Memory: OOMKilled |

## CPU Units

```yaml
cpu: "1"       # 1 vCPU core
cpu: "0.5"     # Half a core
cpu: 500m      # 500 millicores = 0.5 cores
cpu: 100m      # 100 millicores = 0.1 cores
cpu: 250m      # Quarter core
```

CPU limits cause **throttling**, not killing. Your app gets slower, not terminated.

## Memory Units

```yaml
memory: 128Mi   # 128 mebibytes (128 × 1024² bytes)
memory: 256Mi
memory: 1Gi     # 1 gibibyte
memory: 512M    # 512 megabytes (decimal, not binary)
```

Memory limits cause **OOMKilled** — the pod is terminated immediately.

## Quality of Service (QoS) Classes

Kubernetes assigns QoS based on your resource configuration:

### Guaranteed (highest priority)

```yaml
# Requests == Limits for ALL containers
resources:
  requests:
    cpu: 500m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

Last to be evicted under memory pressure.

### Burstable

```yaml
# Requests < Limits (or only requests set)
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

Evicted after BestEffort pods.

### BestEffort (lowest priority)

```yaml
# No requests or limits set
resources: {}
```

First to be evicted. Never use in production.

## Common Patterns

### Web Application

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

### API Server

```yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi
```

### Background Worker

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: "2"
    memory: 1Gi
```

### Database (Guaranteed QoS)

```yaml
resources:
  requests:
    cpu: "1"
    memory: 2Gi
  limits:
    cpu: "1"
    memory: 2Gi
```

## Right-Sizing

### Check Actual Usage

```bash
# Current usage
kubectl top pods
kubectl top pods --containers

# Detailed per-pod
kubectl top pod my-pod --containers
```

### Prometheus Queries

```promql
# Average CPU usage over 24h
avg_over_time(
  rate(container_cpu_usage_seconds_total{pod="my-pod"}[5m])[24h:]
)

# Peak memory usage over 24h
max_over_time(
  container_memory_working_set_bytes{pod="my-pod"}[24h]
)

# CPU request vs actual usage (over-provisioning)
sum(kube_pod_container_resource_requests{resource="cpu"})
/ sum(rate(container_cpu_usage_seconds_total[5m]))
```

### Vertical Pod Autoscaler (VPA)

Automatically adjusts requests based on usage:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  updatePolicy:
    updateMode: "Off"  # Start with recommendations only
  resourcePolicy:
    containerPolicies:
      - containerName: api
        minAllowed:
          cpu: 50m
          memory: 64Mi
        maxAllowed:
          cpu: "2"
          memory: 2Gi
```

```bash
# Check recommendations
kubectl describe vpa api-vpa
```

## Troubleshooting

### OOMKilled

```bash
kubectl describe pod my-pod | grep -A5 "Last State"
# Reason: OOMKilled
# Exit Code: 137

# Fix: increase memory limit
kubectl set resources deployment my-app --limits=memory=1Gi
```

### CPU Throttling

```bash
# Check throttling
kubectl exec my-pod -- cat /sys/fs/cgroup/cpu/cpu.stat
# nr_throttled: 12345  ← high number = significant throttling

# Fix: increase CPU limit (or remove it)
kubectl set resources deployment my-app --limits=cpu=2
```

### Pending Pod (Insufficient Resources)

```bash
kubectl describe pod my-pod
# Events:
# FailedScheduling: Insufficient cpu / Insufficient memory

# Check node capacity
kubectl describe nodes | grep -A5 "Allocated resources"
```

## Should You Set CPU Limits?

Controversial topic:

**Set CPU limits when:**
- Running on shared clusters (prevent noisy neighbors)
- Compliance requires it
- Predictable performance needed

**Skip CPU limits when:**
- You want pods to burst when CPU is available
- Throttling causes latency spikes
- You trust your request values

Many teams set CPU requests but not CPU limits — pods get guaranteed minimum CPU but can burst higher when capacity is available.

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers resource management for ML training workloads. **Docker Fundamentals** teaches container resource controls. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

