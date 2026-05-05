---
title: "Wolfi Distroless Container Images"
date: "2026-03-03"
description: "Wolfi is a Linux undistro designed for containers with zero CVEs. Learn how Wolfi and Chainguard Images reduce your container attack surface compared to Alpine, Debian, and Ubuntu base images."
category: "DevOps"
tags: ["wolfi", "chainguard", "distroless", "container-security", "Docker", "supply-chain"]
author: "Luca Berton"
---

Your application has zero vulnerabilities. Your base image has 142. Most container CVEs come from OS packages in the base image that your application never uses. Wolfi eliminates them.

## The Base Image Problem

```bash
# Scan a standard Node.js image
trivy image node:20
# Total: 142 vulnerabilities (2 Critical, 10 High)

# Scan an Alpine Node.js image
trivy image node:20-alpine
# Total: 3 vulnerabilities (0 Critical, 1 High)

# Scan a Chainguard Node.js image
trivy image cgr.dev/chainguard/node:latest
# Total: 0 vulnerabilities
```

Standard images include shells, package managers, compilers, and system utilities. Attackers use these tools after gaining initial access. If they are not in the image, they cannot be exploited.

## What Wolfi Is

Wolfi is a Linux distribution built specifically for containers:

- **Minimal**: Only packages your application needs
- **No shell by default**: No `bash`, `sh`, or `ash` unless explicitly added
- **No package manager in runtime**: `apk` available in build stage only
- **Rolling releases**: Packages updated continuously, CVEs patched within hours
- **SBOM built-in**: Every package includes a Software Bill of Materials
- **Signed packages**: Cryptographic signatures on all packages

## Chainguard Images

Chainguard builds production images using Wolfi:

```dockerfile
# Instead of this:
FROM node:20-slim

# Use this:
FROM cgr.dev/chainguard/node:latest
```

Available for: Node.js, Python, Go, Java, Rust, Ruby, PHP, nginx, PostgreSQL, Redis, and 100+ other images.

## Building with Wolfi

### Multi-Stage Build

```dockerfile
# Build stage: has tools
FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

# Runtime stage: minimal
FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["dist/server.js"]
```

The `-dev` variant includes a shell and package manager for building. The runtime variant has neither.

### Custom Images with apko

Build custom Wolfi-based images declaratively:

```yaml
# apko.yaml
contents:
  repositories:
    - https://packages.wolfi.dev/os
  packages:
    - wolfi-baselayout
    - python-3.12
    - py3-pip
    - ca-certificates-bundle

accounts:
  groups:
    - groupname: app
      gid: 1000
  users:
    - username: app
      uid: 1000
  run-as: 1000

entrypoint:
  command: /usr/bin/python3

archs:
  - x86_64
  - aarch64
```

```bash
apko build apko.yaml myorg/python:latest image.tar
docker load < image.tar
```

## Security Comparison

| Image | CVEs (typical) | Size | Shell | Package Manager |
|-------|---------------|------|-------|----------------|
| ubuntu:22.04 | 30-80 | 77MB | Yes | apt |
| debian:12-slim | 20-50 | 74MB | Yes | apt |
| alpine:3.19 | 0-5 | 7MB | Yes | apk |
| cgr.dev/chainguard/static | 0 | 2MB | No | No |
| cgr.dev/chainguard/node | 0 | 50MB | No | No |

## Debugging Distroless Containers

Without a shell, you cannot `exec` into the container. Use these alternatives:

```bash
# Ephemeral debug container (Kubernetes 1.23+)
kubectl debug -it pod/order-api --image=busybox --target=order-api

# Or use the -dev variant temporarily
# Change image to cgr.dev/chainguard/node:latest-dev
# Shell in, debug, switch back to production image
```

## Migration Path

1. **Start with scanning**: Know your current CVE count
2. **Switch non-critical services first**: Internal tools, batch jobs
3. **Use multi-stage builds**: Build with `-dev`, run with minimal
4. **Update CI to scan**: Fail builds if CVEs appear
5. **Gradually migrate critical services**: Verify behavior in staging

Do not switch everything at once. Start with one service, verify it works, then expand.

## When to Use Distroless

**Always use distroless for:**
- Production workloads exposed to the internet
- Services handling sensitive data
- Container images stored in public registries
- Compliance environments requiring minimal attack surface

**Keep a shell for:**
- Development environments
- Debug/troubleshooting images (use `-dev` variants)
- Legacy applications that shell out to system commands

---

Ready to go deeper? Master container security with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
