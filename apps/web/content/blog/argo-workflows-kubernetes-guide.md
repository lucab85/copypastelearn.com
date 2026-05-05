---
title: "Argo Workflows Kubernetes Guide"
date: "2026-03-26"
description: "Argo Workflows runs complex DAG-based workflows on Kubernetes. Learn how to build multi-step pipelines for data processing, ML training, CI/CD, and infrastructure automation."
category: "DevOps"
tags: ["argo-workflows", "kubernetes", "workflows", "dag", "Automation", "data-pipelines"]
author: "Luca Berton"
---

Argo Workflows is a Kubernetes-native workflow engine for orchestrating parallel jobs. Each step runs in a container. Steps can form DAGs (directed acyclic graphs) with dependencies, retries, and conditional execution.

## When to Use Argo Workflows

- **Data pipelines** — ETL jobs that process data through multiple stages
- **ML training** — hyperparameter tuning, model training, evaluation in parallel
- **CI/CD** — build pipelines with complex dependency graphs
- **Infrastructure automation** — multi-step provisioning with rollback

## Installation

```bash
kubectl create namespace argo
kubectl apply -n argo -f \
  https://github.com/argoproj/argo-workflows/releases/latest/download/install.yaml

# Install CLI
brew install argo
```

## Simple Workflow

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: hello-
spec:
  entrypoint: main
  templates:
    - name: main
      steps:
        - - name: step1
            template: echo
            arguments:
              parameters:
                - name: message
                  value: "Step 1 complete"
        - - name: step2
            template: echo
            arguments:
              parameters:
                - name: message
                  value: "Step 2 complete"

    - name: echo
      inputs:
        parameters:
          - name: message
      container:
        image: alpine:3.19
        command: [echo]
        args: ["{{inputs.parameters.message}}"]
```

Steps in the same list item run in parallel. Steps in sequential list items run after the previous completes.

## DAG Workflows

For complex dependency graphs:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: data-pipeline-
spec:
  entrypoint: pipeline
  templates:
    - name: pipeline
      dag:
        tasks:
          - name: extract
            template: run-job
            arguments:
              parameters: [{name: stage, value: extract}]

          - name: transform-users
            depends: "extract"
            template: run-job
            arguments:
              parameters: [{name: stage, value: transform-users}]

          - name: transform-orders
            depends: "extract"
            template: run-job
            arguments:
              parameters: [{name: stage, value: transform-orders}]

          - name: load
            depends: "transform-users && transform-orders"
            template: run-job
            arguments:
              parameters: [{name: stage, value: load}]

    - name: run-job
      inputs:
        parameters: [{name: stage}]
      container:
        image: myorg/data-pipeline:latest
        command: [python, run.py]
        args: ["--stage", "{{inputs.parameters.stage}}"]
```

`extract` runs first. `transform-users` and `transform-orders` run in parallel. `load` runs after both transforms complete.

## Artifacts

Pass data between steps:

```yaml
templates:
  - name: generate-data
    container:
      image: python:3.12
      command: [python, -c]
      args: ["import json; json.dump({'count': 42}, open('/tmp/data.json', 'w'))"]
    outputs:
      artifacts:
        - name: data
          path: /tmp/data.json

  - name: process-data
    inputs:
      artifacts:
        - name: data
          path: /tmp/input.json
    container:
      image: python:3.12
      command: [python, -c]
      args: ["import json; d=json.load(open('/tmp/input.json')); print(f'Count: {d[\"count\"]}')"]
```

Artifacts are stored in S3/GCS/Minio between steps.

## Retries and Timeouts

```yaml
- name: flaky-step
  retryStrategy:
    limit: 3
    retryPolicy: Always
    backoff:
      duration: "10s"
      factor: 2
      maxDuration: "1m"
  activeDeadlineSeconds: 300
  container:
    image: myorg/processor:latest
```

Retry up to 3 times with exponential backoff. Timeout after 5 minutes.

## Cron Workflows

Schedule recurring workflows:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: CronWorkflow
metadata:
  name: nightly-etl
spec:
  schedule: "0 2 * * *"
  timezone: "Europe/Rome"
  workflowSpec:
    entrypoint: pipeline
    templates:
      - name: pipeline
        dag:
          tasks:
            # ... same as above
```

## Argo Workflows vs Alternatives

| Tool | Strength | Limitation |
|------|----------|-----------|
| Argo Workflows | K8s-native, DAGs, artifacts | Requires Kubernetes |
| Apache Airflow | Mature, Python DSL, rich ecosystem | Heavy, not K8s-native |
| Tekton | CI/CD focused, K8s-native | Less suited for data pipelines |
| GitHub Actions | SaaS, easy to start | Not self-hosted, limited DAGs |

Choose Argo Workflows when you need complex, Kubernetes-native workflow orchestration with parallel execution and artifact passing.

---

Ready to go deeper? Master Kubernetes orchestration with hands-on courses at [CopyPasteLearn](/courses).
