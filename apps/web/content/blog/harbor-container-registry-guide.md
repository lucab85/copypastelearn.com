---
title: "Harbor Container Registry Guide"
date: "2026-03-01"
description: "Harbor is an open-source container registry with vulnerability scanning, RBAC, image signing, and replication. Learn how to deploy Harbor on Kubernetes and replace Docker Hub for your organization."
category: "DevOps"
tags: ["harbor", "container-registry", "Docker", "kubernetes", "Security", "cncf"]
author: "Luca Berton"
---

Docker Hub rate limits pull requests. Cloud registries (ECR, GCR, ACR) create vendor lock-in. Harbor gives you a self-hosted, CNCF-graduated container registry with enterprise features.

## Installation

```bash
helm install harbor harbor/harbor \
  --namespace harbor --create-namespace \
  --set expose.type=ingress \
  --set expose.ingress.hosts.core=registry.myorg.com \
  --set expose.tls.certSource=secret \
  --set expose.tls.secret.secretName=harbor-tls \
  --set persistence.persistentVolumeClaim.registry.size=200Gi \
  --set externalURL=https://registry.myorg.com
```

## Push and Pull Images

```bash
# Login
docker login registry.myorg.com

# Tag and push
docker tag myapp:latest registry.myorg.com/myproject/myapp:v1.0
docker push registry.myorg.com/myproject/myapp:v1.0

# Pull
docker pull registry.myorg.com/myproject/myapp:v1.0
```

## Projects and RBAC

Harbor organizes images into projects with role-based access:

```
registry.myorg.com/
├── platform/          # Platform team images
│   ├── nginx-base
│   └── node-base
├── commerce/          # Commerce team images  
│   ├── order-api
│   └── payment-service
└── public/            # Public read access
    └── docs-site
```

| Role | Pull | Push | Manage |
|------|------|------|--------|
| Guest | ✓ | ✗ | ✗ |
| Developer | ✓ | ✓ | ✗ |
| Maintainer | ✓ | ✓ | Partial |
| Admin | ✓ | ✓ | ✓ |

## Vulnerability Scanning

Harbor integrates with Trivy for automatic scanning:

```
# Scan results for myapp:v1.0
Total: 3 vulnerabilities
  Critical: 0
  High: 1 (openssl 3.0.13 → fix: 3.0.14)
  Medium: 2
```

Configure policies to block vulnerable images:

```
Project Settings → Policy:
  ✓ Prevent vulnerable images from being pulled
  Severity threshold: High
```

Images with High or Critical CVEs cannot be pulled until the vulnerabilities are fixed.

## Image Signing

Verify image integrity with Cosign:

```bash
# Sign with Cosign
cosign sign registry.myorg.com/commerce/order-api:v1.0

# Harbor shows signature status in the UI
# ✓ Signed by: build@myorg.com
```

Combine with Kubernetes admission control to enforce only signed images run in production.

## Replication

Mirror images between registries:

```yaml
# Harbor replication rule
Source: docker.io/library/nginx
Destination: registry.myorg.com/mirrors/nginx
Trigger: Scheduled (every 6 hours)
Filter: Tag matching "1.2*"
```

Use cases:
- **Cache Docker Hub**: Avoid rate limits
- **Multi-region**: Replicate to registries in each region
- **Disaster recovery**: Replicate to a backup registry
- **Air-gapped environments**: Pull from Harbor instead of the internet

## Proxy Cache

Cache external registries without full replication:

```
# Configure Docker Hub as a proxy cache
Project: dockerhub-proxy
Type: Proxy Cache
Endpoint: https://hub.docker.com

# Pull through Harbor (cached)
docker pull registry.myorg.com/dockerhub-proxy/library/nginx:1.25
```

First pull fetches from Docker Hub. Subsequent pulls served from Harbor's cache.

## Garbage Collection

Clean up unreferenced blobs:

```bash
# Schedule garbage collection
# Harbor Admin → Garbage Collection → Schedule
# Weekly, Sunday at 2 AM
```

Without GC, deleted tags still consume storage. Schedule it regularly.

## Kubernetes Integration

```yaml
# Create image pull secret
kubectl create secret docker-registry harbor-creds \
  --docker-server=registry.myorg.com \
  --docker-username=robot-account \
  --docker-password=token

# Use in deployments
spec:
  imagePullSecrets:
    - name: harbor-creds
  containers:
    - image: registry.myorg.com/commerce/order-api:v1.0
```

For cluster-wide configuration, add the secret to a service account:

```bash
kubectl patch serviceaccount default \
  -p '{"imagePullSecrets": [{"name": "harbor-creds"}]}'
```

## Harbor vs Alternatives

| Feature | Harbor | Docker Hub | ECR | GHCR |
|---------|--------|-----------|-----|------|
| Self-hosted | Yes | No | No | No |
| Vulnerability scanning | Built-in (Trivy) | Paid | Basic | No |
| RBAC | Fine-grained | Basic | IAM | Org-level |
| Replication | Multi-target | No | Cross-region | No |
| Image signing | Cosign/Notary | Paid | Signer | Cosign |
| Cost | Infrastructure only | Per-seat | Per-GB + transfer | Free (public) |

---

Ready to go deeper? Master container infrastructure with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
