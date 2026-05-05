---
title: "Grafana Mimir Scalable Metrics Store"
date: "2026-01-26"
description: "Grafana Mimir stores Prometheus metrics at massive scale using object storage. Learn how Mimir compares to Thanos and Cortex, and how to deploy it for multi-tenant long-term metrics."
category: "DevOps"
tags: ["grafana-mimir", "Prometheus", "metrics", "observability", "long-term-storage", "Monitoring"]
author: "Luca Berton"
---

Prometheus was not built for long-term storage or multi-tenancy. Mimir was. It ingests Prometheus metrics via remote write, stores them in S3, and serves queries across years of data from multiple tenants.

## Architecture

```
Prometheus → remote_write → Mimir Distributor → Ingester → Object Storage (S3)
                                                                    ↑
                                     Mimir Querier ← Grafana ← User Query
```

Mimir is horizontally scalable. Each component scales independently:

- **Distributor**: Receives incoming metrics, validates, distributes to ingesters
- **Ingester**: Batches samples, writes blocks to object storage
- **Querier**: Reads from ingesters (recent) and object storage (historical)
- **Compactor**: Merges and deduplicates blocks
- **Store-gateway**: Serves historical blocks from object storage

## Installation

```bash
helm install mimir grafana/mimir-distributed \
  --namespace monitoring --create-namespace \
  --set minio.enabled=true  # Built-in MinIO for testing
```

For production, point to your S3 bucket:

```yaml
# values.yaml
mimir:
  structuredConfig:
    common:
      storage:
        backend: s3
        s3:
          endpoint: s3.eu-west-1.amazonaws.com
          bucket_name: mimir-metrics
          region: eu-west-1
```

## Configure Prometheus

```yaml
# prometheus.yml
remote_write:
  - url: http://mimir-distributor.monitoring:8080/api/v1/push
    headers:
      X-Scope-OrgID: myorg
```

That is it. Prometheus pushes all metrics to Mimir. Local retention can be reduced to hours.

## Multi-Tenancy

```yaml
# Team A's Prometheus
remote_write:
  - url: http://mimir:8080/api/v1/push
    headers:
      X-Scope-OrgID: team-a

# Team B's Prometheus
remote_write:
  - url: http://mimir:8080/api/v1/push
    headers:
      X-Scope-OrgID: team-b
```

Each tenant's data is isolated. Team A cannot query team B's metrics. One Mimir cluster, many teams.

## Grafana Configuration

```yaml
datasources:
  - name: Mimir
    type: prometheus
    url: http://mimir-querier.monitoring:8080/prometheus
    jsonData:
      httpHeaderName1: X-Scope-OrgID
    secureJsonData:
      httpHeaderValue1: myorg
```

Grafana queries Mimir using standard PromQL. All existing dashboards work without changes.

## Limits and Quotas

```yaml
mimir:
  structuredConfig:
    limits:
      # Per-tenant limits
      ingestion_rate: 100000          # Samples per second
      ingestion_burst_size: 200000
      max_series_per_user: 5000000    # Active time series
      max_global_series_per_metric: 100000
      compactor_blocks_retention_period: 365d  # 1 year retention
```

Set limits per tenant to prevent noisy neighbors from affecting others.

## Recording Rules and Alerting

Mimir supports Prometheus-compatible rules:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mimir-rules
data:
  rules.yaml: |
    groups:
      - name: slo
        rules:
          - record: http_request_error_rate:5m
            expr: |
              sum(rate(http_requests_total{status=~"5.."}[5m]))
              /
              sum(rate(http_requests_total[5m]))
          - alert: HighErrorRate
            expr: http_request_error_rate:5m > 0.01
            for: 5m
            labels:
              severity: critical
```

Rules run inside Mimir — no separate Prometheus ruler needed.

## Compaction and Downsampling

The compactor runs automatically:

```
Raw metrics (15s resolution) → 2h blocks → 24h compacted blocks
```

Blocks are merged, deduplicated, and compacted for efficient queries. Historical queries over weeks or months scan fewer, larger blocks.

## Scale

Mimir handles billions of active time series:

| Metric | Mimir Capacity |
|--------|---------------|
| Active series | Billions |
| Ingestion rate | Millions of samples/sec |
| Query range | Years |
| Tenants | Unlimited |
| Storage | Object storage (unlimited) |

## Mimir vs Alternatives

| Feature | Mimir | Thanos | Cortex | VictoriaMetrics |
|---------|-------|--------|--------|----------------|
| Architecture | Write-ahead | Sidecar | Write-ahead | Standalone/cluster |
| Multi-tenancy | Native | No | Native | Enterprise |
| Scale | Massive | Large | Large | Large |
| Complexity | Medium | Medium | High | Low |
| Storage | S3/GCS | S3/GCS | S3/GCS | Local + S3 |
| Grafana Labs | Yes | Community | Predecessor | No |

**Use Mimir** for multi-tenant, high-scale Prometheus storage with Grafana. **Use Thanos** for sidecar-based approach with less change to existing Prometheus. **Use VictoriaMetrics** for simplicity.

---

Ready to go deeper? Build your monitoring infrastructure with hands-on courses at [CopyPasteLearn](/courses).
