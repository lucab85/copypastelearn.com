---
title: "Spacelift Terraform Orchestration"
date: "2026-02-18"
description: "Spacelift orchestrates Terraform, OpenTofu, and Pulumi with policies, drift detection, and approval workflows. Learn how Spacelift compares to Terraform Cloud and Atlantis for IaC management."
category: "DevOps"
tags: ["spacelift", "terraform", "iac", "orchestration", "gitops", "infrastructure"]
---

Terraform Cloud manages state and runs plans. Atlantis comments on PRs. Spacelift does both and adds policies, drift detection, dependencies between stacks, and fine-grained access control.

## Core Concepts

```
Git Push → Spacelift Stack → Plan → Policy Check → Approval → Apply
```

A **stack** is a Terraform workspace managed by Spacelift. It tracks a Git repository, branch, and Terraform root module.

## Stack Configuration

```yaml
# .spacelift/config.yml
version: 1

stacks:
  - name: production-vpc
    root: terraform/vpc
    branch: main
    terraform_version: 1.7.0
    labels:
      - production
      - networking

  - name: production-eks
    root: terraform/eks
    branch: main
    depends_on:
      - production-vpc
    terraform_version: 1.7.0
    labels:
      - production
      - compute
```

The EKS stack depends on the VPC stack. Spacelift applies them in order.

## Policy as Code

Spacelift uses Open Policy Agent (OPA) for policy enforcement:

### Cost Limits

```rego
# Reject plans that increase monthly cost by more than $500
package spacelift

deny[msg] {
  input.spacelift.run.type == "PROPOSED"
  cost_increase := input.third_party.infracost.total_monthly_cost_change
  cost_increase > 500
  msg := sprintf("Cost increase $%.2f exceeds $500 limit", [cost_increase])
}
```

### Resource Restrictions

```rego
# Block creation of public S3 buckets
package spacelift

deny[msg] {
  resource := input.terraform.resource_changes[_]
  resource.type == "aws_s3_bucket"
  resource.change.after.acl == "public-read"
  msg := "Public S3 buckets are not allowed"
}
```

### Approval Requirements

```rego
# Require 2 approvals for production changes
package spacelift

approve {
  input.spacelift.stack.labels[_] == "production"
  count(input.spacelift.run.approvals) >= 2
}
```

## Drift Detection

Spacelift periodically runs `terraform plan` to detect configuration drift:

```
Stack: production-vpc
Drift detected: 2 resources changed outside Terraform

~ aws_security_group.web
  - ingress rule added: port 22 from 0.0.0.0/0  ← Manual change!

~ aws_route_table.public
  - route added: 10.0.0.0/8 via igw-xxxx  ← Manual change!
```

Options:
- **Alert**: Notify the team
- **Auto-reconcile**: Apply Terraform to undo the drift
- **Review**: Create a tracked run for manual review

## Stack Dependencies

```
VPC Stack → EKS Stack → App Stack → Monitoring Stack
              ↓
         RDS Stack
```

When the VPC stack changes, Spacelift automatically triggers dependent stacks in order. No manual coordination.

## Contexts (Shared Configuration)

```yaml
# Share AWS credentials across stacks
context: aws-production
  environment:
    AWS_DEFAULT_REGION: eu-west-1
  mounted_files:
    - path: /mnt/workspace/.aws/credentials
      content: ${{ secrets.AWS_CREDENTIALS }}
```

Attach contexts to stacks by label:

```yaml
# All stacks with label "production" get AWS credentials
auto_attach:
  label: production
```

## Module Registry

```
# Publish a module
spacectl module create-version \
  --id my-vpc-module \
  --version 1.2.0

# Use in stacks
module "vpc" {
  source  = "spacelift.io/myorg/vpc/aws"
  version = "~> 1.2"
}
```

## Spacelift vs Alternatives

| Feature | Spacelift | Terraform Cloud | Atlantis |
|---------|----------|----------------|---------|
| State management | Yes | Yes | No (use S3) |
| Policy engine | OPA | Sentinel | No |
| Drift detection | Yes | Yes (paid) | No |
| Stack dependencies | Yes | Run triggers | No |
| Multi-IaC | TF, OT, Pulumi, CF | TF only | TF only |
| Self-hosted | Yes | No (TFE only) | Yes |
| PR integration | Yes | Yes | Yes |
| Pricing | Per-run | Per-resource | Free |

**Choose Spacelift** for complex multi-stack environments needing policies, drift detection, and dependency management. **Choose Atlantis** for simple PR-based Terraform workflows with zero cost. **Choose Terraform Cloud** if you want HashiCorp's ecosystem.

---

Ready to go deeper? Master Terraform orchestration with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
