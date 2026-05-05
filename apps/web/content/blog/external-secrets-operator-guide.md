---
title: "External Secrets Operator Guide"
date: "2026-02-22"
description: "External Secrets Operator syncs secrets from AWS Secrets Manager, HashiCorp Vault, and Azure Key Vault into Kubernetes Secrets. Learn how to stop committing secrets to Git."
category: "DevOps"
tags: ["external-secrets", "kubernetes", "secrets-management", "Vault", "AWS", "gitops"]
author: "Luca Berton"
---

GitOps says everything in Git. Secrets say otherwise. External Secrets Operator bridges the gap: secret definitions live in Git, actual values live in your secrets manager.

## The Problem

```yaml
# This is what you want in Git:
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
data:
  password: cGFzc3dvcmQxMjM=  # ← Base64 is not encryption
```

Sealed Secrets encrypts them. External Secrets takes a different approach: store nothing sensitive in Git. Reference secrets by name, fetch values at runtime.

## Installation

```bash
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets --create-namespace
```

## Connect to a Secret Store

### AWS Secrets Manager

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: eu-west-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

### HashiCorp Vault

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault
spec:
  provider:
    vault:
      server: https://vault.myorg.com
      path: secret
      version: v2
      auth:
        kubernetes:
          mountPath: kubernetes
          role: external-secrets
```

### Azure Key Vault

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: azure-kv
spec:
  provider:
    azurekv:
      tenantId: "your-tenant-id"
      vaultUrl: "https://myorg-kv.vault.azure.net"
      authType: WorkloadIdentity
      serviceAccountRef:
        name: external-secrets-sa
```

## Create an External Secret

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: ClusterSecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: production/database
        property: username
    - secretKey: password
      remoteRef:
        key: production/database
        property: password
```

The operator creates a standard Kubernetes Secret named `db-credentials` with values fetched from AWS Secrets Manager. Pods consume it normally:

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: password
```

## What Lives in Git vs What Does Not

```
In Git (ExternalSecret YAML):          In AWS/Vault (actual values):
  - Secret name: db-credentials          - username: app_user
  - Source: production/database           - password: s3cur3-p@ssw0rd
  - Refresh: every 1 hour                - host: db.internal.myorg.com
  - Target namespace: production
```

Git contains the reference. The secrets manager contains the value.

## Secret Rotation

```yaml
spec:
  refreshInterval: 15m  # Check for updates every 15 minutes
```

Rotate the secret in AWS Secrets Manager → External Secrets Operator picks up the new value within 15 minutes → Kubernetes Secret is updated → pods restart (if configured).

For zero-downtime rotation, combine with the Reloader controller:

```yaml
metadata:
  annotations:
    reloader.stakater.com/auto: "true"
```

## Template Secrets

Generate complex secret formats:

```yaml
spec:
  target:
    name: db-connection
    template:
      engineVersion: v2
      data:
        connection_string: "postgresql://{{ .username }}:{{ .password }}@{{ .host }}:5432/{{ .database }}"
  data:
    - secretKey: username
      remoteRef:
        key: production/database
        property: username
    - secretKey: password
      remoteRef:
        key: production/database
        property: password
    - secretKey: host
      remoteRef:
        key: production/database
        property: host
    - secretKey: database
      remoteRef:
        key: production/database
        property: database
```

The resulting Kubernetes Secret contains a fully-formed connection string.

## Multi-Source Secrets

Pull from different secret stores into one Kubernetes Secret:

```yaml
spec:
  data:
    - secretKey: db-password
      remoteRef:
        key: production/database
        property: password
      sourceRef:
        storeRef:
          name: aws-secrets
          kind: ClusterSecretStore
    - secretKey: api-key
      remoteRef:
        key: secret/data/api-keys
        property: stripe
      sourceRef:
        storeRef:
          name: vault
          kind: ClusterSecretStore
```

## External Secrets vs Alternatives

| Feature | External Secrets | Sealed Secrets | Vault Agent |
|---------|-----------------|---------------|-------------|
| Secret in Git | Reference only | Encrypted blob | No |
| Secret store | Any (AWS, Vault, Azure, GCP) | Cluster-only | Vault only |
| Rotation | Automatic | Manual re-encrypt | Automatic |
| Complexity | Medium | Low | High |
| GitOps compatible | Yes | Yes | Partial |

**Use External Secrets** when you already have a secrets manager and want GitOps. **Use Sealed Secrets** for simpler setups without an external secrets manager.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).
