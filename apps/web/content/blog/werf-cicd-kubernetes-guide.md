---
title: "Werf CI/CD for Kubernetes Guide"
date: "2026-01-25"
description: "Werf is a CNCF tool that combines building, publishing, and deploying to Kubernetes into a single workflow. Learn how werf handles Dockerfiles, Helm charts, and cleanup in one declarative config."
category: "DevOps"
tags: ["werf", "kubernetes", "cicd", "helm", "deployment", "cncf"]
author: "Luca Berton"
---

Most CI/CD pipelines chain together separate tools: Docker build, registry push, Helm install, image cleanup. Werf integrates all of these into one tool that understands the full lifecycle from code to running deployment.

## What Werf Does

```
Source Code → Build Images → Push to Registry → Deploy (Helm) → Cleanup Old Images
                    ↑                                    ↑              ↑
                All managed by werf with content-based tagging
```

No manual tag management. Werf generates content-based tags from your source files — the same code always produces the same tag.

## Installation

```bash
curl -sSL https://werf.io/install.sh | bash
```

## Project Configuration

```yaml
# werf.yaml
project: order-api
configVersion: 1

---
image: order-api
dockerfile: Dockerfile
context: .
```

## Build and Deploy

```bash
# Build, push, and deploy in one command
werf converge --repo ghcr.io/myorg/order-api
```

`werf converge` does everything:
1. Builds the Docker image
2. Pushes to the registry with a content-based tag
3. Deploys using Helm charts
4. Waits for rollout to complete

## Helm Integration

Werf uses standard Helm charts with extra templating:

```
.helm/
├── Chart.yaml
├── templates/
│   ├── deployment.yaml
│   └── service.yaml
└── values.yaml
```

```yaml
# .helm/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicas }}
  template:
    spec:
      containers:
        - name: app
          image: {{ .Values.werf.image.order_api }}
          # werf injects the correct content-based image tag
```

No hardcoded image tags. Werf injects the correct tag automatically.

## Multi-Image Projects

```yaml
# werf.yaml
project: ecommerce
configVersion: 1

---
image: frontend
dockerfile: frontend/Dockerfile
context: frontend/

---
image: order-api
dockerfile: backend/order-api/Dockerfile
context: backend/order-api/

---
image: payment-svc
dockerfile: backend/payment-svc/Dockerfile
context: backend/payment-svc/
```

All images are built, tagged, and deployed together. If only the frontend changed, only the frontend image is rebuilt.

## Content-Based Tagging

```
Source files hash → Image tag

src/server.ts (changed) → sha256:abc123 (new tag)
src/server.ts (unchanged) → sha256:abc123 (same tag, no rebuild)
```

Benefits:
- Same code always produces the same image
- No rebuilds when nothing changed
- Rollback = redeploy the old tag (always available)

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # werf needs full history

      - name: Install werf
        uses: werf/actions/install@v2

      - name: Converge
        uses: werf/actions/converge@v2
        with:
          env: production
        env:
          WERF_REPO: ghcr.io/myorg/ecommerce
          WERF_NAMESPACE: production
          WERF_KUBE_CONFIG_BASE64: ${{ secrets.KUBE_CONFIG }}
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - werf converge --repo $CI_REGISTRY_IMAGE
  environment:
    name: production
```

## Cleanup

Old images accumulate in registries. Werf cleans them up based on Git history:

```bash
# Remove images not referenced by any Git tag or branch
werf cleanup --repo ghcr.io/myorg/order-api
```

```yaml
# .werf-cleanup.yaml
policies:
  - references:
      branch: /^main$/
    imagesPerReference:
      last: 10  # Keep last 10 images on main
  - references:
      tag: /^v\d+\.\d+\.\d+$/
    imagesPerReference:
      last: 5   # Keep last 5 tagged releases
```

## Environment Promotion

```bash
# Deploy to staging
werf converge --repo ghcr.io/myorg/order-api --env staging

# Promote to production (same images, different values)
werf converge --repo ghcr.io/myorg/order-api --env production
```

## Werf vs Alternatives

| Feature | Werf | Skaffold | Helm + Docker | Argo CD |
|---------|------|---------|-------------|---------|
| Build + Deploy | Single tool | Single tool | Separate tools | Deploy only |
| Content-based tags | Yes | No | No | N/A |
| Image cleanup | Built-in | No | Manual | No |
| Helm integration | Native | Plugin | Native | Native |
| CI/CD focus | Yes | Dev + CI | CI | GitOps |

**Use werf** for end-to-end CI/CD with automatic image management. **Use Skaffold** for local development. **Use Argo CD** for GitOps deployments.

---

Ready to go deeper? Master Kubernetes CI/CD with hands-on courses at [CopyPasteLearn](/courses).
