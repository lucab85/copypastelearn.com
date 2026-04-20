---
title: "Kubernetes Storage PV and PVC Guide"
slug: "kubernetes-storage-pv-pvc-guide"
date: "2026-02-04"
category: "DevOps"
tags: ["Kubernetes", "Storage", "PersistentVolume", "DevOps", "Stateful"]
excerpt: "Kubernetes persistent storage explained. PV, PVC, StorageClasses, dynamic provisioning, StatefulSets, and backup strategies."
description: "Kubernetes persistent storage. PVs, PVCs, StorageClasses, dynamic provisioning, StatefulSets, and backup strategies."
---

Containers are ephemeral. When a pod restarts, its filesystem resets. Persistent storage lets data survive pod restarts, rescheduling, and even node failures.

## Core Concepts

```
StorageClass → defines HOW storage is provisioned
     ↓
PersistentVolume (PV) → actual storage resource
     ↓
PersistentVolumeClaim (PVC) → request for storage by a pod
     ↓
Pod → mounts the PVC as a volume
```

## StorageClass

Defines the storage backend and provisioning behavior:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
allowVolumeExpansion: true
```

| Field | Purpose |
|---|---|
| `provisioner` | CSI driver or built-in provisioner |
| `volumeBindingMode` | `Immediate` or `WaitForFirstConsumer` |
| `reclaimPolicy` | `Delete` (default) or `Retain` |
| `allowVolumeExpansion` | Can PVCs be resized? |

## Dynamic Provisioning (Recommended)

Just create a PVC — the StorageClass automatically creates the PV:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi
```

Use in a pod:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: app-data
```

## Static Provisioning

For pre-existing storage (NFS, existing EBS volumes):

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-data
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    server: nfs.internal
    path: /exports/data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-data
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
  volumeName: nfs-data  # Bind to specific PV
```

## Access Modes

| Mode | Abbreviation | Description |
|---|---|---|
| ReadWriteOnce | RWO | Single node read-write |
| ReadOnlyMany | ROX | Multiple nodes read-only |
| ReadWriteMany | RWX | Multiple nodes read-write |
| ReadWriteOncePod | RWOP | Single pod read-write (K8s 1.27+) |

Cloud block storage (EBS, Azure Disk) only supports RWO. For RWX, use NFS, EFS, or CephFS.

## StatefulSets

For databases and stateful applications — each pod gets its own PVC:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          env:
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```

This creates:
- `data-postgres-0` → 50Gi PVC for pod 0
- `data-postgres-1` → 50Gi PVC for pod 1
- `data-postgres-2` → 50Gi PVC for pod 2

PVCs persist even if pods are deleted.

## Volume Expansion

```yaml
# Edit the PVC
kubectl patch pvc app-data -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'

# Check status
kubectl get pvc app-data
```

Requires `allowVolumeExpansion: true` on the StorageClass. Some CSI drivers need a pod restart.

## Volume Snapshots

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: db-backup-20260204
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: data-postgres-0
```

Restore from snapshot:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-restore
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi
  dataSource:
    name: db-backup-20260204
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
```

## Troubleshooting

```bash
# PVC stuck in Pending
kubectl describe pvc my-pvc
# Common causes: no StorageClass, no capacity, wrong access mode

# Check PV status
kubectl get pv

# Check CSI driver
kubectl get csidrivers
kubectl get pods -n kube-system | grep csi
```

| Issue | Cause | Fix |
|---|---|---|
| PVC Pending | No matching StorageClass | Create StorageClass or set default |
| PVC Pending | Volume binding mode | Pod must be scheduled first (`WaitForFirstConsumer`) |
| Permission denied | Wrong fsGroup | Set `securityContext.fsGroup` |
| Data lost on restart | Using emptyDir, not PVC | Switch to PVC |
| Cannot mount RWX | Block storage limitation | Use NFS/EFS for shared storage |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers persistent storage for ML model artifacts and training data. **Docker Fundamentals** teaches volume management. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

