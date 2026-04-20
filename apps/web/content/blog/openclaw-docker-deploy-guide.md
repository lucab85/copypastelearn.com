---
title: "Deploy OpenClaw with Docker Compose"
description: "Step-by-step guide to deploy OpenClaw using Docker Compose. Cover networking, volumes, reverse proxy, and Tailscale setups."
date: "2026-04-05"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Docker", "Docker Compose", "Self-Hosted", "DevOps"]
excerpt: "Deploy OpenClaw on any Linux server with Docker Compose. Covers networking, volumes, permissions, reverse proxy, and Tailscale — production-ready in 10 minutes."
---

## Why Docker for OpenClaw?

Running OpenClaw in Docker keeps your host clean, makes upgrades a single `docker compose pull`, and lets you move between machines by copying one volume. If you already run Docker on your server, this is the fastest path to production.

## Minimal docker-compose.yml

Create a directory and add your compose file:

```bash
mkdir -p ~/openclaw && cd ~/openclaw
```

```yaml
version: "3.8"
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "18789:18789"
    environment:
      - OPENCLAW_GATEWAY_BIND=0.0.0.0
    volumes:
      - openclaw-data:/home/node/.openclaw

volumes:
  openclaw-data:
```

Start it:

```bash
docker compose up -d
docker compose logs -f openclaw
```

The gateway starts on port 18789. Grab your token:

```bash
docker compose exec openclaw openclaw config get gateway.token
```

## Configure allowedOrigins

The Control UI needs to know which origins are allowed. Replace `YOUR_HOST_IP` with your actual IP:

```bash
# Find your IP
hostname -I | awk '{print $1}'
```

Add to your compose environment:

```yaml
environment:
  - OPENCLAW_GATEWAY_BIND=0.0.0.0
  - OPENCLAW_GATEWAY_CONTROLUI_ALLOWEDORIGINS=["http://192.168.1.50:18789"]
```

**Common mistake**: using `localhost` here only works if the browser runs on the same machine. Always use the real IP for remote access.

## Fix Volume Permissions

If you see `EACCES: permission denied`, the container runs as UID 1000:

```bash
# For named volumes — recreate
docker compose down
docker volume rm openclaw_openclaw-data
docker compose up -d

# For bind mounts — fix ownership
sudo chown -R 1000:1000 ./openclaw-data
sudo chmod 700 ./openclaw-data
```

## Add Tailscale Access

If you use Tailscale, add your Tailscale hostname to allowedOrigins:

```yaml
environment:
  - OPENCLAW_GATEWAY_BIND=0.0.0.0
  - OPENCLAW_GATEWAY_CONTROLUI_ALLOWEDORIGINS=["http://192.168.1.50:18789","http://my-server.tail12345.ts.net:18789"]
```

This lets you access the Control UI from any device on your tailnet.

## Behind a Reverse Proxy

For HTTPS with Caddy or Nginx, remove the port mapping and let the proxy handle TLS:

```yaml
services:
  openclaw:
    image: openclaw/openclaw:latest
    environment:
      - OPENCLAW_GATEWAY_BIND=0.0.0.0
      - OPENCLAW_GATEWAY_CONTROLUI_ALLOWEDORIGINS=["https://openclaw.yourdomain.com"]
    networks:
      - proxy

networks:
  proxy:
    external: true
```

Caddy example:

```
openclaw.yourdomain.com {
    reverse_proxy openclaw:18789
}
```

## Connect Messaging Channels

Once the gateway is running, connect your channels:

- **Discord**: Create a bot, add the token via `openclaw configure --section discord`
- **Telegram**: Talk to BotFather, get a token, configure via `openclaw configure --section telegram`
- **Signal**: Link your phone number through the Signal integration

Each channel runs independently — one OpenClaw instance handles all of them.

## Verify Everything Works

```bash
# Check gateway is responding
TOKEN=$(docker compose exec openclaw openclaw config get gateway.token)
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $TOKEN" \
  http://localhost:18789/v1/models
```

Expected: `200`. If you get `401`, your token does not match. If connection refused, the gateway is not running.

## Upgrades

```bash
docker compose pull
docker compose up -d
```

Your data persists in the named volume. OpenClaw handles config migrations automatically.

## What's Next?

With OpenClaw running in Docker, explore these next:

- [Install custom skills](/blog/building-openclaw-skills) to extend your agent
- [Connect Discord](/blog/openclaw-discord-bot) for team automation
- [Set up heartbeats](/blog/openclaw-heartbeats-proactive) for proactive monitoring
- [Secure your agent](/blog/securing-openclaw-agent) for production use

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

