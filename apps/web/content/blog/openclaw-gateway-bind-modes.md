---
title: "OpenClaw Gateway Bind Modes Guide"
description: "Learn OpenClaw gateway bind modes: loopback, lan, tailnet, auto, and custom. Pick the right mode for your network setup."
date: "2026-04-05"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Networking", "Self-Hosted", "DevOps"]
excerpt: "Learn OpenClaw gateway bind modes: loopback, lan, tailnet, auto, and custom. Pick the right mode for your network setup."
---

## What Are Bind Modes?

The gateway bind mode controls which network interfaces OpenClaw listens on. Choose the wrong mode and your agent is either unreachable or exposed to the internet.

## The Five Modes

### loopback (Default)

Listens on `127.0.0.1` only. The safest option — only local connections work.

```bash
openclaw config set gateway.bind loopback
openclaw gateway restart
```

Use when: single-user setup on the same machine.

### lan

Listens on your local network IP (e.g., `192.168.1.50`). Other devices on your network can reach it.

```bash
openclaw config set gateway.bind lan
openclaw gateway restart
```

Use when: accessing from your phone or another computer on the same network.

### tailnet

Listens on your Tailscale IP. Only devices on your tailnet can connect.

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Use when: you use Tailscale and want secure remote access without exposing to the internet.

### auto

OpenClaw picks the best option automatically. It prefers tailnet if available, then lan, then loopback.

```bash
openclaw config set gateway.bind auto
openclaw gateway restart
```

Use when: you want reasonable defaults without thinking about it.

### custom

Bind to a specific IP or `0.0.0.0` (all interfaces).

```bash
openclaw config set gateway.bind 0.0.0.0
openclaw gateway restart
```

Use when: running behind a reverse proxy or in Docker.

## Which Mode Should You Pick?

| Scenario | Mode |
|---|---|
| Local dev on laptop | `loopback` |
| Access from phone on same Wi-Fi | `lan` |
| Remote access via Tailscale | `tailnet` |
| Docker container | `0.0.0.0` (custom) |
| Behind Caddy/Nginx | `0.0.0.0` (custom) |
| Not sure | `auto` |

## Check Your Current Bind

```bash
openclaw config get gateway.bind

# See what IP the gateway is actually listening on
ss -tlnp | grep 18789
```

## Security Considerations

- **Never bind `0.0.0.0` on a public server without a firewall.** Anyone on the internet could reach your gateway.
- Always set `allowedOrigins` when using `lan` or wider modes.
- Use a reverse proxy with TLS for production deployments.

## Related Posts

- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for containerized setups
- [Securing Your OpenClaw Agent](/blog/securing-openclaw-agent) for production hardening
- [OpenClaw on Raspberry Pi](/blog/openclaw-raspberry-pi) for low-power deployments
