---
title: "Container Runtime Security Guide"
slug: "container-runtime-security-guide"
date: "2026-01-09"
category: "DevOps"
tags: ["Containers", "Security", "Docker", "Runtime", "DevOps"]
excerpt: "Secure container runtimes. Non-root users, read-only filesystems, seccomp profiles, AppArmor, capabilities, and image scanning."
description: "Secure container runtimes in production. Non-root users, read-only filesystems, seccomp profiles, AppArmor, and automated vulnerability scanning."
author: "Luca Berton"
---

Containers are not VMs. They share the host kernel, so a container escape means host compromise. Runtime security adds defense in depth.

## Run as Non-Root

```dockerfile
# Dockerfile
FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --chown=app:app . .
RUN npm ci --omit=dev

USER app
CMD ["node", "server.js"]
```

```yaml
# Kubernetes
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
```

Verify:

```bash
docker exec my-container whoami
# app (not root)

docker exec my-container id
# uid=1000(app) gid=1000(app)
```

## Read-Only Root Filesystem

```yaml
# Kubernetes
securityContext:
  readOnlyRootFilesystem: true

volumeMounts:
  - name: tmp
    mountPath: /tmp
  - name: cache
    mountPath: /app/cache

volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir:
      sizeLimit: 100Mi
```

```bash
# Docker
docker run --read-only --tmpfs /tmp:rw,noexec,nosuid my-app
```

App can only write to explicitly mounted volumes.

## Drop Capabilities

Linux capabilities break root into granular permissions:

```yaml
securityContext:
  capabilities:
    drop:
      - ALL           # Drop everything
    add:
      - NET_BIND_SERVICE  # Only add what's needed
```

Common capabilities:

| Capability | Purpose | Usually Needed? |
|---|---|---|
| `NET_BIND_SERVICE` | Bind to ports < 1024 | Rarely |
| `NET_RAW` | Raw sockets (ping) | No |
| `SYS_ADMIN` | Many admin ops | Never in containers |
| `SYS_PTRACE` | Debug processes | Only for debugging |
| `CHOWN` | Change file ownership | Rarely |

**Default**: Drop ALL, add back only what fails.

## No Privilege Escalation

```yaml
securityContext:
  allowPrivilegeEscalation: false
```

Prevents `setuid` binaries from gaining elevated privileges inside the container.

## Seccomp Profiles

Restrict which system calls a container can make:

```yaml
# Kubernetes (1.19+)
securityContext:
  seccompProfile:
    type: RuntimeDefault  # Docker's default seccomp profile
```

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "fstat", "mmap", "mprotect", "brk", "exit_group"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

`RuntimeDefault` blocks dangerous syscalls like `ptrace`, `mount`, `reboot`.

## Complete Pod Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: my-app:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          cpu: "1"
          memory: 512Mi
        requests:
          cpu: 200m
          memory: 256Mi
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir:
        sizeLimit: 50Mi
```

## Image Scanning

### Trivy

```bash
# Scan image
trivy image my-app:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL my-app:latest

# Scan in CI (fail on critical)
trivy image --exit-code 1 --severity CRITICAL my-app:latest

# Scan filesystem
trivy fs --security-checks vuln,secret .
```

### In CI/CD

```yaml
# GitHub Actions
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: my-app:${{ github.sha }}
    format: table
    exit-code: 1
    severity: CRITICAL,HIGH
```

## Image Best Practices

```dockerfile
# Pin specific versions
FROM node:22.12.0-alpine3.20

# Don't install unnecessary packages
RUN apk add --no-cache tini

# Remove package cache
RUN rm -rf /var/cache/apk/*

# Use .dockerignore
# Don't COPY secrets

# Use tini as PID 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

## Network Security

```yaml
# NetworkPolicy: restrict egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-egress
spec:
  podSelector:
    matchLabels:
      app: my-app
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432
    - ports:
        - port: 53
          protocol: UDP
```

## Security Checklist

| Check | Command/Config |
|---|---|
| Non-root user | `runAsNonRoot: true` |
| Read-only filesystem | `readOnlyRootFilesystem: true` |
| Drop capabilities | `capabilities: { drop: [ALL] }` |
| No privilege escalation | `allowPrivilegeEscalation: false` |
| Seccomp profile | `seccompProfile: { type: RuntimeDefault }` |
| Resource limits | `resources.limits` set |
| Image scanned | Trivy in CI pipeline |
| No latest tag | Pin image versions |
| Secrets via volumes | Not env vars when possible |
| Network policies | Default deny + whitelist |

## What's Next?

Our **SELinux for System Admins** course covers mandatory access controls that complement container security. **Docker Fundamentals** teaches secure container building. First lessons are free.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [Docker Fundamentals](/courses/docker-fundamentals) on CopyPasteLearn.
