---
title: "Git Guide for DevOps Engineers"
description: "Essential Git workflows for DevOps: branching strategies, interactive rebasing, cherry-picking, bisect debugging, and CI/CD integration."
date: "2026-04-15"
author: "Luca Berton"
category: "Development"
tags: ["Git", "DevOps", "CI/CD", "Version Control", "Best Practices"]
excerpt: "Essential Git workflows for DevOps: branching strategies, rebasing, cherry-picking, bisect, and CI/CD integration."
---

## Branching Strategy

### Trunk-Based Development

Best for teams with CI/CD. Everyone works on short-lived branches off `main`:

```bash
git checkout -b fix/broken-deploy
# Make changes, push, create PR
git push origin fix/broken-deploy
# After review, squash merge to main
```

Rules:
- Branches live less than 24 hours
- Every merge triggers CI/CD
- Feature flags hide incomplete work

### GitFlow

For projects with scheduled releases:

```bash
# Feature branch
git checkout -b feature/new-api develop

# Release branch
git checkout -b release/1.2.0 develop

# Hotfix
git checkout -b hotfix/security-patch main
```

## Rebase vs Merge

```bash
# Merge — preserves history, creates merge commit
git checkout main
git merge feature-branch

# Rebase — linear history, cleaner log
git checkout feature-branch
git rebase main
git checkout main
git merge feature-branch  # Fast-forward
```

**Use rebase** for feature branches before merging. **Use merge** for shared branches (main, develop).

## Interactive Rebase

Clean up commits before PR:

```bash
git rebase -i HEAD~3
```

```
pick abc1234 Add initial config
squash def5678 Fix typo in config
squash ghi9012 Add missing field
```

Result: three commits become one clean commit.

## Cherry-Pick

Apply a specific commit to another branch:

```bash
# Hotfix: apply one commit from develop to main
git checkout main
git cherry-pick abc1234

# Cherry-pick without committing (stage only)
git cherry-pick --no-commit abc1234
```

## Bisect

Find which commit introduced a bug:

```bash
git bisect start
git bisect bad          # Current commit is broken
git bisect good v1.0.0  # This tag was working

# Git checks out a middle commit — test it
# Then mark it:
git bisect good  # or git bisect bad

# Repeat until Git finds the culprit
git bisect reset  # Return to original branch
```

## Stash

Save uncommitted work temporarily:

```bash
git stash
git stash list
git stash pop        # Apply and remove
git stash apply      # Apply and keep
git stash drop       # Remove without applying
```

## Undo Mistakes

```bash
# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Undo last commit (keep changes unstaged)
git reset --mixed HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo a pushed commit (creates new commit)
git revert abc1234

# Recover deleted branch
git reflog
git checkout -b recovered abc1234
```

## Hooks for CI/CD

**Pre-commit hook** — lint before committing:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
terraform fmt -check
if [ $? -ne 0 ]; then
  echo "Run 'terraform fmt' before committing"
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

**Use with Husky** for team-wide hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  }
}
```

## .gitignore for DevOps

```
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfplan

# Ansible
*.retry
inventory/*.cache

# Docker
docker-compose.override.yml

# Secrets
.env
*.pem
*.key
vault_pass.txt
```

## Related Posts

- [Terraform CI/CD Pipelines](/blog/terraform-cicd-pipelines) for IaC automation
- [GitHub Actions CI/CD for Terraform](/blog/github-actions-terraform-cicd) for GitHub-specific workflows
- [Infrastructure as Code Explained](/blog/infrastructure-as-code-explained) for IaC fundamentals
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Git for DevOps Engineers as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Git, DevOps, CI/CD, Version Control. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Git for DevOps Engineers?

Use it when you need a practical, repeatable way to handle Git, DevOps, CI/CD, Version Control work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.
