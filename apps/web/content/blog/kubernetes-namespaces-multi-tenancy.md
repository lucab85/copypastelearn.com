---
title: "Kubernetes Namespaces Multi-Tenancy"
slug: "kubernetes-namespaces-multi-tenancy"
date: "2026-02-20"
category: "DevOps"
tags: ["Kubernetes", "Namespaces", "Multi-Tenancy", "DevOps", "Security"]
excerpt: "Use Kubernetes namespaces for multi-tenancy. Resource quotas, limit ranges, network policies, and RBAC per team or environment."
description: "Kubernetes multi-tenancy with namespaces. Resource quotas, limit ranges, network policies, and RBAC for isolating teams."
---

Namespaces partition a Kubernetes cluster into virtual clusters. Each team, environment, or application gets its own namespace with isolated resources, network policies, and access controls.

## Why Namespaces?

Without namespaces, all resources live in `default`:
- No resource isolation between teams
- No access control boundaries
- Name collisions between apps
- One runaway pod affects everything

With namespaces:
- Each team has resource quotas
- RBAC controls who accesses what
- Network policies isolate traffic
- Teams can self-manage within their namespace

## Namespace Setup

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-backend
  labels:
    team: backend
    environment: production
```

```bash
kubectl create namespace team-frontend
kubectl create namespace team-data
kubectl create namespace staging
```

## Resource Quotas

Prevent one team from consuming all cluster resources:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-backend
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    pods: "50"
    services: "10"
    persistentvolumeclaims: "10"
    requests.storage: 100Gi
```

Check quota usage:

```bash
kubectl describe resourcequota team-quota -n team-backend
```

## Limit Ranges

Set default and maximum resource limits per pod:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-backend
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      max:
        cpu: "4"
        memory: 8Gi
      min:
        cpu: 50m
        memory: 64Mi
    - type: Pod
      max:
        cpu: "8"
        memory: 16Gi
```

Pods without resource specifications automatically get the defaults. Pods requesting more than the max are rejected.

## Network Policies

Isolate namespace traffic:

```yaml
# Default deny all ingress in namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: team-backend
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Allow traffic within the namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: team-backend
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector: {}

---
# Allow traffic from frontend namespace to backend API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: team-backend
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              team: frontend
      ports:
        - port: 3000

---
# Allow ingress controller traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-controller
  namespace: team-backend
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
```

## RBAC Per Namespace

```yaml
# Role: team-backend developers
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: team-backend
rules:
  - apiGroups: ["", "apps", "batch"]
    resources: ["pods", "deployments", "services", "configmaps", "jobs", "cronjobs"]
    verbs: ["*"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec", "pods/portforward"]
    verbs: ["get", "create"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]  # Read but not create/delete

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-developers
  namespace: team-backend
subjects:
  - kind: Group
    name: backend-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

## Multi-Environment Pattern

```yaml
# Namespace per environment
namespaces:
  - name: dev
    quotas: { cpu: "4", memory: 8Gi, pods: 20 }
  - name: staging
    quotas: { cpu: "8", memory: 16Gi, pods: 50 }
  - name: production
    quotas: { cpu: "32", memory: 64Gi, pods: 200 }
```

Deploy same app to different namespaces:

```bash
helm upgrade --install my-app ./chart \
  -f values-dev.yaml \
  -n dev

helm upgrade --install my-app ./chart \
  -f values-production.yaml \
  -n production
```

## Useful Commands

```bash
# List namespaces
kubectl get namespaces

# Set default namespace
kubectl config set-context --current --namespace=team-backend

# View resources across all namespaces
kubectl get pods --all-namespaces
kubectl get pods -A  # shorthand

# Resource usage per namespace
kubectl top pods -n team-backend
kubectl describe resourcequota -n team-backend
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers namespace management for ML workloads. **Docker Fundamentals** teaches the container basics. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

