---
title: "Docker Networking Explained"
slug: "docker-networking-explained"
date: "2026-02-02"
category: "DevOps"
tags: ["Docker", "Networking", "Containers", "DevOps", "Infrastructure"]
excerpt: "Understand Docker networking. Bridge, host, overlay networks, DNS resolution, port mapping, and container-to-container communication."
description: "Docker networking explained for DevOps engineers. Bridge, host, and overlay networks, DNS service discovery, port mapping, and secure container-to-container communication."
---

Docker containers need networking to communicate with each other and the outside world. Understanding Docker's network model saves hours of debugging connectivity issues.

## Network Drivers

```bash
# List networks
docker network ls

# Default networks
NETWORK ID     NAME      DRIVER
abc123         bridge    bridge    # Default for containers
def456         host      host      # Share host network
ghi789         none      null      # No networking
```

| Driver | Use Case |
|---|---|
| **bridge** | Default. Containers on same host communicate |
| **host** | Container uses host's network stack directly |
| **overlay** | Multi-host networking (Swarm/K8s) |
| **macvlan** | Container gets its own MAC address on the LAN |
| **none** | No networking at all |

## Bridge Networks

### Default Bridge

```bash
# Containers on default bridge can reach each other by IP only
docker run -d --name web nginx
docker run -d --name api my-api

# Get container IP
docker inspect web -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# 172.17.0.2

# api can reach web by IP (not name!)
docker exec api curl http://172.17.0.2
```

### User-Defined Bridge (Recommended)

```bash
# Create custom network
docker network create app-net

# Containers get DNS resolution by name
docker run -d --name web --network app-net nginx
docker run -d --name api --network app-net my-api

# api can reach web by name!
docker exec api curl http://web
```

User-defined bridges provide:
- **DNS resolution** by container name
- **Better isolation** from other containers
- **Network-level access control**

## Port Mapping

```bash
# Map host port 8080 to container port 80
docker run -d -p 8080:80 nginx

# Map to specific interface
docker run -d -p 127.0.0.1:8080:80 nginx  # Only localhost

# Random host port
docker run -d -p 80 nginx
docker port <container>  # See assigned port

# Multiple ports
docker run -d -p 80:80 -p 443:443 nginx

# UDP
docker run -d -p 53:53/udp dns-server
```

## Docker Compose Networking

```yaml
services:
  frontend:
    image: my-frontend
    ports:
      - "3000:3000"       # Exposed to host
    networks:
      - frontend-net

  api:
    image: my-api
    expose:
      - "8080"             # Only internal, not to host
    networks:
      - frontend-net
      - backend-net

  postgres:
    image: postgres:16
    networks:
      - backend-net        # Not reachable from frontend

  redis:
    image: redis:7
    networks:
      - backend-net

networks:
  frontend-net:
  backend-net:
    internal: true         # No external access
```

In this setup:
- `frontend` can reach `api` (both on `frontend-net`)
- `api` can reach `postgres` and `redis` (all on `backend-net`)
- `frontend` **cannot** reach `postgres` directly
- `postgres` **cannot** reach the internet (`internal: true`)

## DNS Resolution

```bash
# Containers resolve each other by name on user-defined networks
docker exec api nslookup web
# Server:    127.0.0.11 (Docker's embedded DNS)
# Name:      web
# Address:   172.18.0.2

# Service aliases
docker run -d --name db --network app-net --network-alias database postgres
# Both "db" and "database" resolve to this container
```

## Host Network

Container shares the host's network namespace:

```bash
docker run -d --network host nginx
# Nginx listens on host's port 80 directly
# No port mapping needed
# No network isolation
```

Use when:
- Maximum network performance needed
- Container needs to see all host traffic
- Running network monitoring tools

## Network Inspection and Debugging

```bash
# Inspect network
docker network inspect app-net

# Check container's networks
docker inspect api --format '{{json .NetworkSettings.Networks}}' | jq

# Test connectivity
docker exec api ping web
docker exec api curl http://web:8080/health
docker exec api nslookup postgres

# View port mappings
docker port my-container

# Network traffic
docker run --rm --net container:api nicolaka/netshoot tcpdump -i eth0
```

## Connect/Disconnect Networks

```bash
# Connect running container to a network
docker network connect backend-net api

# Disconnect
docker network disconnect frontend-net api

# Container on multiple networks
docker run -d --name api \
  --network frontend-net \
  my-api
docker network connect backend-net api
```

## IP Address Management

```bash
# Create network with custom subnet
docker network create \
  --subnet 10.10.0.0/24 \
  --gateway 10.10.0.1 \
  custom-net

# Assign static IP
docker run -d --name db \
  --network custom-net \
  --ip 10.10.0.100 \
  postgres
```

## Common Issues

| Issue | Cause | Fix |
|---|---|---|
| Container can't resolve name | Default bridge (no DNS) | Use user-defined network |
| Port already in use | Host port conflict | Change `-p` mapping |
| Can't reach container from host | No port mapping | Add `-p host:container` |
| Containers can't communicate | Different networks | Connect to same network |
| Slow DNS resolution | Docker DNS timeout | Check `/etc/resolv.conf` in container |
| Connection refused | Service not listening on 0.0.0.0 | App binds to localhost, not 0.0.0.0 |

The last one is the most common mistake:

```javascript
// ❌ Only accessible from inside container
app.listen(3000, '127.0.0.1')

// ✅ Accessible from other containers and host
app.listen(3000, '0.0.0.0')
```

## What's Next?

Our **Docker Fundamentals** course covers networking, compose, and production deployment patterns. **Node.js REST APIs** teaches containerized API development. First lessons are free.

---

**Ready to go deeper?** Check out our hands-on course: [Docker Fundamentals](/courses/docker-fundamentals) — practical exercises you can follow along on your own machine.

