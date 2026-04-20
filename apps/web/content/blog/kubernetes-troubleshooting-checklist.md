---
title: "Kubernetes Troubleshooting Checklist"
slug: "kubernetes-troubleshooting-checklist"
date: "2026-02-11"
category: "DevOps"
tags: ["Kubernetes", "Troubleshooting", "Debugging", "DevOps", "SRE"]
excerpt: "Systematic Kubernetes troubleshooting. Pod failures, CrashLoopBackOff, ImagePullBackOff, networking, DNS, and storage issues with fix commands."
description: "Kubernetes troubleshooting checklist. Pod failures, CrashLoopBackOff, networking issues, DNS resolution, and storage fixes."
---

When something breaks in Kubernetes, you need a systematic approach. This checklist covers the most common issues and how to fix them.

## Step 1: Get the Big Picture

```bash
# What's unhealthy?
kubectl get pods -A | grep -v Running | grep -v Completed

# Recent events (errors bubble up here)
kubectl get events --sort-by='.lastTimestamp' -A | tail -20

# Node health
kubectl get nodes
kubectl top nodes
```

## Pod Not Starting

### CrashLoopBackOff

The container starts, crashes, and Kubernetes keeps restarting it.

```bash
# Check logs (current crash)
kubectl logs my-pod

# Previous crash logs
kubectl logs my-pod --previous

# Check exit code
kubectl describe pod my-pod | grep -A5 "Last State"
```

Common causes:
- **Exit code 1**: Application error (wrong config, missing env var)
- **Exit code 137**: OOMKilled (needs more memory)
- **Exit code 143**: SIGTERM (graceful shutdown issue)

Fixes:

```bash
# OOMKilled — increase memory limit
kubectl patch deployment my-app -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"512Mi"}}}]}}}}'

# Missing env var — check ConfigMap/Secret
kubectl get configmap my-config -o yaml
kubectl get secret my-secret -o yaml

# Debug interactively
kubectl run debug --image=my-app --rm -it -- sh
```

### ImagePullBackOff

Kubernetes cannot pull the container image.

```bash
kubectl describe pod my-pod | grep -A5 "Events"
```

Common causes:
- Image name typo
- Private registry without credentials
- Image tag does not exist

```bash
# Check image name
kubectl get pod my-pod -o jsonpath='{.spec.containers[0].image}'

# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass

# Add to deployment
kubectl patch serviceaccount default -p '{"imagePullSecrets":[{"name":"regcred"}]}'
```

### Pending

Pod is waiting to be scheduled.

```bash
kubectl describe pod my-pod | grep -A10 "Events"
```

Causes:
- **Insufficient resources**: No node has enough CPU/memory
- **Node selector/affinity**: No matching nodes
- **PVC not bound**: Storage not available
- **Taints**: All nodes tainted, pod has no toleration

```bash
# Check available resources
kubectl describe nodes | grep -A5 "Allocated resources"

# Check PVC status
kubectl get pvc

# Check taints
kubectl describe nodes | grep Taints
```

## Networking Issues

### Service Not Reachable

```bash
# Does the service exist?
kubectl get svc my-service

# Are endpoints populated?
kubectl get endpoints my-service
# Empty endpoints = selector doesn't match pod labels

# Check pod labels
kubectl get pods --show-labels | grep my-app

# Test from inside the cluster
kubectl run test --image=busybox --rm -it -- wget -qO- http://my-service:80
```

### DNS Not Resolving

```bash
# Test DNS resolution
kubectl run dns-test --image=busybox --rm -it -- nslookup my-service

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

# Check resolv.conf inside a pod
kubectl exec my-pod -- cat /etc/resolv.conf
```

### Pod Cannot Reach External Services

```bash
# Test outbound connectivity
kubectl exec my-pod -- curl -v https://api.example.com

# Check NetworkPolicy
kubectl get networkpolicy -n my-namespace

# Check egress rules
kubectl describe networkpolicy -n my-namespace
```

## Storage Issues

### PVC Stuck in Pending

```bash
kubectl describe pvc my-pvc

# Common fixes:
# 1. No StorageClass
kubectl get storageclass

# 2. No available PV (for static provisioning)
kubectl get pv

# 3. Wrong access mode
# ReadWriteOnce: single node
# ReadWriteMany: multiple nodes (needs NFS/EFS)
```

### Permission Denied on Volume

```yaml
# Fix: Set fsGroup in securityContext
spec:
  securityContext:
    fsGroup: 1000
  containers:
    - name: app
      securityContext:
        runAsUser: 1000
```

## Resource Issues

### OOMKilled

```bash
# Check memory usage
kubectl top pods
kubectl describe pod my-pod | grep -i oom

# Fix: increase limits or fix memory leak
kubectl set resources deployment my-app --limits=memory=1Gi
```

### CPU Throttling

```bash
# Check CPU usage vs limits
kubectl top pods

# Signs: high latency, slow responses
# Fix: increase CPU limit or optimize code
kubectl set resources deployment my-app --limits=cpu=2
```

## Deployment Issues

### Rollout Stuck

```bash
kubectl rollout status deployment my-app
kubectl describe deployment my-app

# Check new ReplicaSet
kubectl get rs -l app=my-app

# Rollback
kubectl rollout undo deployment my-app

# Rollback to specific revision
kubectl rollout history deployment my-app
kubectl rollout undo deployment my-app --to-revision=3
```

## Quick Reference

| Symptom | First Command | Likely Cause |
|---|---|---|
| CrashLoopBackOff | `kubectl logs --previous` | App crash, OOM, bad config |
| ImagePullBackOff | `kubectl describe pod` | Wrong image, no registry creds |
| Pending | `kubectl describe pod` | No resources, PVC, taints |
| Service unreachable | `kubectl get endpoints` | Label mismatch, no pods |
| DNS failure | `nslookup` from pod | CoreDNS down, wrong service name |
| OOMKilled | `kubectl describe pod` | Memory limit too low |
| Rollout stuck | `kubectl rollout status` | New pods failing, resource limits |

## Debug Toolkit

```bash
# Interactive debug container (K8s 1.25+)
kubectl debug my-pod -it --image=nicolaka/netshoot

# Copy of pod with debug tools
kubectl debug my-pod -it --image=nicolaka/netshoot --copy-to=debug-pod

# Node-level debugging
kubectl debug node/my-node -it --image=ubuntu
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes operations for ML workloads. **Docker Fundamentals** builds the container foundation you need. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

