---
title: "GitHub Actions CI/CD Advanced Guide"
slug: "github-actions-cicd-advanced-guide"
date: "2026-02-15"
category: "DevOps"
tags: ["GitHub Actions", "CI/CD", "Automation", "DevOps", "testing"]
excerpt: "Advanced GitHub Actions patterns. Matrix builds, reusable workflows, caching, artifacts, environment protection, and self-hosted runners."
description: "Advanced GitHub Actions for CI/CD. Matrix builds, reusable workflows, dependency caching, artifacts, environments, and self-hosted runners."
author: "Luca Berton"
---

GitHub Actions handles everything from running tests to deploying to production. Once you move beyond basic workflows, these patterns keep your CI/CD fast and maintainable.

## Matrix Builds

Test across multiple versions and platforms in parallel:

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          - os: macos-latest
            node: 18
        include:
          - os: ubuntu-latest
            node: 22
            coverage: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
      - if: matrix.coverage
        run: npm run test:coverage
```

## Caching

Speed up builds by caching dependencies:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'npm'  # Built-in caching

# Or manual caching for more control
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Docker Layer Caching

```yaml
- uses: docker/build-push-action@v6
  with:
    push: true
    tags: my-app:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Reusable Workflows

Define once, use everywhere:

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '22'
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: npm test
```

Call from another workflow:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '22'
    secrets: inherit
```

## Environment Protection

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: echo "Deploying to staging"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com
    steps:
      - run: echo "Deploying to production"
```

Configure in GitHub Settings → Environments:
- **Required reviewers**: Approval before deploy
- **Wait timer**: Delay (e.g., 30 minutes)
- **Branch protection**: Only `main` can deploy to production
- **Environment secrets**: Production-only API keys

## Artifacts

Share data between jobs:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: npx vercel deploy dist/ --prod
```

## Conditional Jobs

```yaml
jobs:
  lint:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - run: ./release.sh
```

## Concurrency Control

Prevent duplicate deployments:

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true  # Cancel previous run for same branch
```

## Composite Actions

Package multiple steps into a reusable action:

```yaml
# .github/actions/setup-project/action.yml
name: Setup Project
description: Install dependencies and build
inputs:
  node-version:
    default: '22'
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: npm
    - run: npm ci
      shell: bash
    - run: npm run build
      shell: bash
```

Use it:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-project
    with:
      node-version: '22'
  - run: npm test
```

## Path Filtering

Only run when relevant files change:

```yaml
on:
  push:
    paths:
      - 'apps/web/**'
      - 'packages/shared/**'
      - 'package.json'
    paths-ignore:
      - '**.md'
      - '.github/ISSUE_TEMPLATE/**'
```

## Self-Hosted Runners

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]
    steps:
      - uses: actions/checkout@v4
      - run: nvidia-smi  # GPU available!
      - run: python train.py
```

## Complete Production Workflow

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint
    uses: ./.github/workflows/reusable-test.yml
    secrets: inherit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
      - run: ./deploy.sh
```

## What's Next?

Our **Docker Fundamentals** course covers CI/CD with containers. **Terraform for Beginners** teaches infrastructure automation with GitHub Actions. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

