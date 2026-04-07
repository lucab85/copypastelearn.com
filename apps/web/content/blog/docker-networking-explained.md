---
title: "Docker Networking Explained"
description: "Understand Docker networking: bridge, host, overlay, and macvlan. Connect containers, expose ports, and troubleshoot."
date: "2026-04-11"
author: "Luca Berton"
category: "DevOps"
tags: ["Docker", "Networking", "Containers", "DevOps"]
excerpt: "Understand Docker networking: bridge, host, overlay, and macvlan. Connect containers, expose ports, and troubleshoot."
---

## Network Types

Docker has four built-in network drivers:

### Bridge (Default)

Containers on the same bridge network can talk to each other by name. Isolated from the host network.

```bash
# Create a custom bridge
docker network create myapp

# Run containers on it
docker run -d --name api --network myapp nginx
docker run -d --name db --network myapp postgres:16

# api can reach db by name
docker exec api curl http://db:5432
```

### Host

Container shares the host's network stack. No port mapping needed — the container binds directly to host ports.

```bash
docker run -d --network host nginx
# Nginx is now on host port 80
```

Use when: maximum network performance or when port mapping is impractical.

### Overlay

Spans multiple Docker hosts (Swarm mode). Containers on different machines can communicate.

```bash
docker network create --driver overlay my-overlay
```

### None

No networking at all. The container is completely isolated.

```bash
docker run --network none alpine
```

## Port Mapping

Expose container ports to the host:

```bash
# Map host 8080 to container 80
docker run -p 8080:80 nginx

# Map to specific interface
docker run -p 127.0.0.1:8080:80 nginx

# Random host port
docker run -p 80 nginx
docker port <container-id>  # See the assigned port
```

## Docker Compose Networking

Compose creates a default network automatically. All services can reach each other by service name:

```yaml
services:
  api:
    image: node:20
    ports:
      - "3000:3000"

  db:
    image: postgres:16
    # No ports needed — api reaches db:5432 internally
```

For multiple isolated networks:

```yaml
services:
  api:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend

  nginx:
    networks:
      - frontend

networks:
  frontend:
  backend:
```

The `db` container is not reachable from `nginx` — only `api` bridges both networks.

## DNS Resolution

Custom bridge networks have built-in DNS. The default bridge does not.

```bash
# Works on custom network
docker network create mynet
docker run -d --name web --network mynet nginx
docker run --rm --network mynet alpine nslookup web
# Returns the container IP

# Does NOT work on default bridge
docker run -d --name web2 nginx
docker run --rm alpine nslookup web2
# nslookup: can't resolve 'web2'
```

Always use custom networks for multi-container apps.

## Troubleshooting

```bash
# List networks
docker network ls

# Inspect a network
docker network inspect myapp

# Check container's network
docker inspect <container> | grep -A20 "Networks"

# Test connectivity from inside
docker exec <container> ping <other-container>
docker exec <container> curl http://<service>:<port>

# Check published ports
docker port <container>
```

## Common Issues

- **Container can't reach another**: are they on the same network? Check `docker network inspect`
- **Port already in use**: `ss -tlnp | grep <port>` to find the conflict
- **DNS not working**: use a custom bridge network, not the default
- **Firewall blocking**: `sudo ufw allow <port>/tcp` or check iptables

## Related Posts

- [Getting Started with Docker](/blog/getting-started-with-docker) for Docker basics
- [Docker Compose for Dev Environments](/blog/docker-compose-dev-environments) for multi-service setups
- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for a real-world example
