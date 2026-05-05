---
title: "Container Security Best Practices"
slug: "container-security-best-practices"
date: "2026-03-10"
category: "DevOps"
tags: ["Container", "Security", "Docker", "kubernetes", "devsecops"]
excerpt: "Secure your containers in production. Image scanning, rootless containers, read-only filesystems, secrets management, and runtime security."
description: "Secure containers in production. Image scanning, rootless, read-only filesystems, secrets management, and runtime security."
author: "Luca Berton"
---

Running containers in production without security hardening is like leaving your front door open. These are the practices that prevent container breaches.

## 1. Use Minimal Base Images

```dockerfile
# Bad — full OS with unnecessary packages
FROM ubuntu:24.04

# Better — slim variant
FROM python:3.12-slim

# Best — distroless (no shell, no package manager)
FROM gcr.io/distroless/python3-debian12
```

| Base Image | Size | Attack Surface |
|---|---|---|
| ubuntu:24.04 | ~78 MB | High (shell, apt, utilities) |
| python:3.12-slim | ~45 MB | Medium (minimal OS) |
| distroless | ~20 MB | Minimal (no shell) |
| scratch | 0 MB | None (for Go/Rust binaries) |

## 2. Don't Run as Root

```dockerfile
# Create non-root user
FROM node:22-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
CMD ["node", "server.js"]
```

In Kubernetes:

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

## 3. Scan Images for Vulnerabilities

```bash
# Trivy (free, fast)
trivy image my-app:latest

# Grype
grype my-app:latest

# Docker Scout
docker scout cves my-app:latest
```

In CI:

```yaml
- name: Scan image
  run: |
    trivy image --exit-code 1 --severity CRITICAL,HIGH my-app:${{ github.sha }}
```

Fail the build if critical vulnerabilities are found.

## 4. Read-Only Root Filesystem

Prevent attackers from writing malware to the container:

```yaml
spec:
  containers:
    - name: app
      securityContext:
        readOnlyRootFilesystem: true
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

Only explicitly mounted volumes are writable. Everything else is read-only.

## 5. Never Store Secrets in Images

```dockerfile
# NEVER do this
ENV DATABASE_PASSWORD=supersecret
COPY .env /app/.env
```

Instead:

```yaml
# Kubernetes secrets
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGIvYXBw  # base64
---
spec:
  containers:
    - name: app
      envFrom:
        - secretRef:
            name: app-secrets
```

Better yet, use external secrets managers:

```yaml
# External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/app/database-url
```

## 6. Network Policies

Restrict container-to-container communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: web
      ports:
        - port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - port: 5432
    - to:  # Allow DNS
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
```

## 7. Resource Limits

Prevent resource exhaustion attacks:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

Without limits, a compromised container can consume all node resources.

## 8. Image Signing and Verification

```bash
# Sign with cosign
cosign sign --key cosign.key my-registry/app:v1.0

# Verify before deploy
cosign verify --key cosign.pub my-registry/app:v1.0
```

Kubernetes admission controller:

```yaml
# Kyverno policy — only allow signed images
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image
spec:
  rules:
    - name: check-signature
      match:
        resources:
          kinds: [Pod]
      verifyImages:
        - imageReferences: ["my-registry/*"]
          attestors:
            - entries:
                - keys:
                    publicKeys: |-
                      -----BEGIN PUBLIC KEY-----
                      ...
                      -----END PUBLIC KEY-----
```

## Security Checklist

- [ ] Non-root user in Dockerfile
- [ ] Minimal base image (alpine/distroless/scratch)
- [ ] Image scanning in CI pipeline
- [ ] Read-only root filesystem
- [ ] No secrets in images or env vars
- [ ] Network policies restricting traffic
- [ ] Resource limits on all containers
- [ ] Security context (no privilege escalation, drop capabilities)
- [ ] Image signing and verification
- [ ] Regular base image updates

## What's Next?

Our **Docker Fundamentals** course covers container security from the ground up. Our **SELinux for System Admins** course teaches mandatory access control for containers on RHEL. First lessons are free.

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

