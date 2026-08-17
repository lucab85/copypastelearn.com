---
title: "Terraform Workspaces for Environments"
description: "Use Terraform workspaces for dev, staging, and production. Practical patterns, trade-offs, and best practices for multi-env IaC."
date: "2026-04-12"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "IaC", "Workspaces", "DevOps", "cloud"]
excerpt: "Use Terraform workspaces to manage dev, staging, and prod environments from a single codebase. Practical patterns."
---

## What Are Workspaces?

Terraform workspaces let you maintain separate state files for the same configuration. One codebase, multiple environments.

```bash
# List workspaces
terraform workspace list

# Create and switch
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch between them
terraform workspace select prod
```

## Use in Configuration

Access the current workspace with `terraform.workspace`:

```hcl
locals {
  environment = terraform.workspace

  instance_count = {
    dev     = 1
    staging = 2
    prod    = 3
  }

  instance_type = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.large"
  }
}

resource "aws_instance" "web" {
  count         = local.instance_count[local.environment]
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.instance_type[local.environment]

  tags = {
    Name        = "web-${local.environment}-${count.index}"
    Environment = local.environment
  }
}
```

## Resource Naming

Prefix resources with the workspace name to avoid conflicts:

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "myapp-${terraform.workspace}-data"
}

resource "aws_db_instance" "main" {
  identifier = "myapp-${terraform.workspace}-db"
  # ...
}
```

## Remote State with Workspaces

Each workspace gets its own state file. With S3 backend:

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"
    region = "eu-west-1"
  }
}
```

State files are stored as:

```
s3://my-terraform-state/env:/dev/app/terraform.tfstate
s3://my-terraform-state/env:/staging/app/terraform.tfstate
s3://my-terraform-state/env:/prod/app/terraform.tfstate
```

## Workspace-Specific Variables

Combine workspaces with tfvars for full flexibility:

```bash
# Apply with workspace-specific variables
terraform workspace select prod
terraform apply -var-file="envs/${terraform.workspace}.tfvars"
```

Or use a wrapper script:

```bash
#!/bin/bash
ENV=$1
terraform workspace select "$ENV" || terraform workspace new "$ENV"
terraform apply -var-file="envs/${ENV}.tfvars"
```

## When NOT to Use Workspaces

Workspaces work best for identical infrastructure across environments. Consider separate directories if:

- Environments have fundamentally different architectures
- Different teams manage different environments
- You need different providers or backends per environment

The alternative — directory-based layout:

```
environments/
├── dev/
│   ├── main.tf
│   └── terraform.tfvars
├── staging/
│   ├── main.tf
│   └── terraform.tfvars
└── prod/
    ├── main.tf
    └── terraform.tfvars
```

## Workspaces in CI/CD

```yaml
# GitHub Actions
- name: Deploy to production
  env:
    TF_WORKSPACE: prod
  run: |
    terraform init
    terraform plan -var-file="envs/prod.tfvars" -out=tfplan
    terraform apply tfplan
```

## Delete a Workspace

```bash
# Switch away first
terraform workspace select default

# Delete (must have empty state)
terraform workspace delete dev
```

## Related Posts

- [Terraform for Beginners Guide](/blog/terraform-beginners-complete-guide) for getting started
- [Terraform Variables and Outputs](/blog/terraform-variables-outputs-guide) for variable management
- [Terraform State Management](/blog/terraform-state-management) for remote state
- [Terraform CI/CD Pipelines](/blog/terraform-cicd-pipelines) for automation

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Terraform Workspaces for Environments as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Terraform, IaC, Workspaces, DevOps. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Terraform Workspaces for Environments?

Use it when you need a practical, repeatable way to handle Terraform, IaC, Workspaces, DevOps work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

