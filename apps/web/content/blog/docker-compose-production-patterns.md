---
title: "Docker Compose Production Patterns"
slug: "docker-compose-production-patterns"
date: "2026-02-10"
category: "DevOps"
tags: ["Docker", "Docker Compose", "Production", "DevOps", "deployment"]
excerpt: "Production-ready Docker Compose patterns. Health checks, resource limits, logging, secrets, networking, and multi-environment configs."
description: "Production-ready Docker Compose patterns. Health checks, resource limits, structured logging, secrets management, and multi-environment configs."
author: "Luca Berton"
---

Docker Compose is not just for development. With the right patterns, it runs production workloads on single servers reliably.

## Health Checks

```yaml
services:
  api:
    image: my-api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

## Dependency Management

```yaml
services:
  api:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
```

## Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
      replicas: 2
```

## Logging

```yaml
services:
  api:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
        tag: "{{.Name}}"

  # Or centralized logging
  loki-api:
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
        loki-retries: "3"
```

Without `max-size`, Docker logs grow unbounded and fill the disk.

## Networking

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  postgres:
    networks:
      - backend-net  # Not accessible from frontend

networks:
  frontend-net:
  backend-net:
    internal: true  # No external access
```

## Secrets

```yaml
services:
  api:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

Read in application:

```typescript
import { readFileSync } from 'fs';

const dbPassword = process.env.DB_PASSWORD_FILE
  ? readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim()
  : process.env.DB_PASSWORD;
```

## Multi-Environment Configuration

### Base + Override Pattern

```yaml
# docker-compose.yml (base)
services:
  api:
    image: my-api:latest
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```yaml
# docker-compose.override.yml (development — auto-loaded)
services:
  api:
    build: .
    environment:
      NODE_ENV: development
      DEBUG: "*"
    volumes:
      - ./src:/app/src
    ports:
      - "3000:3000"

  postgres:
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: devpassword
```

```yaml
# docker-compose.prod.yml (production overrides)
services:
  api:
    image: registry.internal/my-api:v2.1.0
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
    restart: unless-stopped

  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - /data/postgres:/var/lib/postgresql/data

secrets:
  db_password:
    file: /etc/secrets/db_password
```

```bash
# Development (auto-loads override)
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Reverse Proxy with Caddy

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy

  api:
    image: my-api:latest
    expose:
      - "3000"  # Not published to host, only internal
    restart: unless-stopped

volumes:
  caddy-data:
```

```
# Caddyfile
app.example.com {
    reverse_proxy api:3000
    encode gzip
}
```

Caddy handles HTTPS automatically with Let's Encrypt.

## Zero-Downtime Deploys

```bash
#!/bin/bash
set -euo pipefail

# Pull new image
docker compose pull api

# Rolling update (one at a time with health checks)
docker compose up -d --no-deps --scale api=3 api

# Wait for new containers to be healthy
sleep 10

# Remove old containers
docker compose up -d --no-deps --scale api=2 api
```

## Backup Pattern

```yaml
services:
  backup:
    image: postgres:16-alpine
    entrypoint: /bin/sh
    command: >
      -c "while true; do
        pg_dump -h postgres -U postgres mydb | gzip > /backups/db-$$(date +%Y%m%d_%H%M%S).sql.gz;
        find /backups -name '*.sql.gz' -mtime +7 -delete;
        sleep 86400;
      done"
    volumes:
      - ./backups:/backups
    depends_on:
      postgres:
        condition: service_healthy
```

## Monitoring Stack

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}

  node-exporter:
    image: prom/node-exporter:latest
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro

volumes:
  prometheus-data:
  grafana-data:
```

## What's Next?

Our **Docker Fundamentals** course covers Docker Compose for development and production environments. **Node.js REST APIs** teaches containerized API development. First lessons are free.

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Docker Compose Production Patterns as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Docker, Docker Compose, Production, DevOps. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Docker Compose Production Patterns?

Use it when you need a practical, repeatable way to handle Docker, Docker Compose, Production, DevOps work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

