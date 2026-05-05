---
title: "Taskfile Modern Build Automation"
date: "2026-02-01"
description: "Taskfile is a modern alternative to Makefiles for task automation. Learn how to use Task for build scripts, development workflows, and CI/CD tasks with YAML syntax and cross-platform support."
category: "DevOps"
tags: ["taskfile", "Automation", "build-tools", "developer-experience", "yaml", "DevOps"]
author: "Luca Berton"
---

Makefiles work but the syntax is painful: tabs vs spaces, shell escaping, `.PHONY` everywhere, platform-specific commands. Task uses YAML, runs cross-platform, and handles dependencies cleanly.

## Installation

```bash
# macOS
brew install go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d

# Or via npm
npm install -g @go-task/cli
```

## Basic Taskfile

```yaml
# Taskfile.yml
version: "3"

tasks:
  build:
    desc: Build the application
    cmds:
      - go build -o bin/app ./cmd/app

  test:
    desc: Run tests
    cmds:
      - go test ./...

  lint:
    desc: Run linters
    cmds:
      - golangci-lint run

  dev:
    desc: Run with hot reload
    cmds:
      - air -c .air.toml
```

```bash
task build
task test
task --list  # Show all available tasks
```

## Dependencies

```yaml
tasks:
  build:
    deps: [lint, test]
    cmds:
      - go build -o bin/app ./cmd/app

  docker:
    deps: [build]
    cmds:
      - docker build -t myorg/app:latest .

  deploy:
    deps: [docker]
    cmds:
      - kubectl set image deployment/app app=myorg/app:{{.TAG}}
    vars:
      TAG:
        sh: git rev-parse --short HEAD
```

`task deploy` runs lint → test → build → docker → deploy in order. Dependencies run in parallel when possible.

## Variables

```yaml
version: "3"

vars:
  APP_NAME: order-api
  VERSION:
    sh: git describe --tags --always
  GO_FILES:
    sh: find . -name '*.go' -type f

tasks:
  build:
    cmds:
      - go build -ldflags "-X main.version={{.VERSION}}" -o bin/{{.APP_NAME}}

  info:
    cmds:
      - echo "Building {{.APP_NAME}} version {{.VERSION}}"
```

## Environment Variables

```yaml
tasks:
  test:
    env:
      DATABASE_URL: postgres://localhost:5432/test
      REDIS_URL: redis://localhost:6379
    cmds:
      - go test ./...

  test-ci:
    dotenv: [".env.test"]
    cmds:
      - go test -race -coverprofile=coverage.out ./...
```

## Conditional Execution

```yaml
tasks:
  generate:
    desc: Generate code (only if sources changed)
    sources:
      - api/openapi.yaml
    generates:
      - internal/api/server.go
    cmds:
      - oapi-codegen -generate server api/openapi.yaml > internal/api/server.go

  install-tools:
    desc: Install development tools
    status:
      - which golangci-lint
      - which air
    cmds:
      - go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
      - go install github.com/air-verse/air@latest
```

`sources/generates` skips the task if outputs are newer than inputs. `status` skips if all checks pass.

## Multi-Platform

```yaml
tasks:
  clean:
    cmds:
      - rm -rf bin/
    platforms: [linux, darwin]

  clean:windows:
    cmds:
      - Remove-Item -Recurse -Force bin
    platforms: [windows]

  open:
    cmds:
      - cmd: open http://localhost:3000
        platforms: [darwin]
      - cmd: xdg-open http://localhost:3000
        platforms: [linux]
```

## Namespaces (Included Taskfiles)

```yaml
# Taskfile.yml
version: "3"
includes:
  docker: ./taskfiles/Docker.yml
  k8s: ./taskfiles/Kubernetes.yml
  db: ./taskfiles/Database.yml
```

```bash
task docker:build
task k8s:deploy
task db:migrate
```

## Real-World Example

```yaml
version: "3"

vars:
  APP: order-api
  TAG:
    sh: git rev-parse --short HEAD
  REGISTRY: ghcr.io/myorg

tasks:
  default:
    cmds:
      - task --list

  setup:
    desc: Install development dependencies
    status:
      - which air
      - which golangci-lint
    cmds:
      - go install github.com/air-verse/air@latest
      - go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

  dev:
    desc: Start development server with hot reload
    deps: [setup]
    cmds:
      - air

  test:
    desc: Run tests
    cmds:
      - go test -race -count=1 ./...

  test-coverage:
    desc: Run tests with coverage report
    cmds:
      - go test -race -coverprofile=coverage.out ./...
      - go tool cover -html=coverage.out -o coverage.html
      - echo "Coverage report: coverage.html"

  lint:
    desc: Run linters
    cmds:
      - golangci-lint run

  build:
    desc: Build binary
    deps: [lint, test]
    cmds:
      - CGO_ENABLED=0 go build -ldflags "-s -w -X main.version={{.TAG}}" -o bin/{{.APP}}

  docker-build:
    desc: Build Docker image
    cmds:
      - docker build -t {{.REGISTRY}}/{{.APP}}:{{.TAG}} .

  docker-push:
    desc: Push Docker image
    deps: [docker-build]
    cmds:
      - docker push {{.REGISTRY}}/{{.APP}}:{{.TAG}}

  deploy:
    desc: Deploy to Kubernetes
    deps: [docker-push]
    cmds:
      - kubectl set image deployment/{{.APP}} {{.APP}}={{.REGISTRY}}/{{.APP}}:{{.TAG}}
      - kubectl rollout status deployment/{{.APP}}

  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf bin/ coverage.out coverage.html
```

## Task vs Make

| Feature | Task | Make |
|---------|------|------|
| Syntax | YAML | Makefile (tabs!) |
| Cross-platform | Yes | Needs GNU Make |
| Variables | Clean YAML | Complex escaping |
| Dependencies | Parallel by default | Sequential by default |
| Conditional skip | sources/generates/status | File timestamps only |
| Namespaces | includes | Recursive make |
| Learning curve | Low | Medium |

---

Ready to go deeper? Master DevOps automation with hands-on courses at [CopyPasteLearn](/courses).
