---
title: "Earthly Reproducible Build Tool"
date: "2026-03-13"
description: "Earthly combines Dockerfiles and Makefiles into reproducible, containerized builds. Learn how Earthly works, how to write Earthfiles, and when it replaces complex CI/CD configurations."
category: "DevOps"
tags: ["earthly", "builds", "cicd", "Containers", "reproducible-builds", "Automation"]
author: "Luca Berton"
---

Makefiles are not reproducible. Dockerfiles are not composable. Earthly combines both: Dockerfile-like syntax for containerized build steps, Makefile-like targets for composition. Every build runs the same everywhere.

## The Problem

Your Makefile works on your machine:

```makefile
test:
    go test ./...
build:
    go build -o app .
```

But fails in CI because CI has Go 1.21 and you have 1.22. Or `gcc` is missing. Or the test database is not running.

Earthly runs every step in a container:

```dockerfile
# Earthfile
VERSION 0.8
FROM golang:1.22
WORKDIR /app

deps:
    COPY go.mod go.sum .
    RUN go mod download
    SAVE ARTIFACT go.mod
    SAVE ARTIFACT go.sum

test:
    FROM +deps
    COPY . .
    RUN go test ./...

build:
    FROM +deps
    COPY . .
    RUN go build -o app .
    SAVE ARTIFACT app AS LOCAL ./app

docker:
    FROM alpine:3.19
    COPY +build/app /usr/local/bin/app
    ENTRYPOINT ["/usr/local/bin/app"]
    SAVE IMAGE myorg/myapp:latest
```

```bash
earthly +test    # Runs tests in a container
earthly +build   # Builds binary
earthly +docker  # Creates Docker image
```

Same result on your laptop, in GitHub Actions, in GitLab CI, or on a colleague's machine.

## Key Concepts

### Targets

Targets are like Makefile rules but run in containers:

```dockerfile
lint:
    FROM golangci/golangci-lint:latest
    COPY . .
    RUN golangci-lint run

test:
    FROM +deps
    COPY . .
    RUN go test -race ./...

integration-test:
    FROM +deps
    COPY . .
    WITH DOCKER --compose docker-compose.test.yml
        RUN go test -tags=integration ./...
    END
```

### Artifacts

Pass files between targets:

```dockerfile
build-frontend:
    FROM node:20
    COPY frontend/ .
    RUN npm ci && npm run build
    SAVE ARTIFACT dist /frontend-dist

build-backend:
    FROM golang:1.22
    COPY backend/ .
    RUN go build -o server .
    SAVE ARTIFACT server /server

docker:
    FROM alpine:3.19
    COPY +build-frontend/frontend-dist /app/static
    COPY +build-backend/server /app/server
    ENTRYPOINT ["/app/server"]
    SAVE IMAGE myorg/fullstack:latest
```

### Multi-Platform

```dockerfile
build:
    FROM golang:1.22
    COPY . .
    ARG TARGETARCH
    RUN GOARCH=$TARGETARCH go build -o app .
    SAVE ARTIFACT app

docker:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +build
```

## CI Integration

Earthly works with any CI system — the CI just calls `earthly`:

```yaml
# GitHub Actions
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: earthly/actions-setup@v1
      - run: earthly +test
      - run: earthly +docker --push
```

```yaml
# GitLab CI
build:
  image: earthly/earthly:latest
  script:
    - earthly +test
    - earthly +docker --push
```

The CI config is trivial because all build logic lives in the Earthfile.

## Caching

Earthly caches like Docker — each `RUN` creates a layer. Unchanged layers are reused:

```dockerfile
deps:
    COPY go.mod go.sum .         # Only re-runs if go.mod/go.sum change
    RUN go mod download          # Cached when dependencies unchanged

build:
    FROM +deps                   # Reuses cached deps
    COPY . .                     # Only invalidated when source changes
    RUN go build -o app .
```

Earthly also supports remote cache sharing via registries:

```bash
earthly --remote-cache=ghcr.io/myorg/cache +build
```

## Earthly vs Alternatives

| Tool | Reproducible | Composable | Container-native | Learning curve |
|------|-------------|-----------|-----------------|---------------|
| Earthly | Yes | Yes | Yes | Low (Dockerfile-like) |
| Make | No | Yes | No | Low |
| Bazel | Yes | Yes | Partial | High |
| Dagger | Yes | Yes | Yes | Medium (SDK) |
| Docker | Yes | No (single Dockerfile) | Yes | Low |

Earthly hits the sweet spot: reproducible like Bazel, familiar like Docker, composable like Make.

---

Ready to go deeper? Master CI/CD and build automation with hands-on courses at [CopyPasteLearn](/courses).
