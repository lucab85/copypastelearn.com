---
title: "Docker Image Optimization Guide"
slug: "docker-image-optimization-guide"
date: "2026-02-27"
category: "DevOps"
tags: ["Docker", "Optimization", "Containers", "CI/CD", "DevOps"]
excerpt: "Reduce Docker image size by 90%. Multi-stage builds, layer caching, distroless bases, .dockerignore, and build cache optimization."
description: "Reduce Docker image size by 90%. Multi-stage builds, layer caching, distroless bases, and build optimization."
---

A 2GB Docker image takes minutes to pull, wastes storage, and increases attack surface. Most images can be reduced to under 100MB with the right techniques.

## Measure First

```bash
# Image size
docker images my-app

# Layer breakdown
docker history my-app:latest

# Detailed analysis with dive
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock wagoodman/dive my-app:latest
```

## 1. Multi-Stage Builds

The single biggest optimization. Build in one stage, run in another:

```dockerfile
# Stage 1: Build (1.1GB with all dev tools)
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (180MB)
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

| Stage | Size | Contents |
|---|---|---|
| Builder | ~1.1 GB | Node, npm, devDeps, source, build tools |
| Production | ~180 MB | Node (alpine), prodDeps, compiled output |

### Go: Even Better

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

Final image: **~10 MB** (just the binary, no OS).

## 2. Choose the Right Base Image

| Base | Size | Use Case |
|---|---|---|
| `ubuntu:24.04` | 78 MB | When you need apt and shell |
| `node:22-alpine` | 55 MB | Node.js apps |
| `python:3.12-slim` | 45 MB | Python apps |
| `gcr.io/distroless/nodejs22` | 35 MB | Node.js (no shell) |
| `gcr.io/distroless/static` | 2 MB | Go/Rust static binaries |
| `scratch` | 0 MB | Fully static binaries |

## 3. Layer Caching

Docker caches layers. Order your Dockerfile from least to most frequently changing:

```dockerfile
# ✅ Good — dependencies change less often than code
FROM node:22-alpine
WORKDIR /app

# Layer 1: Dependencies (cached until package.json changes)
COPY package*.json ./
RUN npm ci --production

# Layer 2: Application code (changes every commit)
COPY . .

CMD ["node", "server.js"]
```

```dockerfile
# ❌ Bad — COPY . . before npm ci invalidates cache on every code change
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
CMD ["node", "server.js"]
```

## 4. .dockerignore

Exclude files from the build context:

```dockerignore
node_modules
.git
.github
*.md
.env*
.vscode
coverage
dist
.next
docker-compose*.yml
Dockerfile*
```

This speeds up `docker build` (smaller context to send) and prevents leaking secrets.

## 5. Minimize Layers

Each `RUN` creates a layer. Combine related commands:

```dockerfile
# ❌ Bad — 3 layers, apt cache remains
RUN apt-get update
RUN apt-get install -y curl wget
RUN apt-get clean

# ✅ Good — 1 layer, cache cleaned
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl wget && \
    rm -rf /var/lib/apt/lists/*
```

## 6. BuildKit Cache Mounts

Speed up builds without bloating the image:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./

# Cache npm download between builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

COPY . .
CMD ["node", "server.js"]
```

For Python:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

## 7. Pin Versions

```dockerfile
# ❌ Breaks randomly when latest changes
FROM node:latest

# ✅ Reproducible builds
FROM node:22.12-alpine3.21
```

## Real-World Results

| App | Before | After | Reduction |
|---|---|---|---|
| Node.js API | 1.2 GB | 180 MB | 85% |
| Python ML service | 3.5 GB | 450 MB | 87% |
| Go microservice | 800 MB | 12 MB | 98% |
| React frontend | 1.1 GB | 25 MB | 97% |

## CI Build Speed

```yaml
# GitHub Actions with BuildKit cache
- uses: docker/build-push-action@v6
  with:
    push: true
    tags: my-app:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

GHA cache can reduce build time from 5+ minutes to under 30 seconds for unchanged layers.

## What's Next?

Our **Docker Fundamentals** course covers image optimization, multi-stage builds, and production deployment patterns across hands-on lessons. First lesson is free.
