---
title: "Terraform Workspaces Multi-Env"
slug: "terraform-workspaces-multi-environment"
date: "2026-01-25"
category: "DevOps"
tags: ["Terraform", "Workspaces", "Multi-Environment", "IaC", "DevOps"]
excerpt: "Manage multiple environments with Terraform workspaces. CLI workspaces, Terraform Cloud, directory-based isolation, and when to use each."
description: "Manage environments with Terraform workspaces. CLI workspaces, Terraform Cloud workspaces, directory isolation, and trade-offs."
---

You need the same infrastructure in dev, staging, and production — but with different sizes, settings, and credentials. Terraform offers several approaches to multi-environment management.

## CLI Workspaces

```bash
# List workspaces
terraform workspace list

# Create and switch
terraform workspace new staging
terraform workspace new production
terraform workspace select staging

# Show current
terraform workspace show
```

Use `terraform.workspace` in configuration:

```hcl
locals {
  env_config = {
    default = {
      instance_type = "t3.micro"
      instance_count = 1
      db_class = "db.t3.micro"
    }
    staging = {
      instance_type = "t3.small"
      instance_count = 2
      db_class = "db.t3.small"
    }
    production = {
      instance_type = "t3.large"
      instance_count = 3
      db_class = "db.r6g.large"
    }
  }

  config = local.env_config[terraform.workspace]
}

resource "aws_instance" "app" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type

  tags = {
    Environment = terraform.workspace
  }
}
```

### State Isolation

Each workspace gets its own state file:

```
terraform.tfstate.d/
  staging/
    terraform.tfstate
  production/
    terraform.tfstate
```

With S3 backend, state keys include the workspace:

```
s3://my-state/env:/staging/terraform.tfstate
s3://my-state/env:/production/terraform.tfstate
```

### CLI Workspace Limitations

- Easy to `terraform destroy` the wrong workspace
- No access control per workspace
- Same code, same backend — just different state
- Hard to have different providers per environment

## Directory-Based Isolation (Recommended)

Separate directories per environment with shared modules:

```
terraform/
  modules/
    vpc/
    database/
    application/
  environments/
    dev/
      main.tf
      variables.tf
      terraform.tfvars
      backend.tf
    staging/
      main.tf
      variables.tf
      terraform.tfvars
      backend.tf
    production/
      main.tf
      variables.tf
      terraform.tfvars
      backend.tf
```

### environments/production/main.tf

```hcl
module "vpc" {
  source     = "../../modules/vpc"
  name       = "production"
  cidr_block = "10.0.0.0/16"
  az_count   = 3
}

module "database" {
  source         = "../../modules/database"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  instance_class = "db.r6g.large"
  multi_az       = true
}

module "application" {
  source        = "../../modules/application"
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = module.vpc.private_subnet_ids
  instance_type = "t3.large"
  replicas      = 3
  database_url  = module.database.connection_string
}
```

### environments/dev/main.tf

```hcl
module "vpc" {
  source     = "../../modules/vpc"
  name       = "dev"
  cidr_block = "10.1.0.0/16"
  az_count   = 2
}

module "database" {
  source         = "../../modules/database"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  instance_class = "db.t3.micro"
  multi_az       = false
}

module "application" {
  source        = "../../modules/application"
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = module.vpc.private_subnet_ids
  instance_type = "t3.micro"
  replicas      = 1
  database_url  = module.database.connection_string
}
```

```bash
# Deploy dev
cd environments/dev && terraform apply

# Deploy production (completely separate state)
cd environments/production && terraform apply
```

### Advantages

- **Impossible to accidentally destroy production from dev**
- Different providers, backends, and state per environment
- PR reviews can target specific environments
- Different Terraform versions per environment if needed

## Terraform Cloud Workspaces

Different from CLI workspaces — full environment isolation:

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "app-production"
    }
  }
}
```

Features:
- **RBAC**: Different permissions per workspace
- **Variable sets**: Shared variables across workspaces
- **Run triggers**: Deploy staging → auto-trigger production
- **Policy as code**: Sentinel policies per workspace
- **VCS integration**: Auto-plan on PR, auto-apply on merge

## Terragrunt (DRY Multi-Environment)

```
terragrunt/
  terragrunt.hcl          # Root config
  dev/
    terragrunt.hcl        # Dev overrides
    vpc/
      terragrunt.hcl
    database/
      terragrunt.hcl
  production/
    terragrunt.hcl        # Prod overrides
    vpc/
      terragrunt.hcl
    database/
      terragrunt.hcl
```

```hcl
# production/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

inputs = {
  environment    = "production"
  instance_type  = "t3.large"
  instance_count = 3
}
```

```bash
# Deploy everything in production
cd production && terragrunt run-all apply
```

## Comparison

| Approach | Isolation | Complexity | Best For |
|---|---|---|---|
| CLI Workspaces | State only | Low | Small teams, simple infra |
| Directory-based | Full | Medium | Most teams |
| Terraform Cloud | Full + RBAC | Medium | Enterprise, compliance |
| Terragrunt | Full + DRY | High | Large, multi-account |

## What's Next?

Our **Terraform for Beginners** course covers multi-environment management patterns. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

