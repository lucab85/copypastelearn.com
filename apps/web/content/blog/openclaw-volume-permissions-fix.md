---
title: "OpenClaw Volume Permissions Fix"
description: "Fix OpenClaw Docker volume permission errors. Resolve EACCES denied issues for named volumes and bind mounts."
date: "2026-04-07"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Docker", "Linux", "Permissions", "DevOps"]
excerpt: "Fix OpenClaw Docker volume permission errors. Resolve EACCES denied issues for named volumes and bind mounts."
---

## The Error

```
Error: EACCES: permission denied, open '/home/node/.openclaw/openclaw.json'
```

OpenClaw's Docker container runs as user `node` (UID 1000, GID 1000). If the mounted volume is owned by root or another user, the process cannot read or write its config files.

## Named Volumes (Recommended)

Docker named volumes usually get correct permissions automatically. If they do not:

```bash
# Remove and recreate
docker compose down
docker volume rm openclaw_openclaw-data
docker compose up -d
```

Docker creates the volume with the correct ownership on first run.

## Bind Mounts

Bind mounts inherit host filesystem permissions. Fix them:

```bash
# Create the directory
mkdir -p ./openclaw-data

# Set ownership to UID 1000
sudo chown -R 1000:1000 ./openclaw-data
sudo chmod 700 ./openclaw-data
```

Your `docker-compose.yml`:

```yaml
services:
  openclaw:
    image: openclaw/openclaw:latest
    volumes:
      - ./openclaw-data:/home/node/.openclaw
```

## Verify Permissions

```bash
# Check host directory
ls -la ./openclaw-data/

# Check inside container
docker compose exec openclaw ls -la /home/node/.openclaw/
```

Both should show `node` (or UID 1000) as owner.

## SELinux Systems (RHEL, Fedora)

On SELinux-enabled hosts, add the `:z` flag:

```yaml
volumes:
  - ./openclaw-data:/home/node/.openclaw:z
```

The `:z` flag tells Docker to relabel the volume for the container's SELinux context. Without it, SELinux blocks access even if Unix permissions are correct.

If you use a shared volume across multiple containers, use `:Z` (uppercase) instead.

## Rootless Docker

Rootless Docker maps UIDs differently. Check the actual UID mapping:

```bash
# Find the mapped UID
cat /proc/$(docker inspect --format '{{.State.Pid}}' openclaw-openclaw-1)/uid_map
```

For rootless Docker, you may need to adjust ownership to match the mapped UID.

## Common Mistakes

- **Running `chown` without `sudo`**: you need root to change ownership to UID 1000 if your user is not 1000
- **Forgetting to recreate after `chown`**: the container caches the mount — restart with `docker compose restart`
- **Using `:ro` (read-only) mount**: OpenClaw needs write access to update config, memory, and workspace files

## Prevention

Use named volumes in production. They handle permissions automatically and survive `docker compose down`:

```yaml
volumes:
  openclaw-data:
    driver: local
```

Only use bind mounts when you need direct host access to the files (debugging, backups).

## Related Posts

- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for the full Docker setup
- [Troubleshoot OpenClaw Gateway Errors](/blog/troubleshoot-openclaw-gateway-errors) for other common issues
- [SELinux File Contexts and Labels](/blog/selinux-file-contexts-labels-guide) for SELinux deep dive
