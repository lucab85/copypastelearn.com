---
title: "Prometheus Monitoring Beginner Guide"
slug: "prometheus-monitoring-beginner-guide"
date: "2026-03-19"
category: "DevOps"
tags: ["Prometheus", "Monitoring", "Grafana", "Observability", "DevOps"]
excerpt: "Get started with Prometheus monitoring. Set up metrics collection, write PromQL queries, build Grafana dashboards, and configure alerts."
description: "Get started with Prometheus monitoring. Metrics collection, PromQL queries, Grafana dashboards, and alerting setup."
---

Prometheus is the standard for monitoring Kubernetes and cloud-native applications. This guide gets you from zero to dashboards and alerts.

## What Prometheus Does

Prometheus **scrapes** metrics from your applications and infrastructure at regular intervals, stores them as time series data, and lets you query, visualize, and alert on them.

```
Your App → /metrics endpoint → Prometheus scrapes → Stores time series
                                                       ↓
                                              PromQL queries → Grafana dashboards
                                                       ↓
                                              Alert rules → Alertmanager → Slack/PagerDuty
```

## Quick Start with Docker Compose

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
```

`prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']

  - job_name: node
    static_configs:
      - targets: ['node-exporter:9100']
```

```bash
docker compose up -d
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

## Instrumenting Your Application

### Node.js / Express

```bash
npm install prom-client
```

```typescript
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Middleware
app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, path: req.route?.path || req.path });
  res.on('finish', () => {
    httpRequests.inc({ method: req.method, path: req.route?.path || req.path, status: res.statusCode });
    end();
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

### Python / Flask

```python
from prometheus_client import Counter, Histogram, generate_latest
import time

REQUEST_COUNT = Counter('http_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'Request latency', ['method', 'endpoint'])

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    latency = time.time() - request.start_time
    REQUEST_COUNT.labels(request.method, request.path, response.status_code).inc()
    REQUEST_LATENCY.labels(request.method, request.path).observe(latency)
    return response

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain'}
```

## Essential PromQL Queries

### Request Rate

```promql
# Requests per second (last 5 min)
rate(http_requests_total[5m])

# Requests per second by status
sum by (status) (rate(http_requests_total[5m]))
```

### Error Rate

```promql
# Error percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))
* 100
```

### Latency (P50, P90, P99)

```promql
# 50th percentile
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Resource Usage

```promql
# CPU usage percentage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage percentage
(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100
```

## Alerting Rules

`alert-rules.yml`:

```yaml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate ({{ $value | humanizePercentage }})"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency above 1s"

  - name: infrastructure
    rules:
      - alert: HighCPU
        expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning

      - alert: DiskSpaceLow
        expr: (1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) > 0.85
        for: 5m
        labels:
          severity: critical
```

## Grafana Dashboard

1. Add Prometheus as data source: `http://prometheus:9090`
2. Import community dashboards:
   - **Node Exporter Full**: ID `1860`
   - **Kubernetes Cluster**: ID `6417`
3. Build custom panels with PromQL queries above

## The Four Golden Signals

Google SRE recommends monitoring these for every service:

| Signal | What to Measure | PromQL |
|---|---|---|
| **Latency** | Request duration | `histogram_quantile(0.99, ...)` |
| **Traffic** | Requests per second | `sum(rate(http_requests_total[5m]))` |
| **Errors** | Error rate | `rate(http_requests_total{status=~"5.."}[5m])` |
| **Saturation** | Resource utilization | CPU, memory, disk, connections |

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers monitoring ML workloads with Prometheus and Grafana. **Docker Fundamentals** teaches container observability basics. First lessons are free.
