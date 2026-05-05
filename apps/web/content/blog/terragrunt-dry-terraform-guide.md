---
title: "Terragrunt DRY Terraform Guide"
date: "2026-03-24"
description: "Terragrunt eliminates copy-paste in multi-environment Terraform setups. Learn how to use Terragrunt for DRY configuration, remote state management, and dependency orchestration."
category: "DevOps"
tags: ["terragrunt", "Terraform", "infrastructure-as-code", "dry", "Multi-Environment", "DevOps"]
author: "Luca Berton"
---

Every Terraform project eventually hits the same problem: three environments with nearly identical configuration, copy-pasted across directories with slight differences. Terragrunt is a thin wrapper around Terraform that eliminates this duplication.

## The Problem Terragrunt Solves

Typical multi-environment Terraform layout:

```
environments/
├── dev/
│   ├── main.tf      # 90% identical to staging
│   ├── variables.tf
│   └── backend.tf   # Different state bucket
├── staging/
│   ├── main.tf      # 90% identical to production
│   ├── variables.tf
│   └── backend.tf
└── production/
    ├── main.tf
    ├── variables.tf
    └── backend.tf
```

Three copies of nearly the same code. Change a module version? Update three files. Add a new resource? Three places.

## Terragrunt Structure

```
live/
├── terragrunt.hcl          # Root config (backend, provider)
├── dev/
│   └── terragrunt.hcl      # Environment-specific values
├── staging/
│   └── terragrunt.hcl
└── production/
    └── terragrunt.hcl

modules/
└── app-infrastructure/     # Single Terraform module
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

One module. Three small config files. Zero duplication.

## Root Configuration

```hcl
# live/terragrunt.hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }
  config = {
    bucket         = "myorg-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<EOF
provider "aws" {
  region = "eu-west-1"
}
EOF
}
```

Every environment inherits this. The `path_relative_to_include()` function ensures each environment gets a unique state key.

## Environment Configuration

```hcl
# live/dev/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules/app-infrastructure"
}

inputs = {
  environment    = "dev"
  instance_type  = "t3.small"
  instance_count = 1
  enable_cdn     = false
}
```

```hcl
# live/production/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules/app-infrastructure"
}

inputs = {
  environment    = "production"
  instance_type  = "t3.large"
  instance_count = 3
  enable_cdn     = true
}
```

The only differences are the values. The infrastructure code is shared.

## Dependency Management

When one stack depends on another:

```hcl
# live/production/app/terragrunt.hcl
dependency "vpc" {
  config_path = "../vpc"
}

dependency "database" {
  config_path = "../database"
}

inputs = {
  vpc_id     = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.private_subnet_ids
  db_url     = dependency.database.outputs.connection_string
}
```

```bash
# Apply everything in the right order
cd live/production
terragrunt run-all apply
```

Terragrunt resolves the dependency graph: VPC first, then database, then app. Parallel execution where dependencies allow.

## Commands

```bash
# Apply a single environment
cd live/dev
terragrunt apply

# Apply all environments
cd live
terragrunt run-all apply

# Plan across all environments
terragrunt run-all plan

# Destroy in reverse dependency order
terragrunt run-all destroy
```

## Common Patterns

### Environment-Specific Variables

```hcl
# live/terragrunt.hcl
locals {
  environment = basename(get_terragrunt_dir())
  
  env_config = {
    dev = {
      instance_type = "t3.small"
      min_size      = 1
    }
    staging = {
      instance_type = "t3.medium"
      min_size      = 2
    }
    production = {
      instance_type = "t3.large"
      min_size      = 3
    }
  }
}

inputs = local.env_config[local.environment]
```

### Before and After Hooks

```hcl
terraform {
  before_hook "validate" {
    commands = ["apply", "plan"]
    execute  = ["tflint", "--init"]
  }

  after_hook "notify" {
    commands = ["apply"]
    execute  = ["slack-notify", "Terraform apply completed"]
  }
}
```

## When to Use Terragrunt

**Good fit:**
- 3+ environments with shared infrastructure code
- Teams managing multiple AWS accounts or regions
- Complex dependency chains between infrastructure stacks
- Need for consistent remote state configuration

**Not needed:**
- Single environment projects
- Simple infrastructure managed by one team
- Already using Terraform workspaces successfully

Terragrunt adds a layer of abstraction. If your Terraform is simple enough, that layer adds complexity without benefit. If you are maintaining copy-pasted Terraform across environments, Terragrunt pays for itself immediately.

---

Ready to go deeper? Master Terraform with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
