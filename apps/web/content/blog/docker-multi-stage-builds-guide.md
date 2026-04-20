---
title: "Docker Multi-Stage Builds Guide"
slug: "docker-multi-stage-builds-guide"
date: "2026-01-16"
category: "DevOps"
tags: ["Docker", "Multi-Stage", "Build", "Optimization", "DevOps"]
excerpt: "Shrink Docker images with multi-stage builds. Separate build and runtime stages, distroless images, and patterns for Go, Node, Python, and Java."
description: "Shrink Docker images dramatically with multi-stage builds. Separate build and runtime stages using distroless bases for Go, Node.js, Python, and Java applications."
---

Multi-stage builds produce small, secure production images by separating build tools from runtime. Your final image contains only what is needed to run the app.

## The Problem

```dockerfile
# ❌ Single stage — 1.2 GB image
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Build tools, source code, devDependencies all in final image
CMD ["node", "dist/server.js"]
```

## The Solution

```dockerfile
# ✅ Multi-stage — 180 MB image
# Stage 1: Build
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER node
CMD ["node", "dist/server.js"]
```

The `COPY --from=builder` pulls only specific files from the build stage. Everything else (source code, dev dependencies, build tools) is discarded.

## Patterns by Language

### Go

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Distroless — no shell, no package manager, no OS utilities
FROM gcr.io/distroless/static-debian12
COPY --from=builder /server /server
USER nonroot
ENTRYPOINT ["/server"]
```

Final image: **~15 MB** (vs 800 MB with full Go image).

### Node.js (Production Dependencies Only)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Three stages: production deps, build, runtime.

### Python

```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
USER nobody
CMD ["python", "app.py"]
```

### Java

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/app.jar ./app.jar
USER 1000
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

JDK in build, only JRE in production.

## Named Stages

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS test
RUN npm ci
COPY . .
RUN npm test

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

Build specific stages:

```bash
# Only run tests
docker build --target test .

# Build production image
docker build --target production -t my-app:latest .
```

## COPY from External Images

```dockerfile
FROM nginx:alpine

# Copy from another image (not a build stage)
COPY --from=caddy:latest /usr/bin/caddy /usr/local/bin/caddy

# Copy from a specific tag
COPY --from=busybox:latest /bin/wget /usr/local/bin/wget
```

## Size Comparison

| Approach | Image Size |
|---|---|
| `node:22` (single stage) | ~1.2 GB |
| `node:22-slim` (multi-stage) | ~180 MB |
| `node:22-alpine` (multi-stage) | ~130 MB |
| Go + distroless | ~15 MB |
| Go + scratch | ~8 MB |

## Best Practices

| Practice | Why |
|---|---|
| Order layers by change frequency | Better cache hits |
| Copy dependency files first | Cache `npm install` / `go mod download` |
| Use `--omit=dev` for prod deps | Smaller, more secure |
| Use `-slim` or `-alpine` base | Smaller base image |
| Run as non-root user | Security |
| Use `.dockerignore` | Exclude `node_modules`, `.git`, tests |
| Pin base image versions | Reproducible builds |

### .dockerignore

```
node_modules
.git
.github
*.md
Dockerfile
docker-compose*.yml
.env*
coverage/
tests/
```

## What's Next?

Our **Docker Fundamentals** course covers multi-stage builds, optimization, and production deployment patterns. First lesson is free.
