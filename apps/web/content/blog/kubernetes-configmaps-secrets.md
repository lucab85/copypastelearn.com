---
title: "Kubernetes ConfigMaps and Secrets"
slug: "kubernetes-configmaps-secrets"
date: "2026-02-22"
category: "DevOps"
tags: ["Kubernetes", "ConfigMap", "Secrets", "DevOps", "Configuration"]
excerpt: "Manage configuration in Kubernetes with ConfigMaps and Secrets. Environment variables, volume mounts, and external secrets operators."
description: "Manage Kubernetes configuration with ConfigMaps and Secrets. Env vars, volume mounts, and external secrets."
---

Kubernetes separates configuration from container images using ConfigMaps (non-sensitive) and Secrets (sensitive). Change config without rebuilding images.

## ConfigMaps

### Create from Literal Values

```bash
kubectl create configmap app-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3000 \
  --from-literal=LOG_LEVEL=info
```

### Create from YAML

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  config.json: |
    {
      "features": {
        "darkMode": true,
        "betaFeatures": false
      },
      "cache": {
        "ttl": 3600
      }
    }
```

### Create from File

```bash
kubectl create configmap nginx-config --from-file=nginx.conf
kubectl create configmap app-config --from-env-file=.env.production
```

### Use as Environment Variables

```yaml
spec:
  containers:
    - name: app
      image: my-app
      # All keys as env vars
      envFrom:
        - configMapRef:
            name: app-config
      # Or specific keys
      env:
        - name: APP_PORT
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: PORT
```

### Use as Volume Mount

```yaml
spec:
  containers:
    - name: app
      volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
  volumes:
    - name: config
      configMap:
        name: app-config
        items:
          - key: config.json
            path: config.json
```

The file `/app/config/config.json` contains the ConfigMap data. When you update the ConfigMap, the file updates automatically (within ~1 minute).

## Secrets

### Create

```bash
# From literals
kubectl create secret generic db-credentials \
  --from-literal=username=appuser \
  --from-literal=password='S3cur3P@ss!'

# From file (e.g., TLS certificate)
kubectl create secret tls app-tls \
  --cert=tls.crt \
  --key=tls.key
```

### YAML (base64 encoded)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YXBwdXNlcg==          # echo -n "appuser" | base64
  password: UzNjdXIzUEBzcyE=     # echo -n "S3cur3P@ss!" | base64
```

Or use `stringData` (auto-encoded):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  username: appuser
  password: "S3cur3P@ss!"
  DATABASE_URL: "postgresql://appuser:S3cur3P@ss!@db:5432/myapp"
```

### Use in Pods

```yaml
spec:
  containers:
    - name: app
      envFrom:
        - secretRef:
            name: db-credentials
      # Or specific keys
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
      # Or as files
      volumeMounts:
        - name: secrets
          mountPath: /app/secrets
          readOnly: true
  volumes:
    - name: secrets
      secret:
        secretName: db-credentials
```

## Sealed Secrets (Git-Safe)

Regular Secrets are base64 (not encrypted). Use Sealed Secrets for GitOps:

```bash
# Install kubeseal
brew install kubeseal

# Seal a secret (encrypted with cluster's public key)
kubectl create secret generic db-creds \
  --from-literal=password=S3cur3 \
  --dry-run=client -o yaml | \
  kubeseal --format yaml > sealed-secret.yaml
```

```yaml
# sealed-secret.yaml (safe to commit to Git)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-creds
spec:
  encryptedData:
    password: AgBj7s8...encrypted...
```

Only the cluster can decrypt it.

## External Secrets Operator

Pull secrets from AWS Secrets Manager, Vault, etc.:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/app/database
    - secretKey: API_KEY
      remoteRef:
        key: production/app/api-key
```

Benefits:
- Secrets never stored in Git or etcd
- Automatic rotation
- Single source of truth (Vault/AWS SM)
- Audit trail

## ConfigMap vs Secret

| Feature | ConfigMap | Secret |
|---|---|---|
| Encoding | Plain text | Base64 |
| Encryption at rest | No | Optional (EncryptionConfiguration) |
| Size limit | 1 MB | 1 MB |
| Use for | App config, feature flags | Passwords, tokens, certificates |
| RBAC | Standard | Can restrict separately |

## Best Practices

- **Never commit Secrets YAML** to Git (use Sealed Secrets or External Secrets)
- **Use `envFrom`** for bulk env injection instead of individual `env` entries
- **Mount as read-only** volumes when using file mounts
- **Set RBAC** to restrict who can read Secrets
- **Enable encryption at rest** for etcd
- **Rotate secrets** regularly with External Secrets Operator
- **Use `immutable: true`** for ConfigMaps that never change (better performance)

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes configuration patterns for ML workloads. **Docker Fundamentals** builds the container foundation. First lessons are free.
