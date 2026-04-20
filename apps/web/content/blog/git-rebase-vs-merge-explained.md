---
title: "Git Rebase vs Merge Explained"
slug: "git-rebase-vs-merge-explained"
date: "2026-01-26"
category: "Development"
tags: ["Git", "Rebase", "Merge", "Version Control", "Development"]
excerpt: "Understand Git rebase vs merge. When to use each, interactive rebase, squash workflows, and team conventions for clean history."
description: "Git rebase vs merge explained with practical examples. When to use each approach, interactive rebase workflows, squash commits, and team convention recommendations."
---

Merge preserves history as it happened. Rebase rewrites history to be linear. Both combine branches — the choice affects how your Git log reads.

## Merge

```bash
git checkout main
git merge feature-branch
```

```
Before:
main:    A → B → C
feature:      ↘ D → E

After merge:
main:    A → B → C → M (merge commit)
feature:      ↘ D → E ↗
```

- Creates a merge commit
- Preserves all branch history
- Non-destructive (no rewriting)

## Rebase

```bash
git checkout feature-branch
git rebase main
```

```
Before:
main:    A → B → C
feature:      ↘ D → E

After rebase:
main:    A → B → C
feature:              → D' → E' (replayed on top of C)
```

Then fast-forward merge:

```bash
git checkout main
git merge feature-branch  # Fast-forward, no merge commit
```

```
main: A → B → C → D' → E'
```

- Linear history
- Rewrites commit hashes
- Looks like work happened sequentially

## When to Use Each

| Use Merge | Use Rebase |
|---|---|
| Public/shared branches | Local/personal branches |
| Preserving branch context matters | Clean linear history wanted |
| Team default (safer) | Before opening a PR |
| Release branches | Updating feature branch with main |

### The Golden Rule

**Never rebase commits that have been pushed and shared with others.** Rebase rewrites history — if someone else has those commits, their history diverges from yours.

## Interactive Rebase

Clean up commits before merging:

```bash
git rebase -i HEAD~4  # Last 4 commits
```

Editor opens:

```
pick abc1234 Add user model
pick def5678 Fix typo in user model
pick ghi9012 Add user controller
pick jkl3456 Fix lint errors
```

Change to:

```
pick abc1234 Add user model
fixup def5678 Fix typo in user model
pick ghi9012 Add user controller
fixup jkl3456 Fix lint errors
```

| Command | Effect |
|---|---|
| `pick` | Keep commit as-is |
| `reword` | Keep commit, edit message |
| `squash` | Combine with previous, edit combined message |
| `fixup` | Combine with previous, discard this message |
| `drop` | Remove commit entirely |
| `edit` | Pause to amend the commit |

Result: 2 clean commits instead of 4 messy ones.

## Squash Merge

GitHub/GitLab squash merge combines an entire PR into one commit:

```bash
# Or via CLI
git checkout main
git merge --squash feature-branch
git commit -m "feat: add user management (#42)"
```

```
Before:
feature: D → E → F → G (4 WIP commits)

After squash merge to main:
main: A → B → C → S (one clean commit)
```

Best for: Teams that want one commit per feature/PR.

## Common Workflows

### Rebase Before PR

```bash
# On your feature branch
git fetch origin
git rebase origin/main

# Fix any conflicts
git add .
git rebase --continue

# Force push (only your branch!)
git push --force-with-lease origin feature-branch
```

`--force-with-lease` is safer than `--force` — it fails if someone else pushed to your branch.

### Keep Feature Branch Updated

```bash
# Option 1: Rebase (clean history)
git checkout feature-branch
git rebase main

# Option 2: Merge (preserves context)
git checkout feature-branch
git merge main
```

### Fixing Conflicts During Rebase

```bash
git rebase main
# CONFLICT in file.ts

# Fix the conflict
vim file.ts
git add file.ts
git rebase --continue

# Or abort and go back
git rebase --abort
```

## Team Conventions

### Convention 1: Squash Merge (Most Common)

```
- Develop on feature branches (messy commits OK)
- PR review
- Squash merge to main (one clean commit)
- Delete feature branch
```

Pros: Clean main history, developers can commit freely.

### Convention 2: Rebase + Merge

```
- Develop on feature branches
- Interactive rebase to clean up before PR
- Fast-forward merge to main
- Delete feature branch
```

Pros: Each commit is meaningful, bisect-friendly.

### Convention 3: Merge Commits

```
- Develop on feature branches
- PR review
- Merge commit to main
- Delete feature branch
```

Pros: Full context preserved, easiest workflow.

## Useful Commands

```bash
# Undo last merge (before push)
git reset --hard HEAD~1

# Undo rebase
git reflog
git reset --hard HEAD@{2}  # Go back to pre-rebase state

# Cherry-pick specific commit
git cherry-pick abc1234

# Amend last commit
git commit --amend

# Autosquash (fixup commits)
git commit --fixup abc1234
git rebase -i --autosquash main
```

## What's Next?

Our **Node.js REST APIs** course uses Git workflows throughout the project. **Docker Fundamentals** covers version control for containerized apps. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

