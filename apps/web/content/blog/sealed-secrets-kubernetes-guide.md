---
title: "Sealed Secrets Kubernetes Guide"
date: "2026-03-20"
description: "Sealed Secrets encrypts Kubernetes secrets so you can store them safely in Git. Learn how to install Sealed Secrets, encrypt secrets, and manage key rotation for GitOps workflows."
category: "DevOps"
tags: ["sealed-secrets", "kubernetes", "secrets", "gitops", "security", "encryption"]
---

Kubernetes Secrets are base64-encoded, not encrypted. Committing them to Git is a security incident waiting to happen. Sealed Secrets solves this: encrypt secrets client-side, store the encrypted version in Git, and only the cluster can decrypt them.

## How It Works

```
Developer → kubeseal (encrypt) → SealedSecret YAML → Git → Flux/ArgoCD → Cluster
                                                                              ↓
                                                            Sealed Secrets Controller
                                                                              ↓
                                                              Decrypted Kubernetes Secret
```

The controller runs in the cluster and holds the private key. `kubeseal` uses the public key to encrypt. Only the cluster can decrypt.

## Installation

```bash
# Install the controller
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system

# Install the CLI
brew install kubeseal
```

## Encrypting Secrets

```bash
# Create a regular secret (don't apply it!)
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=s3cur3-p4ss \
  --dry-run=client -o yaml > secret.yaml

# Encrypt it
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Delete the unencrypted file
rm secret.yaml
```

The sealed secret looks like this:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
    password: AgCtr7BJ6FDKMblrSP0v4yGHsA3lMnQ+...
```

This is safe to commit to Git. Without the cluster's private key, the values cannot be decrypted.

## GitOps Integration

Store sealed secrets alongside your manifests:

```
deploy/
├── production/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── sealed-secrets/
│       ├── db-credentials.yaml
│       └── api-keys.yaml
```

Flux or ArgoCD applies the SealedSecret. The controller decrypts it into a regular Secret. Your pods reference the Secret as normal:

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretRef:
        name: db-credentials
        key: password
```

## Scoping

Sealed Secrets supports three scopes:

### Strict (default)

Sealed to a specific name and namespace. Cannot be renamed or moved:

```bash
kubeseal --scope strict --format yaml < secret.yaml
```

### Namespace-Wide

Can be renamed within the same namespace:

```bash
kubeseal --scope namespace-wide --format yaml < secret.yaml
```

### Cluster-Wide

Can be used in any namespace with any name:

```bash
kubeseal --scope cluster-wide --format yaml < secret.yaml
```

Use strict scope unless you have a specific reason not to.

## Key Rotation

The controller generates a new key pair every 30 days by default. Old keys are retained for decryption. New secrets use the latest key.

```bash
# View current keys
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# Force key rotation
kubectl annotate secret -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key \
  sealedsecrets.bitnami.com/managed=true
```

To re-encrypt secrets with the latest key:

```bash
# Fetch the new public key
kubeseal --fetch-cert > pub-cert.pem

# Re-encrypt
kubeseal --cert pub-cert.pem --format yaml < secret.yaml > sealed-secret.yaml
```

## Backup the Private Key

If you lose the private key, all sealed secrets become undecryptable:

```bash
# Backup the key
kubectl get secret -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key \
  -o yaml > sealed-secrets-key-backup.yaml

# Store this backup securely (NOT in Git)
# Use a password manager, vault, or encrypted storage
```

## Alternatives

| Tool | Approach | GitOps-friendly |
|------|----------|-----------------|
| Sealed Secrets | Encrypt at rest in Git | Yes |
| SOPS + age | Encrypt files with age/PGP keys | Yes |
| External Secrets Operator | Sync from Vault/AWS SM/GCP SM | Yes |
| Vault Agent Injector | Inject secrets at runtime | Partial |

Sealed Secrets is the simplest option for teams that want encrypted secrets in Git. External Secrets Operator is better if you already use a central secret manager.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).
