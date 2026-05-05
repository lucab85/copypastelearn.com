---
title: "Kubernetes Helm Hooks and Testing"
slug: "kubernetes-helm-hooks-testing"
date: "2026-01-31"
category: "DevOps"
tags: ["helm", "kubernetes", "testing", "Hooks", "DevOps"]
excerpt: "Use Helm hooks for pre-install migrations, post-deploy tests, and rollback safety. Plus helm test, helm lint, and chart testing in CI."
description: "Use Helm hooks for database migrations, post-deploy verification, and rollback safety. Plus helm test and CI pipeline strategies."
author: "Luca Berton"
---

Helm hooks run jobs at specific points in a release lifecycle — database migrations before upgrades, smoke tests after deploys, cleanup on deletion. Combined with built-in testing, they make Helm releases reliable.

## Hook Types

| Hook | When It Runs |
|---|---|
| `pre-install` | Before any resources are created |
| `post-install` | After all resources are created |
| `pre-upgrade` | Before an upgrade |
| `post-upgrade` | After an upgrade |
| `pre-delete` | Before deletion begins |
| `post-delete` | After all resources are deleted |
| `pre-rollback` | Before a rollback |
| `post-rollback` | After a rollback |
| `test` | When `helm test` is run |

## Database Migration Hook

```yaml
# templates/migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-migrate
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          command: ["python", "manage.py", "migrate", "--no-input"]
          envFrom:
            - secretRef:
                name: {{ .Release.Name }}-db-credentials
      restartPolicy: Never
  backoffLimit: 3
  ttlSecondsAfterFinished: 600
```

### Hook Weight

Controls execution order when multiple hooks exist:

```yaml
# Run first (lower weight = earlier)
"helm.sh/hook-weight": "-5"

# Run second
"helm.sh/hook-weight": "0"

# Run last
"helm.sh/hook-weight": "10"
```

### Delete Policies

| Policy | Behavior |
|---|---|
| `before-hook-creation` | Delete previous hook resource before creating new one |
| `hook-succeeded` | Delete after hook succeeds |
| `hook-failed` | Delete after hook fails |

Use `before-hook-creation` for jobs — prevents "job already exists" errors on repeated upgrades.

## Post-Deploy Smoke Test Hook

```yaml
# templates/post-deploy-test.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-smoke-test
  annotations:
    "helm.sh/hook": post-upgrade,post-install
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      containers:
        - name: smoke
          image: curlimages/curl:latest
          command:
            - /bin/sh
            - -c
            - |
              echo "Waiting for service..."
              sleep 10
              STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://{{ .Release.Name }}:{{ .Values.service.port }}/health)
              if [ "$STATUS" = "200" ]; then
                echo "Health check passed"
                exit 0
              else
                echo "Health check failed with status $STATUS"
                exit 1
              fi
      restartPolicy: Never
  backoffLimit: 3
```

## Helm Test

Test resources run with `helm test <release>`:

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: {{ .Release.Name }}-test
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: test
      image: curlimages/curl:latest
      command:
        - /bin/sh
        - -c
        - |
          # Test health endpoint
          curl -sf http://{{ .Release.Name }}:{{ .Values.service.port }}/health || exit 1

          # Test API responds
          curl -sf http://{{ .Release.Name }}:{{ .Values.service.port }}/api/v1/status || exit 1

          # Test database connectivity (via app)
          curl -sf http://{{ .Release.Name }}:{{ .Values.service.port }}/api/v1/health/db || exit 1

          echo "All tests passed"
  restartPolicy: Never
```

```bash
helm test my-release
# NAME: my-release
# LAST DEPLOYED: ...
# STATUS: deployed
# TEST SUITE:     my-release-test
# Last Started:   ...
# Last Completed: ...
# Phase:          Succeeded
```

## Chart Linting

```bash
# Basic lint
helm lint ./my-chart

# Lint with values
helm lint ./my-chart -f values-production.yaml

# Template rendering check
helm template my-release ./my-chart -f values-production.yaml > /dev/null
```

## CI/CD Testing

### GitHub Actions

```yaml
name: Helm CI
on:
  pull_request:
    paths:
      - 'charts/**'

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: azure/setup-helm@v4

      - name: Lint chart
        run: helm lint charts/my-app

      - name: Template check
        run: |
          helm template test charts/my-app -f charts/my-app/values.yaml > /dev/null
          helm template test charts/my-app -f charts/my-app/ci/production-values.yaml > /dev/null

      - name: Install chart-testing
        uses: helm/chart-testing-action@v2

      - name: Run chart-testing
        run: ct lint --charts charts/my-app

      - name: Create kind cluster
        uses: helm/kind-action@v1

      - name: Install and test
        run: |
          helm install test charts/my-app --wait --timeout 120s
          helm test test
```

### chart-testing (ct)

```bash
# Lint changed charts
ct lint --all

# Install and test changed charts
ct install --all

# With custom config
ct lint --config ct.yaml
```

```yaml
# ct.yaml
target-branch: main
chart-dirs:
  - charts
helm-extra-args: --timeout 120s
```

## Pre-Delete Cleanup Hook

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-cleanup
  annotations:
    "helm.sh/hook": pre-delete
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
        - name: cleanup
          image: bitnami/kubectl
          command:
            - /bin/sh
            - -c
            - |
              echo "Draining connections..."
              kubectl annotate svc {{ .Release.Name }} service.kubernetes.io/drain="true"
              sleep 30
              echo "Cleanup complete"
      serviceAccountName: {{ .Release.Name }}-cleanup-sa
      restartPolicy: Never
```

## Rollback Safety

```yaml
# pre-rollback hook — snapshot before rollback
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-pre-rollback-backup
  annotations:
    "helm.sh/hook": pre-rollback
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      containers:
        - name: backup
          image: postgres:16-alpine
          command:
            - /bin/sh
            - -c
            - pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > /backups/pre-rollback-$(date +%s).sql.gz
          envFrom:
            - secretRef:
                name: {{ .Release.Name }}-db-credentials
      restartPolicy: Never
```

```bash
# Rollback with confidence
helm rollback my-release 3
# pre-rollback hook runs backup first, then rollback proceeds
```

## Best Practices

| Practice | Why |
|---|---|
| Always set `hook-delete-policy` | Prevents stale job resources |
| Use `before-hook-creation` for jobs | Avoids "already exists" errors |
| Keep hooks idempotent | May run multiple times on retries |
| Set `backoffLimit` and `ttl` | Prevent infinite retries and resource accumulation |
| Put tests in `templates/tests/` | Convention for `helm test` resources |
| Test with multiple value files | Catch missing defaults in CI |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Helm-based ML platform deployment. **Terraform for Beginners** teaches infrastructure automation. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

