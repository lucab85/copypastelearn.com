---
title: "Terraform HCL Syntax: A Practical Guide"
description: "Master HashiCorp Configuration Language (HCL) — the syntax behind every Terraform configuration. Blocks, arguments, expressions, and functions."
date: "2026-02-25"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "HCL", "Configuration"]
---

## What Is HCL?

HashiCorp Configuration Language (HCL) is the language Terraform uses for configuration files. It's designed to be human-readable while being machine-parseable.

## Basic Structure

HCL files use **blocks**, **arguments**, and **expressions**:

```hcl
# Block type "resource", labels "aws_instance" and "web"
resource "aws_instance" "web" {
  # Arguments
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  # Nested block
  tags = {
    Name = "WebServer"
  }
}
```

## Variables

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "allowed_ports" {
  type    = list(number)
  default = [80, 443]
}

variable "tags" {
  type = map(string)
  default = {
    Environment = "dev"
    Team        = "platform"
  }
}
```

Reference with `var.instance_type`.

## Outputs

```hcl
output "instance_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}
```

## Expressions

```hcl
# Conditional
instance_type = var.environment == "prod" ? "t2.large" : "t2.micro"

# String interpolation
name = "server-${var.environment}-${count.index}"

# For expressions
upper_names = [for name in var.names : upper(name)]
```

## Built-in Functions

```hcl
# String functions
name = lower("MyServer")           # "myserver"
id   = substr(var.long_id, 0, 8)   # first 8 chars

# Collection functions
first = element(var.list, 0)
merged = merge(var.tags, { Name = "web" })

# File functions
key = file("~/.ssh/id_rsa.pub")
```

## Locals

```hcl
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "web" {
  tags = local.common_tags
}
```

## Learn More

Master HCL from scratch in our [Terraform for Beginners course](/courses) — practical exercises with real AWS infrastructure.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

