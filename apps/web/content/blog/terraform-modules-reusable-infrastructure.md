---
title: "Terraform Modules Guide"
description: "Learn how to create and use Terraform modules to organize, share, and reuse infrastructure code across projects and teams."
date: "2026-02-23"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "Modules", "Reusability"]
---

## Why Modules?

Without modules, Terraform projects become monolithic walls of configuration. Modules let you:

- **Organize** — group related resources logically
- **Reuse** — use the same pattern across projects
- **Abstract** — hide complexity behind simple interfaces
- **Share** — publish modules for your team or community

## Module Structure

```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
  ec2/
    main.tf
    variables.tf
    outputs.tf
```

## Creating a Module

`modules/vpc/main.tf`:

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true

  tags = merge(var.tags, {
    Name = "${var.project}-vpc"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.project}-public-${count.index}"
  })
}
```

`modules/vpc/variables.tf`:

```hcl
variable "cidr_block" {
  type = string
}

variable "public_subnets" {
  type = list(string)
}

variable "azs" {
  type = list(string)
}

variable "project" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

`modules/vpc/outputs.tf`:

```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnet_ids" {
  value = aws_subnet.public[*].id
}
```

## Using a Module

```hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block     = "10.0.0.0/16"
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  azs            = ["eu-west-1a", "eu-west-1b"]
  project        = "myapp"
  tags           = local.common_tags
}

# Reference module outputs
resource "aws_instance" "web" {
  subnet_id = module.vpc.subnet_ids[0]
}
```

## Terraform Registry Modules

Use community modules from the Terraform Registry:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
}
```

## Best Practices

1. **Keep modules focused** — one concern per module
2. **Version your modules** — use Git tags or registry versions
3. **Document inputs/outputs** — add descriptions to all variables
4. **Use sensible defaults** — make modules easy to use out of the box
5. **Don't hardcode** — everything configurable via variables

## Learn More

Build reusable Terraform modules in our [Terraform for Beginners course](/courses).
