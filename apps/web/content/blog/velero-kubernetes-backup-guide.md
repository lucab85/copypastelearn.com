---
title: "Velero Kubernetes Backup Guide"
date: "2026-03-27"
description: "Velero backs up and restores Kubernetes resources and persistent volumes. Learn how to set up Velero, schedule backups, and recover from cluster disasters."
category: "DevOps"
tags: ["velero", "kubernetes", "backup", "disaster-recovery", "persistent-volumes", "storage"]
---

Kubernetes is declarative until your etcd fails and you realize your manifests were not all in Git. Velero backs up cluster state and persistent volume data so you can recover from disasters.

## What Velero Backs Up

- **Kubernetes resources** — deployments, services, configmaps, secrets, CRDs
- **Persistent volumes** — actual data on PVCs via volume snapshots
- **Namespace-scoped or cluster-scoped** — back up specific namespaces or everything

## Installation

```bash
# Install Velero CLI
brew install velero

# Install Velero in cluster with AWS S3 backend
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.9 \
  --bucket my-velero-backups \
  --backup-location-config region=eu-west-1 \
  --snapshot-location-config region=eu-west-1 \
  --secret-file ./credentials-velero
```

Velero stores backups in object storage (S3, GCS, Azure Blob). Volume snapshots use your cloud provider's snapshot API.

## Manual Backup

```bash
# Back up everything
velero backup create full-backup

# Back up a specific namespace
velero backup create prod-backup \
  --include-namespaces production

# Back up specific resources
velero backup create secrets-backup \
  --include-resources secrets \
  --include-namespaces production

# Check backup status
velero backup describe full-backup
velero backup logs full-backup
```

## Scheduled Backups

```bash
# Daily backup at 2 AM, retain for 30 days
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h \
  --include-namespaces production,staging

# Hourly backup of critical namespace
velero schedule create critical-hourly \
  --schedule="0 * * * *" \
  --ttl 168h \
  --include-namespaces payments
```

Or as a Kubernetes resource:

```yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-production
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
      - production
    ttl: 720h0m0s
    storageLocation: default
    volumeSnapshotLocations:
      - default
```

## Restore

```bash
# Restore everything from a backup
velero restore create --from-backup full-backup

# Restore to a different namespace
velero restore create --from-backup prod-backup \
  --namespace-mappings production:production-restored

# Restore only specific resources
velero restore create --from-backup prod-backup \
  --include-resources deployments,services

# Check restore status
velero restore describe <restore-name>
```

## Disaster Recovery Scenarios

### Namespace Deletion

Someone ran `kubectl delete namespace production`:

```bash
velero restore create prod-recovery \
  --from-backup daily-backup \
  --include-namespaces production
```

### Cluster Migration

Move workloads to a new cluster:

```bash
# On the old cluster: create backup
velero backup create migration-backup

# On the new cluster: install Velero with the same storage backend
velero install --provider aws --bucket my-velero-backups ...

# Restore
velero restore create --from-backup migration-backup
```

### Persistent Volume Recovery

If a PVC's data is corrupted:

```bash
# Delete the corrupted PVC
kubectl delete pvc data-volume -n production

# Restore just that PVC from backup
velero restore create pvc-recovery \
  --from-backup daily-backup \
  --include-resources persistentvolumeclaims \
  --include-namespaces production \
  --selector app=my-database
```

## Best Practices

1. **Test restores regularly** — a backup you have never restored is not a backup
2. **Back up to a different region** — protect against regional outages
3. **Include resource quotas and RBAC** — cluster-scoped resources are easy to forget
4. **Monitor backup success** — alert on failed backups
5. **Document restore procedures** — the person restoring may not be the person who set it up

```bash
# Quick restore test: restore to a test namespace
velero restore create test-restore \
  --from-backup daily-backup \
  --namespace-mappings production:restore-test

# Verify, then clean up
kubectl delete namespace restore-test
```

---

Ready to go deeper? Master Kubernetes operations with hands-on courses at [CopyPasteLearn](/courses).
