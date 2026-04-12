---
title: "Terraform Variables and Outputs"
slug: "terraform-variables-outputs-guide"
date: "2026-02-09"
category: "DevOps"
tags: ["Terraform", "Variables", "IaC", "DevOps", "Configuration"]
excerpt: "Master Terraform variables and outputs. Types, validation, locals, sensitive values, tfvars files, and output dependencies."
description: "Master Terraform variables and outputs. Types, validation, locals, sensitive values, tfvars, and dependencies."
---

Variables make Terraform code reusable. Outputs share data between modules and display results. Together they are how you parameterize infrastructure.

## Input Variables

### Basic Types

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = false
}
```

### Complex Types

```hcl
# List
variable "availability_zones" {
  type    = list(string)
  default = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}

# Map
variable "instance_types" {
  type = map(string)
  default = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }
}

# Object
variable "database" {
  type = object({
    engine         = string
    version        = string
    instance_class = string
    storage_gb     = number
    multi_az       = bool
  })
  default = {
    engine         = "postgres"
    version        = "16"
    instance_class = "db.t3.micro"
    storage_gb     = 20
    multi_az       = false
  }
}

# List of objects
variable "ingress_rules" {
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  default = [
    {
      port        = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP"
    },
    {
      port        = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS"
    }
  ]
}
```

### Validation

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "cidr_block" {
  type = string
  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "name" {
  type = string
  validation {
    condition     = length(var.name) >= 3 && length(var.name) <= 32
    error_message = "Name must be 3-32 characters."
  }
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.name))
    error_message = "Name must start with a letter and contain only lowercase letters, numbers, and hyphens."
  }
}
```

### Sensitive Variables

```hcl
variable "db_password" {
  type      = string
  sensitive = true  # Hidden in plan/apply output
}

variable "api_key" {
  type      = string
  sensitive = true
}
```

## Setting Variable Values

### Priority (lowest to highest)

1. `default` in variable block
2. Environment variables (`TF_VAR_name`)
3. `terraform.tfvars` file
4. `*.auto.tfvars` files
5. `-var-file` flag
6. `-var` flag (highest)

### tfvars Files

```hcl
# terraform.tfvars (auto-loaded)
environment    = "production"
instance_type  = "t3.large"
instance_count = 3

# production.tfvars (loaded with -var-file)
database = {
  engine         = "postgres"
  version        = "16"
  instance_class = "db.r6g.large"
  storage_gb     = 500
  multi_az       = true
}
```

```bash
terraform apply -var-file=production.tfvars
```

### Environment Variables

```bash
export TF_VAR_db_password="S3cur3P@ss!"
export TF_VAR_environment="production"
terraform apply
```

## Locals

Computed values that simplify expressions:

```hcl
locals {
  name_prefix = "${var.project}-${var.environment}"
  
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Team        = var.team
  }

  is_production = var.environment == "production"
  
  instance_type = local.is_production ? "t3.large" : "t3.micro"
  
  subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
}

resource "aws_instance" "app" {
  instance_type = local.instance_type
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-app" })
}
```

## Outputs

```hcl
output "vpc_id" {
  description = "The VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "database_endpoint" {
  description = "Database connection endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true  # Hidden in CLI output
}

output "load_balancer_dns" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
  depends_on  = [aws_lb_listener.https]
}
```

### Using Outputs

```bash
# View all outputs
terraform output

# Get specific output
terraform output vpc_id

# JSON format (for scripts)
terraform output -json

# Raw value (no quotes)
terraform output -raw load_balancer_dns
```

### Cross-Module References

```hcl
# In root module
module "vpc" {
  source = "./modules/vpc"
}

module "database" {
  source     = "./modules/rds"
  vpc_id     = module.vpc.vpc_id          # Output from vpc module
  subnet_ids = module.vpc.private_subnet_ids
}
```

## Patterns

### Feature Flags

```hcl
variable "features" {
  type = object({
    enable_cdn       = bool
    enable_waf       = bool
    enable_monitoring = bool
  })
  default = {
    enable_cdn        = false
    enable_waf        = false
    enable_monitoring = true
  }
}

resource "aws_cloudfront_distribution" "cdn" {
  count = var.features.enable_cdn ? 1 : 0
  # ...
}
```

### Environment-Specific Defaults

```hcl
variable "env_config" {
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
  }))
  default = {
    dev     = { instance_type = "t3.micro",  min_size = 1, max_size = 2 }
    staging = { instance_type = "t3.small",  min_size = 2, max_size = 4 }
    prod    = { instance_type = "t3.medium", min_size = 3, max_size = 10 }
  }
}

locals {
  config = var.env_config[var.environment]
}
```

## What's Next?

Our **Terraform for Beginners** course covers variables, outputs, and modules across 15 hands-on lessons. First lesson is free.
