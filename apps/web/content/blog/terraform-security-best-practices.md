---
title: "Terraform Security Best Practices for Production"
description: "Secure your Terraform workflows — manage secrets, control access, encrypt state, and implement policy-as-code for safe infrastructure deployments."
date: "2026-02-21"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "Security", "Production"]
---

## Why Terraform Security Matters

Terraform manages your infrastructure — it has the keys to your kingdom. A misconfigured Terraform setup can expose secrets, create insecure resources, or grant excessive permissions.

## Secret Management

### Never hardcode secrets

```hcl
# BAD — secret in code
resource "aws_db_instance" "main" {
  password = "super-secret-password"
}

# GOOD — use variables
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}
```

### Use environment variables

```bash
export TF_VAR_db_password="your-secret"
terraform apply
```

### Use a secrets manager

```hcl
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/db-password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db.secret_string
}
```

## State Security

State files contain all resource data, including secrets:

1. **Encrypt state at rest** — enable S3 bucket encryption
2. **Encrypt in transit** — use HTTPS for remote backends
3. **Restrict access** — IAM policies on state bucket
4. **Enable versioning** — recover from state corruption

```hcl
terraform {
  backend "s3" {
    bucket  = "my-state"
    key     = "prod/terraform.tfstate"
    encrypt = true
  }
}
```

## Least Privilege IAM

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "eu-west-1"
        }
      }
    }
  ]
}
```

## Pre-Commit Checks

```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_checkov
```

## Security Checklist

1. No secrets in code or state
2. Remote state encrypted with restricted access
3. Least-privilege IAM for Terraform
4. `terraform plan` review before every apply
5. Pre-commit hooks for validation
6. Audit trail via version control
7. Separate state per environment

## Learn More

Implement production security practices in our [Terraform for Beginners course](/courses).
