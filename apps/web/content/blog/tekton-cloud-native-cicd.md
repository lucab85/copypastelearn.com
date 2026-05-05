---
title: "Tekton Cloud Native CI/CD"
date: "2026-03-31"
description: "Tekton runs CI/CD pipelines as Kubernetes custom resources. Learn how Tekton works, how to build pipelines with Tasks and Pipelines, and when to choose it over Jenkins or GitHub Actions."
category: "DevOps"
tags: ["tekton", "cicd", "kubernetes", "pipelines", "cloud-native", "Automation"]
author: "Luca Berton"
---

Tekton runs CI/CD pipelines natively on Kubernetes. Each step runs in a container. Each pipeline is a Kubernetes custom resource. If your infrastructure is Kubernetes, your CI/CD can be too.

## Core Concepts

### Tasks

A Task is a sequence of steps that run in containers:

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: build-and-push
spec:
  params:
    - name: image
      type: string
  workspaces:
    - name: source
  steps:
    - name: build
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=Dockerfile
        - --destination=$(params.image)
        - --context=dir://$(workspaces.source.path)
```

### Pipelines

A Pipeline chains Tasks together:

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: ci-pipeline
spec:
  params:
    - name: repo-url
      type: string
    - name: image
      type: string
  workspaces:
    - name: shared-workspace
  tasks:
    - name: clone
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.repo-url)
      workspaces:
        - name: output
          workspace: shared-workspace

    - name: test
      runAfter: ["clone"]
      taskRef:
        name: run-tests
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: build
      runAfter: ["test"]
      taskRef:
        name: build-and-push
      params:
        - name: image
          value: $(params.image)
      workspaces:
        - name: source
          workspace: shared-workspace
```

### PipelineRuns

A PipelineRun executes a Pipeline with specific parameters:

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: ci-run-
spec:
  pipelineRef:
    name: ci-pipeline
  params:
    - name: repo-url
      value: https://github.com/myorg/my-app
    - name: image
      value: ghcr.io/myorg/my-app:latest
  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 1Gi
```

## Installation

```bash
# Install Tekton Pipelines
kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml

# Install Tekton Triggers (for webhooks)
kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# Install Tekton Dashboard
kubectl apply -f https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# Install CLI
brew install tektoncd-cli
```

## Triggers: Webhook-Driven Pipelines

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: github-listener
spec:
  triggers:
    - name: github-push
      bindings:
        - ref: github-push-binding
      template:
        ref: ci-pipeline-template
```

Push to GitHub → webhook fires → EventListener creates a PipelineRun → pipeline executes.

## Tekton vs Other CI Systems

| Feature | Tekton | GitHub Actions | Jenkins |
|---------|--------|---------------|---------|
| Runs on | Kubernetes | GitHub cloud | Anywhere |
| Definition | Kubernetes YAML | GitHub YAML | Groovy/YAML |
| Scaling | Kubernetes-native | GitHub-managed | Manual |
| Self-hosted | Yes (required) | Optional | Yes |
| Reusable tasks | Tekton Hub | Marketplace | Plugin system |
| Vendor lock-in | None (K8s standard) | GitHub | None |

## When to Choose Tekton

**Good fit:**
- Your infrastructure is Kubernetes-first
- You need complete control over CI/CD infrastructure
- Compliance requires self-hosted CI/CD
- You want CI/CD pipelines as Kubernetes resources (GitOps-managed)
- Multi-cloud environments where vendor-neutral CI matters

**Not ideal:**
- Small teams without Kubernetes expertise
- Projects already using GitHub Actions effectively
- Teams that prefer managed CI/CD over self-hosted

Tekton is powerful but operationally heavy. You are running a CI/CD platform, not just using one.

---

Ready to go deeper? Learn Kubernetes and CI/CD with hands-on courses at [CopyPasteLearn](/courses).
