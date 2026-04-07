---
title: "Terraform Variables and Outputs"
description: "Master Terraform variables, locals, and outputs. Input validation, type constraints, and tfvars files explained."
date: "2026-04-09"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "IaC", "Variables", "DevOps", "Cloud"]
excerpt: "Master Terraform variables, locals, and outputs. Input validation, type constraints, and tfvars files explained."
---

## Variable Types

Terraform supports strings, numbers, booleans, lists, maps, and objects:

```hcl
variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "instance_count" {
  type    = number
  default = 2
}

variable "enable_monitoring" {
  type    = bool
  default = true
}

variable "allowed_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/8"]
}

variable "tags" {
  type = map(string)
  default = {
    Environment = "dev"
    Team        = "platform"
  }
}
```

## Complex Types

```hcl
variable "servers" {
  type = list(object({
    name          = string
    instance_type = string
    az            = string
  }))
  default = [
    {
      name          = "web-1"
      instance_type = "t3.small"
      az            = "eu-west-1a"
    }
  ]
}
```

## Input Validation

Catch bad values before `terraform apply`:

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  type = string
  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Only t3 instance types are allowed."
  }
}
```

## Setting Variables

Four ways, in order of precedence (highest first):

```bash
# 1. Command line
terraform apply -var="instance_type=t3.large"

# 2. Environment variable
export TF_VAR_instance_type="t3.large"

# 3. terraform.tfvars (auto-loaded)
echo 'instance_type = "t3.large"' > terraform.tfvars

# 4. Default value in variable block
```

## Environment-Specific tfvars

```bash
# Create per-environment files
cat > envs/prod.tfvars <<EOF
instance_type    = "t3.large"
instance_count   = 3
enable_monitoring = true
EOF

cat > envs/dev.tfvars <<EOF
instance_type    = "t3.micro"
instance_count   = 1
enable_monitoring = false
EOF

# Apply with specific env
terraform apply -var-file="envs/prod.tfvars"
```

## Local Values

Computed values that reduce repetition:

```hcl
locals {
  name_prefix = "${var.project}-${var.environment}"
  common_tags = merge(var.tags, {
    ManagedBy = "terraform"
    Project   = var.project
  })
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  tags          = merge(local.common_tags, {
    Name = "${local.name_prefix}-web"
  })
}
```

## Outputs

Expose values for other modules or CLI display:

```hcl
output "instance_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "instance_id" {
  description = "Instance ID"
  value       = aws_instance.web.id
  sensitive   = false
}

output "db_password" {
  description = "Database password"
  value       = random_password.db.result
  sensitive   = true
}
```

Access outputs:

```bash
terraform output instance_ip
terraform output -json
```

## Sensitive Variables

Mark variables as sensitive to suppress them from logs:

```hcl
variable "db_password" {
  type      = string
  sensitive = true
}
```

Terraform redacts the value in plan output and logs.

## Related Posts

- [Terraform for Beginners Guide](/blog/terraform-beginners-complete-guide) for getting started
- [Terraform HCL Syntax Guide](/blog/terraform-hcl-syntax-guide) for language basics
- [Terraform Modules Guide](/blog/terraform-modules-reusable-infrastructure) for reusable code
- [Terraform State Management](/blog/terraform-state-management) for remote state
