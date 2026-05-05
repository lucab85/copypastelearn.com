---
title: "Boundary Zero Trust Access Manager"
date: "2026-01-31"
description: "HashiCorp Boundary provides identity-based access to infrastructure without VPNs or SSH keys. Learn how Boundary replaces bastion hosts and VPNs with just-in-time, audited access to databases and servers."
category: "DevOps"
tags: ["boundary", "zero-trust", "hashicorp", "access-management", "Security", "SSH"]
author: "Luca Berton"
---

Bastion hosts are shared. VPN access is all-or-nothing. SSH keys are hard to rotate. Boundary gives each user identity-based, just-in-time access to specific targets — with full session recording.

## How Boundary Works

```
User → Authenticate (OIDC/LDAP) → Request Access → Boundary Proxy → Target
                                                         ↓
                                                   Session Recorded
```

No VPN. No bastion. No SSH keys distributed to users. Boundary creates a temporary, authenticated tunnel to the target.

## Installation

```bash
# Install Boundary
brew install hashicorp/tap/boundary

# Start dev server
boundary dev

# Or production on Kubernetes
helm install boundary hashicorp/boundary \
  --namespace boundary --create-namespace
```

## Core Concepts

```
Organization → Project → Host Catalog → Host Set → Target
                              ↓
                         Credential Store → Credential Library
```

- **Organization**: Top-level tenant
- **Project**: Group of related resources
- **Host Catalog**: Where targets live (static IPs, AWS, Azure)
- **Target**: A specific resource (database, server, K8s cluster)
- **Credential Store**: Where credentials come from (Vault)

## Connect to a Database

### Define the Target

```bash
# Create a target for the production database
boundary targets create tcp \
  -name "prod-postgres" \
  -scope-id p_project123 \
  -default-port 5432 \
  -session-max-seconds 3600

# Add the host
boundary hosts create static \
  -name "prod-db" \
  -address "10.0.1.50" \
  -host-catalog-id hcst_catalog123

boundary host-sets add-hosts \
  -id hsst_hostset123 \
  -host hst_host123
```

### Connect

```bash
# User authenticates and connects
boundary connect postgres \
  -target-id ttcp_target123 \
  -dbname orders

# Boundary creates a local proxy
# psql connects through it
# Session is recorded and auditable
```

The user never sees the database IP, credentials, or network path.

## Dynamic Credentials with Vault

```bash
# Link Boundary to Vault
boundary credential-stores create vault \
  -scope-id p_project123 \
  -vault-address https://vault.myorg.com \
  -vault-token <token>

# Create credential library
boundary credential-libraries create vault-generic \
  -credential-store-id csvlt_store123 \
  -vault-path "database/creds/readonly" \
  -credential-type username_password
```

When a user connects:
1. Boundary requests temporary credentials from Vault
2. Vault generates a short-lived database user
3. User connects with temporary credentials
4. Credentials expire after the session

No standing credentials. No shared passwords.

## SSH Access

```bash
# Connect to a server via SSH
boundary connect ssh \
  -target-id ttcp_ssh_target \
  -username ubuntu

# Or with injected credentials (from Vault)
boundary connect ssh \
  -target-id ttcp_ssh_target
  # Boundary injects SSH key automatically
```

No SSH keys on the user's laptop. No `authorized_keys` to manage. Boundary handles it.

## Session Recording

```bash
# List recorded sessions
boundary sessions list -scope-id p_project123

# Session details
boundary sessions read -id s_session123
# User: alice@myorg.com
# Target: prod-postgres
# Duration: 23 minutes
# Bytes transferred: 1.2 MB
# Connection time: 2026-02-01T14:30:00Z
```

Every connection is logged: who, what, when, how long. Compliance teams can audit access without reviewing firewall logs.

## Dynamic Host Catalogs

Auto-discover targets from cloud providers:

```bash
# AWS EC2 discovery
boundary host-catalogs create plugin \
  -scope-id p_project123 \
  -plugin-name aws \
  -attr region=eu-west-1 \
  -secret access_key_id=$AWS_ACCESS_KEY \
  -secret secret_access_key=$AWS_SECRET_KEY

# Filter to specific instances
boundary host-sets create plugin \
  -host-catalog-id hcplg_catalog123 \
  -attr "filters=tag:Environment=production"
```

New EC2 instances with the `production` tag are automatically available as Boundary targets.

## Boundary vs Alternatives

| Feature | Boundary | Teleport | Bastion Host | VPN |
|---------|---------|----------|-------------|-----|
| Identity-based | Yes | Yes | No | No |
| Session recording | Yes | Yes | Manual | No |
| Dynamic credentials | Yes (Vault) | Limited | No | No |
| No VPN needed | Yes | Yes | No | N/A |
| Cloud discovery | Yes | Yes | No | No |
| Credential injection | Yes | SSH certs | SSH keys | N/A |
| Audit trail | Built-in | Built-in | Logs | Logs |

**Use Boundary** when you need Vault integration and dynamic credentials. **Use Teleport** for simpler setups with built-in certificate authority. Both are better than bastion hosts and VPNs.

---

Ready to go deeper? Master infrastructure security with hands-on courses at [CopyPasteLearn](/courses).
