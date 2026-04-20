---
title: "Kubernetes ETCD Backup and Restore"
slug: "kubernetes-etcd-backup-restore"
date: "2026-01-04"
category: "DevOps"
tags: ["Kubernetes", "ETCD", "Backup", "Disaster Recovery", "DevOps"]
excerpt: "Back up and restore Kubernetes etcd. Snapshot creation, automated backups, disaster recovery procedures, and etcd cluster health checks."
description: "Back up and restore Kubernetes etcd. Snapshot procedures, automated schedules, restore workflows, and cluster health verification."
---

etcd stores all Kubernetes cluster state — deployments, services, secrets, configmaps, everything. Losing etcd without a backup means rebuilding from scratch.

## What's in etcd

```
etcd contains:
├── All Kubernetes objects (pods, services, deployments, etc.)
├── RBAC configurations (roles, bindings)
├── Secrets and ConfigMaps
├── Custom Resources (CRDs and CRs)
├── Namespace definitions
├── Service account tokens
└── Cluster configuration
```

## Manual Snapshot

### Find etcd Endpoint and Certs

```bash
# On a control plane node
kubectl -n kube-system get pods -l component=etcd

# Check etcd pod for cert paths
kubectl -n kube-system describe pod etcd-master-1 | grep -A5 Command
```

Typical cert locations:

```bash
ETCD_CERT=/etc/kubernetes/pki/etcd/server.crt
ETCD_KEY=/etc/kubernetes/pki/etcd/server.key
ETCD_CACERT=/etc/kubernetes/pki/etcd/ca.crt
ETCD_ENDPOINT=https://127.0.0.1:2379
```

### Take Snapshot

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d-%H%M%S).db \
  --endpoints=$ETCD_ENDPOINT \
  --cert=$ETCD_CERT \
  --key=$ETCD_KEY \
  --cacert=$ETCD_CACERT
```

### Verify Snapshot

```bash
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-20260104-120000.db --write-table
# +----------+----------+------------+------------+
# |   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
# +----------+----------+------------+------------+
# | abc12345 |   45678  |    1234    |   25 MB    |
# +----------+----------+------------+------------+
```

## Automated Backup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          hostNetwork: true
          nodeSelector:
            node-role.kubernetes.io/control-plane: ""
          tolerations:
            - effect: NoSchedule
              operator: Exists
          containers:
            - name: backup
              image: bitnami/etcd:latest
              command:
                - /bin/sh
                - -c
                - |
                  set -e
                  FILENAME="etcd-$(date +%Y%m%d-%H%M%S).db"
                  etcdctl snapshot save "/backup/$FILENAME" \
                    --endpoints=https://127.0.0.1:2379 \
                    --cert=/etc/kubernetes/pki/etcd/server.crt \
                    --key=/etc/kubernetes/pki/etcd/server.key \
                    --cacert=/etc/kubernetes/pki/etcd/ca.crt
                  etcdctl snapshot status "/backup/$FILENAME" --write-table
                  # Keep last 7 days
                  find /backup -name "etcd-*.db" -mtime +7 -delete
                  echo "Backup complete: $FILENAME"
              env:
                - name: ETCDCTL_API
                  value: "3"
              volumeMounts:
                - name: etcd-certs
                  mountPath: /etc/kubernetes/pki/etcd
                  readOnly: true
                - name: backup
                  mountPath: /backup
          volumes:
            - name: etcd-certs
              hostPath:
                path: /etc/kubernetes/pki/etcd
            - name: backup
              persistentVolumeClaim:
                claimName: etcd-backup-pvc
          restartPolicy: OnFailure
```

## Restore from Snapshot

### Stop kube-apiserver

```bash
# Move static pod manifests to stop API server and etcd
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
sudo mv /etc/kubernetes/manifests/etcd.yaml /tmp/
```

### Restore Snapshot

```bash
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-20260104-120000.db \
  --data-dir=/var/lib/etcd-restored \
  --name=master-1 \
  --initial-cluster=master-1=https://10.0.1.10:2380 \
  --initial-cluster-token=etcd-cluster-1 \
  --initial-advertise-peer-urls=https://10.0.1.10:2380
```

### Replace Data Directory

```bash
# Back up current (corrupted) data
sudo mv /var/lib/etcd /var/lib/etcd-corrupted

# Use restored data
sudo mv /var/lib/etcd-restored /var/lib/etcd
sudo chown -R etcd:etcd /var/lib/etcd
```

### Restart Components

```bash
# Restore static pod manifests
sudo mv /tmp/etcd.yaml /etc/kubernetes/manifests/
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Wait for etcd and API server to start
kubectl get nodes
kubectl get pods -A
```

## Cluster Health

```bash
# Check cluster health
ETCDCTL_API=3 etcdctl endpoint health \
  --endpoints=$ETCD_ENDPOINT \
  --cert=$ETCD_CERT \
  --key=$ETCD_KEY \
  --cacert=$ETCD_CACERT

# Check cluster status
ETCDCTL_API=3 etcdctl endpoint status --write-table \
  --endpoints=$ETCD_ENDPOINT \
  --cert=$ETCD_CERT \
  --key=$ETCD_KEY \
  --cacert=$ETCD_CACERT

# List members
ETCDCTL_API=3 etcdctl member list --write-table \
  --endpoints=$ETCD_ENDPOINT \
  --cert=$ETCD_CERT \
  --key=$ETCD_KEY \
  --cacert=$ETCD_CACERT

# Defragment (reclaim space)
ETCDCTL_API=3 etcdctl defrag \
  --endpoints=$ETCD_ENDPOINT \
  --cert=$ETCD_CERT \
  --key=$ETCD_KEY \
  --cacert=$ETCD_CACERT
```

## Backup to S3

```bash
#!/bin/bash
set -e

FILENAME="etcd-$(date +%Y%m%d-%H%M%S).db"
BACKUP_DIR="/tmp/etcd-backup"

mkdir -p "$BACKUP_DIR"

ETCDCTL_API=3 etcdctl snapshot save "$BACKUP_DIR/$FILENAME" \
  --endpoints=https://127.0.0.1:2379 \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt

gzip "$BACKUP_DIR/$FILENAME"

aws s3 cp "$BACKUP_DIR/$FILENAME.gz" "s3://my-backups/etcd/$FILENAME.gz"

rm -f "$BACKUP_DIR/$FILENAME.gz"
echo "Uploaded $FILENAME.gz to S3"
```

## Disaster Recovery Checklist

| Step | Action |
|---|---|
| 1 | Stop kube-apiserver and etcd |
| 2 | Restore snapshot to new data directory |
| 3 | Replace etcd data directory |
| 4 | Start etcd, then kube-apiserver |
| 5 | Verify `kubectl get nodes` |
| 6 | Verify `kubectl get pods -A` |
| 7 | Check application health |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes cluster management and operations. **Docker Fundamentals** teaches container orchestration basics. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

