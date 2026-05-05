---
title: "Checkov Infrastructure as Code Scan"
date: "2026-02-17"
description: "Checkov scans Terraform, CloudFormation, Kubernetes, and Dockerfile for security misconfigurations with 1000+ built-in policies. Learn how to integrate Checkov into CI/CD and write custom checks."
category: "DevOps"
tags: ["checkov", "iac-security", "Terraform", "devsecops", "compliance", "scanning"]
author: "Luca Berton"
---

You wrote Terraform that works. Does it follow security best practices? Checkov has over 1000 built-in policies that check your infrastructure code before you apply it.

## Quick Start

```bash
pip install checkov

# Scan Terraform
checkov -d ./terraform/

# Results
Passed checks: 42
Failed checks: 8
Skipped checks: 2

Check: CKV_AWS_18: "Ensure S3 bucket has access logging enabled"
  FAILED for resource: aws_s3_bucket.data
  File: /main.tf:15-25
  Guide: https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/s3-policies/s3-13

Check: CKV_AWS_145: "Ensure S3 bucket is encrypted with KMS"
  FAILED for resource: aws_s3_bucket.data
  File: /main.tf:15-25
```

## What Checkov Scans

| Framework | File Types | Check Count |
|-----------|-----------|-------------|
| Terraform | `.tf`, `.tfvars` | 400+ |
| CloudFormation | `.yaml`, `.json`, `.template` | 300+ |
| Kubernetes | manifests, Helm | 100+ |
| Dockerfile | `Dockerfile` | 30+ |
| ARM templates | `.json` | 100+ |
| Serverless | `serverless.yml` | 20+ |
| GitHub Actions | `.github/workflows/*.yml` | 30+ |

## Common Terraform Failures

### S3 Bucket Security

```hcl
# ❌ Fails CKV_AWS_18, CKV_AWS_145, CKV_AWS_19
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

# ✅ Passes all checks
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.bucket.arn
    }
  }
}

resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "data-bucket/"
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

### RDS Security

```hcl
# ❌ Fails checks
resource "aws_db_instance" "main" {
  engine         = "postgres"
  instance_class = "db.t3.medium"
  publicly_accessible = true  # CKV_AWS_17
  storage_encrypted   = false # CKV_AWS_16
}

# ✅ Passes
resource "aws_db_instance" "main" {
  engine              = "postgres"
  instance_class      = "db.t3.medium"
  publicly_accessible = false
  storage_encrypted   = true
  deletion_protection = true
  backup_retention_period = 7
  multi_az            = true
}
```

## Kubernetes Checks

```bash
checkov -d ./k8s/

# Check: CKV_K8S_1: "Do not admit privileged containers"
# Check: CKV_K8S_20: "Containers should not run with allowPrivilegeEscalation"
# Check: CKV_K8S_22: "Use read-only filesystem for containers"
# Check: CKV_K8S_28: "Ensure resource limits are set"
# Check: CKV_K8S_40: "Do not allow containers to run as root"
```

## Dockerfile Checks

```bash
checkov -f Dockerfile

# Check: CKV_DOCKER_2: "Ensure HEALTHCHECK is added"
# Check: CKV_DOCKER_3: "Ensure USER is not root"
# Check: CKV_DOCKER_7: "Ensure base image uses a specific tag"
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkov scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          soft_fail: false
          output_format: sarif
          output_file_path: results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

## Custom Checks

```python
# custom_checks/s3_naming.py
from checkov.terraform.checks.resource.base_resource_check import BaseResourceCheck
from checkov.common.models.enums import CheckResult, CheckCategories

class S3NamingConvention(BaseResourceCheck):
    def __init__(self):
        name = "Ensure S3 bucket follows naming convention"
        id = "CKV_CUSTOM_1"
        supported_resources = ["aws_s3_bucket"]
        categories = [CheckCategories.CONVENTION]
        super().__init__(name=name, id=id,
                        categories=categories,
                        supported_resources=supported_resources)

    def scan_resource_conf(self, conf):
        bucket = conf.get("bucket", [""])[0]
        if bucket.startswith(("dev-", "staging-", "prod-")):
            return CheckResult.PASSED
        return CheckResult.FAILED

check = S3NamingConvention()
```

```bash
checkov -d ./terraform/ --external-checks-dir ./custom_checks/
```

## Skip Checks

```hcl
# Inline skip
resource "aws_s3_bucket" "public_assets" {
  #checkov:skip=CKV_AWS_18:Access logging not needed for public CDN assets
  bucket = "public-assets"
}
```

```bash
# CLI skip
checkov -d ./terraform/ --skip-check CKV_AWS_18,CKV_AWS_19
```

Always document why you skip a check.

---

Ready to go deeper? Master infrastructure security with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
