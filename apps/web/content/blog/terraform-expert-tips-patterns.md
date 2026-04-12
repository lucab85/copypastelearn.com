---
title: "Terraform Expert Tips and Patterns"
slug: "terraform-expert-tips-patterns"
date: "2026-04-03"
category: "DevOps"
tags: ["Terraform", "IaC", "Advanced", "Best Practices", "Patterns"]
excerpt: "Level up your Terraform skills with expert patterns. Dynamic blocks, for_each, moved blocks, custom validation, and production workflows."
description: "Level up Terraform skills with expert patterns. Dynamic blocks, for_each, moved blocks, validation, and production workflows."
---

Once you know the basics of Terraform, these expert patterns will make your infrastructure code cleaner, safer, and more maintainable.

## Pattern 1: for_each Over count

**Avoid** `count` for resources that might change order:

```hcl
# Bad — removing item 0 forces recreation of items 1, 2, 3...
variable "subnets" {
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

resource "aws_subnet" "main" {
  count      = length(var.subnets)
  cidr_block = var.subnets[count.index]
  vpc_id     = aws_vpc.main.id
}
```

**Use** `for_each` for stable resource addresses:

```hcl
# Good — each subnet has a stable key
variable "subnets" {
  default = {
    public-a  = { cidr = "10.0.1.0/24", az = "eu-west-1a" }
    public-b  = { cidr = "10.0.2.0/24", az = "eu-west-1b" }
    private-a = { cidr = "10.0.3.0/24", az = "eu-west-1a" }
  }
}

resource "aws_subnet" "main" {
  for_each          = var.subnets
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  vpc_id            = aws_vpc.main.id
  tags              = { Name = each.key }
}
```

Removing `public-b` only destroys that one subnet.

## Pattern 2: Dynamic Blocks

Reduce repetition in security group rules:

```hcl
variable "ingress_rules" {
  default = [
    { port = 80, description = "HTTP" },
    { port = 443, description = "HTTPS" },
    { port = 22, description = "SSH", cidrs = ["10.0.0.0/8"] },
  ]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = lookup(ingress.value, "cidrs", ["0.0.0.0/0"])
      description = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## Pattern 3: Custom Validation

Catch bad inputs before `apply`:

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "instance_type" {
  type = string
  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Only t3 instance types are allowed."
  }
}

variable "cidr_block" {
  type = string
  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}
```

## Pattern 4: Moved Blocks for Refactoring

Rename resources without destroying them:

```hcl
# Before: resource "aws_instance" "web"
# After: resource "aws_instance" "application"

moved {
  from = aws_instance.web
  to   = aws_instance.application
}

resource "aws_instance" "application" {
  ami           = "ami-0c1c30571d2dae5c9"
  instance_type = "t3.micro"
}
```

Move into a module:

```hcl
moved {
  from = aws_instance.application
  to   = module.compute.aws_instance.main
}
```

## Pattern 5: Terragrunt for DRY Multi-Environment

```
environments/
  terragrunt.hcl          # Common config
  dev/
    terragrunt.hcl        # Dev overrides
  staging/
    terragrunt.hcl        # Staging overrides
  production/
    terragrunt.hcl        # Production overrides
modules/
  vpc/
  eks/
  rds/
```

Root `terragrunt.hcl`:

```hcl
remote_state {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "${path_relative_to_include()}/terraform.tfstate"
    region = "eu-west-1"
  }
}
```

Environment `terragrunt.hcl`:

```hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules/vpc"
}

inputs = {
  environment = "production"
  cidr_block  = "10.0.0.0/16"
  az_count    = 3
}
```

## Pattern 6: Data Sources for Cross-Stack References

Read outputs from other Terraform states:

```hcl
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "network/terraform.tfstate"
    region = "eu-west-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnet_id
}
```

## Pattern 7: Pre-commit Hooks

Automate quality checks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_docs
```

## Expert Checklist

- [ ] Use `for_each` instead of `count` for resources
- [ ] Validate all input variables
- [ ] Use `moved` blocks when refactoring
- [ ] Set up remote state with locking from day one
- [ ] Pin provider versions with `~>` constraints
- [ ] Use dynamic blocks to reduce repetition
- [ ] Implement pre-commit hooks
- [ ] Run `terraform plan` in CI before merge

## What's Next?

Our **Terraform for Beginners** course builds from fundamentals to these advanced patterns across 15 hands-on lessons. The first lesson is free.
