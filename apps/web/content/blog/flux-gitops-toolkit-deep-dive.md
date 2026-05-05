---
title: "Flux GitOps Toolkit Deep Dive"
date: "2026-02-02"
description: "Flux v2 uses GitOps Toolkit controllers for source management, Kustomize, Helm, and notifications. Learn how to structure a Flux GitOps repository and automate Kubernetes deployments."
category: "DevOps"
tags: ["flux", "gitops", "kubernetes", "helm", "kustomize", "Automation"]
author: "Luca Berton"
---

Argo CD has a UI. Flux is headless — it runs as controllers and reconciles state from Git without a dashboard. This makes Flux lighter, more composable, and better suited for teams that live in the terminal.

## Architecture

```
Git Repository → Source Controller → Kustomize/Helm Controller → Cluster
                                            ↓
                                  Notification Controller → Slack/Teams
```

Four controllers, each handling one concern:
- **Source**: Watches Git repos, Helm repos, S3 buckets
- **Kustomize**: Applies Kustomize overlays
- **Helm**: Manages Helm releases
- **Notification**: Sends alerts on reconciliation events

## Bootstrap

```bash
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --path=clusters/production \
  --personal
```

Flux creates the repo, commits its own manifests, and starts reconciling. The cluster manages itself from Git.

## Repository Structure

```
fleet-infra/
├── clusters/
│   ├── production/
│   │   ├── flux-system/          # Flux controllers (auto-generated)
│   │   ├── infrastructure.yaml   # Sources for infra components
│   │   └── apps.yaml             # Sources for applications
│   └── staging/
│       ├── flux-system/
│       ├── infrastructure.yaml
│       └── apps.yaml
├── infrastructure/
│   ├── sources/                  # HelmRepository definitions
│   │   ├── prometheus.yaml
│   │   └── ingress-nginx.yaml
│   ├── monitoring/               # Prometheus + Grafana
│   │   ├── kustomization.yaml
│   │   └── helmrelease.yaml
│   └── ingress/
│       ├── kustomization.yaml
│       └── helmrelease.yaml
└── apps/
    ├── base/
    │   └── order-api/
    │       ├── deployment.yaml
    │       ├── service.yaml
    │       └── kustomization.yaml
    ├── production/
    │   └── order-api/
    │       ├── kustomization.yaml  # Overlays for prod
    │       └── patch-replicas.yaml
    └── staging/
        └── order-api/
            └── kustomization.yaml
```

## Kustomize Deployment

```yaml
# clusters/production/apps.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: flux-system
  path: ./apps/production
  prune: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: order-api
      namespace: production
```

Flux applies the Kustomize overlay every 10 minutes. If resources are deleted from Git, `prune: true` removes them from the cluster.

## Helm Release

```yaml
# infrastructure/sources/prometheus.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: prometheus-community
  namespace: flux-system
spec:
  interval: 1h
  url: https://prometheus-community.github.io/helm-charts
```

```yaml
# infrastructure/monitoring/helmrelease.yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: prometheus
  namespace: monitoring
spec:
  interval: 30m
  chart:
    spec:
      chart: kube-prometheus-stack
      version: ">=55.0.0 <56.0.0"
      sourceRef:
        kind: HelmRepository
        name: prometheus-community
        namespace: flux-system
  values:
    alertmanager:
      enabled: true
    grafana:
      adminPassword:
        valueFrom:
          secretKeyRef:
            name: grafana-admin
            key: password
```

## Image Automation

Auto-update image tags when new versions are pushed:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: order-api
spec:
  image: ghcr.io/myorg/order-api
  interval: 5m
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: order-api
spec:
  imageRepositoryRef:
    name: order-api
  policy:
    semver:
      range: ">=1.0.0"
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageUpdateAutomation
metadata:
  name: flux-system
spec:
  interval: 30m
  sourceRef:
    kind: GitRepository
    name: flux-system
  git:
    commit:
      author:
        name: flux
        email: flux@myorg.com
    push:
      branch: main
  update:
    strategy: Setters
    path: ./apps
```

In your manifests, mark which images to update:

```yaml
image: ghcr.io/myorg/order-api:1.2.0 # {"$imagepolicy": "flux-system:order-api"}
```

New image pushed → Flux detects it → commits updated tag to Git → reconciles.

## Notifications

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
spec:
  type: slack
  channel: deployments
  secretRef:
    name: slack-webhook
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: on-call
spec:
  providerRef:
    name: slack
  eventSeverity: error
  eventSources:
    - kind: Kustomization
      name: "*"
    - kind: HelmRelease
      name: "*"
```

## Dependencies

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  dependsOn:
    - name: infrastructure  # Wait for infra (ingress, monitoring) first
  path: ./apps/production
```

Infrastructure deploys first, then applications.

## Flux vs Argo CD

| Feature | Flux | Argo CD |
|---------|------|---------|
| UI | CLI only (Weave GitOps optional) | Built-in web UI |
| Architecture | Multiple controllers | Single server |
| Helm support | HelmRelease CRD | Application CRD |
| Image automation | Built-in | Argo Image Updater |
| Multi-tenancy | Namespace scoping | Projects + RBAC |
| SOPS/age | Built-in decryption | Plugin needed |

**Use Flux** for headless GitOps, teams comfortable with CLI, and when you want composable controllers. **Use Argo CD** when you need a visual dashboard and manual sync controls.

---

Ready to go deeper? Master Kubernetes GitOps with hands-on courses at [CopyPasteLearn](/courses).
