---
title: "Kubernetes Pod Troubleshooting"
description: "Debug Kubernetes pods systematically. Fix CrashLoopBackOff, ImagePullBackOff, pending pods, and OOMKilled with diagnostic commands."
date: "2026-04-10"
author: "Luca Berton"
category: "DevOps"
tags: ["kubernetes", "Troubleshooting", "DevOps", "Containers", "kubectl"]
excerpt: "Debug Kubernetes pods: CrashLoopBackOff, ImagePullBackOff, pending pods, and OOMKilled. Step-by-step fixes."
---

## First Steps

When a pod is not running, start here:

```bash
# What state is it in?
kubectl get pods

# Why?
kubectl describe pod <pod-name>

# What did the app say?
kubectl logs <pod-name>

# Previous crash logs
kubectl logs <pod-name> --previous
```

## CrashLoopBackOff

The container starts, crashes, and Kubernetes keeps restarting it.

**Check logs:**

```bash
kubectl logs <pod-name> --previous
```

Common causes:
- Application error (check stack trace in logs)
- Missing environment variable or config
- Wrong command or entrypoint

**Quick debug — run a shell instead:**

```bash
kubectl run debug --image=<your-image> --rm -it -- /bin/sh
```

## ImagePullBackOff

Kubernetes cannot pull the container image.

```bash
kubectl describe pod <pod-name> | grep -A5 "Events"
```

Fixes:
- **Wrong image name**: check for typos in the deployment spec
- **Private registry**: create an image pull secret

```bash
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<user> \
  --docker-password=<token>
```

Add to your pod spec:

```yaml
spec:
  imagePullSecrets:
    - name: regcred
```

## Pending Pod

Pod stays in `Pending` state — not scheduled to any node.

```bash
kubectl describe pod <pod-name> | grep -A10 "Events"
```

Common causes:
- **Insufficient resources**: no node has enough CPU/memory

```bash
kubectl describe nodes | grep -A5 "Allocated resources"
```

- **Node selector or affinity mismatch**: pod requires a label no node has
- **PVC not bound**: the persistent volume claim is waiting

```bash
kubectl get pvc
```

## OOMKilled

Container exceeded its memory limit and was killed.

```bash
kubectl describe pod <pod-name> | grep -i "oom\|killed\|memory"
```

Fix: increase the memory limit or fix the memory leak:

```yaml
resources:
  requests:
    memory: "256Mi"
  limits:
    memory: "512Mi"
```

Check actual usage:

```bash
kubectl top pod <pod-name>
```

## Container Won't Start

Exit code 0 but pod keeps restarting — the process exits immediately.

Common fix: your container needs a foreground process. Docker images that work with `docker run` may exit in Kubernetes because there is no TTY.

```yaml
# Wrong — exits immediately
command: ["bash", "-c", "echo hello"]

# Right — stays running
command: ["bash", "-c", "echo hello && sleep infinity"]
```

## Network Issues

Pod is running but cannot be reached:

```bash
# Check service endpoints
kubectl get endpoints <service-name>

# Test from inside the cluster
kubectl run curl --image=curlimages/curl --rm -it -- curl http://<service-name>:<port>

# Check DNS
kubectl run dns --image=busybox --rm -it -- nslookup <service-name>
```

## Quick Reference

| Symptom | First Command |
|---|---|
| CrashLoopBackOff | `kubectl logs <pod> --previous` |
| ImagePullBackOff | `kubectl describe pod <pod>` |
| Pending | `kubectl describe pod <pod>` |
| OOMKilled | `kubectl top pod <pod>` |
| Not reachable | `kubectl get endpoints <svc>` |
| Slow startup | `kubectl describe pod <pod>` (check readiness probe) |

## Related Posts

- [Local Kubernetes with Kind](/blog/local-kubernetes-kind-ml) for local testing
- [Monitoring ML Models in K8s](/blog/monitoring-ml-models-kubernetes) for observability
- [CI/CD for ML on Kubernetes](/blog/cicd-ml-models-kubernetes) for deployment pipelines
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

