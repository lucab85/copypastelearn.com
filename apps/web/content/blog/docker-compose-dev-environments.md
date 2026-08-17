---
title: "Docker Compose for Dev Environments"
description: "Set up reproducible local development environments with Docker Compose. Multi-service stacks, hot reload, database seeding, and team workflows."
date: "2026-04-09"
author: "Luca Berton"
category: "Development"
tags: ["Docker", "Docker Compose", "Development", "Node.js", "PostgreSQL"]
excerpt: "Set up local development environments with Docker Compose. Multi-service stacks, hot reload, and database seeding."
---

## Why Docker Compose for Dev?

Every developer on the team runs the exact same stack: same database version, same Redis, same message queue. No more "works on my machine."

## Full-Stack Example

A Node.js API with PostgreSQL and Redis:

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://app:secret@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    volumes:
      - ./src:/app/src
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## Hot Reload

Mount your source code as a volume so changes reflect instantly:

```yaml
services:
  api:
    build: .
    volumes:
      - ./src:/app/src
      - /app/node_modules  # Prevent overwriting container's node_modules
    command: npm run dev
```

The `/app/node_modules` anonymous volume keeps the container's installed packages separate from your host.

## Database Seeding

Place SQL files in the init directory:

```bash
# init.sql — runs on first container start
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255)
);

INSERT INTO users (email, name) VALUES
  ('alice@example.com', 'Alice'),
  ('bob@example.com', 'Bob');
```

Reset the database:

```bash
docker compose down -v  # -v removes volumes
docker compose up -d
```

## Override Files

Use `docker-compose.override.yml` for dev-specific settings:

```yaml
# docker-compose.override.yml (auto-loaded)
services:
  api:
    command: npm run dev
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
```

For production, use an explicit file:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Useful Commands

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f api

# Run a one-off command
docker compose exec api npm run migrate

# Rebuild after Dockerfile changes
docker compose up -d --build

# Stop and clean up
docker compose down

# Nuclear option — remove everything including volumes
docker compose down -v --rmi all
```

## Profiles

Run optional services only when needed:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"
    profiles:
      - email

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    profiles:
      - debug
```

```bash
# Normal dev
docker compose up -d

# With email testing
docker compose --profile email up -d

# With everything
docker compose --profile email --profile debug up -d
```

## Related Posts

- [Getting Started with Docker](/blog/getting-started-with-docker) for Docker basics
- [Docker Multi-Stage Builds](/blog/docker-multi-stage-builds-guide) for production images
- [Building REST APIs with Node.js](/blog/building-rest-apis-with-nodejs) for the API side

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Docker Compose for Dev Environments as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Docker, Docker Compose, Development, Node.js. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Docker Compose for Dev Environments?

Use it when you need a practical, repeatable way to handle Docker, Docker Compose, Development, Node.js work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

