---
title: "Infrastructure Monitoring Stack"
slug: "infrastructure-monitoring-stack"
date: "2026-03-05"
category: "DevOps"
tags: ["Monitoring", "Observability", "Grafana", "Loki", "DevOps"]
excerpt: "Build a complete monitoring stack with Prometheus, Grafana, Loki, and Alertmanager. Metrics, logs, and alerts in one platform."
description: "Build a complete monitoring stack. Prometheus, Grafana, Loki, and Alertmanager for metrics, logs, and alerts."
---

A production monitoring stack needs three pillars: metrics, logs, and alerts. Here is how to build one with open-source tools.

## The Stack

```
┌─────────────────────────────────────────┐
│              Grafana (UI)                │
│   Dashboards, Explore, Alerting         │
├─────────────┬─────────────┬─────────────┤
│ Prometheus  │    Loki     │ Alertmanager│
│  (Metrics)  │   (Logs)    │  (Alerts)   │
├─────────────┼─────────────┼─────────────┤
│ Exporters   │  Promtail   │  Rules      │
│ App metrics │  Fluentd    │  Silences   │
│ Node exp.   │  Vector     │  Routes     │
└─────────────┴─────────────┴─────────────┘
```

## Deploy with Docker Compose

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=changeme
      - GF_USERS_ALLOW_SIGN_UP=false

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki/config.yml:/etc/loki/config.yml
      - loki-data:/loki
    command: -config.file=/etc/loki/config.yml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail/config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/alertmanager.yml

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

## Prometheus Configuration

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']

  - job_name: node
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: app
    static_configs:
      - targets: ['app:3000']
    metrics_path: /metrics

  - job_name: docker
    static_configs:
      - targets: ['host.docker.internal:9323']
```

## Alert Rules

```yaml
# prometheus/rules/alerts.yml
groups:
  - name: infrastructure
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

      - alert: DiskSpaceCritical
        expr: (1 - node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes) > 0.90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk almost full on {{ $labels.instance }}"

      - alert: HighMemory
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.85
        for: 10m
        labels:
          severity: warning

  - name: application
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
```

## Alertmanager Configuration

```yaml
# alertmanager/config.yml
global:
  resolve_timeout: 5m

route:
  receiver: default
  group_by: [alertname, severity]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: pagerduty
      repeat_interval: 1h
    - match:
        severity: warning
      receiver: slack

receivers:
  - name: default
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: pagerduty
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'

  - name: slack
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
        channel: '#alerts-warning'

inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: [alertname, instance]
```

## Loki for Logs

```yaml
# loki/config.yml
auth_enabled: false
server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
```

Query logs in Grafana:

```logql
# All error logs from the app
{job="app"} |= "error"

# Count errors per minute
count_over_time({job="app"} |= "error" [1m])

# Parse JSON logs and filter
{job="app"} | json | status >= 500
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers monitoring ML workloads with this exact stack. **Docker Fundamentals** teaches container observability. First lessons are free.
