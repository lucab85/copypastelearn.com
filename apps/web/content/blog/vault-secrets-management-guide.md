---
title: "Vault Secrets Management Guide"
slug: "vault-secrets-management-guide"
date: "2026-02-16"
category: "DevOps"
tags: ["Vault", "Secrets", "Security", "HashiCorp", "DevOps"]
excerpt: "Manage secrets with HashiCorp Vault. KV engine, dynamic secrets, authentication methods, policies, and Kubernetes integration."
description: "Manage secrets securely with HashiCorp Vault. KV secrets engine, dynamic database credentials, authentication methods, policies, and native Kubernetes integration patterns."
---

Hardcoded secrets in code, environment variables on sticky notes, shared passwords in Slack. Vault solves all of this with centralized, audited secrets management.

## Quick Start

```bash
# Docker (dev mode)
docker run -d --name vault -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=dev-token \
  hashicorp/vault:latest

export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='dev-token'
```

## KV Secrets Engine

### Version 2 (Versioned)

```bash
# Enable KV v2
vault secrets enable -version=2 kv

# Write a secret
vault kv put kv/production/database \
  username=appuser \
  password='S3cur3P@ss!' \
  host=db.internal:5432

# Read a secret
vault kv get kv/production/database
vault kv get -field=password kv/production/database

# List secrets
vault kv list kv/production/

# Version history
vault kv get -version=1 kv/production/database

# Delete (soft)
vault kv delete kv/production/database

# Undelete
vault kv undelete -versions=2 kv/production/database

# Destroy (permanent)
vault kv destroy -versions=1,2 kv/production/database
```

## Dynamic Secrets

Vault generates short-lived credentials on demand. No shared passwords.

### PostgreSQL

```bash
# Enable database engine
vault secrets enable database

# Configure connection
vault write database/config/production \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@db.internal:5432/myapp" \
  allowed_roles="readonly,readwrite" \
  username="vault_admin" \
  password="admin_password"

# Create a role
vault write database/roles/readonly \
  db_name=production \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Generate credentials (unique per request!)
vault read database/creds/readonly
# username: v-token-readonly-abc123
# password: A1-random-generated-password
# lease_duration: 1h
```

After 1 hour, Vault automatically revokes the credentials and drops the database user.

### AWS

```bash
vault secrets enable aws

vault write aws/config/root \
  access_key=AKIA... \
  secret_key=...

vault write aws/roles/deploy \
  credential_type=iam_user \
  policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:*", "ec2:Describe*"],
    "Resource": "*"
  }]
}
EOF

# Generate temporary AWS credentials
vault read aws/creds/deploy
```

## Authentication Methods

### AppRole (for Applications)

```bash
vault auth enable approle

vault write auth/approle/role/my-app \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=10m \
  policies=my-app-policy

# Get role ID (baked into app config)
vault read auth/approle/role/my-app/role-id

# Generate secret ID (injected at deploy time)
vault write -f auth/approle/role/my-app/secret-id

# Application authenticates
vault write auth/approle/login \
  role_id=abc-123 \
  secret_id=def-456
```

### Kubernetes

```bash
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt

vault write auth/kubernetes/role/my-app \
  bound_service_account_names=my-app-sa \
  bound_service_account_namespaces=production \
  policies=my-app-policy \
  ttl=1h
```

## Policies

```hcl
# my-app-policy.hcl
# Read production secrets
path "kv/data/production/*" {
  capabilities = ["read"]
}

# Generate database credentials
path "database/creds/readonly" {
  capabilities = ["read"]
}

# No access to other environments
path "kv/data/staging/*" {
  capabilities = ["deny"]
}
```

```bash
vault policy write my-app my-app-policy.hcl
```

## Kubernetes Integration

### Vault Agent Sidecar

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "my-app"
        vault.hashicorp.com/agent-inject-secret-db: "kv/data/production/database"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "kv/data/production/database" -}}
          DATABASE_URL=postgresql://{{ .Data.data.username }}:{{ .Data.data.password }}@{{ .Data.data.host }}/myapp
          {{- end }}
    spec:
      serviceAccountName: my-app-sa
      containers:
        - name: app
          image: my-app
          command: ["sh", "-c", "source /vault/secrets/db && node server.js"]
```

Vault Agent:
1. Authenticates with Vault using the K8s service account
2. Fetches secrets
3. Renders templates to `/vault/secrets/`
4. Automatically refreshes when secrets rotate

## Application Integration

```typescript
import Vault from 'node-vault';

const vault = Vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getDatabaseUrl() {
  const { data } = await vault.read('kv/data/production/database');
  const { username, password, host } = data.data;
  return `postgresql://${username}:${password}@${host}/myapp`;
}

// Or with dynamic credentials
async function getDynamicDbCreds() {
  const { data } = await vault.read('database/creds/readonly');
  return {
    username: data.username,
    password: data.password,
    leaseDuration: data.lease_duration,
  };
}
```

## Audit Logging

```bash
vault audit enable file file_path=/var/log/vault-audit.log

# Every secret access is logged:
# Who accessed what, when, from where
```

## What's Next?

Our **Terraform for Beginners** course covers Vault integration for infrastructure secrets. **SELinux for System Admins** teaches OS-level access controls. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

