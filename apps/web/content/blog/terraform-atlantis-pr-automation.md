---
title: "Terraform Atlantis Pull Request Automation"
date: "2026-03-15"
description: "Atlantis automates Terraform plan and apply through pull request comments. Learn how to set up Atlantis for team-based infrastructure changes with automated plans, locking, and audit trails."
category: "DevOps"
tags: ["atlantis", "Terraform", "pull-requests", "Automation", "gitops", "infrastructure-as-code"]
author: "Luca Berton"
---

Running `terraform apply` from a laptop is fine for side projects. For teams, it creates problems: no audit trail, no review process, and "who ran apply last?" becomes a daily question. Atlantis moves Terraform into pull requests.

## How Atlantis Works

```
Developer opens PR → Atlantis runs terraform plan → Posts plan as PR comment
                                                          ↓
                                    Reviewer approves → Comment "atlantis apply" → Applied
```

Every infrastructure change is visible, reviewed, and recorded in Git history.

## Installation

```bash
# Docker
docker run -p 4141:4141 \
  ghcr.io/runatlantis/atlantis:latest server \
  --gh-user=atlantis-bot \
  --gh-token=ghp_xxx \
  --gh-webhook-secret=webhook-secret \
  --repo-allowlist='github.com/myorg/*'
```

```yaml
# Kubernetes Helm
helm install atlantis runatlantis/atlantis \
  --set github.user=atlantis-bot \
  --set github.token=ghp_xxx \
  --set github.secret=webhook-secret \
  --set orgAllowlist='github.com/myorg/*'
```

Configure a GitHub webhook pointing to `https://atlantis.myorg.com/events`.

## Workflow

Open a PR that changes Terraform files. Atlantis automatically comments:

```
Ran Plan for dir: `environments/production`

<details>
<summary>Show Output</summary>

Terraform will perform the following actions:

  # aws_instance.web will be updated in-place
  ~ resource "aws_instance" "web" {
      ~ instance_type = "t3.medium" -> "t3.large"
    }

Plan: 0 to add, 1 to change, 0 to destroy.
</details>

* :arrow_forward: To **apply** this plan, comment: `atlantis apply -d environments/production`
```

Everyone on the PR sees exactly what will change before it is applied.

## Repository Configuration

```yaml
# atlantis.yaml (in repo root)
version: 3
projects:
  - name: production
    dir: environments/production
    workflow: default
    autoplan:
      when_modified: ["*.tf", "*.tfvars", "../modules/**/*.tf"]
      enabled: true
    apply_requirements: [approved, mergeable]

  - name: staging
    dir: environments/staging
    workflow: default
    autoplan:
      when_modified: ["*.tf", "*.tfvars", "../modules/**/*.tf"]
      enabled: true
```

`apply_requirements` ensures production changes need PR approval before `atlantis apply` works.

## Locking

Atlantis locks a project directory when a plan is active. If two PRs modify the same Terraform directory, the second PR sees:

```
⚠️ This project is currently locked by PR #42.
Wait for that PR to be merged or closed.
```

No more concurrent apply conflicts.

## Server-Side Configuration

```yaml
# repos.yaml (server-side)
repos:
  - id: github.com/myorg/*
    apply_requirements: [approved, mergeable]
    allowed_overrides: [workflow]
    allow_custom_workflows: true

  - id: github.com/myorg/infrastructure
    apply_requirements: [approved, mergeable, undiverged]
    workflow: production
    
workflows:
  production:
    plan:
      steps:
        - init
        - run: tflint
        - plan
    apply:
      steps:
        - apply
```

Add linting, policy checks, or custom scripts as workflow steps.

## Commands

| Comment | Action |
|---------|--------|
| `atlantis plan` | Run plan for all modified projects |
| `atlantis plan -d envs/prod` | Plan specific directory |
| `atlantis apply` | Apply all planned projects |
| `atlantis apply -d envs/prod` | Apply specific directory |
| `atlantis unlock` | Release locks on this PR |

## Security Considerations

Atlantis needs cloud credentials to run Terraform. Secure them:

```yaml
# Use IRSA on EKS
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456:role/atlantis

# Or Workload Identity on GKE
serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: atlantis@project.iam.gserviceaccount.com
```

Never store cloud credentials as environment variables in the Atlantis deployment. Use cloud-native identity federation.

## Atlantis vs Terraform Cloud

| Feature | Atlantis | Terraform Cloud |
|---------|---------|----------------|
| Cost | Free (self-hosted) | Free tier + paid |
| Hosting | Self-managed | SaaS |
| PR integration | Native (GitHub, GitLab, Bitbucket) | GitHub, GitLab |
| State management | External (S3, etc.) | Built-in |
| Policy as code | Custom workflow steps | Sentinel |
| Operational burden | You manage it | HashiCorp manages it |

Atlantis is free and flexible but requires operational effort. Terraform Cloud is managed but costs money at scale.

---

Ready to go deeper? Master Terraform workflows with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
