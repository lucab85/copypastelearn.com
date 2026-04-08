---
title: "GitHub Actions CI/CD for Terraform"
description: "Automate Terraform with GitHub Actions. Plan on PR, apply on merge, state locking, and secrets management."
date: "2026-04-13"
author: "Luca Berton"
category: "DevOps"
tags: ["GitHub Actions", "Terraform", "CI/CD", "IaC", "DevOps"]
excerpt: "Automate Terraform with GitHub Actions. Plan on PR, apply on merge, state locking, and secrets management."
---

## The Workflow

Plan on every pull request. Apply only when merged to main. This gives you code review for infrastructure changes.

```yaml
name: Terraform
on:
  pull_request:
    paths: ['infra/**']
  push:
    branches: [main]
    paths: ['infra/**']

permissions:
  contents: read
  pull-requests: write

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.8

      - name: Terraform Init
        run: terraform init
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -out=tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Required Secrets

Add these in GitHub → Settings → Secrets:

- `AWS_ACCESS_KEY_ID` — IAM user with deployment permissions
- `AWS_SECRET_ACCESS_KEY` — corresponding secret key

For other clouds, use the equivalent credentials (GCP service account JSON, Azure service principal).

## Remote State Backend

Store state in S3 with DynamoDB locking:

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

The CI runner reads and writes state through the same backend. DynamoDB prevents concurrent applies.

## Multi-Environment

Use workspaces or matrix strategy:

```yaml
jobs:
  terraform:
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - name: Terraform Plan
        run: |
          terraform workspace select ${{ matrix.environment }} || \
          terraform workspace new ${{ matrix.environment }}
          terraform plan -var-file="envs/${{ matrix.environment }}.tfvars"
```

## Drift Detection

Schedule a daily plan to detect manual changes:

```yaml
on:
  schedule:
    - cron: '0 8 * * *'

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - name: Check for drift
        run: |
          terraform plan -detailed-exitcode -no-color || echo "DRIFT DETECTED"
```

Exit code 2 means changes detected — pipe this to Slack or email.

## Security Tips

- **Never store state locally** in CI — always use a remote backend
- **Use OIDC** instead of static credentials when possible
- **Limit IAM permissions** to only what Terraform needs
- **Pin provider versions** to avoid surprise breaking changes
- **Review plans** before merging — automated apply trusts your review process

## Related Posts

- [Terraform CI/CD Pipelines](/blog/terraform-cicd-pipelines) for more CI patterns
- [Terraform Variables and Outputs](/blog/terraform-variables-outputs-guide) for parameterization
- [Terraform Security Practices](/blog/terraform-security-best-practices) for hardening
