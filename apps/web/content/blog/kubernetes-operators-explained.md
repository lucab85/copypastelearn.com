---
title: "Kubernetes Operators Explained"
slug: "kubernetes-operators-explained"
date: "2026-01-12"
category: "DevOps"
tags: ["Kubernetes", "Operators", "CRD", "Automation", "DevOps"]
excerpt: "Understand Kubernetes Operators. Custom Resource Definitions, controller pattern, popular operators, and when to build your own."
description: "Kubernetes Operators explained for DevOps teams. Custom Resource Definitions, the controller pattern, popular community operators, and when to build your own operator."
---

Operators extend Kubernetes to manage complex applications. Instead of writing runbooks, encode operational knowledge into software that watches and acts automatically.

## The Operator Pattern

```
Custom Resource (CR) → Controller → Kubernetes API
     "I want 3         Watches CR,      Creates/updates
      Postgres          reconciles       pods, services,
      replicas"         desired state    configmaps, PVCs
```

An operator is a controller that uses Custom Resource Definitions (CRDs) to manage application-specific logic.

## Custom Resource Definitions

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                engine:
                  type: string
                  enum: [postgres, mysql]
                version:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                storage:
                  type: string
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames:
      - db
```

### Create a Custom Resource

```yaml
apiVersion: example.com/v1
kind: Database
metadata:
  name: my-postgres
  namespace: production
spec:
  engine: postgres
  version: "16"
  replicas: 3
  storage: 100Gi
```

```bash
kubectl apply -f my-database.yaml
kubectl get databases
kubectl describe database my-postgres
```

## How the Controller Works

```
1. Watch: Controller watches for Database CRs
2. Diff: Compare desired state (CR spec) vs actual state (cluster)
3. Act: Create/update/delete resources to match desired state
4. Repeat: Continuous reconciliation loop
```

```go
// Simplified reconciliation logic
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Fetch the Database CR
    db := &v1.Database{}
    r.Get(ctx, req.NamespacedName, db)

    // Check if StatefulSet exists
    sts := &appsv1.StatefulSet{}
    err := r.Get(ctx, types.NamespacedName{Name: db.Name, Namespace: db.Namespace}, sts)

    if errors.IsNotFound(err) {
        // Create StatefulSet, Service, ConfigMap, etc.
        r.createStatefulSet(ctx, db)
        r.createService(ctx, db)
        return ctrl.Result{}, nil
    }

    // Update if spec changed
    if sts.Spec.Replicas != db.Spec.Replicas {
        sts.Spec.Replicas = &db.Spec.Replicas
        r.Update(ctx, sts)
    }

    return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
}
```

## Popular Operators

| Operator | Manages | Install |
|---|---|---|
| **CloudNativePG** | PostgreSQL clusters | Helm / kubectl |
| **Strimzi** | Apache Kafka | Helm |
| **Prometheus Operator** | Prometheus + Alertmanager | kube-prometheus-stack Helm chart |
| **cert-manager** | TLS certificates | Helm |
| **ArgoCD** | GitOps deployments | Helm |
| **Istio Operator** | Service mesh | istioctl |
| **Elastic Cloud on K8s** | Elasticsearch, Kibana | kubectl |
| **Redis Operator** | Redis clusters | Helm |

### Example: CloudNativePG

```bash
helm install cnpg cloudnative-pg/cloudnative-pg -n cnpg-system --create-namespace
```

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: my-postgres
spec:
  instances: 3
  storage:
    size: 10Gi
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
  bootstrap:
    initdb:
      database: myapp
      owner: app
  backup:
    barmanObjectStore:
      destinationPath: s3://my-backups/postgres/
      s3Credentials:
        accessKeyId:
          name: s3-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: s3-creds
          key: SECRET_ACCESS_KEY
```

This single CR creates:
- 3-node Postgres cluster with streaming replication
- Automatic failover
- Continuous backups to S3
- Connection pooling
- Monitoring endpoints

### Example: cert-manager

```bash
helm install cert-manager jetstack/cert-manager --set installCRDs=true
```

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin&#64;example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-tls
spec:
  secretName: app-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - app.example.com
    - api.example.com
```

Automatic certificate provisioning and renewal.

## Operator Maturity Model

| Level | Capabilities | Example |
|---|---|---|
| 1 - Basic Install | Automated install | Helm chart |
| 2 - Seamless Upgrades | Patch/minor upgrades | Version-aware controller |
| 3 - Full Lifecycle | Backup, restore, failover | CloudNativePG |
| 4 - Deep Insights | Metrics, alerts, log analysis | Prometheus Operator |
| 5 - Auto Pilot | Auto-scaling, auto-tuning, anomaly detection | Advanced operators |

## Building Your Own

### Operator SDK (Go)

```bash
operator-sdk init --domain example.com --repo github.com/myorg/my-operator
operator-sdk create api --group app --version v1 --kind MyApp --resource --controller
```

### Kubebuilder

```bash
kubebuilder init --domain example.com
kubebuilder create api --group app --version v1 --kind MyApp
```

### When to Build vs Use Existing

**Build when:**
- Managing proprietary/internal software
- Specific operational logic unique to your org
- No existing operator covers your use case

**Use existing when:**
- Managing standard software (Postgres, Redis, Kafka)
- Community operator is mature and maintained
- OperatorHub.io has what you need

## Finding Operators

```bash
# OperatorHub.io
# https://operatorhub.io

# Artifact Hub
# https://artifacthub.io

# OLM (Operator Lifecycle Manager)
kubectl get catalogsources -n olm
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers deploying ML platforms with Kubernetes operators. **Docker Fundamentals** teaches the container basics underneath. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

