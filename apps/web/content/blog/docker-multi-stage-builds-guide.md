---
title: "Docker Multi-Stage Builds Guide"
description: "Use Docker multi-stage builds to create smaller, faster images. Practical examples for Node.js, Python, and Go."
date: "2026-04-08"
author: "Luca Berton"
category: "DevOps"
tags: ["Docker", "Containers", "Multi-Stage", "DevOps", "Node.js"]
excerpt: "Use Docker multi-stage builds to create smaller, faster images. Practical examples for Node.js, Python, and Go."
---

## Why Multi-Stage Builds?

A typical Node.js Docker image with build tools is 1GB+. Your production app needs maybe 100MB. Multi-stage builds let you use a full build environment and then copy only the artifacts to a minimal runtime image.

## Basic Pattern

```dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

The final image only contains the runtime, compiled code, and production dependencies.

## Node.js with Pruned Dependencies

Install all dependencies for the build, then copy only production deps:

```dockerfile
FROM node:20 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production && npm cache clean --force
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Python Flask Example

```dockerfile
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

## Go Binary

Go produces static binaries — the final image can be `scratch` (empty):

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

FROM scratch
COPY --from=builder /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

Final image size: ~10MB instead of 800MB.

## Size Comparison

| Approach | Image Size |
|---|---|
| `node:20` with everything | ~1.1 GB |
| Multi-stage with `node:20-slim` | ~250 MB |
| Multi-stage with Alpine | ~150 MB |
| Go with `scratch` | ~10 MB |

## Tips

- **Order COPY statements carefully**: put `package.json` before source code so Docker caches the `npm install` layer
- **Use `.dockerignore`**: exclude `node_modules`, `.git`, and test files from the build context
- **Name your stages**: `AS builder` makes `COPY --from=builder` readable
- **Use `--no-cache` sparingly**: Docker layer caching is your friend for fast rebuilds

## .dockerignore

```
node_modules
.git
.gitignore
*.md
.env*
dist
coverage
```

## Related Posts

- [Getting Started with Docker](/blog/getting-started-with-docker) for Docker basics
- [Alpine Linux for Containers](/blog/alpine-linux-for-containers) for minimal base images
- [Building Docker Images from MLflow Models](/blog/docker-images-mlflow-models) for ML-specific builds
