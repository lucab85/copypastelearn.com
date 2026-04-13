---
title: "GitOps with ArgoCD Beginner Guide"
slug: "gitops-argocd-beginner-guide"
date: "2026-01-07"
category: "DevOps"
tags: ["ArgoCD", "GitOps", "Kubernetes", "CI/CD", "DevOps"]
excerpt: "Get started with GitOps using ArgoCD. Install ArgoCD, create applications, sync strategies, app of apps pattern, and automated deployments."
description: "Get started with GitOps using ArgoCD. Install, create apps, sync strategies, and automated deployments."
---

GitOps uses Git as the single source of truth for infrastructure and applications. ArgoCD watches your Git repo and automatically syncs Kubernetes clusters to match.

## Core Concepts

```
Git Repo (desired state) → ArgoCD → Kubernetes Cluster (actual state)
                              ↓
                    Detects drift, syncs automatically
```

| Concept | Meaning |
|---|---|
| **Application** | A set of K8s manifests tracked from a Git repo |
| **Sync** | Apply desired state from Git to cluster |
| **Drift** | Actual state differs from Git |
| **Health** | Application resources are working correctly |

## Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods
kubectl -n argocd rollout status deployment argocd-server

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080
```

### Install CLI

```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/

# Login
argocd login localhost:8080
```

## Create an Application

### Via CLI

```bash
argocd app create my-app \
  --repo https://github.com/myorg/k8s-manifests.git \
  --path apps/my-app \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

### Via Manifest

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main
    path: apps/my-app
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Delete resources removed from Git
      selfHeal: true    # Revert manual changes
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        maxDuration: 3m
        factor: 2
```

## Git Repository Structure

```
k8s-manifests/
  apps/
    my-app/
      deployment.yaml
      service.yaml
      ingress.yaml
      configmap.yaml
    api/
      deployment.yaml
      service.yaml
    worker/
      deployment.yaml
  base/
    namespace.yaml
    network-policies.yaml
```

## Helm Applications

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
  namespace: argocd
spec:
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: kube-prometheus-stack
    targetRevision: 55.0.0
    helm:
      values: |
        grafana:
          enabled: true
          adminPassword: admin
        prometheus:
          prometheusSpec:
            retention: 30d
            storageSpec:
              volumeClaimTemplate:
                spec:
                  resources:
                    requests:
                      storage: 50Gi
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
```

## Kustomize Applications

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-production
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
```

## App of Apps Pattern

One parent Application manages child Applications:

```yaml
# apps/root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    path: argocd-apps    # Directory containing Application manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```
argocd-apps/
  my-app.yaml          # Application manifest
  api.yaml             # Application manifest
  prometheus.yaml      # Application manifest
  cert-manager.yaml    # Application manifest
```

Add a new app to the cluster = commit a YAML file to Git.

## Sync Strategies

| Strategy | Behavior |
|---|---|
| Manual | Click sync in UI or run `argocd app sync` |
| Automated | Auto-sync when Git changes detected |
| Automated + Prune | Also delete resources removed from Git |
| Automated + Self-Heal | Revert manual kubectl changes |

## CLI Operations

```bash
# List apps
argocd app list

# Get app details
argocd app get my-app

# Sync
argocd app sync my-app

# Diff (what would change)
argocd app diff my-app

# History
argocd app history my-app

# Rollback
argocd app rollback my-app REVISION_NUMBER

# Delete app (and resources)
argocd app delete my-app --cascade
```

## CI/CD Pipeline Integration

```yaml
# GitHub Actions — update image tag in Git
- name: Update image tag
  run: |
    cd k8s-manifests
    kustomize edit set image my-app=my-registry/my-app:${{ github.sha }}
    git add .
    git commit -m "deploy: my-app ${{ github.sha }}"
    git push
```

ArgoCD detects the commit and syncs automatically. CI pushes images and updates Git. CD (ArgoCD) deploys from Git.

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers GitOps workflows for ML model deployment. **Docker Fundamentals** teaches the container basics. First lessons are free.
