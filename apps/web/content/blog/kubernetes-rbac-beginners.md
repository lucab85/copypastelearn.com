---
title: "Kubernetes RBAC for Beginners"
slug: "kubernetes-rbac-beginners"
date: "2026-03-02"
category: "DevOps"
tags: ["Kubernetes", "RBAC", "Security", "DevOps", "Access Control"]
excerpt: "Understand Kubernetes RBAC. Roles, ClusterRoles, RoleBindings, service accounts, and practical examples for securing your cluster."
description: "Understand Kubernetes RBAC from scratch. Roles, ClusterRoles, RoleBindings, ServiceAccounts, and practical examples for securing your cluster access control policies."
---

RBAC (Role-Based Access Control) controls who can do what in your Kubernetes cluster. Without it, anyone with cluster access can delete production workloads.

## Core Concepts

| Resource | Scope | Purpose |
|---|---|---|
| **Role** | Namespace | Permissions within one namespace |
| **ClusterRole** | Cluster-wide | Permissions across all namespaces |
| **RoleBinding** | Namespace | Assigns a Role/ClusterRole to users in a namespace |
| **ClusterRoleBinding** | Cluster-wide | Assigns a ClusterRole to users cluster-wide |
| **ServiceAccount** | Namespace | Identity for pods/processes |

## Roles and Permissions

### Namespace Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: staging
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec"]
    verbs: ["get", "create"]
```

### ClusterRole

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: readonly
rules:
  - apiGroups: [""]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
```

## Bindings

### RoleBinding (Namespace-Scoped)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: staging
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
  - kind: Group
    name: developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

### ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: readonly-binding
subjects:
  - kind: Group
    name: auditors
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: readonly
  apiGroup: rbac.authorization.k8s.io
```

## Service Accounts for Applications

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["app-secrets"]  # Only specific secret
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: app-sa
    namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

Use in a deployment:

```yaml
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: true  # Only if app needs K8s API access
  containers:
    - name: app
      image: my-app
```

## Common Patterns

### Developer Access (Namespace Only)

```yaml
# Can manage workloads in their namespace
# Cannot access secrets or other namespaces
rules:
  - apiGroups: ["", "apps"]
    resources: ["pods", "deployments", "services", "configmaps"]
    verbs: ["*"]
  - apiGroups: [""]
    resources: ["pods/log", "pods/exec", "pods/portforward"]
    verbs: ["get", "create"]
```

### CI/CD Pipeline Access

```yaml
# Can deploy but not delete namespaces or access secrets directly
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "patch", "update"]
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "create", "update"]
```

### Read-Only Monitoring

```yaml
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "nodes", "namespaces"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list"]
```

## Debugging RBAC

```bash
# Check if you can do something
kubectl auth can-i create deployments --namespace staging
kubectl auth can-i delete pods --namespace production

# Check what a user can do
kubectl auth can-i --list --as alice --namespace staging

# Check service account permissions
kubectl auth can-i get secrets --as system:serviceaccount:production:app-sa

# View all role bindings in a namespace
kubectl get rolebindings -n staging -o wide
kubectl get clusterrolebindings -o wide | grep alice
```

## Best Practices

| Practice | Why |
|---|---|
| Namespace isolation | Each team gets their own namespace |
| Least privilege | Start with nothing, add what's needed |
| No cluster-admin for developers | Use namespace-scoped roles |
| Service accounts per app | Don't share the default SA |
| Disable SA token auto-mount | `automountServiceAccountToken: false` unless needed |
| Audit RBAC regularly | `kubectl auth can-i --list` for each role |
| Use groups over individual users | Easier to manage at scale |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes RBAC for ML workloads and service accounts for model serving. First lesson is free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

