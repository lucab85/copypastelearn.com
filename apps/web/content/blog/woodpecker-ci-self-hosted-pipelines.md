---
title: "Woodpecker CI Self-Hosted Pipelines"
date: "2026-02-06"
description: "Woodpecker CI is a lightweight, container-native CI/CD system you can self-host. Learn how Woodpecker compares to Drone, GitHub Actions, and GitLab CI for teams wanting full control over their pipelines."
category: "DevOps"
tags: ["woodpecker-ci", "cicd", "self-hosted", "containers", "automation", "devops"]
---

GitHub Actions is convenient until you need custom runners, air-gapped builds, or control over your CI infrastructure. Woodpecker CI gives you a self-hosted, container-native pipeline system in minutes.

## What Woodpecker Is

Woodpecker is a community fork of Drone CI. Every step runs in a container. No plugin marketplace lock-in — any Docker image is a valid step.

## Installation

```yaml
# docker-compose.yml
services:
  woodpecker-server:
    image: woodpeckerci/woodpecker-server:latest
    ports:
      - "8000:8000"
    environment:
      - WOODPECKER_OPEN=true
      - WOODPECKER_HOST=https://ci.myorg.com
      - WOODPECKER_GITHUB=true
      - WOODPECKER_GITHUB_CLIENT=your-client-id
      - WOODPECKER_GITHUB_SECRET=your-client-secret
      - WOODPECKER_AGENT_SECRET=shared-secret
    volumes:
      - woodpecker-data:/var/lib/woodpecker

  woodpecker-agent:
    image: woodpeckerci/woodpecker-agent:latest
    environment:
      - WOODPECKER_SERVER=woodpecker-server:9000
      - WOODPECKER_AGENT_SECRET=shared-secret
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

## Pipeline Configuration

```yaml
# .woodpecker.yml
steps:
  - name: install
    image: node:20-alpine
    commands:
      - npm ci

  - name: lint
    image: node:20-alpine
    commands:
      - npm run lint

  - name: test
    image: node:20-alpine
    commands:
      - npm test

  - name: build
    image: node:20-alpine
    commands:
      - npm run build

  - name: docker
    image: plugins/docker
    settings:
      repo: myorg/order-api
      tags: ${CI_COMMIT_SHA}
      username:
        from_secret: docker_username
      password:
        from_secret: docker_password
    when:
      branch: main
      event: push
```

## Multi-Pipeline

Split pipelines into separate files:

```
.woodpecker/
├── test.yml      # Runs on every push
├── build.yml     # Runs on main branch
├── deploy.yml    # Runs on tag
└── security.yml  # Runs weekly
```

```yaml
# .woodpecker/test.yml
when:
  event: [push, pull_request]

steps:
  - name: test
    image: node:20-alpine
    commands:
      - npm ci
      - npm test
```

```yaml
# .woodpecker/deploy.yml
when:
  event: tag

steps:
  - name: deploy
    image: myorg/deployer:latest
    commands:
      - kubectl set image deployment/order-api order-api=myorg/order-api:${CI_COMMIT_TAG}
    secrets: [kube_config]
```

## Services

Run databases and caches alongside your tests:

```yaml
services:
  - name: postgres
    image: postgres:16
    environment:
      POSTGRES_DB: test
      POSTGRES_PASSWORD: test

  - name: redis
    image: redis:7-alpine

steps:
  - name: test
    image: node:20-alpine
    environment:
      DATABASE_URL: postgres://postgres:test@postgres:5432/test
      REDIS_URL: redis://redis:6379
    commands:
      - npm ci
      - npm test
```

## Matrix Builds

```yaml
matrix:
  NODE_VERSION:
    - "18"
    - "20"
    - "22"

steps:
  - name: test
    image: node:${NODE_VERSION}-alpine
    commands:
      - node --version
      - npm ci
      - npm test
```

## Kubernetes Agent

```yaml
# Woodpecker agent on Kubernetes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: woodpecker-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: agent
          image: woodpeckerci/woodpecker-agent:latest
          env:
            - name: WOODPECKER_SERVER
              value: "woodpecker-server:9000"
            - name: WOODPECKER_AGENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: woodpecker-secrets
                  key: agent-secret
            - name: WOODPECKER_BACKEND
              value: kubernetes
```

## Woodpecker vs Alternatives

| Feature | Woodpecker | GitHub Actions | GitLab CI | Drone |
|---------|-----------|---------------|----------|-------|
| Self-hosted | Yes | Runners only | Yes | Yes |
| Container-native | Yes | Yes | Yes | Yes |
| License | Apache 2.0 | Proprietary | Proprietary | Proprietary |
| Config format | YAML | YAML | YAML | YAML |
| Matrix builds | Yes | Yes | Yes | Limited |
| Setup complexity | Low | N/A | High | Low |
| Multi-platform | Yes | Yes | Yes | Yes |
| Plugins | Docker images | Marketplace | Templates | Docker images |

**Use Woodpecker** for self-hosted CI with zero vendor lock-in. **Use GitHub Actions** for convenience with GitHub repos. **Use GitLab CI** if you are already on GitLab.

---

Ready to go deeper? Master CI/CD pipelines with hands-on courses at [CopyPasteLearn](/courses).
