---
title: "Sops Encrypted Secrets in Git"
date: "2026-02-12"
description: "SOPS encrypts secret values in YAML, JSON, and dotenv files while keeping keys readable. Learn how to use SOPS with age, AWS KMS, or GCP KMS for GitOps-friendly secret management."
category: "DevOps"
tags: ["sops", "secrets", "encryption", "gitops", "security", "devops"]
---

You need secrets in Git for GitOps. But plaintext secrets in Git are a breach waiting to happen. SOPS encrypts only the values, leaving the keys readable — so you can review diffs, grep for key names, and still keep values secret.

## How SOPS Works

```yaml
# Before encryption (plaintext)
database:
  host: db.internal.myorg.com
  username: app_user
  password: s3cur3-p@ssw0rd
  port: 5432

# After encryption (SOPS)
database:
  host: ENC[AES256_GCM,data:abc123...,type:str]
  username: ENC[AES256_GCM,data:def456...,type:str]
  password: ENC[AES256_GCM,data:ghi789...,type:str]
  port: 5432  # integers not encrypted by default
```

Keys stay readable. Values are encrypted. You can see the structure without seeing the secrets.

## Setup with age

age is the simplest key management option:

```bash
# Install
brew install sops age

# Generate a key pair
age-keygen -o ~/.sops/age-key.txt
# Public key: age1abc123...

# Create .sops.yaml config
cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: .*\.enc\.yaml$
    age: age1abc123...
EOF
```

## Encrypt and Decrypt

```bash
# Encrypt a file
sops encrypt secrets.yaml > secrets.enc.yaml

# Decrypt
sops decrypt secrets.enc.yaml > secrets.yaml

# Edit encrypted file in-place (opens $EDITOR)
sops secrets.enc.yaml
```

When you run `sops secrets.enc.yaml`, it decrypts to a temp file, opens your editor, and re-encrypts on save.

## AWS KMS

```yaml
# .sops.yaml
creation_rules:
  - path_regex: production/.*\.enc\.yaml$
    kms: arn:aws:kms:eu-west-1:123456789:key/abc-def-123
  - path_regex: staging/.*\.enc\.yaml$
    kms: arn:aws:kms:eu-west-1:123456789:key/xyz-789-456
```

Different KMS keys for different environments. Production secrets can only be decrypted by production IAM roles.

## Multiple Recipients

```yaml
creation_rules:
  - path_regex: .*\.enc\.yaml$
    age: >-
      age1alice...,
      age1bob...,
      age1ci-server...
```

Alice, Bob, and the CI server can all decrypt. Remove someone's key and re-encrypt to revoke access.

## Git Diff

```diff
# Normal git diff shows meaningful changes:
 database:
-  host: ENC[AES256_GCM,data:old_encrypted_host...]
+  host: ENC[AES256_GCM,data:new_encrypted_host...]
   username: ENC[AES256_GCM,data:unchanged...]
+  replica_host: ENC[AES256_GCM,data:new_field...]
```

You can see that `host` changed and `replica_host` was added — without seeing the values.

## Kubernetes Integration

### Flux + SOPS

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: app-secrets
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age-key
```

Flux decrypts SOPS files during reconciliation. Encrypted secrets in Git, decrypted in cluster.

### Helm + SOPS

```bash
# Encrypt Helm values
sops encrypt values-secret.yaml > values-secret.enc.yaml

# Use helm-secrets plugin
helm secrets install myapp ./chart \
  -f values.yaml \
  -f values-secret.enc.yaml
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Decrypt secrets
  run: |
    sops decrypt secrets.enc.yaml > secrets.yaml
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
```

Store the age private key (or AWS/GCP credentials) in CI secrets. SOPS decrypts during the pipeline.

## .sops.yaml Patterns

```yaml
creation_rules:
  # Encrypt everything except 'metadata' and 'kind'
  - path_regex: k8s/.*\.enc\.yaml$
    encrypted_regex: "^(data|stringData)$"
    age: age1abc...

  # Only encrypt specific keys in app config
  - path_regex: config/.*\.enc\.yaml$
    encrypted_regex: "^(password|secret|token|key)$"
    age: age1abc...
```

## SOPS vs Alternatives

| Feature | SOPS | Sealed Secrets | Vault | git-crypt |
|---------|------|---------------|-------|-----------|
| Encrypted in Git | Yes | Yes | No | Yes |
| Key management | age/KMS | Cluster key | Vault server | GPG |
| Partial encryption | Values only | Whole secret | N/A | Whole file |
| Diff-friendly | Yes | No | N/A | No |
| Kubernetes native | Via Flux | Yes | Via agent | No |
| Multi-cloud KMS | Yes | No | Yes | No |

**Use SOPS** for GitOps workflows where you want encrypted secrets in Git with readable diffs. **Use External Secrets** when you have a central secrets manager. **Use Sealed Secrets** for the simplest Kubernetes-only approach.

---

Ready to go deeper? Master secrets management with hands-on courses at [CopyPasteLearn](/courses).
