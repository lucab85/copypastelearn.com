---
title: "Flux GitOps Kubernetes Tutorial"
date: "2026-04-01"
description: "Flux is a GitOps tool that continuously reconciles your Kubernetes cluster with a Git repository. Learn how to set up Flux, manage Helm releases, and handle multi-environment deployments."
category: "DevOps"
tags: ["flux", "gitops", "kubernetes", "helm", "continuous-delivery", "cncf"]
---

GitOps means your Git repository is the single source of truth for what runs in your cluster. Flux watches your repo and automatically applies changes — no `kubectl apply`, no CI pipeline deploying to Kubernetes.

## How Flux Works

Flux runs inside your cluster as a set of controllers:

1. **Source Controller** — watches Git repos and Helm registries for changes
2. **Kustomize Controller** — applies Kustomize overlays and plain manifests
3. **Helm Controller** — manages Helm releases declaratively
4. **Notification Controller** — sends alerts on reconciliation events

```
Developer → git push → GitHub → Flux detects change → kubectl apply → Cluster updated
```

No CI system involved in the deployment step. Flux handles it continuously.

## Bootstrap

```bash
# Install Flux CLI
brew install fluxcd/tap/flux

# Bootstrap Flux in your cluster
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --path=clusters/production \
  --personal
```

This creates a `fleet-infra` repo (or uses an existing one) and installs Flux controllers in your cluster. Flux now watches this repo.

## Deploying Applications

Create a `GitRepository` source and a `Kustomization` to deploy from it:

```yaml
# clusters/production/apps/source.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/my-app
  ref:
    branch: main
```

```yaml
# clusters/production/apps/kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 5m
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./deploy/production
  prune: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-app
      namespace: production
```

Push this to your fleet-infra repo. Flux creates the GitRepository, watches it, and applies manifests from `deploy/production/` every 5 minutes. `prune: true` means resources removed from Git are deleted from the cluster.

## Helm Releases

Manage Helm charts declaratively:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: bitnami
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.bitnami.com/bitnami
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: redis
  namespace: flux-system
spec:
  interval: 10m
  chart:
    spec:
      chart: redis
      version: "18.x"
      sourceRef:
        kind: HelmRepository
        name: bitnami
  values:
    architecture: standalone
    auth:
      enabled: true
      password: ${REDIS_PASSWORD}
```

Flux installs and upgrades Helm charts based on the declared state. Version pinning, value overrides, and rollback are all Git-controlled.

## Multi-Environment

Structure your fleet repo by cluster:

```
fleet-infra/
├── clusters/
│   ├── production/
│   │   ├── apps/
│   │   └── infrastructure/
│   ├── staging/
│   │   ├── apps/
│   │   └── infrastructure/
│   └── dev/
│       ├── apps/
│       └── infrastructure/
└── base/
    ├── apps/
    └── infrastructure/
```

Base manifests in `base/`, environment-specific overrides in each cluster directory. Kustomize handles the merging.

## Flux vs ArgoCD

| Feature | Flux | ArgoCD |
|---------|------|--------|
| Architecture | Multiple controllers | Single server + UI |
| UI | CLI + Weave GitOps (optional) | Built-in web UI |
| Multi-tenancy | Native (per-namespace) | AppProject-based |
| Helm support | HelmRelease CRD | Application CRD |
| Image automation | Built-in | Separate project |
| Governance model | CNCF graduated | CNCF graduated |

**Choose Flux** if you prefer a composable, controller-based approach and manage everything through Git.

**Choose ArgoCD** if your team values a visual UI for deployment status and application management.

Both are production-ready CNCF graduated projects.

---

Ready to go deeper? Master Kubernetes deployment with hands-on courses at [CopyPasteLearn](/courses).
