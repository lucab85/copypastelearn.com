---
title: "Renovate Automated Dependency Updates"
date: "2026-03-17"
description: "Renovate automatically creates pull requests for dependency updates across npm, pip, Docker, Terraform, and Helm. Learn how to configure Renovate for safe, automated dependency management."
category: "Development"
tags: ["renovate", "dependencies", "automation", "cicd", "security", "developer-tools"]
---

Outdated dependencies are security vulnerabilities waiting to happen. Renovate watches your repos and creates pull requests for every update — automatically, on schedule, with changelogs and compatibility scores.

## How Renovate Works

Renovate scans your repo for dependency files (`package.json`, `requirements.txt`, `Dockerfile`, `terraform.tf`, `Chart.yaml`, etc.), checks for updates, and creates one PR per update:

```
Renovate scans repo → finds outdated dep → creates PR → CI runs → you merge (or automerge)
```

## Setup

### GitHub App (easiest)

Install the [Renovate GitHub App](https://github.com/apps/renovate) on your repos. Add a config file:

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"]
}
```

That is the minimal setup. Renovate starts creating PRs within minutes.

### Self-Hosted

```bash
# Run as a Docker container
docker run --rm \
  -e RENOVATE_TOKEN=ghp_xxx \
  -e RENOVATE_REPOSITORIES='["myorg/myapp"]' \
  renovate/renovate
```

## Configuration

### Group Related Updates

```json
{
  "packageRules": [
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript type definitions"
    },
    {
      "matchPackagePatterns": ["eslint"],
      "groupName": "ESLint and plugins"
    },
    {
      "matchManagers": ["dockerfile"],
      "groupName": "Docker base images"
    }
  ]
}
```

Instead of 15 separate PRs for ESLint plugins, you get one.

### Automerge Safe Updates

```json
{
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["minor"],
      "matchPackagePatterns": ["^eslint"],
      "automerge": true
    }
  ]
}
```

Patch updates automerge after CI passes. Type definitions automerge. Minor ESLint updates automerge. Major versions require manual review.

### Schedule Updates

```json
{
  "schedule": ["before 8am on Monday"],
  "timezone": "Europe/Rome"
}
```

All PRs created Monday morning. Review and merge during the week.

### Pin Dependencies

```json
{
  "rangeStrategy": "pin"
}
```

Converts `^1.2.3` to `1.2.3`. Every update becomes an explicit PR. Maximum reproducibility.

## What Renovate Updates

| File | Package Manager |
|------|----------------|
| `package.json` | npm, yarn, pnpm |
| `requirements.txt` | pip |
| `Pipfile` | pipenv |
| `pyproject.toml` | poetry |
| `go.mod` | Go modules |
| `Dockerfile` | Docker images |
| `docker-compose.yml` | Docker images |
| `.terraform.lock.hcl` | Terraform providers |
| `Chart.yaml` | Helm charts |
| `.github/workflows/*.yml` | GitHub Actions |
| `Gemfile` | Ruby gems |

Over 70 package managers supported.

## PR Quality

Each Renovate PR includes:

- **Version diff**: `1.2.3 → 1.3.0`
- **Changelog**: Extracted from GitHub releases
- **Merge confidence**: Based on adoption rate and age
- **CI status**: Your tests run automatically

```markdown
## [1.3.0](https://github.com/pkg/releases/tag/v1.3.0)
### Features
- Added streaming support
### Bug Fixes  
- Fixed memory leak in connection pool

**Merge confidence**: High (87% of users updated within 3 days)
```

## Renovate vs Dependabot

| Feature | Renovate | Dependabot |
|---------|---------|-----------|
| Managers | 70+ | ~15 |
| Grouping | Flexible rules | Limited |
| Automerge | Built-in | Requires GitHub Actions |
| Scheduling | Cron-like | Weekly/daily/monthly |
| Config | Highly customizable | Basic |
| Self-hosted | Yes | No (GitHub only) |

Renovate is more powerful and flexible. Dependabot is simpler and built into GitHub. For polyglot repos or complex dependency strategies, Renovate wins.

---

Ready to go deeper? Automate your development workflows with hands-on courses at [CopyPasteLearn](/courses).
