---
title: "Docker Volumes and Persistent Data"
description: "Manage persistent data in Docker with named volumes and bind mounts. Backup strategies, restore procedures, and best practices for sharing data between containers."
date: "2026-04-14"
author: "Luca Berton"
category: "DevOps"
tags: ["Docker", "Volumes", "Storage", "DevOps", "Containers"]
excerpt: "Manage persistent data in Docker with volumes and bind mounts. Backup, restore, and share data between containers."
---

## Why Volumes?

Containers are ephemeral — when they stop, data is gone. Volumes persist data beyond the container lifecycle.

## Named Volumes

Docker manages the storage location:

```bash
# Create
docker volume create mydata

# Use in a container
docker run -d --name db \
  -v mydata:/var/lib/postgresql/data \
  postgres:16

# List volumes
docker volume ls

# Inspect
docker volume inspect mydata
```

## Bind Mounts

Map a host directory into the container:

```bash
docker run -d --name web \
  -v /home/user/website:/usr/share/nginx/html:ro \
  nginx
```

The `:ro` flag makes it read-only inside the container.

## Docker Compose Volumes

```yaml
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data      # Named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # Bind mount

volumes:
  pgdata:
```

## When to Use Which

| Feature | Named Volume | Bind Mount |
|---|---|---|
| Managed by Docker | Yes | No |
| Performance | Best (especially on Mac) | Native on Linux |
| Portable | Yes | Depends on host paths |
| Pre-populated | Yes (from image) | No |
| Direct host access | Via `docker volume inspect` | Yes |

**Rule of thumb**: named volumes for databases and app state, bind mounts for config files and source code (dev).

## Backup a Volume

```bash
# Backup to tar
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mydata-backup.tar.gz -C /source .

# Restore
docker run --rm \
  -v mydata:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mydata-backup.tar.gz -C /target
```

## Copy Data Between Volumes

```bash
docker run --rm \
  -v source_vol:/from:ro \
  -v dest_vol:/to \
  alpine sh -c "cp -a /from/. /to/"
```

## Share Volumes Between Containers

Multiple containers can mount the same volume:

```yaml
services:
  writer:
    image: alpine
    command: sh -c "while true; do date >> /data/log.txt; sleep 5; done"
    volumes:
      - shared:/data

  reader:
    image: alpine
    command: tail -f /data/log.txt
    volumes:
      - shared:/data:ro

volumes:
  shared:
```

## tmpfs Mounts

In-memory storage — fast but data is lost on restart:

```bash
docker run -d --name cache \
  --tmpfs /tmp:size=100m \
  redis:7-alpine
```

Use for: temporary files, caches, sensitive data that should not persist.

## Cleanup

```bash
# Remove unused volumes
docker volume prune

# Remove a specific volume
docker volume rm mydata

# Nuclear — remove all stopped containers and their volumes
docker system prune --volumes
```

**Warning**: `docker volume prune` deletes ALL volumes not attached to a running container. Double-check before running in production.

## Related Posts

- [Getting Started with Docker](/blog/getting-started-with-docker) for Docker basics
- [Docker Compose for Dev Environments](/blog/docker-compose-dev-environments) for multi-service stacks
- [OpenClaw Volume Permissions Fix](/blog/openclaw-volume-permissions-fix) for permission issues

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

