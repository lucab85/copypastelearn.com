---
title: "Rook Ceph Kubernetes Storage Guide"
date: "2026-02-04"
description: "Rook deploys Ceph distributed storage on Kubernetes for block, file, and object storage. Learn how to set up Rook-Ceph for persistent volumes, shared filesystems, and S3-compatible storage."
category: "DevOps"
tags: ["rook", "ceph", "kubernetes", "storage", "persistent-volumes", "distributed-storage"]
author: "Luca Berton"
---

Kubernetes needs persistent storage. Cloud providers offer EBS and PersistentDisks. On-premises and bare metal clusters need something else. Rook deploys Ceph — a production-grade distributed storage system — as a Kubernetes operator.

## What Rook-Ceph Provides

| Storage Type | Use Case | Kubernetes Object |
|-------------|----------|------------------|
| Block (RBD) | Databases, single-pod volumes | PersistentVolumeClaim |
| Filesystem (CephFS) | Shared storage, ReadWriteMany | PersistentVolumeClaim |
| Object (RGW) | S3-compatible storage | ObjectBucketClaim |

## Installation

```bash
# Deploy the Rook operator
helm install rook-ceph rook-release/rook-ceph \
  --namespace rook-ceph --create-namespace

# Create a Ceph cluster
kubectl apply -f - <<EOF
apiVersion: ceph.rook.io/v1
kind: CephCluster
metadata:
  name: rook-ceph
  namespace: rook-ceph
spec:
  cephVersion:
    image: quay.io/ceph/ceph:v18.2
  dataDirHostPath: /var/lib/rook
  mon:
    count: 3
  storage:
    useAllNodes: true
    useAllDevices: true
EOF
```

Rook discovers available disks on each node and creates a Ceph cluster automatically.

## Block Storage (RBD)

For databases and single-pod workloads:

```yaml
apiVersion: ceph.rook.io/v1
kind: CephBlockPool
metadata:
  name: replicapool
  namespace: rook-ceph
spec:
  replicated:
    size: 3  # 3 copies across nodes
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: rook-ceph-block
provisioner: rook-ceph.rbd.csi.ceph.com
parameters:
  clusterID: rook-ceph
  pool: replicapool
  csi.storage.k8s.io/fstype: ext4
reclaimPolicy: Delete
allowVolumeExpansion: true
```

```yaml
# Use in a deployment
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  storageClassName: rook-ceph-block
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 50Gi
```

## Shared Filesystem (CephFS)

For shared storage across multiple pods:

```yaml
apiVersion: ceph.rook.io/v1
kind: CephFilesystem
metadata:
  name: shared-fs
  namespace: rook-ceph
spec:
  metadataPool:
    replicated:
      size: 3
  dataPools:
    - replicated:
        size: 3
  metadataServer:
    activeCount: 1
    activeStandby: true
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: rook-cephfs
provisioner: rook-ceph.cephfs.csi.ceph.com
parameters:
  clusterID: rook-ceph
  fsName: shared-fs
```

```yaml
# ReadWriteMany PVC — shared across pods
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-uploads
spec:
  storageClassName: rook-cephfs
  accessModes: [ReadWriteMany]
  resources:
    requests:
      storage: 100Gi
```

Multiple pods can read and write to the same volume simultaneously.

## Object Storage (S3)

```yaml
apiVersion: ceph.rook.io/v1
kind: CephObjectStore
metadata:
  name: s3-store
  namespace: rook-ceph
spec:
  metadataPool:
    replicated:
      size: 3
  dataPool:
    replicated:
      size: 3
  gateway:
    port: 80
    instances: 2
```

```yaml
# Request a bucket
apiVersion: objectbucket.io/v1alpha1
kind: ObjectBucketClaim
metadata:
  name: app-bucket
spec:
  generateBucketName: app-data
  storageClassName: rook-ceph-bucket
```

Access via S3 API using credentials from the generated secret.

## Monitoring

```bash
# Check cluster health
kubectl -n rook-ceph exec deploy/rook-ceph-tools -- ceph status

# Output:
  cluster:
    health: HEALTH_OK
  services:
    mon: 3 daemons
    osd: 6 osds: 6 up, 6 in
  data:
    pools:   3 pools, 96 pgs
    objects: 1.2k objects, 4.5 GiB
    usage:   15 GiB used, 585 GiB avail
```

## When to Use Rook-Ceph

**Good fit:**
- On-premises Kubernetes clusters needing persistent storage
- Bare metal clusters without cloud storage
- Workloads needing ReadWriteMany (shared) volumes
- Teams wanting S3-compatible storage alongside block storage

**Not needed:**
- Cloud clusters (use EBS, PersistentDisks)
- Small clusters (<3 nodes — Ceph needs 3+ for replication)
- Workloads that only need ephemeral storage

Rook-Ceph is production-grade but operationally complex. Plan for monitoring, capacity management, and occasional maintenance.

---

Ready to go deeper? Master Kubernetes storage with hands-on courses at [CopyPasteLearn](/courses).
