---
title: "Getting Started with Docker"
description: "Learn Docker fundamentals from scratch — containers, images, Dockerfiles, and real-world workflows. No prior experience needed."
date: "2026-02-26"
author: "Luca Berton"
category: "DevOps"
tags: ["Docker", "Containers", "DevOps"]
---

## What is Docker and Why Should You Care?

If you've ever heard "it works on my machine" — Docker is the cure. Docker lets you package applications with everything they need to run (code, runtime, libraries, config) into lightweight, portable containers.

The underlying problem is dependency hell: your app needs Python 3.11, your teammate has 3.9, and production has something else entirely. Docker fixes this by bundling the exact runtime and dependencies your app needs into one reproducible unit that behaves the same everywhere.

Unlike virtual machines, containers share the host OS kernel, making them incredibly fast to start and efficient with resources.

## Prerequisites

Before you dive in, make sure you have:

- A Linux, macOS, or Windows (with WSL2) machine.
- Docker installed and running — Docker Desktop, or the Docker Engine on Linux.
- Basic comfort with the command line.

No prior container experience required.

## How It Works

A Docker image is a stack of read-only layers, one per Dockerfile instruction. A running container adds one thin writable layer on top, where its runtime changes live; stop the container and that layer disappears, while the image layers underneath stay untouched and get reused by anything else built from that image.

This is also how Docker differs from a full VM — a common source of beginner confusion. A VM boots its own kernel and drivers on top of a hypervisor, which is why VMs are measured in gigabytes and take real time to start. A container shares the host's kernel instead: isolation comes from Linux namespaces (process, network, and mount isolation) and cgroups (CPU/memory limits), not a second kernel.

## Key Concepts

### Images vs Containers

Think of a **Docker image** as a recipe and a **container** as the dish you cook from it:

- **Image**: A read-only template with instructions for creating a container
- **Container**: A running instance of an image — isolated, lightweight, and disposable

### The Dockerfile

A `Dockerfile` is your recipe file. Here's a simple one for a Node.js app:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Each instruction creates a layer. Docker caches layers, so unchanged steps are blazing fast on rebuilds.

This caching is also why instruction order matters: change any instruction and every layer after it must rebuild. That's why the Dockerfile above installs dependencies with `npm ci` before copying the application code — dependencies change less often than code, so most rebuilds skip that step and reuse the cached layer.

## Essential Commands

- `docker build -t myapp .` — Build an image from a Dockerfile
- `docker run -p 3000:3000 myapp` — Run a container
- `docker ps` — List running containers
- `docker stop <id>` — Stop a container
- `docker compose up` — Start multi-container apps

`docker run` creates a brand-new container from an image, while `docker exec` attaches to one that's already running — useful for a quick shell (`docker exec -it <id> bash`) without restarting anything. Confusing the two is a common beginner mistake.

Also avoid the implicit `latest` tag in production. It's just a label for whatever was last pushed without an explicit version, not a guarantee of anything current or stable. Pin a real version instead, so deployments stay reproducible.

## Real-World Workflow

1. Write your application code
2. Create a `Dockerfile` in your project root
3. Build the image: `docker build -t myapp .`
4. Test locally: `docker run -p 3000:3000 myapp`
5. Push to a registry: `docker push myregistry/myapp`
6. Deploy anywhere that runs Docker

Step 5 matters more than it looks: pushing to a registry (Docker Hub, GitHub Container Registry, AWS ECR) turns your local image into the exact bytes that CI, staging, and production all pull and run — no rebuilding on a different machine and hoping it matches.

## Common Pitfalls

A few mistakes catch almost every Docker beginner:

- **Disk fills up from neglect.** Stopped containers, unused images, and dangling layers pile up fast. Run `docker system prune` periodically and check `docker system df` to see where the space is going.
- **Image bloat.** Starting from a full `ubuntu` or `node` image when you only need a few binaries drags in libraries you'll never use — prefer `alpine` variants and multi-stage builds.
- **Secrets baked into images.** Never `COPY` a `.env` file or credentials into an image, and never pass secrets as build arguments — they persist in cached layers. Pass secrets at runtime instead.

## What's Next?

Docker is the foundation of modern DevOps. Once you're comfortable with basics, explore:

- **Docker Compose** for multi-container applications
- **Docker volumes** for persistent data
- **Multi-stage builds** for smaller production images
- **Container orchestration** with Kubernetes

Ready to learn hands-on? Check out our [Docker Fundamentals course](/courses/docker-fundamentals) — it includes interactive labs where you practice in real environments.
