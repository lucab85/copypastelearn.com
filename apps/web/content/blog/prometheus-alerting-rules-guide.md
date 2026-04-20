---
title: "Prometheus Alerting Rules Guide"
slug: "prometheus-alerting-rules-guide"
date: "2026-01-08"
category: "DevOps"
tags: ["Prometheus", "Alerting", "Monitoring", "Alertmanager", "DevOps"]
excerpt: "Write Prometheus alerting rules. PromQL alert expressions, severity levels, Alertmanager routing, PagerDuty and Slack integration."
description: "Write Prometheus alerting rules for production. PromQL expressions, severity levels, Alertmanager routing, and notification channels."
---

Metrics without alerts are just pretty graphs. Prometheus alerting rules evaluate PromQL expressions and fire alerts through Alertmanager to Slack, PagerDuty, email, or webhooks.

## Alert Rule Structure

```yaml
# rules/app-alerts.yml
groups:
  - name: application
    interval: 30s    # Evaluation interval
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m]))
          > 0.05
        for: 5m        # Must be true for 5 minutes
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate: {{ $value | humanizePercentage }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"
```

| Field | Purpose |
|---|---|
| `expr` | PromQL expression (true when > 0) |
| `for` | How long condition must be true before firing |
| `labels` | Added to the alert (used for routing) |
| `annotations` | Human-readable context (not used for routing) |

## Essential Alerts

### Infrastructure

```yaml
groups:
  - name: infrastructure
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage above 85% on {{ $labels.instance }}"

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Memory usage above 90% on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space below 10% on {{ $labels.instance }}"

      - alert: InstanceDown
        expr: up == 0
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} is down"
```

### Application

```yaml
groups:
  - name: application
    rules:
      - alert: HighLatencyP99
        expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency above 1s: {{ $value | humanizeDuration }}"

      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical

      - alert: TooManyOpenConnections
        expr: sum by(instance) (pg_stat_activity_count) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $value }} active Postgres connections on {{ $labels.instance }}"
```

### Kubernetes

```yaml
groups:
  - name: kubernetes
    rules:
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) * 60 * 5 > 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping"

      - alert: PodNotReady
        expr: kube_pod_status_ready{condition="true"} == 0
        for: 10m
        labels:
          severity: warning

      - alert: DeploymentReplicasMismatch
        expr: kube_deployment_spec_replicas != kube_deployment_status_available_replicas
        for: 15m
        labels:
          severity: warning

      - alert: PVCAlmostFull
        expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.85
        for: 5m
        labels:
          severity: warning
```

## Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: slack-default
  group_by: [alertname, namespace]
  group_wait: 30s        # Wait before first notification
  group_interval: 5m     # Wait between grouped notifications
  repeat_interval: 4h    # Re-send if still firing

  routes:
    - match:
        severity: critical
      receiver: pagerduty
      continue: true      # Also send to next matching route

    - match:
        severity: critical
      receiver: slack-critical

    - match:
        severity: warning
      receiver: slack-warnings

    - match:
        team: backend
      receiver: slack-backend

receivers:
  - name: slack-default
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX/YYY/ZZZ
        channel: "#alerts"
        title: '{{ .GroupLabels.alertname }}'
        text: >-
          {{ range .Alerts }}
          *{{ .Labels.severity | toUpper }}* {{ .Annotations.summary }}
          {{ end }}

  - name: slack-critical
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX/YYY/ZZZ
        channel: "#alerts-critical"

  - name: slack-warnings
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX/YYY/ZZZ
        channel: "#alerts-warnings"

  - name: pagerduty
    pagerduty_configs:
      - service_key: YOUR_PAGERDUTY_KEY
        severity: '{{ .CommonLabels.severity }}'

  - name: slack-backend
    slack_configs:
      - channel: "#backend-alerts"

inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: [alertname, instance]
```

## Silences and Inhibition

```bash
# Create silence via amtool
amtool silence add alertname=HighCPUUsage instance="web-1" --duration=2h --comment="Planned maintenance"

# List silences
amtool silence query

# Expire silence
amtool silence expire SILENCE_ID
```

## Testing Rules

```bash
# Check rule syntax
promtool check rules rules/app-alerts.yml

# Unit test rules
promtool test rules tests/alert-tests.yml
```

```yaml
# tests/alert-tests.yml
rule_files:
  - ../rules/app-alerts.yml

evaluation_interval: 1m

tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{status="500"}'
        values: "0+10x20"
      - series: 'http_requests_total{status="200"}'
        values: "0+100x20"
    alert_rule_test:
      - eval_time: 10m
        alertname: HighErrorRate
        exp_alerts:
          - exp_labels:
              severity: critical
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers monitoring ML systems with Prometheus. **Docker Fundamentals** teaches container monitoring. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

