---
title: "Grafana Alloy OpenTelemetry Collector"
date: "2026-02-13"
description: "Grafana Alloy is a programmable OpenTelemetry collector that replaces Prometheus Agent, Grafana Agent, and OTel Collector. Learn how to collect metrics, logs."
category: "DevOps"
tags: ["grafana-alloy", "opentelemetry", "observability", "metrics", "logs", "traces"]
author: "Luca Berton"
---

Running Prometheus Agent for metrics, Promtail for logs, and an OTel Collector for traces means three agents on every node. Grafana Alloy replaces all three with one programmable collector.

## Installation

```bash
helm install alloy grafana/alloy \
  --namespace monitoring --create-namespace
```

## Configuration Language

Alloy uses a component-based configuration:

```alloy
// Scrape Kubernetes pods for Prometheus metrics
prometheus.scrape "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.mimir.receiver]
}

// Discover Kubernetes pods
discovery.kubernetes "pods" {
  role = "pod"
}

// Send metrics to Mimir/Prometheus
prometheus.remote_write "mimir" {
  endpoint {
    url = "http://mimir.monitoring:9009/api/v1/push"
  }
}
```

Components connect with pipes: discovery → scrape → remote_write. Data flows left to right.

## Collect Everything

### Metrics (Prometheus)

```alloy
prometheus.scrape "nodes" {
  targets = [{
    __address__ = "localhost:9100",
    job         = "node-exporter",
  }]
  scrape_interval = "15s"
  forward_to      = [prometheus.remote_write.mimir.receiver]
}
```

### Logs (Loki)

```alloy
// Discover pod logs
loki.source.kubernetes "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.process.pipeline.receiver]
}

// Process logs (parse JSON, add labels)
loki.process "pipeline" {
  stage.json {
    expressions = {
      level   = "level",
      message = "msg",
    }
  }
  stage.labels {
    values = { level = "" }
  }
  forward_to = [loki.write.default.receiver]
}

// Send to Loki
loki.write "default" {
  endpoint {
    url = "http://loki.monitoring:3100/loki/api/v1/push"
  }
}
```

### Traces (Tempo)

```alloy
// Receive OTLP traces
otelcol.receiver.otlp "default" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }
  http {
    endpoint = "0.0.0.0:4318"
  }
  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

// Send to Tempo
otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo.monitoring:4317"
  }
}
```

## All Three in One Config

```alloy
// === METRICS ===
discovery.kubernetes "pods" { role = "pod" }

prometheus.scrape "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.mimir.receiver]
}

prometheus.remote_write "mimir" {
  endpoint { url = "http://mimir:9009/api/v1/push" }
}

// === LOGS ===
loki.source.kubernetes "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.loki.receiver]
}

loki.write "loki" {
  endpoint { url = "http://loki:3100/loki/api/v1/push" }
}

// === TRACES ===
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  output { traces = [otelcol.exporter.otlp.tempo.input] }
}

otelcol.exporter.otlp "tempo" {
  client { endpoint = "tempo:4317" }
}
```

One DaemonSet. Three signal types. One config file.

## Auto-Instrumentation

Alloy can inject OpenTelemetry instrumentation into applications without code changes:

```alloy
// Auto-instrument Java applications
beyla.ebpf "auto" {
  open_port = "8080"
  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}
```

Beyla uses eBPF to instrument HTTP and gRPC calls without modifying application code.

## Alloy vs Alternatives

| Feature | Alloy | OTel Collector | Prometheus Agent | Promtail |
|---------|-------|---------------|-----------------|---------|
| Metrics | ✓ | ✓ | ✓ | ✗ |
| Logs | ✓ | ✓ | ✗ | ✓ |
| Traces | ✓ | ✓ | ✗ | ✗ |
| Config language | Alloy (River) | YAML | YAML | YAML |
| Programmable | Yes | Limited | No | Limited |
| Grafana native | Yes | No | Partial | Yes |

**Use Alloy** if you run the Grafana stack (Mimir, Loki, Tempo). **Use OTel Collector** for vendor-neutral setups or non-Grafana backends.

---

Ready to go deeper? Build your observability stack with hands-on courses at [CopyPasteLearn](/courses).

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Grafana Alloy OpenTelemetry Collector as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to grafana-alloy, opentelemetry, observability, metrics. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Grafana Alloy OpenTelemetry Collector?

Use it when you need a practical, repeatable way to handle grafana-alloy, opentelemetry, observability, metrics work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

