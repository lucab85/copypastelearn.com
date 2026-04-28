---
title: "Thanos Long-Term Prometheus Storage"
date: "2026-03-02"
description: "Thanos extends Prometheus with unlimited retention, global querying across clusters, and downsampling. Learn how to deploy Thanos Sidecar and Store Gateway for multi-cluster observability."
category: "DevOps"
tags: ["thanos", "prometheus", "monitoring", "observability", "kubernetes", "long-term-storage"]
---

Prometheus stores 15 days of metrics by default. After that, data is gone. Thanos uploads Prometheus blocks to object storage and lets you query years of metrics across multiple clusters from a single endpoint.

## Architecture

```
Cluster A: Prometheus + Thanos Sidecar → S3
Cluster B: Prometheus + Thanos Sidecar → S3
                                           ↓
                                    Thanos Store Gateway
                                           ↓
                                    Thanos Querier ← Grafana
```

- **Sidecar**: Runs alongside Prometheus, uploads blocks to S3
- **Store Gateway**: Reads blocks from S3 for historical queries
- **Querier**: Unified query endpoint across all Prometheus instances and Store Gateways
- **Compactor**: Downsamples and compacts historical data

## Thanos Sidecar

```yaml
# Add sidecar to existing Prometheus
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
spec:
  template:
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.51.0
          args:
            - --storage.tsdb.min-block-duration=2h
            - --storage.tsdb.max-block-duration=2h
          volumeMounts:
            - name: data
              mountPath: /prometheus

        - name: thanos-sidecar
          image: quay.io/thanos/thanos:v0.35.0
          args:
            - sidecar
            - --tsdb.path=/prometheus
            - --objstore.config-file=/etc/thanos/objstore.yaml
          volumeMounts:
            - name: data
              mountPath: /prometheus
            - name: thanos-config
              mountPath: /etc/thanos
```

```yaml
# objstore.yaml
type: S3
config:
  bucket: my-thanos-metrics
  region: eu-west-1
  endpoint: s3.eu-west-1.amazonaws.com
```

The sidecar uploads completed 2-hour blocks to S3. Prometheus continues to serve recent queries from local storage.

## Thanos Querier

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-querier
spec:
  template:
    spec:
      containers:
        - name: querier
          image: quay.io/thanos/thanos:v0.35.0
          args:
            - query
            - --store=thanos-sidecar-cluster-a:10901
            - --store=thanos-sidecar-cluster-b:10901
            - --store=thanos-store-gateway:10901
          ports:
            - containerPort: 9090  # PromQL endpoint
```

Point Grafana at the Querier. Every PromQL query automatically fans out to all connected stores and deduplicates results.

## Store Gateway

Serves historical data from object storage:

```yaml
containers:
  - name: store-gateway
    image: quay.io/thanos/thanos:v0.35.0
    args:
      - store
      - --objstore.config-file=/etc/thanos/objstore.yaml
      - --data-dir=/var/thanos/store
```

When you query metrics from 6 months ago, the Store Gateway reads blocks from S3. Recent data comes from Prometheus via the Sidecar.

## Compactor

Downsamples historical data to reduce storage costs:

```yaml
containers:
  - name: compactor
    image: quay.io/thanos/thanos:v0.35.0
    args:
      - compact
      - --objstore.config-file=/etc/thanos/objstore.yaml
      - --data-dir=/var/thanos/compact
      - --retention.resolution-raw=30d
      - --retention.resolution-5m=180d
      - --retention.resolution-1h=365d
```

- Raw data (5s resolution): kept 30 days
- 5-minute downsampled: kept 180 days
- 1-hour downsampled: kept 1 year

A year of metrics from 100 services costs a few dollars in S3.

## Multi-Cluster Querying

```
Grafana → Thanos Querier → [Sidecar A, Sidecar B, Sidecar C, Store Gateway]
```

```promql
# CPU usage across ALL clusters
sum(rate(container_cpu_usage_seconds_total{namespace="production"}[5m])) by (cluster)
```

One query, all clusters. The Querier deduplicates metrics from HA Prometheus pairs.

## Thanos vs Alternatives

| Feature | Thanos | Cortex/Mimir | VictoriaMetrics |
|---------|--------|-------------|-----------------|
| Architecture | Sidecar + components | Write-ahead (remote write) | Standalone or cluster |
| Prometheus compatibility | Full (reads TSDB blocks) | Full (remote write) | Full (remote write) |
| Multi-cluster | Global query | Global query | Global query |
| Storage | S3/GCS/Azure | S3/GCS/Azure | Local + S3 |
| Operational complexity | Medium | High | Low |
| Downsampling | Built-in | Via recording rules | Built-in |

**Choose Thanos** for sidecar-based approach with minimal Prometheus changes. **Choose Mimir** for high-ingest workloads needing write-ahead architecture. **Choose VictoriaMetrics** for simplicity and performance.

---

Ready to go deeper? Build your monitoring stack with hands-on courses at [CopyPasteLearn](/courses).
