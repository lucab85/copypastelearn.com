---
title: "SRE Golden Signals Monitoring"
slug: "sre-golden-signals-monitoring"
date: "2026-02-21"
category: "DevOps"
tags: ["SRE", "Monitoring", "Golden Signals", "observability", "DevOps"]
excerpt: "Implement the four golden signals of SRE monitoring. Latency, traffic, errors, and saturation with Prometheus queries and Grafana dashboards."
description: "Implement SRE golden signals. Latency, traffic, errors, and saturation dashboards with Prometheus queries and Grafana visualizations."
author: "Luca Berton"
---

Google's SRE book defines four golden signals that every service should monitor. If you only have four dashboards, make them these.

## The Four Golden Signals

| Signal | Question | Example |
|---|---|---|
| **Latency** | How long do requests take? | P50: 45ms, P99: 230ms |
| **Traffic** | How much demand is on the system? | 1,200 req/s |
| **Errors** | What fraction of requests fail? | 0.3% error rate |
| **Saturation** | How full is the system? | CPU 65%, Memory 78% |

## Signal 1: Latency

**What to measure**: Request duration, distinguishing successful from failed requests (failed requests may be fast — a quick 500 shouldn't improve your latency metrics).

### Prometheus Metrics

```promql
# P50 latency (median)
histogram_quantile(0.50,
  sum(rate(http_request_duration_seconds_bucket{status!~"5.."}[5m])) by (le)
)

# P95 latency
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{status!~"5.."}[5m])) by (le)
)

# P99 latency
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{status!~"5.."}[5m])) by (le)
)

# Average latency (less useful than percentiles)
rate(http_request_duration_seconds_sum[5m])
/ rate(http_request_duration_seconds_count[5m])
```

### Instrumentation

```typescript
import { Histogram } from 'prom-client';

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || 'unknown', status: res.statusCode });
  });
  next();
});
```

### Alert

```yaml
- alert: HighLatency
  expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "P99 latency above 1 second"
```

## Signal 2: Traffic

**What to measure**: Requests per second, broken down by endpoint and method.

### Prometheus Metrics

```promql
# Total request rate
sum(rate(http_requests_total[5m]))

# By endpoint
sum(rate(http_requests_total[5m])) by (route)

# By status code class
sum(rate(http_requests_total[5m])) by (status)

# Comparison to last week (trend)
sum(rate(http_requests_total[5m]))
/ sum(rate(http_requests_total[5m] offset 7d))
```

### Alert

```yaml
- alert: TrafficDrop
  expr: sum(rate(http_requests_total[5m])) < 10
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "Traffic dropped below 10 req/s — possible outage"
```

## Signal 3: Errors

**What to measure**: The rate of failed requests (5xx responses, timeouts, unhandled exceptions).

### Prometheus Metrics

```promql
# Error rate (percentage)
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))
* 100

# Error rate by endpoint
sum(rate(http_requests_total{status=~"5.."}[5m])) by (route)
/ sum(rate(http_requests_total[5m])) by (route)

# Absolute error count per minute
sum(increase(http_requests_total{status=~"5.."}[1m]))
```

### Alert

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m]))
    / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Error rate above 1%: {{ $value | humanizePercentage }}"
```

## Signal 4: Saturation

**What to measure**: How close the system is to its capacity limits.

### Prometheus Metrics

```promql
# CPU utilization
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory utilization
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk utilization
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes) * 100

# Connection pool utilization
pg_stat_activity_count / pg_settings_max_connections * 100

# Kubernetes pod CPU vs request
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)
/ sum(kube_pod_container_resource_requests{resource="cpu"}) by (pod) * 100
```

### Alerts

```yaml
- alert: HighCPU
  expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
  for: 15m
  labels:
    severity: warning

- alert: DiskAlmostFull
  expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes) > 0.90
  for: 5m
  labels:
    severity: critical

- alert: ConnectionPoolExhausted
  expr: pg_stat_activity_count / pg_settings_max_connections > 0.85
  for: 5m
  labels:
    severity: critical
```

## Grafana Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ Row 1: Overview                                  │
│ [Total RPS] [Error Rate %] [P99 Latency] [CPU %]│
├─────────────────────────────────────────────────┤
│ Row 2: Latency                                   │
│ [P50/P95/P99 over time] [Latency by endpoint]   │
├─────────────────────────────────────────────────┤
│ Row 3: Traffic                                   │
│ [RPS over time] [RPS by endpoint] [vs last week]│
├─────────────────────────────────────────────────┤
│ Row 4: Errors                                    │
│ [Error rate %] [Errors by type] [Error logs]     │
├─────────────────────────────────────────────────┤
│ Row 5: Saturation                                │
│ [CPU] [Memory] [Disk] [Connections]              │
└─────────────────────────────────────────────────┘
```

## SLOs from Golden Signals

| SLI (what you measure) | SLO (target) |
|---|---|
| P99 latency | < 500ms for 99.9% of requests |
| Error rate | < 0.1% over 30-day window |
| Availability | 99.95% uptime (21.9 min/month downtime) |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers monitoring ML services with golden signals. **Docker Fundamentals** teaches container observability. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

