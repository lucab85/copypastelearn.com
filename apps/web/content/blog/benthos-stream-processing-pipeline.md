---
title: "Benthos Stream Processing Pipeline"
date: "2026-02-10"
description: "Benthos (now Redpanda Connect) is a declarative stream processor for ETL, data transformation, and message routing. Learn how to build data pipelines connecting Kafka, S3, databases, and APIs."
category: "DevOps"
tags: ["benthos", "stream-processing", "etl", "data-pipeline", "kafka", "redpanda"]
author: "Luca Berton"
---

You need to move data from Kafka to S3, transform JSON fields, filter events, and fan out to multiple destinations. Writing this in code means error handling, retries, backpressure, and observability. Benthos does it in YAML.

## How Benthos Works

```yaml
input:
  kafka:
    addresses: ["kafka:9092"]
    topics: ["order-events"]
    consumer_group: benthos-pipeline

pipeline:
  processors:
    - mapping: |
        root = this
        root.processed_at = now()
        root.total = this.quantity * this.price

output:
  s3:
    bucket: processed-orders
    path: "orders/${!timestamp_unix()}.json"
    region: eu-west-1
```

Input → Process → Output. Benthos handles retries, batching, and backpressure automatically.

## Inputs

```yaml
# Kafka
input:
  kafka:
    addresses: ["kafka:9092"]
    topics: ["events"]

# HTTP server (receive webhooks)
input:
  http_server:
    path: /webhook
    allowed_verbs: ["POST"]

# S3 (process new files)
input:
  aws_s3:
    bucket: raw-data
    prefix: uploads/
    region: eu-west-1

# Database polling
input:
  sql_select:
    driver: postgres
    dsn: "postgres://user:pass@db:5432/app"
    table: events
    columns: ["id", "data", "created_at"]
    where: "processed = false"

# AMQP (RabbitMQ)
input:
  amqp_0_9:
    urls: ["amqp://rabbitmq:5672"]
    queue: tasks
```

## Processors (Bloblang)

Benthos uses Bloblang for data transformation:

```yaml
pipeline:
  processors:
    # Transform fields
    - mapping: |
        root.user_id = this.user.id
        root.email = this.user.email.lowercase()
        root.order_total = this.items.map_each(i -> i.price * i.qty).sum()
        root.currency = "EUR"
        root.timestamp = this.created_at.ts_parse("2006-01-02T15:04:05Z")

    # Filter messages
    - mapping: |
        root = if this.order_total < 10 { deleted() }

    # Enrich with HTTP call
    - branch:
        request_map: |
          root.url = "http://user-api:8080/users/" + this.user_id
        processors:
          - http:
              url: "${! this.url }"
              verb: GET
        result_map: |
          root.user_name = this.name
          root.user_tier = this.tier
```

## Outputs

```yaml
# Multiple outputs (fan-out)
output:
  broker:
    outputs:
      - s3:
          bucket: order-archive
          path: "${!meta(\"kafka_topic\")}/${!count(\"files\")}.json"

      - kafka:
          addresses: ["kafka:9092"]
          topic: enriched-orders

      - http_client:
          url: https://analytics.myorg.com/events
          verb: POST
          headers:
            Authorization: "Bearer ${API_TOKEN}"

      - sql_insert:
          driver: postgres
          dsn: "postgres://user:pass@db:5432/analytics"
          table: orders
          columns: ["user_id", "total", "timestamp"]
          args_mapping: |
            root = [this.user_id, this.order_total, this.timestamp]
```

## Error Handling

```yaml
output:
  broker:
    outputs:
      - kafka:
          addresses: ["kafka:9092"]
          topic: processed-orders
      - fallback:
          - kafka:
              addresses: ["kafka:9092"]
              topic: dead-letter-queue
          - file:
              path: /var/log/failed-messages.jsonl
```

Failed messages go to a dead letter queue. If that fails, they go to a file. No data loss.

## Batching

```yaml
input:
  kafka:
    addresses: ["kafka:9092"]
    topics: ["events"]
    batching:
      count: 100
      period: 5s
```

Batch 100 messages or flush every 5 seconds — whichever comes first. Reduces API calls and improves throughput.

## Docker Deployment

```yaml
# docker-compose.yml
services:
  benthos:
    image: ghcr.io/redpandadata/connect
    volumes:
      - ./pipeline.yaml:/benthos.yaml
    environment:
      - API_TOKEN=${API_TOKEN}
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-pipeline
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: benthos
          image: ghcr.io/redpandadata/connect
          args: ["-c", "/config/pipeline.yaml"]
          volumeMounts:
            - name: config
              mountPath: /config
      volumes:
        - name: config
          configMap:
            name: benthos-pipeline
```

Scale horizontally. Kafka consumer groups distribute partitions across replicas.

## When to Use Benthos

**Good fit:**
- ETL pipelines between message queues, databases, and APIs
- Real-time data transformation and enrichment
- Webhook processing and routing
- Log and event processing pipelines

**Not needed:**
- Simple A-to-B message forwarding (use Kafka Connect)
- Complex stateful stream processing (use Flink or Kafka Streams)
- Batch processing of huge datasets (use Spark)

---

Ready to go deeper? Master data pipelines with hands-on courses at [CopyPasteLearn](/courses).
