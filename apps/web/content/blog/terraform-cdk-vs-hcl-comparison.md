---
title: "Terraform CDK vs HCL Comparison"
date: "2026-04-05"
description: "Terraform CDK lets you write infrastructure in TypeScript, Python, or Go instead of HCL. Compare CDKTF and HCL for real-world use cases and learn when each approach makes sense."
category: "DevOps"
tags: ["Terraform", "cdktf", "hcl", "infrastructure-as-code", "typescript", "DevOps"]
author: "Luca Berton"
---

HCL is purpose-built for infrastructure. CDKTF lets you use general-purpose languages instead. Both produce Terraform plans. The question is which tradeoffs fit your team.

## What CDKTF Is

The Cloud Development Kit for Terraform (CDKTF) generates Terraform JSON from code written in TypeScript, Python, Go, Java, or C#:

```typescript
// main.ts
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";

class MyStack extends TerraformStack {
  constructor(scope: App, id: string) {
    super(scope, id);

    new AwsProvider(this, "aws", { region: "eu-west-1" });

    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      tags: { Name: "production" },
    });

    new Instance(this, "web", {
      ami: "ami-0c55b159cbfafe1f0",
      instanceType: "t3.medium",
      subnetId: vpc.id,
    });
  }
}

const app = new App();
new MyStack(app, "production");
app.synth();
```

Run `cdktf synth` and it generates standard Terraform JSON. Then `cdktf deploy` applies it.

## HCL Equivalent

```hcl
provider "aws" {
  region = "eu-west-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "production" }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  subnet_id     = aws_vpc.main.id
}
```

For simple infrastructure, HCL is more concise and readable.

## Where CDKTF Wins

### Complex Logic

HCL has `for_each`, `count`, `dynamic` blocks, and `locals` — but they are limited compared to real programming constructs:

```typescript
// CDKTF: Generate resources programmatically
const environments = ["dev", "staging", "production"];
const instanceSizes: Record<string, string> = {
  dev: "t3.small",
  staging: "t3.medium",
  production: "t3.large",
};

for (const env of environments) {
  new Instance(this, `web-${env}`, {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: instanceSizes[env],
    tags: { Environment: env },
  });
}
```

Loops, conditionals, and data transformations are natural in TypeScript. In HCL, the equivalent requires nested `for_each` expressions that are harder to read and debug.

### Type Safety

CDKTF has full type checking. Your IDE catches errors before you run `terraform plan`:

```typescript
// TypeScript catches this at compile time
new Instance(this, "web", {
  ami: "ami-0c55b159cbfafe1f0",
  instanceType: "t3.mediummm", // Type error: not a valid instance type
});
```

### Shared Libraries

Package infrastructure patterns as npm/PyPI packages:

```typescript
// Reusable module as a TypeScript class
export class StandardVpc extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);
    // Standard VPC configuration
  }
}
```

Teams import and use it like any library dependency. Versioning, changelogs, and breaking change detection come from the language ecosystem.

## Where HCL Wins

### Readability for Infrastructure

HCL was designed to be readable by people who are not programmers. A `resource` block is self-documenting:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs"
}
```

The CDKTF equivalent requires understanding classes, constructors, and object-oriented patterns.

### Community Ecosystem

99% of Terraform modules on the registry are HCL. Examples, tutorials, and Stack Overflow answers are HCL. Using CDKTF means translating constantly.

### Plan Readability

`terraform plan` output maps directly to HCL resource blocks. With CDKTF, the plan references generated resource names that are harder to trace back to source code.

### Simpler Mental Model

HCL is declarative: "this is what I want." CDKTF is imperative: "this is how to build what I want." Declarative is easier to reason about for infrastructure state.

## Decision Guide

**Choose HCL if:**
- Your team includes non-programmers (SREs, sysadmins)
- Infrastructure is straightforward (standard cloud resources)
- You want maximum community support and examples
- Simplicity matters more than flexibility

**Choose CDKTF if:**
- Your team is developer-heavy (TypeScript/Python is their primary language)
- You need complex logic, loops, and abstractions
- You want to share infrastructure patterns as packages
- Type safety is important for your workflow

---

Ready to go deeper? Master Terraform from scratch with our hands-on course at [CopyPasteLearn](/courses/terraform-beginners).
