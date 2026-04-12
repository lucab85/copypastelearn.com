---
title: "Docker Tutorial for Beginners 2026"
slug: "docker-tutorial-beginners-2026"
date: "2026-04-07"
category: "DevOps"
tags: ["Docker", "Containers", "Beginner", "Tutorial", "DevOps"]
excerpt: "Complete Docker tutorial for beginners. Learn containers, images, Dockerfiles, volumes, networking, and Docker Compose step by step."
description: "Complete Docker tutorial for beginners. Learn containers, images, Dockerfiles, volumes, networking, and Docker Compose step by step."
---

Docker changed how we build, ship, and run software. This tutorial covers everything a beginner needs to go from zero to running containerized applications.

## What is Docker?

Docker packages your application and all its dependencies into a **container** — a lightweight, portable unit that runs the same everywhere: your laptop, staging server, or production cloud.

**Before Docker**: "It works on my machine" was the most common excuse in software development. Different OS versions, library conflicts, and environment mismatches caused endless deployment problems.

**After Docker**: Build once, run anywhere. The container includes everything the app needs.

## Install Docker

**Ubuntu/Debian:**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
docker --version
```

**macOS:**

```bash
brew install --cask docker
# Open Docker Desktop
docker --version
```

## Your First Container

```bash
docker run hello-world
```

That command:
1. Pulled the `hello-world` image from Docker Hub
2. Created a container from that image
3. Ran the container
4. Printed a message and exited

## Working with Images

Search for images:

```bash
docker search nginx
```

Pull an image:

```bash
docker pull nginx:latest
```

List your images:

```bash
docker images
```

## Running Containers

Run Nginx web server:

```bash
docker run -d -p 8080:80 --name webserver nginx
```

Breaking it down:
- `-d` — Run in background (detached)
- `-p 8080:80` — Map host port 8080 to container port 80
- `--name webserver` — Give the container a name

Visit `http://localhost:8080` — you have a web server running.

Useful commands:

```bash
docker ps              # List running containers
docker ps -a           # List all containers (including stopped)
docker logs webserver  # View container logs
docker exec -it webserver bash  # Shell into container
docker stop webserver  # Stop container
docker rm webserver    # Remove container
```

## Building Custom Images

Create a `Dockerfile` for a Node.js app:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t my-app .
docker run -d -p 3000:3000 my-app
```

### Multi-Stage Builds

Keep images small by separating build and runtime:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Volumes — Persistent Data

Containers are ephemeral — data is lost when they stop. Volumes persist data:

```bash
# Named volume
docker volume create mydata
docker run -d -v mydata:/data my-app

# Bind mount (map host directory)
docker run -d -v $(pwd)/data:/app/data my-app
```

## Networking

Containers communicate through Docker networks:

```bash
# Create a network
docker network create mynet

# Run containers on the same network
docker run -d --network mynet --name db postgres:16
docker run -d --network mynet --name app -e DB_HOST=db my-app
```

The `app` container can reach `db` by hostname — Docker handles DNS.

## Docker Compose

Define multi-container applications in one file. Create `docker-compose.yml`:

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb

volumes:
  pgdata:
```

Run the entire stack:

```bash
docker compose up -d     # Start everything
docker compose logs -f   # Follow logs
docker compose down      # Stop and clean up
```

## Essential Docker Commands

| Command | Purpose |
|---|---|
| `docker build -t name .` | Build image from Dockerfile |
| `docker run -d -p H:C name` | Run container (host:container ports) |
| `docker ps` | List running containers |
| `docker logs name` | View container logs |
| `docker exec -it name sh` | Shell into container |
| `docker compose up -d` | Start multi-container app |
| `docker system prune` | Clean unused resources |

## What's Next?

Our **Docker Fundamentals** course goes hands-on with real lab environments — build, debug, and deploy containers without any local setup. The first lesson is free.
