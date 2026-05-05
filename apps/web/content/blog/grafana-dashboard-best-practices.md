---
title: "Grafana Dashboard Best Practices"
slug: "grafana-dashboard-best-practices"
date: "2026-02-19"
category: "DevOps"
tags: ["Grafana", "Monitoring", "Dashboards", "Prometheus", "observability"]
excerpt: "Build effective Grafana dashboards. Layout patterns, variable templates, alert integration, and dashboard-as-code with JSON provisioning."
description: "Build effective Grafana dashboards for monitoring. Layout patterns, template variables, alert integration, and dashboard-as-code."
author: "Luca Berton"
---

A good Grafana dashboard answers questions at a glance. A bad one is a wall of graphs nobody looks at. Here is how to build dashboards people actually use.

## Dashboard Layout Principles

Structure your dashboard top-to-bottom, general-to-specific:

```
Row 1: Overview (stat panels — key numbers)
  [Uptime] [Error Rate] [P99 Latency] [Active Users] [CPU %]

Row 2: Traffic & Latency (time series)
  [Request Rate over time] [Latency percentiles over time]

Row 3: Errors (time series + table)
  [Error rate over time] [Top errors by endpoint]

Row 4: Resources (time series)
  [CPU usage] [Memory usage] [Disk I/O] [Network I/O]

Row 5: Logs (optional)
  [Recent error logs from Loki]
```

### Key Rules

- **5-second rule**: Can you understand the system state in 5 seconds?
- **Top row = stat panels**: Big numbers with thresholds (green/yellow/red)
- **Left = most important**: Eyes scan left to right
- **Consistent time range**: All panels should use the dashboard time picker
- **Max 15 panels per dashboard**: More than that, split into sub-dashboards

## Variable Templates

Make dashboards reusable across environments and services:

```
Variable: namespace
  Query: label_values(kube_pod_info, namespace)
  Multi-value: true

Variable: service
  Query: label_values(http_requests_total{namespace="$namespace"}, service)

Variable: instance
  Query: label_values(up{namespace="$namespace", job="$service"}, instance)
```

Use in queries:

```promql
rate(http_requests_total{namespace="$namespace", service="$service"}[5m])
```

Users can switch between production/staging/dev from a dropdown instead of maintaining separate dashboards.

## Panel Types and When to Use Them

| Panel | Use For |
|---|---|
| **Stat** | Single key metric (uptime, error rate, current RPS) |
| **Gauge** | Percentage metrics (CPU%, memory%, disk%) |
| **Time series** | Metrics over time (the default choice) |
| **Bar gauge** | Comparing values across items (top 10 endpoints) |
| **Table** | Detailed breakdowns (errors by endpoint + status) |
| **Heatmap** | Latency distribution over time |
| **Logs** | Recent log entries from Loki |
| **Alert list** | Currently firing alerts |

## Essential PromQL Patterns

### Request Rate

```promql
sum(rate(http_requests_total{namespace="$namespace"}[5m])) by (service)
```

### Error Percentage

```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
/ sum(rate(http_requests_total[5m])) by (service)
* 100
```

### Latency Percentiles

```promql
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{service="$service"}[5m])) by (le)
)
```

### Resource Usage

```promql
# Container CPU (percentage of request)
sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", pod=~"$service.*"}[5m]))
/ sum(kube_pod_container_resource_requests{namespace="$namespace", pod=~"$service.*", resource="cpu"})
* 100

# Container memory (percentage of limit)
sum(container_memory_working_set_bytes{namespace="$namespace", pod=~"$service.*"})
/ sum(kube_pod_container_resource_limits{namespace="$namespace", pod=~"$service.*", resource="memory"})
* 100
```

## Thresholds and Colors

Configure stat panels with meaningful thresholds:

```json
{
  "thresholds": {
    "steps": [
      { "value": null, "color": "green" },
      { "value": 1, "color": "yellow" },
      { "value": 5, "color": "red" }
    ]
  }
}
```

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Error rate | < 1% | 1–5% | > 5% |
| P99 latency | < 200ms | 200–500ms | > 500ms |
| CPU usage | < 60% | 60–80% | > 80% |
| Memory | < 70% | 70–85% | > 85% |
| Disk | < 75% | 75–90% | > 90% |

## Dashboard as Code

### JSON Provisioning

```yaml
# grafana/provisioning/dashboards/default.yml
apiVersion: 1
providers:
  - name: default
    type: file
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

Export dashboards as JSON and store in Git:

```bash
# Export
curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" \
  "http://grafana:3000/api/dashboards/uid/my-dashboard" \
  | jq '.dashboard' > dashboards/my-dashboard.json

# Import
curl -s -X POST -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"dashboard\": $(cat dashboards/my-dashboard.json), \"overwrite\": true}" \
  "http://grafana:3000/api/dashboards/db"
```

### Grafonnet (Jsonnet Library)

```jsonnet
local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local prometheus = grafana.prometheus;
local graphPanel = grafana.graphPanel;

dashboard.new(
  'Service Overview',
  tags=['generated', 'prometheus'],
  time_from='now-1h',
)
.addPanel(
  graphPanel.new(
    'Request Rate',
    datasource='Prometheus',
  ).addTarget(
    prometheus.target(
      'sum(rate(http_requests_total[5m])) by (service)',
      legendFormat='{{service}}',
    )
  ),
  gridPos={ x: 0, y: 0, w: 12, h: 8 }
)
```

## Annotations

Mark deployments and incidents on dashboards:

```bash
# Add deployment annotation
curl -X POST -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Deployed v2.1.0\", \"tags\": [\"deploy\"]}" \
  "http://grafana:3000/api/annotations"
```

Or from Prometheus:

```promql
# Annotation query for deploys
changes(kube_deployment_status_observed_generation{deployment="my-app"}[5m]) > 0
```

## Common Mistakes

- **Too many dashboards** — Start with 3: Overview, Service Detail, Infrastructure
- **No variables** — Forces duplicating dashboards per environment
- **Raw counters instead of rates** — Always use `rate()` or `increase()`
- **Missing units** — Configure panel units (seconds, bytes, percent)
- **Auto-refresh too fast** — 30s is fine for most dashboards, 5s only for live debugging

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers monitoring ML pipelines with Grafana dashboards. First lesson is free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

