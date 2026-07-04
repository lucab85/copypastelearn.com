---
title: "Terraform Security Practices"
description: "Secure your Terraform workflows — manage secrets, control access, encrypt state, and implement policy-as-code for safe infrastructure deployments."
date: "2026-02-21"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "Security", "Production"]
---

## Why Terraform Security Matters

Terraform manages your infrastructure — it has the keys to your kingdom. A misconfigured Terraform setup can expose secrets, create insecure resources, or grant excessive permissions. The failure mode is rarely dramatic: someone commits a `.tf` file with a hardcoded database password, a `terraform.tfstate` file with plaintext credentials ends up in a public S3 bucket or a shared git repo, or a CI pipeline runs `terraform apply` with an IAM role broad enough to touch every resource in the account. None of this requires an attacker to be sophisticated — it just requires the state file or the git history to be readable by the wrong person.

This matters more for Terraform than for regular application code because Terraform state is not source code — it's a snapshot of your live infrastructure, including every attribute Terraform needs to manage that infrastructure, which for many providers means secrets in plaintext. Treat state the same way you'd treat a backup of your production database, not the same way you'd treat a config file.

**Prerequisites:** this guide assumes you already have a working Terraform setup — some existing configuration, a backend you're using today, and at least one environment you'd call "production" in some sense. You should also be familiar with your cloud provider's IAM model (AWS IAM, GCP IAM, or Azure RBAC) since the least-privilege section below depends on understanding how roles, policies, and permission boundaries work in whichever provider you're targeting.

## Secret Management

Terraform needs to read and write sensitive values — database passwords, API keys, TLS private keys — as part of managing resources. Where those values live, and how they get into Terraform's hands, determines whether a leaked laptop or a misconfigured repo turns into an incident. The three patterns below move from worst to best.

### Never hardcode secrets

```hcl
# BAD — secret in code
resource "aws_db_instance" "main" {
  password = "super-secret-password"
}

# GOOD — use variables
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}
```

Marking a variable `sensitive = true` stops Terraform from printing the value in plan and apply output, but it does not encrypt anything — the raw value still lands in the state file. It's a UI safeguard against shoulder-surfing in a terminal or CI log, not a security control on its own.

### Use environment variables

```bash
export TF_VAR_db_password="your-secret"
terraform apply
```

This keeps the secret out of your `.tf` files and out of your shell history if you source it from a `.env` file that's gitignored, but it's still a manual step someone has to remember, and the value still ends up in state. Treat this as a stepping stone toward a secrets manager, not an end state for anything you'd call production.

### Use a secrets manager

```hcl
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/db-password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db.secret_string
}
```

This is the pattern to standardize on. The secret is created and rotated outside of Terraform, and Terraform only ever reads a reference to it at apply time. Rotation, access auditing, and revocation all become the secrets manager's job instead of something you bolt onto your Terraform workflow. The tradeoff is that the value still gets written into state once Terraform reads it — which is exactly why state security, covered next, isn't optional even if you've done secret management perfectly.

## State Security

State files contain all resource data, including secrets. This isn't a bug or an edge case — it's how Terraform works. To know whether a resource needs to change on the next apply, Terraform has to remember every attribute it set, and for many providers that includes the password, token, or key you passed in. A `terraform.tfstate` file for a database instance will contain that database's password in plaintext unless the backend itself encrypts it. If that file sits in a git repo, an unencrypted S3 bucket, or a laptop's local disk, every secret Terraform has ever touched for that resource is sitting there in the clear.

This is why "remote backend" and "encrypted backend" are not the same thing, and why access control on the backend matters as much as the encryption setting. A remote backend solves the problem of team members clobbering each other's local state — it does nothing for security unless you also lock down who can read the bucket or blob container and turn on encryption at rest and in transit. An S3 bucket with public-read accidentally enabled is functionally the same risk as committing secrets to GitHub, just with an extra step.

1. **Encrypt state at rest** — enable S3 bucket encryption
2. **Encrypt in transit** — use HTTPS for remote backends
3. **Restrict access** — IAM policies on state bucket
4. **Enable versioning** — recover from state corruption

```hcl
terraform {
  backend "s3" {
    bucket  = "my-state"
    key     = "prod/terraform.tfstate"
    encrypt = true
  }
}
```

Versioning deserves a specific callout: it's a security control, not just a convenience feature. If state gets corrupted, overwritten by a bad apply, or maliciously tampered with, versioning is what lets you roll back to a known-good state file instead of trying to reverse-engineer your infrastructure's actual configuration from the cloud console.

## Least Privilege IAM

Least privilege is the easiest principle to state and the hardest to actually implement for a Terraform service account. The core problem is that `terraform plan` is read-only and safe to run with broad permissions, but `terraform apply` needs to create, modify, and delete whatever resources are in your configuration — which in practice means the apply identity ends up needing something close to full access to every service Terraform manages, because you can't always predict in advance which resource types a future change will touch.

Scoping IAM permissions down to exactly what today's configuration needs is a losing game: every new resource type in a future PR either breaks the pipeline with an access-denied error or forces someone to widen the policy again, and widening under time pressure is how permissions creep back to `*`. The permission boundary below (region-restricted, but still `ec2:*` and `s3:*`) reflects that reality — it's a reasonable middle ground, not a gold standard.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "eu-west-1"
        }
      }
    }
  ]
}
```

The practical way out of this bind is to stop treating "the Terraform identity" as one thing. Split plan from apply across your pipeline: a narrowly-scoped, read-only identity runs `terraform plan` on every PR and posts the diff for review, while the broader apply identity only runs after a human approves that diff, ideally gated behind a manual approval step in CI rather than triggered automatically on merge. That approval gate is doing the work that IAM scoping alone can't — it's a human checking that the blast radius of this specific change is acceptable, not a policy trying to predict it in advance.

## Pre-Commit Checks

```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_checkov
```

Tools like tfsec and checkov are static analyzers — they scan your `.tf` files for known-bad patterns: an S3 bucket without encryption, a security group open to `0.0.0.0/0`, an IAM policy with a wildcard action and wildcard resource. They're genuinely good at catching that class of mistake before it ever reaches a plan or apply, and running them as a pre-commit hook means the feedback loop is seconds, not a failed CI job ten minutes later.

What they can't catch is anything that depends on runtime context or human judgment: a wildcard IAM policy that's actually necessary for the reasons described above, a secret that's syntactically fine but was pasted into the wrong variable, or a resource configuration that's secure in isolation but insecure given how another team is using it downstream. Pre-commit hooks are a floor, not a ceiling — they stop the obvious mistakes from landing, but they don't replace a plan review or an understanding of what the change actually does.

## Security Checklist

Use this as a gate before every apply to a shared or production environment, not as a reference list you read once and forget. The cheapest time to catch a problem is before `terraform apply` runs against real infrastructure — after that, you're doing incident response instead of code review. Walk through these items during plan review, not after something has already broken.

1. No secrets in code or state
2. Remote state encrypted with restricted access
3. Least-privilege IAM for Terraform
4. `terraform plan` review before every apply
5. Pre-commit hooks for validation
6. Audit trail via version control
7. Separate state per environment

## Learn More

Implement production security practices in our [Terraform for Beginners course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

