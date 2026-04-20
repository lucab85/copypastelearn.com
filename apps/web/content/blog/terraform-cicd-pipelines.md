---
title: "Terraform CI/CD Pipelines"
description: "Build CI/CD pipelines for Terraform using GitHub Actions. Automate plan, apply, and destroy workflows with safety checks."
date: "2026-02-19"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "CI/CD", "GitHub Actions"]
---

## Why Automate Terraform?

Manual `terraform apply` works for learning. In production, you need:

- Automated planning on pull requests
- Approval gates before applying
- Consistent environments
- Audit trails

## GitHub Actions Workflow

```yaml
name: Terraform
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0

      - name: Terraform Init
        run: terraform init
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -out=tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Comment PR with Plan
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const plan = `${{ steps.plan.outputs.stdout }}`;
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## Terraform Plan\n\`\`\`\n${plan}\n\`\`\``
            });

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Safety Checks

1. **Format check** — enforces consistent style
2. **Validate** — catches syntax errors
3. **Plan on PR** — reviewers see what will change
4. **Apply only on main** — no accidental deployments from branches
5. **Plan output as PR comment** — visibility for reviewers

## Environment Separation

```yaml
jobs:
  deploy-staging:
    environment: staging
    steps:
      - run: terraform workspace select staging

  deploy-prod:
    needs: deploy-staging
    environment: production
    steps:
      - run: terraform workspace select prod
```

## Best Practices

1. **Never auto-apply without review** for production
2. **Use OIDC** instead of long-lived AWS keys
3. **Lock state** to prevent concurrent applies
4. **Pin Terraform version** across all environments
5. **Store plan artifacts** for audit trails

## Learn More

Build production CI/CD workflows for Terraform in our [Terraform for Beginners course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

