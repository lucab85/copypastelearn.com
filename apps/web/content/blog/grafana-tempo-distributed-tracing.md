---
title: "Grafana Tempo Distributed Tracing"
date: "2026-03-04"
description: "Grafana Tempo stores distributed traces at scale with object storage. Learn how Tempo compares to Jaeger, how to deploy it on Kubernetes, and how to correlate traces with logs and metrics."
category: "DevOps"
tags: ["grafana-tempo", "distributed-tracing", "observability", "opentelemetry", "kubernetes", "grafana"]
---

Jaeger stores traces in Elasticsearch or Cassandra — expensive to operate. Tempo stores traces in object storage (S3, GCS) with no indexing, making it 10-100x cheaper for the same trace volume.

## How Tempo Works

Tempo takes a different approach to trace storage:

- **No indexing**: Traces are stored as compressed blocks in object storage
- **Trace ID lookup**: Find traces by ID (from logs or metrics)
- **Search via tags**: Optional search using Parquet-based backend
- **TraceQL**: Query language for finding traces by structure and attributes

The tradeoff: you cannot browse all traces. Instead, you jump to traces from correlated signals — a log line, an error metric, or a specific trace ID.

## Installation

```bash
helm install tempo grafana/tempo-distributed \
  --namespace monitoring --create-namespace \
  --set storage.trace.backend=s3 \
  --set storage.trace.s3.bucket=my-tempo-traces \
  --set storage.trace.s3.region=eu-west-1
```

## Sending Traces to Tempo

Tempo accepts OpenTelemetry (OTLP), Jaeger, and Zipkin formats:

```yaml
# OpenTelemetry Collector config
exporters:
  otlp/tempo:
    endpoint: tempo-distributor.monitoring:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/tempo]
```

Applications instrumented with OpenTelemetry send traces to the Collector, which forwards to Tempo.

## TraceQL

Query traces by structure and attributes:

```
# Find traces where an HTTP request returned 500
{ span.http.status_code = 500 }

# Find slow database queries
{ span.db.system = "postgresql" && duration > 500ms }

# Find traces with errors in the payment service
{ resource.service.name = "payment-service" && status = error }

# Find traces where a specific operation took too long
{ name = "process_order" && duration > 2s }
```

## Correlating Signals

The real power of Tempo is correlation with Grafana's other data sources.

### Logs → Traces

In Grafana Loki, click a trace ID in a log line to jump directly to the trace in Tempo:

```json
{"level":"error","msg":"payment failed","trace_id":"abc123","order_id":"456"}
```

Click `abc123` → see the full distributed trace showing exactly where the payment failed.

### Metrics → Traces

Grafana generates metrics from traces (RED metrics):

```promql
# Request rate from traces
tempo_spanmetrics_calls_total{service="order-api"}

# Error rate
tempo_spanmetrics_calls_total{service="order-api", status_code="STATUS_CODE_ERROR"}

# Duration histogram
tempo_spanmetrics_duration_seconds_bucket{service="order-api"}
```

Click on a spike in the metrics dashboard → see exemplar traces from that time period.

### Traces → Logs

From a trace span, click to see all logs emitted during that span's execution. Context flows in every direction.

## Architecture

```
Apps → OTel Collector → Tempo Distributor → Tempo Ingester → Object Storage (S3)
                                                                     ↑
                              Tempo Querier ← Grafana ← User Query
```

- **Distributor**: Receives spans, hashes by trace ID
- **Ingester**: Batches spans into blocks
- **Compactor**: Merges blocks for efficient storage
- **Querier**: Reads blocks from storage for queries

## Tempo vs Jaeger

| Feature | Tempo | Jaeger |
|---------|-------|--------|
| Storage | Object storage (S3/GCS) | Elasticsearch, Cassandra, or Badger |
| Cost | Very low | High (indexing overhead) |
| Operations | Simple | Complex (manage ES/Cassandra) |
| Search | TraceQL, tag-based | Full search on all fields |
| Grafana integration | Native | Plugin |
| Scale | Horizontally scalable | Depends on backend |
| Query language | TraceQL | Basic filters |

**Choose Tempo** if you use Grafana and want cost-effective trace storage with signal correlation. **Choose Jaeger** if you need full trace search without relying on correlated signals.

## Retention

```yaml
# Tempo config
compactor:
  compaction:
    block_retention: 720h  # 30 days
storage:
  trace:
    backend: s3
```

Object storage lifecycle policies can move older traces to cheaper storage tiers automatically.

---

Ready to go deeper? Build your observability stack with hands-on courses at [CopyPasteLearn](/courses).
