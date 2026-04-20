---
title: "CI/CD Pipeline Tutorial from Scratch"
slug: "cicd-pipeline-tutorial-scratch"
date: "2026-03-20"
category: "DevOps"
tags: ["CI/CD", "GitHub Actions", "DevOps", "Automation", "Pipeline"]
excerpt: "Build a complete CI/CD pipeline from scratch with GitHub Actions. Lint, test, build, deploy — automated on every push."
description: "Build a complete CI/CD pipeline from scratch with GitHub Actions. Lint, test, build, and deploy your application — fully automated on every push to your repository."
---

A CI/CD pipeline automates the journey from code commit to production deployment. This tutorial builds one step by step using GitHub Actions.

## What CI/CD Means

**Continuous Integration (CI)**: Automatically build and test code on every push. Catch bugs before they reach the main branch.

**Continuous Delivery (CD)**: Automatically deploy tested code to staging or production. Reduce manual deployment steps to zero.

## Pipeline Architecture

```
Push Code → Lint → Test → Build → Deploy Staging → Deploy Production
                                        ↑                    ↑
                                   Automatic            Manual gate
                                   (on PR merge)        (on release tag)
```

## Step 1: Basic CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

## Step 2: Add Docker Build

```yaml
  docker:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Step 3: Deploy to Staging

```yaml
  deploy-staging:
    runs-on: ubuntu-latest
    needs: docker
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          kubectl set image deployment/app \
            app=ghcr.io/${{ github.repository }}:${{ github.sha }}
        env:
          KUBECONFIG_DATA: ${{ secrets.STAGING_KUBECONFIG }}

      - name: Wait for rollout
        run: kubectl rollout status deployment/app --timeout=120s

      - name: Smoke test
        run: |
          STAGING_URL="${{ vars.STAGING_URL }}"
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/health")
          if [ "$STATUS" != "200" ]; then
            echo "Smoke test failed: HTTP $STATUS"
            exit 1
          fi
```

## Step 4: Deploy to Production

```yaml
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://app.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          kubectl set image deployment/app \
            app=ghcr.io/${{ github.repository }}:${{ github.sha }}
        env:
          KUBECONFIG_DATA: ${{ secrets.PROD_KUBECONFIG }}

      - name: Wait for rollout
        run: kubectl rollout status deployment/app --timeout=180s

      - name: Health check
        run: |
          for i in {1..5}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://app.example.com/health")
            if [ "$STATUS" = "200" ]; then exit 0; fi
            sleep 10
          done
          echo "Health check failed"
          exit 1
```

## Step 5: Notifications

```yaml
      - name: Notify on success
        if: success()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {"text": "✅ Deployed ${{ github.sha }} to production"}

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {"text": "❌ Deploy failed for ${{ github.sha }}"}
```

## Complete Pipeline Diagram

```
PR opened
  └─ lint → test → build (feedback on PR)

PR merged to main
  └─ lint → test → build → docker → staging → production
                                        │          │
                                    automatic   approval gate
```

## Pipeline Best Practices

| Practice | Why |
|---|---|
| Cache dependencies | Faster builds (npm ci with cache) |
| Parallel jobs | Lint and type-check run simultaneously |
| Fail fast | Lint before test before build |
| Pin action versions | `actions/checkout@v4` not `@main` |
| Use environments | Separate secrets per environment |
| Approval gates | Manual approval for production |
| Smoke tests | Verify deployment actually works |
| Rollback plan | Automated rollback on health check failure |

## Matrix Builds

Test across multiple versions:

```yaml
  test:
    strategy:
      matrix:
        node-version: [20, 22]
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

## What's Next?

Our **Docker Fundamentals** course includes a full CI/CD module covering container builds, registry management, and automated deployment pipelines. Our **Terraform for Beginners** course teaches infrastructure provisioning that integrates with CI/CD. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

