---
title: "Argo Events Kubernetes Automation"
date: "2026-02-15"
description: "Argo Events triggers Kubernetes workflows from webhooks, message queues, S3 uploads, and cron schedules. Learn how to build event-driven automation pipelines with sensors and triggers."
category: "DevOps"
tags: ["argo-events", "kubernetes", "event-driven", "Automation", "webhooks", "workflows"]
author: "Luca Berton"
---

A file lands in S3. A webhook fires from GitHub. A message appears in Kafka. Something needs to happen. Argo Events listens for these events and triggers Kubernetes workflows, jobs, or any API call in response.

## Architecture

```
Event Source → Sensor → Trigger → Action
(GitHub webhook)  (filter)  (fire)   (Argo Workflow, K8s Job, HTTP call)
```

- **EventSource**: Listens for events (webhooks, S3, Kafka, cron, etc.)
- **Sensor**: Evaluates event filters and triggers actions
- **Trigger**: Defines what happens (create a workflow, call an API, etc.)

## Installation

```bash
kubectl create namespace argo-events
kubectl apply -n argo-events -f \
  https://raw.githubusercontent.com/argoproj/argo-events/stable/manifests/install.yaml
```

## Webhook Event Source

```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata:
  name: github-webhook
  namespace: argo-events
spec:
  webhook:
    push:
      port: "12000"
      endpoint: /push
      method: POST
```

Configure GitHub to send push events to this endpoint.

## Sensor with Trigger

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata:
  name: deploy-on-push
  namespace: argo-events
spec:
  dependencies:
    - name: push-event
      eventSourceName: github-webhook
      eventName: push
      filters:
        data:
          - path: body.ref
            type: string
            value:
              - "refs/heads/main"
  triggers:
    - template:
        name: run-deploy-workflow
        argoWorkflow:
          operation: submit
          source:
            resource:
              apiVersion: argoproj.io/v1alpha1
              kind: Workflow
              metadata:
                generateName: deploy-
              spec:
                entrypoint: deploy
                arguments:
                  parameters:
                    - name: commit
                      value: ""
                templates:
                  - name: deploy
                    container:
                      image: myorg/deployer:latest
                      command: ["./deploy.sh"]
                      args: ["{{inputs.parameters.commit}}"]
          parameters:
            - src:
                dependencyName: push-event
                dataKey: body.after
              dest: spec.arguments.parameters.0.value
```

Push to `main` → sensor fires → Argo Workflow deploys with the commit SHA.

## S3 Event Source

```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata:
  name: s3-uploads
spec:
  s3:
    new-data:
      bucket:
        name: raw-data
      events:
        - s3:ObjectCreated:*
      filter:
        suffix: ".csv"
      endpoint: minio.storage:9000
      insecure: true
      accessKey:
        name: minio-creds
        key: accesskey
      secretKey:
        name: minio-creds
        key: secretkey
```

New CSV file in S3 → trigger a data processing workflow.

## Kafka Event Source

```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata:
  name: kafka-events
spec:
  kafka:
    orders:
      url: kafka-broker.messaging:9092
      topic: order-events
      consumerGroup:
        groupName: argo-events
      jsonBody: true
```

## Cron Event Source

```yaml
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata:
  name: scheduled
spec:
  calendar:
    nightly-report:
      schedule: "0 2 * * *"
      timezone: "Europe/Rome"
    weekly-cleanup:
      schedule: "0 4 * * 0"
      timezone: "Europe/Rome"
```

## Multiple Dependencies

Trigger only when multiple events occur:

```yaml
spec:
  dependencies:
    - name: tests-passed
      eventSourceName: ci-webhook
      eventName: tests
      filters:
        data:
          - path: body.status
            type: string
            value: ["success"]
    - name: security-scan
      eventSourceName: ci-webhook
      eventName: security
      filters:
        data:
          - path: body.status
            type: string
            value: ["clean"]
  triggers:
    - template:
        name: deploy-after-checks
        conditions: "tests-passed && security-scan"
        # Only triggers when BOTH events have fired
```

## Trigger Types

| Trigger | Action |
|---------|--------|
| Argo Workflow | Submit a workflow |
| Kubernetes | Create any K8s resource (Job, Pod, ConfigMap) |
| HTTP | Call any HTTP endpoint |
| AWS Lambda | Invoke a Lambda function |
| Slack | Send a notification |
| Log | Write to sensor logs |

## When to Use Argo Events

**Good fit:**
- Event-driven CI/CD (deploy on push, test on PR)
- Data pipelines (process files when they arrive)
- Cross-service automation (react to Kafka/SQS messages)
- Scheduled jobs with complex dependencies

**Not needed:**
- Simple cron jobs (use Kubernetes CronJob)
- Single-trigger CI/CD (use GitHub Actions directly)
- Teams not already using Kubernetes

---

Ready to go deeper? Master Kubernetes automation with hands-on courses at [CopyPasteLearn](/courses).
