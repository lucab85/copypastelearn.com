---
title: "Pulumi Infrastructure as Code Guide"
date: "2026-04-02"
description: "Pulumi lets you write infrastructure in TypeScript, Python, Go, or C# with full programming language features. Learn how Pulumi works, how it compares to Terraform, and when to use it."
category: "DevOps"
tags: ["pulumi", "infrastructure-as-code", "typescript", "devops", "cloud", "automation"]
---

Pulumi uses real programming languages for infrastructure instead of domain-specific languages like HCL. If you already write TypeScript or Python, you can write infrastructure without learning a new syntax.

## How Pulumi Works

```typescript
import * as aws from "@pulumi/aws";

// Create a VPC
const vpc = new aws.ec2.Vpc("main", {
  cidrBlock: "10.0.0.0/16",
  tags: { Name: "production" },
});

// Create a subnet
const subnet = new aws.ec2.Subnet("public", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: "eu-west-1a",
});

// Create an EC2 instance
const server = new aws.ec2.Instance("web", {
  ami: "ami-0c55b159cbfafe1f0",
  instanceType: "t3.medium",
  subnetId: subnet.id,
});

// Export the public IP
export const publicIp = server.publicIp;
```

```bash
pulumi up
# Previews changes, then applies on confirmation
```

This is TypeScript. You get autocompletion, type checking, refactoring tools, and the full npm ecosystem.

## Pulumi vs Terraform

| Feature | Pulumi | Terraform |
|---------|--------|-----------|
| Language | TypeScript, Python, Go, C#, Java | HCL |
| State management | Pulumi Cloud (free tier) or self-managed | S3, Consul, Terraform Cloud |
| Secret management | Built-in encryption | External (Vault, SOPS) |
| Testing | Standard test frameworks (Jest, pytest) | terraform test (limited) |
| IDE support | Full (any IDE) | HCL plugins |
| Community modules | Growing | Massive registry |
| Learning curve | Know your language → productive immediately | Must learn HCL |

## Programming Language Advantages

### Loops and Conditionals

```typescript
// Create instances across availability zones
const azs = ["eu-west-1a", "eu-west-1b", "eu-west-1c"];

const subnets = azs.map((az, i) =>
  new aws.ec2.Subnet(`subnet-${i}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i}.0/24`,
    availabilityZone: az,
  })
);
```

### Reusable Components

```typescript
// components/vpc.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface VpcArgs {
  cidrBlock: string;
  azCount: number;
}

export class StandardVpc extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly subnets: aws.ec2.Subnet[];

  constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:StandardVpc", name, {}, opts);

    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.cidrBlock,
    }, { parent: this });

    this.subnets = Array.from({ length: args.azCount }, (_, i) =>
      new aws.ec2.Subnet(`${name}-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
      }, { parent: this })
    );
  }
}
```

Share components as npm packages with proper versioning and type definitions.

### Testing

```typescript
// __tests__/infra.test.ts
import * as pulumi from "@pulumi/pulumi";
import { StandardVpc } from "../components/vpc";

describe("StandardVpc", () => {
  it("creates the correct number of subnets", async () => {
    const vpc = new StandardVpc("test", {
      cidrBlock: "10.0.0.0/16",
      azCount: 3,
    });

    const subnets = await pulumi.output(vpc.subnets).promise();
    expect(subnets).toHaveLength(3);
  });
});
```

Use Jest, pytest, or Go testing — the same frameworks your team already knows.

## Built-in Secrets

Pulumi encrypts secrets in state by default:

```typescript
const config = new pulumi.Config();
const dbPassword = config.requireSecret("dbPassword");

new aws.rds.Instance("db", {
  password: dbPassword, // encrypted in state
});
```

```bash
# Set a secret
pulumi config set --secret dbPassword "my-secure-password"
```

No external secret manager needed for basic use cases.

## When to Choose Pulumi

**Good fit:**
- Developer-heavy teams (TypeScript/Python is the primary skill)
- Complex infrastructure with lots of conditional logic
- Teams that want infrastructure tested like application code
- Projects where infrastructure and application code share a monorepo
- Need built-in secret encryption

**Better with Terraform:**
- Ops-heavy teams more comfortable with declarative config
- Need the massive Terraform module registry
- Organization already standardized on Terraform
- Simple infrastructure that does not need programming language features

---

Ready to go deeper? Learn infrastructure as code with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
