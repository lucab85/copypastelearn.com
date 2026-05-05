---
title: "Observability vs Monitoring Explained"
slug: "observability-vs-monitoring-explained"
date: "2026-01-29"
category: "DevOps"
tags: ["observability", "Monitoring", "logging", "Tracing", "DevOps"]
excerpt: "Understand the three pillars of observability. Metrics, logs, and traces with OpenTelemetry, Prometheus, Grafana, Loki, and Jaeger."
description: "The three pillars of observability. Metrics, logs, and distributed traces with OpenTelemetry, Prometheus, Grafana, and Jaeger."
author: "Luca Berton"
---

Monitoring tells you when something is broken. Observability tells you why. In distributed systems, you need both.

## Monitoring vs Observability

| Aspect | Monitoring | Observability |
|---|---|---|
| Question | "Is it broken?" | "Why is it broken?" |
| Approach | Predefined dashboards & alerts | Explore unknown unknowns |
| Data | Metrics, uptime checks | Metrics + Logs + Traces |
| When useful | Known failure modes | Novel, unexpected failures |

## The Three Pillars

### 1. Metrics (Numbers Over Time)

```
CPU: 78% → 85% → 92% → 99% 🔥
Request rate: 500/s → 200/s → 50/s
Error rate: 0.1% → 5% → 25%
```

Best for: Dashboards, alerts, trends, SLOs.

**Prometheus** example:

```promql
# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# P99 latency
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

### 2. Logs (Events with Context)

```json
{
  "timestamp": "2026-01-29T14:23:01Z",
  "level": "error",
  "service": "payment-service",
  "trace_id": "abc123def456",
  "user_id": "usr_789",
  "message": "Payment failed: card declined",
  "error": "stripe_card_declined",
  "amount": 2900,
  "currency": "EUR"
}
```

Best for: Debugging specific requests, audit trails, error details.

### 3. Traces (Request Flow Across Services)

```
[Client] → [API Gateway] → [Auth Service] → [Payment Service] → [Database]
  0ms         5ms              15ms              45ms               80ms
                                                  ↑
                                          Slow query: 35ms
```

Best for: Finding bottlenecks in distributed systems, understanding request flow.

## OpenTelemetry (The Standard)

OpenTelemetry provides a single SDK for all three signals:

```typescript
// Auto-instrumentation (Node.js)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics',
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

This automatically instruments:
- HTTP requests (incoming and outgoing)
- Database queries (pg, mysql, redis)
- gRPC calls
- Express/Fastify routes

### Custom Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('payment-service');

async function processPayment(order: Order) {
  return tracer.startActiveSpan('process-payment', async (span) => {
    span.setAttribute('order.id', order.id);
    span.setAttribute('order.amount', order.amount);

    try {
      const result = await stripe.charges.create({
        amount: order.amount,
        currency: 'eur',
      });
      span.setAttribute('payment.status', 'success');
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## The Observability Stack

### Prometheus + Grafana + Loki + Tempo

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"

  loki:
    image: grafana/loki:latest

  tempo:
    image: grafana/tempo:latest

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    volumes:
      - ./otel-config.yaml:/etc/otel/config.yaml
    command: ["--config=/etc/otel/config.yaml"]
```

### OTel Collector Config

```yaml
# otel-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889

  loki:
    endpoint: http://loki:3100/loki/api/v1/push

  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      exporters: [loki]
    traces:
      receivers: [otlp]
      exporters: [otlp/tempo]
```

## Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Always include context
logger.info({ orderId: order.id, userId: user.id, amount: order.total }, 'Order placed');
logger.error({ err, orderId: order.id }, 'Payment failed');
```

## Correlating the Three Pillars

The real power is connecting metrics → logs → traces:

1. **Alert fires**: Error rate > 5% (metric)
2. **Filter logs**: `level=error AND service=payment-service AND time=last_5m`
3. **Find trace**: Click `trace_id` in log entry
4. **See full request flow**: API Gateway → Auth → Payment → Stripe API (timeout at 30s)
5. **Root cause**: Stripe API latency spike

This workflow requires consistent `trace_id` propagation across all services.

## SLOs (Service Level Objectives)

Define what "good" looks like:

| SLI | SLO | Error Budget |
|---|---|---|
| Availability | 99.95% over 30 days | 21.9 min downtime/month |
| Latency (P99) | < 500ms | 0.05% of requests can exceed |
| Error rate | < 0.1% | ~4,320 errors/month at 100 RPS |

```promql
# Error budget burn rate
1 - (
  sum(rate(http_requests_total{status!~"5.."}[1h]))
  / sum(rate(http_requests_total[1h]))
) / (1 - 0.9995)
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers observability for ML systems. **Docker Fundamentals** teaches container monitoring basics. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

