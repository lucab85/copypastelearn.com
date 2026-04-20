---
title: "Terraform Loops and Conditionals"
slug: "terraform-loops-conditionals-guide"
date: "2026-01-30"
category: "DevOps"
tags: ["Terraform", "Loops", "for_each", "count", "IaC"]
excerpt: "Master Terraform loops and conditionals. count, for_each, for expressions, dynamic blocks, and conditional resource creation patterns."
description: "Terraform loops and conditionals. count, for_each, for expressions, dynamic blocks, and advanced patterns for DRY config code."
---

Terraform is declarative, but you still need loops and conditionals. Here is how to create multiple resources, toggle features, and transform data.

## count

Create multiple copies of a resource:

```hcl
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c1c30571d2dae5c9"
  instance_type = "t3.micro"

  tags = {
    Name = "web-${count.index}"
  }
}

# Reference: aws_instance.web[0], aws_instance.web[1], ...
output "instance_ids" {
  value = aws_instance.web[*].id
}
```

### Conditional Creation with count

```hcl
variable "create_cdn" {
  type    = bool
  default = false
}

resource "aws_cloudfront_distribution" "cdn" {
  count = var.create_cdn ? 1 : 0
  # ... configuration
}

# Reference conditionally created resource
output "cdn_domain" {
  value = var.create_cdn ? aws_cloudfront_distribution.cdn[0].domain_name : null
}
```

### Problem with count

Removing an item from the middle shifts all indices:

```hcl
# If you remove "web-1" from a list of 3, web-2 becomes web-1
# Terraform destroys web-1 and web-2, recreates web-1 (was web-2)
```

Use `for_each` instead when resources have identity.

## for_each

Create resources from a map or set — stable addressing by key:

```hcl
variable "instances" {
  type = map(object({
    instance_type = string
    ami           = string
  }))
  default = {
    web = { instance_type = "t3.micro", ami = "ami-abc123" }
    api = { instance_type = "t3.small", ami = "ami-abc123" }
    worker = { instance_type = "t3.medium", ami = "ami-abc123" }
  }
}

resource "aws_instance" "app" {
  for_each      = var.instances
  ami           = each.value.ami
  instance_type = each.value.instance_type

  tags = {
    Name = each.key  # "web", "api", "worker"
  }
}

# Reference: aws_instance.app["web"], aws_instance.app["api"]
output "instance_ips" {
  value = { for k, v in aws_instance.app : k => v.public_ip }
}
```

### for_each with Set

```hcl
variable "subnet_cidrs" {
  type    = set(string)
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

resource "aws_subnet" "this" {
  for_each   = var.subnet_cidrs
  vpc_id     = aws_vpc.main.id
  cidr_block = each.value
}
```

### Converting List to Set for for_each

```hcl
variable "users" {
  type    = list(string)
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "this" {
  for_each = toset(var.users)
  name     = each.value
}
```

## for Expressions

Transform data:

```hcl
# List comprehension
locals {
  upper_names = [for name in var.users : upper(name)]
  # ["ALICE", "BOB", "CHARLIE"]

  # Filter
  admins = [for user in var.users : user if user.role == "admin"]

  # Map from list
  user_map = { for user in var.users : user.name => user.email }

  # Transform map
  instance_names = { for k, v in aws_instance.app : k => v.tags.Name }
}

# In outputs
output "public_ips" {
  value = { for k, instance in aws_instance.app : k => instance.public_ip }
}
```

## Dynamic Blocks

Generate repeated nested blocks:

```hcl
variable "ingress_rules" {
  type = list(object({
    port        = number
    cidr_blocks = list(string)
    description = string
  }))
  default = [
    { port = 80,  cidr_blocks = ["0.0.0.0/0"], description = "HTTP" },
    { port = 443, cidr_blocks = ["0.0.0.0/0"], description = "HTTPS" },
    { port = 22,  cidr_blocks = ["10.0.0.0/8"], description = "SSH internal" },
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
      cidr_blocks = ingress.value.cidr_blocks
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

## Conditional Expressions

```hcl
# Ternary
locals {
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"
  multi_az      = var.environment == "production" ? true : false
  replicas      = var.environment == "production" ? 3 : 1
}

# Conditional output
output "cdn_url" {
  value = var.enable_cdn ? "https://${aws_cloudfront_distribution.cdn[0].domain_name}" : "https://${aws_lb.main.dns_name}"
}

# Conditional variable in resource
resource "aws_db_instance" "main" {
  engine               = "postgres"
  instance_class       = var.environment == "production" ? "db.r6g.large" : "db.t3.micro"
  multi_az             = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 30 : 1
  deletion_protection  = var.environment == "production"
}
```

## Patterns

### Optional Resources

```hcl
resource "aws_waf_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  # ...
}

resource "aws_lb_listener_rule" "waf" {
  count = var.enable_waf ? 1 : 0
  # ...
  action {
    type = "forward"
    target_group_arn = aws_waf_web_acl.main[0].arn
  }
}
```

### Flatten Nested Structures

```hcl
variable "vpcs" {
  type = map(object({
    cidr    = string
    subnets = list(string)
  }))
}

locals {
  subnets = flatten([
    for vpc_name, vpc in var.vpcs : [
      for subnet_cidr in vpc.subnets : {
        vpc_name = vpc_name
        vpc_cidr = vpc.cidr
        subnet   = subnet_cidr
      }
    ]
  ])
}

resource "aws_subnet" "all" {
  for_each   = { for s in local.subnets : "${s.vpc_name}-${s.subnet}" => s }
  vpc_id     = aws_vpc.this[each.value.vpc_name].id
  cidr_block = each.value.subnet
}
```

## count vs for_each

| Feature | count | for_each |
|---|---|---|
| Index type | Integer (0, 1, 2...) | String key |
| Adding/removing items | Shifts indices, may recreate | Stable by key |
| Conditional creation | `count = condition ? 1 : 0` | Use with empty map |
| Best for | Feature toggles, simple multiples | Named resources, maps |

**Rule of thumb**: Use `for_each` for resources with identity. Use `count` for on/off toggles.

## What's Next?

Our **Terraform for Beginners** course covers loops, conditionals, and advanced HCL patterns across 15 hands-on lessons. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

