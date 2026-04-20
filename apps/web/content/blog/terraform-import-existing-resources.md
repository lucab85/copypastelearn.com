---
title: "Terraform Import Existing Resources"
slug: "terraform-import-existing-resources"
date: "2026-01-19"
category: "DevOps"
tags: ["Terraform", "Import", "IaC", "Migration", "DevOps"]
excerpt: "Import existing infrastructure into Terraform. terraform import, import blocks, generated config, and migration strategies for brownfield environments."
description: "Import existing cloud infrastructure into Terraform management. Import blocks, auto-generated configuration, state manipulation, and incremental migration strategies for teams."
---

You have infrastructure created manually or with CloudFormation. Terraform import brings it under IaC management without recreating anything.

## terraform import (Classic)

```bash
# Write the resource block first
# main.tf
resource "aws_instance" "web" {
  # Will be filled in after import
}

# Import
terraform import aws_instance.web i-1234567890abcdef0

# Now run plan to see what needs to match
terraform plan
```

The plan shows drift between your config and the real resource. Update your `.tf` file until `plan` shows no changes.

## Import Blocks (Terraform 1.5+)

Declarative imports — better for teams:

```hcl
# imports.tf
import {
  to = aws_instance.web
  id = "i-1234567890abcdef0"
}

import {
  to = aws_security_group.web
  id = "sg-0123456789abcdef0"
}

import {
  to = aws_vpc.main
  id = "vpc-0123456789abcdef0"
}
```

```bash
# Generate config automatically (Terraform 1.5+)
terraform plan -generate-config-out=generated.tf

# Review generated.tf, clean it up, move to proper files
# Then run
terraform apply
```

After apply, remove the import blocks — they are one-time use.

## Generated Config Example

```bash
terraform plan -generate-config-out=generated.tf
```

Output in `generated.tf`:

```hcl
resource "aws_instance" "web" {
  ami                    = "ami-0c1c30571d2dae5c9"
  instance_type          = "t3.micro"
  key_name               = "my-key"
  subnet_id              = "subnet-abc123"
  vpc_security_group_ids = ["sg-def456"]

  tags = {
    Name = "web-server"
  }

  # ... many more attributes
}
```

Clean up:
1. Remove computed/read-only attributes
2. Replace hardcoded IDs with references or variables
3. Move to appropriate files

## Step-by-Step Migration

### 1. Inventory Existing Resources

```bash
# AWS
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,Tags]'
aws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier]'
aws s3 ls

# Or use terraformer (auto-generates tf + state)
terraformer import aws --resources=ec2_instance,s3 --regions=eu-west-1
```

### 2. Write Import Blocks

```hcl
# imports.tf
import {
  to = aws_vpc.main
  id = "vpc-abc123"
}

import {
  to = aws_subnet.public["eu-west-1a"]
  id = "subnet-def456"
}

import {
  to = aws_subnet.public["eu-west-1b"]
  id = "subnet-ghi789"
}

import {
  to = aws_db_instance.main
  id = "production-db"
}
```

### 3. Generate and Clean Config

```bash
terraform plan -generate-config-out=generated.tf
```

### 4. Refactor

```hcl
# Before (generated — hardcoded)
resource "aws_instance" "web" {
  ami           = "ami-0c1c30571d2dae5c9"
  subnet_id     = "subnet-def456"
  instance_type = "t3.micro"
}

# After (clean — using references and variables)
resource "aws_instance" "web" {
  ami           = var.ami_id
  subnet_id     = aws_subnet.public["eu-west-1a"].id
  instance_type = var.instance_type

  tags = {
    Name        = "${var.project}-web"
    Environment = var.environment
  }
}
```

### 5. Verify Zero Changes

```bash
terraform plan
# Should show: No changes. Your infrastructure matches the configuration.
```

## Import Common Resources

```hcl
# VPC
import { to = aws_vpc.main; id = "vpc-abc123" }

# Subnet
import { to = aws_subnet.web; id = "subnet-def456" }

# Security Group
import { to = aws_security_group.web; id = "sg-ghi789" }

# EC2 Instance
import { to = aws_instance.web; id = "i-jkl012" }

# RDS
import { to = aws_db_instance.main; id = "my-database" }

# S3 Bucket
import { to = aws_s3_bucket.data; id = "my-bucket-name" }

# IAM Role
import { to = aws_iam_role.app; id = "my-role-name" }

# Route53 Record
import { to = aws_route53_record.www; id = "Z1234_www.example.com_A" }

# ALB
import { to = aws_lb.main; id = "arn:aws:elasticloadbalancing:..." }
```

## Handling for_each Imports

```hcl
locals {
  subnets = {
    "eu-west-1a" = "subnet-abc123"
    "eu-west-1b" = "subnet-def456"
  }
}

import {
  for_each = local.subnets
  to       = aws_subnet.public[each.key]
  id       = each.value
}
```

## Common Pitfalls

| Issue | Solution |
|---|---|
| Plan shows changes after import | Update config to match real resource exactly |
| Sensitive values missing | Set in `terraform.tfvars` or mark as `sensitive` |
| Resource not found | Check region, account, resource ID format |
| State conflict | `terraform state rm` the duplicate first |
| Partial import | Import dependent resources together (VPC before subnets) |

## State Surgery

```bash
# View state
terraform state list
terraform state show aws_instance.web

# Move resource (rename)
terraform state mv aws_instance.old aws_instance.new

# Remove from state (without destroying)
terraform state rm aws_instance.web

# Pull state
terraform state pull > state.json
```

## What's Next?

Our **Terraform for Beginners** course covers infrastructure import and state management across 15 hands-on lessons. First lesson is free.
