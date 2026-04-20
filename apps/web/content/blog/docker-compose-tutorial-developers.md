---
title: "Docker Compose Tutorial for Devs"
slug: "docker-compose-tutorial-developers"
date: "2026-03-31"
category: "DevOps"
tags: ["Docker", "Docker Compose", "Development", "Tutorial", "Containers"]
excerpt: "Master Docker Compose for local development. Build multi-service stacks with databases, caching, and hot reload in one command."
description: "Master Docker Compose for local development. Multi-service stacks with databases, caching, and hot reload in one command."
---

Docker Compose lets you define and run multi-container applications with a single YAML file. Instead of remembering 10 `docker run` commands, you run `docker compose up`.

## Why Docker Compose?

Most applications need more than one service:

- **Web app** — your application code
- **Database** — PostgreSQL, MySQL, MongoDB
- **Cache** — Redis, Memcached
- **Queue** — RabbitMQ, Kafka
- **Reverse proxy** — Nginx, Caddy

Without Compose, you would start each container manually, create networks, wire up volumes. With Compose, everything is defined in one file.

## Your First Compose File

`docker-compose.yml` for a Node.js app with PostgreSQL:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Start everything:

```bash
docker compose up -d
```

## Hot Reload for Development

The key to a great dev experience is **bind mounts** with a file watcher:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app            # Sync source code
      - /app/node_modules # Exclude node_modules
    command: npm run dev   # nodemon or tsx --watch
```

`Dockerfile.dev`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

Every file change on your host triggers a reload inside the container.

## Full Stack Example

A realistic development stack:

```yaml
services:
  web:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000

  api:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  adminer:
    image: adminer
    ports:
      - "8080:8080"

volumes:
  pgdata:
```

Run the whole thing:

```bash
docker compose up -d
# Frontend: http://localhost:5173
# API:      http://localhost:3000
# Adminer:  http://localhost:8080
```

## Useful Commands

```bash
docker compose up -d          # Start all services
docker compose down           # Stop and remove containers
docker compose logs -f api    # Follow API logs
docker compose exec api sh    # Shell into API container
docker compose ps             # List running services
docker compose restart api    # Restart one service
docker compose build          # Rebuild images
docker compose down -v        # Stop and remove volumes too
```

## Profiles for Optional Services

Mark services as optional:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"

  debug-tools:
    image: busybox
    profiles: ["debug"]
    command: sleep infinity

  mailhog:
    image: mailhog/mailhog
    profiles: ["email"]
    ports:
      - "1025:1025"
      - "8025:8025"
```

```bash
docker compose up -d              # Only starts 'app'
docker compose --profile debug up # Starts app + debug-tools
docker compose --profile email up # Starts app + mailhog
```

## Environment Variables

Use `.env` file for configuration:

```env
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpass
POSTGRES_DB=myapp
APP_PORT=3000
```

Reference in compose:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
```

## What's Next?

Our **Docker Fundamentals** course covers Compose along with images, networking, volumes, and production deployment patterns. Hands-on labs included — the first lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

