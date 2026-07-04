---
title: "Terraform for Beginners Guide"
description: "Everything you need to know to start using Terraform for Infrastructure as Code. From installation to your first deployment on AWS."
date: "2026-02-27"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "IaC", "AWS"]
---

Provisioning cloud infrastructure by hand doesn't scale past a couple of resources. Clicking through the AWS console to create a bucket, a VPC, and a few IAM roles works the first time, but the second time someone forgets a checkbox, environments drift apart silently, and there's no diff anyone can review before the change goes live. Infrastructure as Code fixes this by turning your infrastructure into plain text files: they're reviewable in a pull request, repeatable across environments, and versioned like any other code you ship. Terraform is the tool most teams reach for first, because it's cloud-agnostic and doesn't lock you into a single provider's own tooling.

## What Is Terraform?

Terraform is an open-source Infrastructure as Code (IaC) tool by HashiCorp. Instead of clicking through cloud consoles, you write declarative configuration files that describe your infrastructure — and Terraform makes it real. "Declarative" is the key word: you describe the end state you want, and Terraform figures out the sequence of API calls needed to get there, rather than you scripting each step yourself.

## Why Terraform?

- **Cloud-agnostic** — works with AWS, Azure, GCP, and 3,000+ providers
- **Declarative** — describe *what* you want, not *how* to build it
- **State management** — tracks what exists and what needs to change
- **Plan before apply** — preview changes before they happen
- **Modular** — reuse infrastructure patterns across projects

## Prerequisites

Before you start, make sure you have the following in place:

- **A cloud account with credentials.** This guide targets AWS, so you'll need an AWS account and either an access key/secret pair or an SSO profile with permissions to create the resources you're testing with (S3, in this case).
- **The Terraform CLI installed.** See the installation steps below for your operating system — there's no separate runtime or dependency to manage beyond keeping the binary on your `PATH`.
- **Basic familiarity with YAML- or HCL-style configuration.** Terraform's configuration language, HCL, looks a lot like YAML: key-value pairs, nested blocks, no semicolons. If you've written a Kubernetes manifest or a CI pipeline file before, the syntax will feel familiar even though the semantics — resources, providers, state — are different.

## How It Works

Terraform's core loop is plan, then apply. When you run `terraform plan`, Terraform reads your configuration files and compares them against its **state** — a record of what it believes already exists in your cloud account — and computes a diff: what needs to be created, changed, or destroyed to make reality match your config. Nothing is touched yet; `plan` is read-only by design, which is exactly why you run it before every change. Only `terraform apply` actually calls the cloud provider's API to make those changes, and then it updates state to reflect the new reality. That state file is Terraform's single source of truth for what it's managing between runs. Lose it — delete it, or let two people apply from divergent local copies — and Terraform has no reliable way to know what it already created; it can end up trying to recreate resources that already exist or losing track of infrastructure it should be managing.

## Installing Terraform

The CLI itself is a single static binary, so installation is mostly a matter of getting it onto your `PATH` through whatever package manager your OS already uses.

```bash
# macOS
brew install hashicorp/tap/terraform

# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Verify
terraform version
```

`terraform version` isn't just a sanity check — note the version it prints, because you'll want to pin it (or at least a compatible range) in your configuration so that a `terraform init` on a teammate's laptop, or in CI, doesn't silently pull down a newer CLI with different default behavior than the one you tested against.

## Your First Configuration

Create a file called `main.tf`. A Terraform configuration is just one or more `.tf` files in a directory — there's no mandatory project layout for an example this small. The `provider` block tells Terraform which API to talk to and where; each `resource` block then declares one specific object you want to exist. This is the distinction that trips up a lot of first-timers: a **resource** is a single infrastructure object (one bucket, one instance, one security group), while a **module** is a reusable bundle of multiple resources wired together. You don't need modules yet — reach for them once you find yourself copy-pasting the same handful of resources across environments.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-first-terraform-bucket"

  tags = {
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
```

Look closely at `version = "~> 5.0"` on the AWS provider. That constraint says "any 5.x release is fine, but never jump to 6.0 automatically." Skipping a constraint like this is one of the most common ways a configuration that worked fine last month starts behaving strangely today, with no changes of your own to explain it — the provider simply moved underneath you.

## The Terraform Workflow

Each of the commands below maps to a distinct phase of the workflow, and running them out of order — or skipping straight to `apply` — is the single most common way a beginner changes something they didn't mean to touch.

```bash
terraform init      # Download providers
terraform plan      # Preview changes
terraform apply     # Create resources
terraform destroy   # Tear everything down
```

`terraform init` is what actually downloads the provider plugin declared in your `required_providers` block (the AWS provider here) and sets up the local `.terraform` directory; you need to rerun it whenever you add a new provider or module source. `terraform plan` is cheap and non-destructive, so make it a habit to run it before every `apply`, even for changes that feel trivial — it's your only chance to catch a typo'd bucket name or a resource about to be destroyed instead of updated. `terraform destroy` deserves the same caution as any other `apply`, because that's exactly what it is under the hood: a normal apply that happens to remove things rather than create them, and it will do so without asking twice.

## Common Pitfalls

A few mistakes catch nearly every Terraform beginner at some point:

- **Committing the state file to git.** `terraform.tfstate` can contain sensitive values — passwords, keys, connection strings — in plain text, and if two people apply from different local copies of state you'll end up with conflicting, corrupted state. Add it to `.gitignore` from day one, and move to a remote backend (S3 with a DynamoDB lock table, Terraform Cloud, etc.) as soon as more than one person touches the same configuration.
- **Not pinning provider versions.** Omitting the `version` constraint means `terraform init` can pull in a newer provider release with breaking changes on an ordinary Tuesday, with nothing in your own diff to explain why `plan` suddenly wants to replace half your infrastructure.
- **Skipping `terraform fmt` and `terraform validate`.** `fmt` rewrites your files into Terraform's canonical formatting so diffs stay small and reviewable instead of full of whitespace noise; `validate` catches syntax errors and type mismatches before you burn time waiting on a `plan` that was never going to succeed. Both run in a fraction of a second, so there's little reason not to run them before every commit.

## Next Steps

This is just the beginning. Our [Terraform for Beginners course](/courses) covers HCL, state management, modules, security, and real AWS deployments hands-on.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.
