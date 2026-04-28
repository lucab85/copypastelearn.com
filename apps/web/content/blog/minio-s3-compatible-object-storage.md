---
title: "Minio S3 Compatible Object Storage"
date: "2026-02-21"
description: "MinIO provides S3-compatible object storage you can self-host anywhere. Learn how to deploy MinIO on Kubernetes for backups, artifacts, ML datasets, and replacing cloud storage dependencies."
category: "DevOps"
tags: ["minio", "object-storage", "s3", "kubernetes", "self-hosted", "storage"]
---

Every DevOps tool needs object storage. Terraform state, container images, backups, ML datasets, log archives — they all want an S3-compatible API. MinIO gives you that API anywhere: on Kubernetes, on bare metal, or on your laptop.

## Quick Start

```bash
# Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=changeme123 \
  minio/minio server /data --console-address ":9001"
```

Console at `http://localhost:9001`. API at `http://localhost:9000`. Full S3 compatibility.

## Kubernetes Deployment

```bash
helm install minio minio/minio \
  --namespace minio --create-namespace \
  --set replicas=4 \
  --set persistence.size=100Gi \
  --set resources.requests.memory=1Gi
```

Four replicas with erasure coding: lose one node and data is still available.

## Using the mc CLI

```bash
# Configure alias
mc alias set myminio http://minio.myminio:9000 admin changeme123

# Create bucket
mc mb myminio/backups

# Upload files
mc cp backup.tar.gz myminio/backups/

# List contents
mc ls myminio/backups/

# Mirror a directory (sync)
mc mirror ./artifacts myminio/ci-artifacts/
```

## S3 API Compatibility

Any tool that speaks S3 works with MinIO. Just change the endpoint:

### Terraform Backend

```hcl
terraform {
  backend "s3" {
    bucket   = "terraform-state"
    key      = "production/terraform.tfstate"
    endpoint = "http://minio.internal:9000"
    region   = "us-east-1"

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true

    access_key = "admin"
    secret_key = "changeme123"
  }
}
```

### Velero Backups

```bash
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket velero-backups \
  --secret-file ./minio-credentials \
  --backup-location-config \
    region=us-east-1,s3ForcePathStyle=true,s3Url=http://minio.internal:9000
```

### Loki Log Storage

```yaml
# Loki config
storage_config:
  aws:
    s3: http://admin:changeme123@minio.internal:9000/loki-logs
    s3forcepathstyle: true
```

### MLflow Artifact Store

```bash
export MLFLOW_S3_ENDPOINT_URL=http://minio.internal:9000
export AWS_ACCESS_KEY_ID=admin
export AWS_SECRET_ACCESS_KEY=changeme123

mlflow server --artifacts-destination s3://mlflow-artifacts/
```

## Bucket Policies

```bash
# Public read access
mc anonymous set download myminio/public-assets

# Bucket-level policy
mc admin policy create myminio ci-upload ci-policy.json
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": ["arn:aws:s3:::ci-artifacts/*"]
    }
  ]
}
```

## Lifecycle Rules

```bash
# Delete objects older than 30 days
mc ilm rule add myminio/ci-artifacts \
  --expiry-days 30

# Move to cold storage after 7 days (tiering)
mc ilm rule add myminio/logs \
  --transition-days 7 \
  --storage-class COLD
```

## Replication

Mirror data between MinIO clusters:

```bash
# Setup replication from primary to DR site
mc admin bucket remote add myminio/backups \
  http://admin:changeme123@dr-minio.internal:9000/backups \
  --service replication

mc replicate add myminio/backups
```

Every object written to the primary is replicated to the DR site.

## MinIO vs Cloud Object Storage

| Feature | MinIO | AWS S3 | GCS |
|---------|-------|--------|-----|
| Self-hosted | Yes | No | No |
| S3 compatible | Native | Native | Interop |
| Cost | Hardware only | Per-GB + requests | Per-GB + requests |
| Data sovereignty | Full control | Region-locked | Region-locked |
| Performance | Very fast (local) | Network-dependent | Network-dependent |
| Vendor lock-in | None | High | High |

**Use MinIO** for on-premises storage, air-gapped environments, development, and avoiding cloud storage costs. **Use S3/GCS** when you need global availability, managed service, and do not control hardware.

---

Ready to go deeper? Master infrastructure and storage with hands-on courses at [CopyPasteLearn](/courses).
