---
title: "Longhorn Cloud Native Storage Guide"
date: "2026-01-30"
description: "Longhorn is a lightweight distributed storage system for Kubernetes. Learn how Longhorn provides replicated block storage, snapshots, and backups without the complexity of Ceph."
category: "DevOps"
tags: ["longhorn", "kubernetes", "storage", "persistent-volumes", "backup", "cncf"]
---

Rook-Ceph is powerful but complex. Longhorn provides distributed block storage for Kubernetes with a simple install, a built-in UI, and backup to S3 — enough for most clusters.

## Installation

```bash
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system --create-namespace
```

Access the UI:

```bash
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
# Open http://localhost:8080
```

## Create Volumes

Longhorn provides a StorageClass automatically:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  storageClassName: longhorn
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 20Gi
```

Longhorn creates a replicated volume across nodes. Default: 3 replicas.

## Custom StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-fast
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "2"
  dataLocality: best-effort
  diskSelector: ssd
allowVolumeExpansion: true
reclaimPolicy: Delete
```

- `numberOfReplicas`: How many copies across nodes
- `dataLocality`: Place a replica on the node where the pod runs (fast reads)
- `diskSelector`: Use specific disk types (SSD vs HDD)

## Snapshots

```yaml
apiVersion: longhorn.io/v1beta2
kind: Snapshot
metadata:
  name: postgres-snap-daily
spec:
  volume: pvc-abc123
```

Or from the UI: click a volume → Create Snapshot. Snapshots are instant and space-efficient (copy-on-write).

## Recurring Snapshots

```yaml
apiVersion: longhorn.io/v1beta2
kind: RecurringJob
metadata:
  name: daily-snapshot
  namespace: longhorn-system
spec:
  cron: "0 2 * * *"
  task: snapshot
  retain: 7
  groups:
    - default
```

Daily snapshots at 2 AM, keep 7 days. Applied to all volumes in the `default` group.

## Backup to S3

```yaml
# Configure backup target (in Longhorn UI or settings)
# Settings → Backup Target:
#   s3://my-longhorn-backups@eu-west-1/

# Or via Kubernetes secret
apiVersion: v1
kind: Secret
metadata:
  name: longhorn-backup-target
  namespace: longhorn-system
data:
  AWS_ACCESS_KEY_ID: <base64>
  AWS_SECRET_ACCESS_KEY: <base64>
```

```yaml
apiVersion: longhorn.io/v1beta2
kind: RecurringJob
metadata:
  name: daily-backup
  namespace: longhorn-system
spec:
  cron: "0 3 * * *"
  task: backup
  retain: 30
  groups:
    - default
```

Snapshots stay on the cluster (fast restore). Backups go to S3 (disaster recovery).

## Restore from Backup

```bash
# From UI: Backup → Select backup → Restore
# Creates a new PV from the backup
```

Or disaster recovery: install Longhorn on a new cluster, point to the same S3 bucket, restore volumes.

## Volume Expansion

```bash
# Edit the PVC
kubectl patch pvc postgres-data -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
```

Longhorn expands the volume online. No downtime, no pod restart needed.

## Monitoring

Longhorn exposes Prometheus metrics:

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: longhorn
spec:
  selector:
    matchLabels:
      app: longhorn-manager
  endpoints:
    - port: manager
```

Key metrics:
- `longhorn_volume_actual_size_bytes` — actual storage used
- `longhorn_volume_state` — volume health (attached, detached, degraded)
- `longhorn_node_storage_capacity_bytes` — available storage per node

## Longhorn vs Alternatives

| Feature | Longhorn | Rook-Ceph | OpenEBS | Local-path |
|---------|---------|-----------|---------|-----------|
| Complexity | Low | High | Medium | Minimal |
| Replication | Yes (1-3) | Yes (configurable) | Depends on engine | No |
| Snapshots | Yes | Yes | Yes | No |
| S3 backup | Built-in | Manual | Manual | No |
| UI | Built-in | Ceph Dashboard | No | No |
| CephFS (RWX) | No (RWO only) | Yes | No | No |
| Object storage | No | Yes (RGW) | No | No |
| CNCF | Sandbox | Graduated | Sandbox | N/A |

**Use Longhorn** for simple clusters needing replicated block storage with backups. **Use Rook-Ceph** for shared filesystems (CephFS) or S3-compatible object storage. **Use local-path** for development clusters without replication needs.

---

Ready to go deeper? Master Kubernetes storage with hands-on courses at [CopyPasteLearn](/courses).
