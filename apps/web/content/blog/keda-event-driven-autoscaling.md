---
title: "KEDA Event-Driven Autoscaling"
date: "2026-03-29"
description: "KEDA scales Kubernetes workloads based on external events like queue depth, HTTP requests, or cron schedules. Learn how to set up KEDA scalers and scale to zero."
category: "DevOps"
tags: ["keda", "kubernetes", "autoscaling", "event-driven", "serverless", "scaling"]
author: "Luca Berton"
---

Horizontal Pod Autoscaler (HPA) scales based on CPU and memory. KEDA scales based on anything: message queue depth, database query count, HTTP request rate, cron schedules, or custom metrics from any source.

## What KEDA Adds

KEDA is a Kubernetes operator that extends HPA with external event sources. It can scale deployments from zero to N pods based on events:

```
0 messages in queue → 0 pods (scale to zero)
50 messages → 5 pods
500 messages → 50 pods
0 messages again → 0 pods
```

HPA cannot scale to zero. KEDA can. This is the key difference for event-driven workloads.

## Installation

```bash
helm install keda kedacore/keda \
  --namespace keda --create-namespace
```

## ScaledObject: The Core Concept

A ScaledObject connects a Kubernetes workload to an event source:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-processor
spec:
  scaleTargetRef:
    name: order-processor
  pollingInterval: 15
  cooldownPeriod: 60
  minReplicaCount: 0
  maxReplicaCount: 100
  triggers:
    - type: rabbitmq
      metadata:
        queueName: orders
        queueLength: "10"
        host: amqp://rabbitmq.default.svc:5672
```

This scales `order-processor` based on the `orders` queue in RabbitMQ. For every 10 messages, KEDA adds one pod. When the queue is empty, it scales to zero.

## Common Scalers

### AWS SQS

```yaml
triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.eu-west-1.amazonaws.com/123456/orders
      queueLength: "5"
      awsRegion: eu-west-1
    authenticationRef:
      name: aws-credentials
```

### Kafka

```yaml
triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka.default.svc:9092
      consumerGroup: order-consumers
      topic: orders
      lagThreshold: "100"
```

### PostgreSQL

```yaml
triggers:
  - type: postgresql
    metadata:
      connectionFromEnv: PG_CONNECTION
      query: "SELECT COUNT(*) FROM jobs WHERE status = 'pending'"
      targetQueryValue: "10"
```

### Cron

```yaml
triggers:
  - type: cron
    metadata:
      timezone: Europe/Rome
      start: 0 8 * * 1-5
      end: 0 18 * * 1-5
      desiredReplicas: "5"
```

Scale to 5 replicas during business hours, scale down outside.

### HTTP

```yaml
triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc:9090
      query: sum(rate(http_requests_total{service="api"}[2m]))
      threshold: "100"
```

Scale based on HTTP request rate via Prometheus metrics.

## Scale to Zero

KEDA's scale-to-zero saves significant cost for bursty workloads:

```yaml
spec:
  minReplicaCount: 0    # Scale to zero when idle
  cooldownPeriod: 300   # Wait 5 minutes before scaling to zero
```

When the first event arrives after a scale-to-zero, KEDA spins up a pod in seconds. The first event may experience latency (cold start), but subsequent events are handled by warm pods.

For workloads that are idle 80% of the time, scale-to-zero reduces compute costs by up to 80%.

## ScaledJob for Batch Work

For one-shot jobs (not long-running deployments):

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: batch-processor
spec:
  jobTargetRef:
    template:
      spec:
        containers:
          - name: processor
            image: myorg/batch-processor:latest
        restartPolicy: Never
  triggers:
    - type: aws-sqs-queue
      metadata:
        queueURL: https://sqs.eu-west-1.amazonaws.com/123456/batch-jobs
        queueLength: "1"
  maxReplicaCount: 50
```

Each message creates a Kubernetes Job. Jobs run to completion and are cleaned up automatically.

## When to Use KEDA

**Good fit:**
- Queue-based workloads (SQS, RabbitMQ, Kafka consumers)
- Batch processing that should scale to zero when idle
- Cron-based scaling (business hours, weekly reports)
- Any workload where CPU/memory does not reflect actual demand

**Not needed:**
- Steady-state services with predictable load (HPA is sufficient)
- Workloads that must always have minimum replicas running

---

Ready to go deeper? Master Kubernetes scaling with hands-on courses at [CopyPasteLearn](/courses).
