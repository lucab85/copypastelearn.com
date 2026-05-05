---
title: "Postgres Operator for Kubernetes"
date: "2026-03-10"
description: "Run production PostgreSQL on Kubernetes with CloudNativePG or Zalando Postgres Operator. Learn automated failover, backup, and high availability for stateful databases on Kubernetes."
category: "DevOps"
tags: ["PostgreSQL", "kubernetes", "operator", "Database", "cloudnativepg", "high-availability"]
author: "Luca Berton"
---

Running databases on Kubernetes was once considered reckless. With mature operators like CloudNativePG, it is now a production-ready approach used by companies processing millions of transactions daily.

## CloudNativePG

CloudNativePG is the most popular Kubernetes operator for PostgreSQL, donated to CNCF.

### Installation

```bash
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.24/releases/cnpg-1.24.0.yaml
```

### Create a Cluster

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: orders-db
  namespace: production
spec:
  instances: 3
  
  storage:
    size: 50Gi
    storageClass: gp3
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "768MB"
  
  bootstrap:
    initdb:
      database: orders
      owner: app
  
  backup:
    barmanObjectStore:
      destinationPath: s3://my-backups/orders-db/
      s3Credentials:
        accessKeyId:
          name: aws-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: aws-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "30d"
  
  resources:
    requests:
      memory: 1Gi
      cpu: "1"
    limits:
      memory: 2Gi
```

This creates:
- 3-node PostgreSQL cluster (1 primary, 2 replicas)
- Streaming replication with synchronous commit
- Continuous WAL archiving to S3
- Automated failover (< 30 seconds)

### What the Operator Manages

```bash
kubectl get cluster orders-db -n production

NAME        INSTANCES   READY   STATUS   AGE
orders-db   3           3       Healthy  24h
```

The operator handles:
- **Failover**: Primary dies → replica promoted in < 30s
- **Replication**: Streaming replication configured automatically
- **Backups**: Continuous WAL + scheduled base backups
- **Upgrades**: Rolling updates with zero downtime
- **Monitoring**: Prometheus metrics endpoint on every instance

### Connection

```yaml
# Application deployment
env:
  - name: DATABASE_URL
    valueFrom:
      secretRef:
        name: orders-db-app  # Auto-created by operator
        key: uri
```

The operator creates Kubernetes Services:
- `orders-db-rw` — read-write (primary)
- `orders-db-ro` — read-only (replicas)
- `orders-db-r` — any instance

### Point-in-Time Recovery

Restore to any point in the last 30 days:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: orders-db-restored
spec:
  instances: 3
  storage:
    size: 50Gi
  bootstrap:
    recovery:
      source: orders-db
      recoveryTarget:
        targetTime: "2026-03-10T14:30:00Z"
  externalClusters:
    - name: orders-db
      barmanObjectStore:
        destinationPath: s3://my-backups/orders-db/
        s3Credentials:
          accessKeyId:
            name: aws-creds
            key: ACCESS_KEY_ID
          secretAccessKey:
            name: aws-creds
            key: SECRET_ACCESS_KEY
```

## Monitoring

CloudNativePG exposes Prometheus metrics:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: orders-db
spec:
  selector:
    matchLabels:
      cnpg.io/cluster: orders-db
  podMetricsEndpoints:
    - port: metrics
```

Key metrics: replication lag, transaction rate, connection count, WAL archiving status, backup age.

## When to Run Postgres on Kubernetes

**Good fit:**
- Teams with Kubernetes expertise who want unified infrastructure management
- Multi-tenant platforms needing database-per-tenant
- Development and staging environments
- Organizations wanting to avoid managed database vendor lock-in

**Use managed services (RDS, Cloud SQL) when:**
- Your team lacks Kubernetes operational experience
- Compliance requires vendor-managed database security
- You need features like read replicas across regions with zero effort
- Operational simplicity is more important than cost savings

The operator reduces complexity significantly, but you are still responsible for the underlying infrastructure (storage performance, network reliability, node capacity).

---

Ready to go deeper? Master Kubernetes and databases with hands-on courses at [CopyPasteLearn](/courses).
