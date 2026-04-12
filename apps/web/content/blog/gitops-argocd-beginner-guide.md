---
title: "GitOps with ArgoCD Beginner Guide"
slug: "gitops-argocd-beginner-guide"
date: "2026-03-21"
category: "DevOps"
tags: ["GitOps", "ArgoCD", "Kubernetes", "CI/CD", "DevOps"]
excerpt: "Get started with GitOps using ArgoCD. Declarative deployments, automatic sync, and Git as the single source of truth for Kubernetes."
description: "Get started with GitOps using ArgoCD. Declarative deployments, automatic sync, and Git as single source of truth for K8s."
---

GitOps uses Git as the single source of truth for your infrastructure and applications. ArgoCD watches your Git repo and automatically syncs your Kubernetes cluster to match what is defined there.

## GitOps Principles

1. **Declarative**: The entire system is described declaratively (YAML/Helm/Kustomize)
2. **Versioned**: All changes go through Git (pull requests, reviews, history)
3. **Automated**: Approved changes are automatically applied to the cluster
4. **Self-healing**: The system corrects drift — if someone manually changes the cluster, ArgoCD reverts it

## Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward the UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit https://localhost:8080
```

Install the CLI:

```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# Login
argocd login localhost:8080
```

## Your First Application

### Git Repository Structure

```
k8s-manifests/
  apps/
    web-app/
      deployment.yaml
      service.yaml
      ingress.yaml
    api/
      deployment.yaml
      service.yaml
  base/
    namespace.yaml
```

### Create an ArgoCD Application

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/k8s-manifests.git
    targetRevision: main
    path: apps/web-app
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Delete resources removed from Git
      selfHeal: true    # Revert manual cluster changes
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f argocd-app.yaml
```

ArgoCD now watches `apps/web-app/` in your repo. Any changes merged to `main` are automatically deployed.

## The GitOps Workflow

```
Developer writes code
  → PR to app repo (triggers CI: build, test, push image)
    → CI updates image tag in k8s-manifests repo
      → ArgoCD detects change
        → ArgoCD syncs cluster to match Git
          → Deployment rolls out new version
```

### Updating a Deployment

Instead of running `kubectl set image`, you update the Git repo:

```yaml
# Before
containers:
  - name: web
    image: my-registry/web-app:v1.2.3

# After (update in Git)
containers:
  - name: web
    image: my-registry/web-app:v1.2.4
```

Push to main → ArgoCD deploys automatically.

### Rollback

Rolling back is a `git revert`:

```bash
git revert HEAD
git push origin main
# ArgoCD automatically rolls back the cluster
```

Full audit trail in Git history. No one needs cluster access to deploy or rollback.

## Helm with ArgoCD

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: monitoring
  namespace: argocd
spec:
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: kube-prometheus-stack
    targetRevision: 56.0.0
    helm:
      values: |
        grafana:
          adminPassword: changeme
        prometheus:
          retention: 30d
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    automated:
      prune: true
```

## Kustomize with ArgoCD

```
k8s/
  base/
    deployment.yaml
    service.yaml
    kustomization.yaml
  overlays/
    dev/
      kustomization.yaml
    staging/
      kustomization.yaml
    production/
      kustomization.yaml
```

```yaml
# ArgoCD app pointing to overlay
spec:
  source:
    repoURL: https://github.com/your-org/k8s-manifests.git
    path: k8s/overlays/production
```

## Multi-Environment Setup

```yaml
# App of Apps pattern
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: apps
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/your-org/argocd-apps.git
    path: environments/production
  destination:
    server: https://kubernetes.default.svc
```

`environments/production/` contains Application manifests for every service. Add a new service by adding a YAML file and pushing.

## GitOps vs Traditional CI/CD

| Aspect | Traditional CI/CD | GitOps |
|---|---|---|
| Deployment trigger | CI pipeline pushes to cluster | ArgoCD pulls from Git |
| Cluster access | CI needs kubectl/credentials | Only ArgoCD needs access |
| Audit trail | CI logs | Git history |
| Drift detection | None | Automatic self-healing |
| Rollback | Re-run old pipeline | git revert |
| Multi-cluster | Complex pipeline logic | ArgoCD ApplicationSets |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes deployment strategies including GitOps patterns. **Terraform for Beginners** teaches the infrastructure provisioning that pairs with GitOps. First lessons are free.
