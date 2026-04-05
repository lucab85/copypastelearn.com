---
title: "OpenClaw + Tailscale Remote Access"
description: "Access your OpenClaw agent securely from anywhere using Tailscale. Zero port forwarding, zero firewall rules."
date: "2026-04-06"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Tailscale", "VPN", "Remote Access", "DevOps"]
excerpt: "Access your OpenClaw agent securely from anywhere using Tailscale. Zero port forwarding, zero firewall rules."
---

## The Problem

You run OpenClaw on a home server or VPS. You want to reach it from your laptop, phone, or another machine — without exposing port 18789 to the internet.

Tailscale solves this. It creates an encrypted mesh network between your devices. No port forwarding, no dynamic DNS, no firewall holes.

## Install Tailscale

On the machine running OpenClaw:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Note your Tailscale IP:

```bash
tailscale ip -4
# Example: 100.64.0.5
```

## Configure OpenClaw

Set the bind mode to `tailnet`:

```bash
openclaw config set gateway.bind tailnet
openclaw config set gateway.controlui.allowedOrigins '["http://100.64.0.5:18789"]'
openclaw gateway restart
```

Or use the Tailscale hostname:

```bash
openclaw config set gateway.controlui.allowedOrigins '["http://my-server.tail12345.ts.net:18789"]'
openclaw gateway restart
```

## Access from Any Device

From any device on your tailnet, open:

```
http://my-server.tail12345.ts.net:18789
```

Enter your gateway token when prompted. Works from your phone, laptop, or any other Tailscale-connected device.

## Docker + Tailscale

If OpenClaw runs in Docker, Tailscale runs on the host. Bind to `0.0.0.0` and let Tailscale handle access control:

```yaml
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "18789:18789"
    environment:
      - OPENCLAW_GATEWAY_BIND=0.0.0.0
      - OPENCLAW_GATEWAY_CONTROLUI_ALLOWEDORIGINS=["http://100.64.0.5:18789"]
    volumes:
      - openclaw-data:/home/node/.openclaw
```

Then use Tailscale ACLs to restrict which devices can reach port 18789.

## Tailscale ACLs

Lock down access in your Tailscale admin console:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:admin"],
      "dst": ["tag:openclaw:18789"]
    }
  ]
}
```

Only devices tagged `admin` can reach your OpenClaw instance.

## HTTPS with Tailscale

Tailscale can provision HTTPS certificates for your tailnet hostnames:

```bash
tailscale cert my-server.tail12345.ts.net
```

Then point Caddy at the certs or use `tailscale serve`:

```bash
tailscale serve --bg https+insecure://localhost:18789
```

Now you have HTTPS at `https://my-server.tail12345.ts.net` with zero configuration.

## Why Not Just Use a VPN?

Traditional VPNs route all traffic through a single gateway. Tailscale creates direct connections between devices. Your OpenClaw traffic goes directly from your phone to your server — no hub bottleneck.

## Related Posts

- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for the base setup
- [OpenClaw Reverse Proxy with Caddy](/blog/openclaw-caddy-reverse-proxy) for domain-based HTTPS
- [OpenClaw Gateway Bind Modes](/blog/openclaw-gateway-bind-modes) for all binding options
