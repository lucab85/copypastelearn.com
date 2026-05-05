---
title: "Grafana Loki Log Aggregation Guide"
date: "2026-03-18"
description: "Grafana Loki indexes log metadata instead of full text, making it cost-effective for Kubernetes log aggregation. Learn how to deploy Loki, query with LogQL, and replace ELK for most use cases."
category: "DevOps"
tags: ["loki", "Grafana", "logging", "kubernetes", "observability", "logql"]
author: "Luca Berton"
---

Elasticsearch indexes every word in every log line. Loki indexes only the labels (metadata) and stores log lines as compressed chunks. This makes Loki 10-100x cheaper to operate for the same volume of logs.

## How Loki Differs from ELK

| Aspect | ELK Stack | Grafana Loki |
|--------|----------|-------------|
| Indexing | Full-text on every field | Labels only (like Prometheus) |
| Storage cost | High (inverted index) | Low (compressed chunks) |
| Query speed | Fast for any field | Fast for labels, grep for content |
| Resource usage | Heavy (JVM, memory) | Light |
| Operations | Complex (shards, replicas) | Simple |
| Query language | KQL/Lucene | LogQL (PromQL-like) |

## Installation

```bash
# Helm install with defaults
helm install loki grafana/loki-stack \
  --namespace monitoring --create-namespace \
  --set promtail.enabled=true \
  --set grafana.enabled=true
```

This deploys:
- **Loki** — log storage and query engine
- **Promtail** — agent that ships logs from pods to Loki
- **Grafana** — visualization

## LogQL Basics

LogQL feels like PromQL for logs:

```logql
# All logs from the order-api
{app="order-api"}

# Filter for errors
{app="order-api"} |= "error"

# Exclude health checks
{app="order-api"} != "/health"

# Parse JSON logs and filter
{app="order-api"} | json | status_code >= 500

# Count errors per minute
count_over_time({app="order-api"} |= "error" [1m])

# Error rate as percentage
sum(rate({app="order-api"} |= "error" [5m]))
/
sum(rate({app="order-api"} [5m]))
* 100
```

## Promtail Configuration

Promtail runs as a DaemonSet and automatically discovers pod logs:

```yaml
# promtail-config.yaml
scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
    pipeline_stages:
      - docker: {}
      - json:
          expressions:
            level: level
            msg: message
      - labels:
          level:
```

Labels are the key to Loki's performance. Choose labels that have low cardinality: `app`, `namespace`, `environment`, `level`. Do not use high-cardinality values like `user_id` or `request_id` as labels.

## Alerting with LogQL

```yaml
# Loki ruler config
groups:
  - name: application-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({app="order-api"} |= "error" [5m])) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in order-api"
          description: "More than 10 errors per second for 5 minutes"
```

## Structured Logging Best Practices

Loki works best with structured (JSON) logs:

```json
{"timestamp":"2026-03-18T10:00:00Z","level":"error","service":"order-api","msg":"payment failed","order_id":"12345","error":"timeout"}
```

Query structured fields:

```logql
{app="order-api"} | json | level="error" | msg="payment failed"
```

Avoid unstructured logs like `Error: something went wrong at line 42`. They require regex parsing, which is slower.

## Storage Backends

```yaml
# Loki config for S3 storage
storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    shared_store: s3
  aws:
    s3: s3://eu-west-1/my-loki-bucket
    bucketnames: my-loki-bucket
    region: eu-west-1
```

Loki stores chunks in object storage (S3, GCS, Azure Blob). Index metadata stays in BoltDB or TSDB. This separation keeps costs low — object storage is cheap.

## When to Choose Loki

**Use Loki when:**
- You already use Grafana and Prometheus
- Log volume is high but query needs are label-based
- Budget matters (Loki is dramatically cheaper than Elasticsearch)
- You need a simple, maintainable logging stack

**Use Elasticsearch when:**
- You need full-text search across all fields
- Complex analytics and aggregations on log data
- You need sub-second queries on arbitrary fields
- Compliance requires indexed, searchable audit logs

For most Kubernetes logging needs, Loki is sufficient and far simpler to operate.

---

Ready to go deeper? Build your observability stack with hands-on courses at [CopyPasteLearn](/courses).
