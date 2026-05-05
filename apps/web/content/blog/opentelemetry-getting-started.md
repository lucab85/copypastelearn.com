---
title: "OpenTelemetry Getting Started Guide"
date: "2026-04-06"
description: "OpenTelemetry is the standard for observability instrumentation. Learn how to add traces, metrics, and logs to your applications with OTel SDKs and the OpenTelemetry Collector."
category: "DevOps"
tags: ["opentelemetry", "observability", "Tracing", "metrics", "logging", "Monitoring"]
author: "Luca Berton"
---

OpenTelemetry (OTel) is the CNCF project that standardizes how applications emit telemetry data: traces, metrics, and logs. Instead of vendor-specific SDKs, you instrument once and send data to any backend.

## The Three Signals

### Traces

Traces follow a request across services. Each span represents one operation:

```python
from opentelemetry import trace

tracer = trace.get_tracer("order-service")

def process_order(order_id: str):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)

        with tracer.start_as_current_span("validate_payment"):
            validate_payment(order_id)

        with tracer.start_as_current_span("update_inventory"):
            update_inventory(order_id)
```

The trace shows: `process_order` took 250ms, `validate_payment` took 180ms (the bottleneck), `update_inventory` took 20ms.

### Metrics

Metrics are aggregated measurements: counters, gauges, histograms:

```python
from opentelemetry import metrics

meter = metrics.get_meter("order-service")

order_counter = meter.create_counter(
    "orders.processed",
    description="Number of orders processed"
)

order_duration = meter.create_histogram(
    "orders.duration",
    unit="ms",
    description="Order processing duration"
)

def process_order(order_id: str):
    start = time.time()
    # ... process ...
    duration = (time.time() - start) * 1000
    order_counter.add(1, {"status": "success"})
    order_duration.record(duration)
```

### Logs

OTel connects logs to traces so you can jump from a log line to the full request trace:

```python
import logging
from opentelemetry._logs import set_logger_provider

logger = logging.getLogger("order-service")

def process_order(order_id: str):
    with tracer.start_as_current_span("process_order"):
        logger.info(f"Processing order {order_id}")
        # This log is automatically correlated with the trace
```

## The OpenTelemetry Collector

The Collector is a proxy that receives, processes, and exports telemetry data:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1000

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/jaeger]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
```

Applications send data to the Collector. The Collector routes it to your backends. Switch from Jaeger to Grafana Tempo by changing the exporter — no application changes.

## Auto-Instrumentation

For many frameworks, you get traces without code changes:

```bash
# Python auto-instrumentation
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install

# Run your app with auto-instrumentation
opentelemetry-instrument \
  --service_name order-service \
  --exporter_otlp_endpoint http://collector:4317 \
  python app.py
```

Auto-instrumentation covers HTTP requests, database queries, message queue operations, and framework-specific operations for Django, Flask, FastAPI, Express, Spring Boot, and more.

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:latest
          ports:
            - containerPort: 4317  # gRPC
            - containerPort: 4318  # HTTP
          volumeMounts:
            - name: config
              mountPath: /etc/otelcol-contrib
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
```

## Why OpenTelemetry Matters

Before OTel, every observability vendor had their own SDK. Switching from Datadog to Grafana meant re-instrumenting your entire codebase.

With OTel, instrumentation is vendor-neutral. Your code emits standard telemetry. The Collector routes it wherever you want. Switch backends without touching application code.

---

Ready to go deeper? Build observable infrastructure with hands-on courses at [CopyPasteLearn](/courses).
