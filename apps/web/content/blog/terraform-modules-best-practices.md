---
title: "Terraform Modules Best Practices"
slug: "terraform-modules-best-practices"
date: "2026-02-24"
category: "DevOps"
tags: ["Terraform", "Modules", "IaC", "AWS", "Best Practices"]
excerpt: "Write reusable Terraform modules. Structure, inputs, outputs, versioning, testing, and publishing your own modules."
description: "Write reusable Terraform modules. Structure, variables, outputs, semantic versioning, automated testing, and registry publishing."
---

Modules are how you write reusable, composable Terraform code. Without modules, you copy-paste infrastructure definitions across environments. With modules, you define once and configure per use.

## Module Structure

```
modules/
  vpc/
    main.tf          # Resources
    variables.tf     # Input variables
    outputs.tf       # Output values
    versions.tf      # Provider requirements
    README.md        # Documentation
```

### variables.tf

```hcl
variable "name" {
  description = "VPC name"
  type        = string
}

variable "cidr_block" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3

  validation {
    condition     = var.az_count >= 1 && var.az_count <= 6
    error_message = "Must be between 1 and 6."
  }
}

variable "enable_nat" {
  description = "Enable NAT gateway for private subnets"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
```

### main.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = var.name
  })
}

resource "aws_subnet" "public" {
  for_each = toset(local.azs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.cidr_block, 8, index(local.azs, each.key))
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.name}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  for_each = toset(local.azs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, index(local.azs, each.key) + var.az_count)
  availability_zone = each.key

  tags = merge(var.tags, {
    Name = "${var.name}-private-${each.key}"
    Tier = "private"
  })
}
```

### outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [for s in aws_subnet.private : s.id]
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.this.cidr_block
}
```

## Using Modules

```hcl
module "production_vpc" {
  source = "./modules/vpc"

  name       = "production"
  cidr_block = "10.0.0.0/16"
  az_count   = 3
  enable_nat = true
  tags       = { Environment = "production" }
}

module "staging_vpc" {
  source = "./modules/vpc"

  name       = "staging"
  cidr_block = "10.1.0.0/16"
  az_count   = 2
  enable_nat = false
  tags       = { Environment = "staging" }
}

# Reference module outputs
resource "aws_instance" "app" {
  subnet_id = module.production_vpc.private_subnet_ids[0]
}
```

## Remote Module Sources

```hcl
# Terraform Registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}

# GitHub
module "vpc" {
  source = "github.com/my-org/terraform-modules//vpc?ref=v1.2.0"
}

# S3
module "vpc" {
  source = "s3::https://my-bucket.s3.amazonaws.com/modules/vpc.zip"
}

# Git tag (versioned)
module "vpc" {
  source = "git::https://github.com/my-org/modules.git//vpc?ref=v1.2.0"
}
```

## Module Composition

Build complex infrastructure from simple modules:

```hcl
module "vpc" {
  source     = "./modules/vpc"
  name       = "production"
  cidr_block = "10.0.0.0/16"
}

module "database" {
  source     = "./modules/rds"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  engine     = "postgres"
  version    = "16"
}

module "cluster" {
  source     = "./modules/eks"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

module "app" {
  source      = "./modules/deployment"
  cluster_id  = module.cluster.cluster_id
  database_url = module.database.connection_string
}
```

## Testing Modules

### Terraform Test (Built-in)

```hcl
# tests/vpc.tftest.hcl
run "creates_vpc" {
  command = plan

  variables {
    name       = "test"
    cidr_block = "10.0.0.0/16"
    az_count   = 2
  }

  assert {
    condition     = aws_vpc.this.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR doesn't match"
  }

  assert {
    condition     = length(aws_subnet.public) == 2
    error_message = "Expected 2 public subnets"
  }
}
```

```bash
terraform test
```

## Best Practices

| Practice | Why |
|---|---|
| One module, one purpose | VPC module shouldn't create databases |
| Validate all inputs | Catch errors before `apply` |
| Document with README | Other teams need to understand your module |
| Version with Git tags | `v1.0.0`, `v1.1.0` for breaking changes |
| Use `for_each` over `count` | Stable resource addresses |
| Output everything useful | Consumers shouldn't need to know internals |
| Pin provider versions | Prevent breaking changes |
| Test with `terraform test` | Catch regressions |

## What's Next?

Our **Terraform for Beginners** course covers module development from scratch across 15 hands-on lessons. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

