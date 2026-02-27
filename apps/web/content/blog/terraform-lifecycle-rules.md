---
title: "Terraform Lifecycle Rules: Control How Resources Change"
description: "Master Terraform lifecycle rules — prevent_destroy, create_before_destroy, ignore_changes, and replace_triggered_by for safe infrastructure updates."
date: "2026-02-18"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "Lifecycle Rules", "Resource Management"]
---

## What Are Lifecycle Rules?

Lifecycle rules control how Terraform creates, updates, and destroys resources. They're essential for safe production infrastructure management.

## prevent_destroy

Protect critical resources from accidental deletion:

```hcl
resource "aws_db_instance" "production" {
  engine         = "postgres"
  instance_class = "db.t3.medium"

  lifecycle {
    prevent_destroy = true
  }
}
```

Running `terraform destroy` will fail with an error. You must remove the rule first — a deliberate, visible action.

## create_before_destroy

Ensure zero-downtime updates by creating the replacement before destroying the old resource:

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t2.micro"

  lifecycle {
    create_before_destroy = true
  }
}
```

The flow: create new → update references → destroy old.

## ignore_changes

Ignore changes made outside Terraform (manual edits, auto-scaling):

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t2.micro"

  lifecycle {
    ignore_changes = [
      tags,
      ami,
    ]
  }
}
```

Use sparingly — ignoring too many changes defeats the purpose of IaC.

## replace_triggered_by

Force resource replacement when a dependency changes:

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t2.micro"

  lifecycle {
    replace_triggered_by = [
      aws_security_group.web.id,
    ]
  }
}
```

## precondition and postcondition

Validate assumptions:

```hcl
resource "aws_instance" "web" {
  instance_type = var.instance_type

  lifecycle {
    precondition {
      condition     = contains(["t2.micro", "t2.small", "t2.medium"], var.instance_type)
      error_message = "Only t2 instances are allowed."
    }

    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance must have a public IP."
    }
  }
}
```

## When to Use Each

- **prevent_destroy** — databases, S3 buckets with important data
- **create_before_destroy** — load-balanced instances, DNS records
- **ignore_changes** — auto-scaled resources, externally managed tags
- **replace_triggered_by** — instances that must restart on config change
- **precondition/postcondition** — input validation and sanity checks

## Learn More

Master lifecycle rules with hands-on exercises in our [Terraform for Beginners course](/courses).
