---
title: "Kubernetes Pod Security Standards"
slug: "kubernetes-pod-security-standards"
date: "2026-02-08"
category: "DevOps"
tags: ["Kubernetes", "Security", "Pod Security", "DevOps", "Hardening"]
excerpt: "Implement Kubernetes Pod Security Standards. Privileged, Baseline, and Restricted profiles with Pod Security Admission examples."
description: "Implement Kubernetes Pod Security Standards. Privileged, Baseline, and Restricted profiles with examples."
---

Pod Security Standards define three security profiles that restrict what pods can do. They replaced PodSecurityPolicy (removed in K8s 1.25) with a simpler, built-in admission controller.

## The Three Profiles

| Profile | Purpose | Restrictions |
|---|---|---|
| **Privileged** | Unrestricted | None — full access |
| **Baseline** | Minimally restrictive | Blocks known privilege escalations |
| **Restricted** | Heavily restricted | Best practices enforced |

## What Each Profile Blocks

### Baseline (prevents obvious exploits)

- `hostNetwork`, `hostPID`, `hostIPC`
- Privileged containers
- Adding Linux capabilities beyond a safe set
- HostPath volumes
- Host ports
- `/proc` mount types

### Restricted (production hardening)

Everything in Baseline, plus:
- Must run as non-root
- Must drop ALL capabilities
- Read-only root filesystem
- Seccomp profile required (`RuntimeDefault` or `Localhost`)
- No privilege escalation (`allowPrivilegeEscalation: false`)

## Applying Pod Security Standards

### Per Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    # Enforce: reject pods that violate
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    
    # Warn: allow but show warning
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: latest
    
    # Audit: log violations
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
```

```bash
# Apply to existing namespace
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### Gradual Rollout Strategy

```yaml
# Step 1: Audit only (no enforcement)
pod-security.kubernetes.io/audit: restricted

# Step 2: Add warnings (still no enforcement)
pod-security.kubernetes.io/warn: restricted

# Step 3: Enforce after fixing violations
pod-security.kubernetes.io/enforce: restricted
```

## Compliant Pod Spec (Restricted)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: my-app:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
```

## Common Violations and Fixes

### Running as Root

```yaml
# ❌ Violation
containers:
  - name: app
    image: my-app

# ✅ Fix
containers:
  - name: app
    image: my-app
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
```

Update Dockerfile:

```dockerfile
FROM node:22-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /home/app
COPY --chown=app:app . .
CMD ["node", "server.js"]
```

### Privilege Escalation

```yaml
# ❌ Violation (default allows escalation)
containers:
  - name: app

# ✅ Fix
containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
          - ALL
```

### Writable Root Filesystem

```yaml
# ✅ Read-only root + writable tmpfs
containers:
  - name: app
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:
      - name: tmp
        mountPath: /tmp
      - name: logs
        mountPath: /app/logs
volumes:
  - name: tmp
    emptyDir: {}
  - name: logs
    emptyDir:
      sizeLimit: 100Mi
```

### Missing Seccomp Profile

```yaml
# ✅ Pod-level seccomp (applies to all containers)
spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault
```

## Namespace Configuration Matrix

| Namespace | Enforce | Warn | Audit | Why |
|---|---|---|---|---|
| `kube-system` | privileged | baseline | restricted | System components need privileges |
| `monitoring` | baseline | restricted | restricted | Prometheus needs some host access |
| `production` | restricted | restricted | restricted | Full lockdown |
| `staging` | baseline | restricted | restricted | Testing toward restricted |
| `development` | baseline | restricted | restricted | Developer flexibility |

## Checking Compliance

```bash
# Dry-run: test a pod against a profile
kubectl label --dry-run=server --overwrite ns production \
  pod-security.kubernetes.io/enforce=restricted

# Check audit logs for violations
kubectl get events -A --field-selector reason=FailedCreate

# List namespace security levels
kubectl get namespaces -L \
  pod-security.kubernetes.io/enforce,\
  pod-security.kubernetes.io/warn
```

## Helm Chart Compatibility

Many Helm charts need security context overrides:

```yaml
# values.yaml
podSecurityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

containerSecurityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
  capabilities:
    drop:
      - ALL
```

## What's Next?

Our **SELinux for System Admins** course covers OS-level security that complements Kubernetes Pod Security. **Docker Fundamentals** teaches container security basics. First lessons are free.
