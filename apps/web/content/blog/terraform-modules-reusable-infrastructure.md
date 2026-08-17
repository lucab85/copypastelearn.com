---
title: "Terraform Modules Reuse Guide"
description: "Learn how to create and use Terraform modules to organize, share, and reuse infrastructure code across projects and teams."
date: "2026-02-23"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "Modules", "Reusability"]
---

If you've ever copy-pasted the same VPC or EC2 configuration into a second environment, you've already felt the problem modules solve. Copy-pasted Terraform doesn't stay in sync: a bug fix applied in staging never makes it back into production, a tag naming convention drifts between teams, and eventually nobody can say with confidence which copy is the "real" one. Terraform modules fix this by letting you define a piece of infrastructure once, parameterize the parts that genuinely differ between callers, and reuse the rest everywhere it's needed — so a fix or an improvement lands in one place instead of three.

## Prerequisites

You should already be comfortable with basic Terraform — writing resource blocks, declaring variables, and running `terraform plan`/`terraform apply` shouldn't be new to you. More importantly, you need a real reason to reach for modules: an existing set of resources — a VPC, an EC2 fleet, an S3 bucket with a specific policy — that you're currently repeating, by hand, across two or more environments or projects. If you're only writing that infrastructure once, hold off on modularizing it; the extra indirection isn't worth paying for until duplication actually shows up.

## How It Works

A Terraform module is nothing more than a directory containing its own `.tf` files — there's no special syntax that turns a directory into a module. In fact, every Terraform configuration you've ever written is technically a module; the one in your current working directory is just the "root" module. What makes a module reusable is that it declares its own input variables and output values, the same way a function declares parameters and a return value: you call it with `source`, pass it inputs, and read back outputs, without needing to know what happens inside.

The difference between a local module (`source = "./modules/vpc"`) and a registry module (`source = "terraform-aws-modules/vpc/aws"`) is distribution, not structure. A local module lives in your own repository, and there's no version boundary between it and the configuration calling it — edit the module's files and the next `plan` picks up the change immediately. A registry module is published and versioned independently, much like a library dependency: you pin a specific release, and upgrading to a newer one is a deliberate decision you make, not something that happens automatically the next time you run `init`.

## Why Modules?

Without modules, Terraform projects become monolithic walls of configuration. Modules let you:

- **Organize** — group related resources logically
- **Reuse** — use the same pattern across projects
- **Abstract** — hide complexity behind simple interfaces
- **Share** — publish modules for your team or community

None of this means every resource belongs in a module, though. If you have a single, one-off resource — a specific S3 bucket that will only ever exist in one place, with no variation — wrapping it in a module adds a layer of indirection (inputs, outputs, a source path) without buying you anything. Reach for a module when you can point to at least two places — two environments, two projects, two teams — that need the same shape of infrastructure with different parameters. Reach for a plain resource block when you can't. Modularizing a one-off resource is premature abstraction: it costs you a file layout and a mental hop for no future benefit.

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

The `variables.tf` and `outputs.tf` files below aren't incidental scaffolding — together, they *are* the module's API. Everything a caller can configure has to be exposed as an input variable, and everything a caller might need downstream has to be exposed as an output. Design both deliberately, not reflexively. A common mistake is exposing every underlying resource argument as a pass-through variable, which just recreates the resource's own interface with extra typing and no real abstraction. A better module exposes the handful of decisions that actually vary between callers — CIDR range, project name, tag set — and makes sensible internal choices for everything else. The same discipline applies to outputs: expose the IDs and ARNs other resources or modules will need to wire things together, and nothing more. A module with a sprawling variable list is usually a sign it's trying to do too much, or that nobody decided what it's actually abstracting.

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

Once a module exposes outputs, other resources and modules can reference them directly with `module.<name>.<output>` — that's the payoff for having designed the API deliberately in the previous step. It's also where a badly designed module shows its cracks: if an output you need later wasn't exposed up front, you either have to fork the module to add it or fall back to something like `terraform_remote_state`, both of which defeat the point of modularizing in the first place. Notice in the example below how `module.vpc.subnet_ids[0]` reads exactly like accessing a return value — because that's what it is.

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

The Registry is essentially Terraform's package manager for infrastructure: modules are versioned with semantic versioning, and each published version is immutable. That immutability is exactly what makes registry modules trustworthy, but it only protects you if you actually pin a version. Leaving `version` unset, or using a loose constraint like `>= 5.0.0`, means the next `terraform init` can silently pull in a newer major release with breaking changes to variables or outputs — you won't find out until `plan` errors, or worse, until `apply` changes infrastructure you didn't intend to touch. Pin to an exact version, or a narrow range such as `~> 5.0`, for anything running in a real environment, and bump the pin deliberately, after reading the module's changelog. The convenience of a floating version constraint is not worth debugging an `apply` that silently rewrote your VPC's routing table at 2am.

## Best Practices

The list below covers the mechanics, but each item exists because of a real failure mode that's easy to hit once a module is in use by more than one caller.

1. **Keep modules focused — one concern per module.** A module that provisions a VPC, an RDS instance, and an IAM role all in one shot is hard to version and hard to test, and it forces every caller to accept all three even if they only need one. Split by concern, and compose modules together at the root level instead of building one module that does everything.
2. **Version your modules — use Git tags or registry versions.** An unversioned module — one whose `source` points at a mutable branch like `main` — exposes every consumer to every change the moment it merges, with no chance to review before it lands in someone else's environment. Tag releases the same way you'd version any other piece of shared code.
3. **Document inputs and outputs — add descriptions to all variables.** The `description` field on a variable is often the only documentation a caller will read before running `terraform plan`. Skipping it just pushes the cost onto whoever has to go read the module's source later to figure out what a variable actually does.
4. **Use sensible defaults — make modules easy to use out of the box.** Defaults reduce how much a caller has to think about, but only set them where a wrong guess is safe. Never default a value like a CIDR range or an environment name in a way that could cause two callers to collide with each other.
5. **Don't hardcode — everything configurable via variables.** This one has a limit, though: not everything needs to be a variable. The goal is exposing what genuinely varies between callers, not maximizing the number of `variable` blocks in the module — a module that lets you configure everything is really just a resource block with extra ceremony.

## Learn More

Build reusable Terraform modules in our [Terraform for Beginners course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.
