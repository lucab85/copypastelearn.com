---
title: "Terraform Backend Configuration"
slug: "terraform-backend-configuration"
date: "2026-01-11"
category: "DevOps"
tags: ["Terraform", "Backend", "S3", "State", "IaC"]
excerpt: "Configure Terraform remote backends. S3 with DynamoDB locking, Azure Blob, GCS, Terraform Cloud, and state migration strategies."
description: "Configure Terraform remote backends for team collaboration. S3 with DynamoDB locking, Azure Blob Storage, Google Cloud Storage, Terraform Cloud, and state migration steps."
---

The backend determines where Terraform stores state. Local files work for learning, but teams need remote backends for collaboration, locking, and disaster recovery.

## Why Remote Backends

| Feature | Local | Remote |
|---|---|---|
| Team collaboration | ❌ | ✅ |
| State locking | ❌ | ✅ |
| Encryption at rest | Manual | ✅ |
| Versioning/backup | Manual | ✅ |
| CI/CD friendly | ❌ | ✅ |

## S3 Backend (AWS)

The most common setup:

### Create Backend Infrastructure

```hcl
# bootstrap/main.tf — run this first, once
provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "state" {
  bucket = "myorg-terraform-state"
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "lock" {
  name         = "terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### Configure Backend

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "myorg-terraform-state"
    key            = "production/network/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}
```

### State Key Organization

```
s3://myorg-terraform-state/
  production/
    network/terraform.tfstate
    database/terraform.tfstate
    application/terraform.tfstate
  staging/
    network/terraform.tfstate
    database/terraform.tfstate
  shared/
    dns/terraform.tfstate
    iam/terraform.tfstate
```

## Azure Blob Backend

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "myorgterraformstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}
```

## GCS Backend (Google Cloud)

```hcl
terraform {
  backend "gcs" {
    bucket = "myorg-terraform-state"
    prefix = "production/network"
  }
}
```

## Terraform Cloud Backend

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "production-network"
    }
  }
}
```

Or with workspace tags:

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      tags = ["production", "network"]
    }
  }
}
```

## Partial Configuration

Keep secrets out of code:

```hcl
# backend.tf
terraform {
  backend "s3" {
    key = "production/terraform.tfstate"
  }
}
```

```bash
# Pass config at init time
terraform init \
  -backend-config="bucket=myorg-terraform-state" \
  -backend-config="region=eu-west-1" \
  -backend-config="dynamodb_table=terraform-lock"

# Or use a file
terraform init -backend-config=backend.hcl
```

```hcl
# backend.hcl (gitignored)
bucket         = "myorg-terraform-state"
region         = "eu-west-1"
dynamodb_table = "terraform-lock"
encrypt        = true
```

## State Locking

DynamoDB provides locking for S3 backend:

```bash
# Lock is acquired automatically during plan/apply
terraform plan
# Acquiring state lock...
# ...
# Releasing state lock...

# Force unlock (use with caution!)
terraform force-unlock LOCK_ID
```

## Migrating Backends

### Local → S3

```hcl
# 1. Add backend configuration
terraform {
  backend "s3" {
    bucket = "myorg-terraform-state"
    key    = "app/terraform.tfstate"
    region = "eu-west-1"
  }
}
```

```bash
# 2. Re-initialize
terraform init
# Terraform will ask: "Do you want to copy existing state to the new backend?"
# Answer: yes
```

### S3 → Terraform Cloud

```bash
# 1. Update backend config to cloud block
# 2. Run terraform init
terraform init
# Terraform detects backend change, offers to migrate
```

### Export/Import State

```bash
# Export
terraform state pull > state.json

# Import to new backend
terraform state push state.json
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Terraform Init
  run: terraform init -backend-config=backend.hcl
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

- name: Terraform Plan
  run: terraform plan -out=tfplan

- name: Terraform Apply
  if: github.ref == 'refs/heads/main'
  run: terraform apply tfplan
```

## Best Practices

| Practice | Why |
|---|---|
| Enable versioning on state bucket | Recover from corruption |
| Enable encryption | State contains secrets |
| Use DynamoDB locking | Prevent concurrent modifications |
| Block public access | State is sensitive |
| Use separate state per component | Limit blast radius |
| Use partial config for secrets | Keep creds out of code |
| Tag state resources | Know what manages them |

## What's Next?

Our **Terraform for Beginners** course covers remote backends, state management, and team workflows. First lesson is free.
