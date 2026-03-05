---
title: "Terraform for Beginners Guide"
description: "Everything you need to know to start using Terraform for Infrastructure as Code. From installation to your first deployment on AWS."
date: "2026-02-27"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "IaC", "AWS"]
---

## What Is Terraform?

Terraform is an open-source Infrastructure as Code (IaC) tool by HashiCorp. Instead of clicking through cloud consoles, you write declarative configuration files that describe your infrastructure — and Terraform makes it real.

## Why Terraform?

- **Cloud-agnostic** — works with AWS, Azure, GCP, and 3,000+ providers
- **Declarative** — describe *what* you want, not *how* to build it
- **State management** — tracks what exists and what needs to change
- **Plan before apply** — preview changes before they happen
- **Modular** — reuse infrastructure patterns across projects

## Installing Terraform

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

## Your First Configuration

Create a file called `main.tf`:

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

## The Terraform Workflow

```bash
terraform init      # Download providers
terraform plan      # Preview changes
terraform apply     # Create resources
terraform destroy   # Tear everything down
```

## Next Steps

This is just the beginning. Our [Terraform for Beginners course](/courses) covers HCL, state management, modules, security, and real AWS deployments hands-on.
