---
title: "Troubleshoot OpenClaw Gateway Errors"
description: "Fix common OpenClaw gateway errors: 401 unauthorized, connection refused, origin not allowed, and WebSocket failures."
date: "2026-04-07"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Troubleshooting", "DevOps", "Self-Hosted"]
excerpt: "Fix common OpenClaw gateway errors: 401 unauthorized, connection refused, origin not allowed, and WebSocket failures."
---

## 401 Unauthorized / Invalid API Key

The most common error. Your client token does not match the gateway token.

**Find the correct token:**

```bash
openclaw config get gateway.token
```

**Test it:**

```bash
TOKEN=$(openclaw config get gateway.token)
curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $TOKEN" \
  http://localhost:18789/v1/models
```

Expected: `200`. If still `401`:

- Check for an environment variable override: `env | grep OPENCLAW_GATEWAY_TOKEN`
- In Docker: `docker compose exec openclaw cat /home/node/.openclaw/openclaw.json | grep token`
- Regenerate if lost: `openclaw config set gateway.token "$(openssl rand -hex 32)"`

## Connection Refused

The gateway is not running or bound to the wrong address.

```bash
# Is the process running?
openclaw gateway status

# What IP is it listening on?
ss -tlnp | grep 18789
```

If it shows `127.0.0.1:18789`, the gateway only accepts local connections. For remote access:

```bash
openclaw config set gateway.bind lan
# or
openclaw config set gateway.bind 0.0.0.0
openclaw gateway restart
```

## Origin Not Allowed

The Control UI shows this when `allowedOrigins` does not include your browser URL.

**Check current setting:**

```bash
openclaw config get gateway.controlui.allowedOrigins
```

**Fix it:** add the URL you see in your browser address bar:

```bash
openclaw config set gateway.controlui.allowedOrigins '["http://192.168.1.50:18789"]'
openclaw gateway restart
```

Common mistake: setting `http://localhost:18789` but accessing from another device.

## WebSocket Errors

Symptoms: Control UI loads but does not update, or chat messages do not appear.

**Behind Nginx:** add WebSocket headers:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Behind Caddy:** works automatically, no config needed.

**Behind Cloudflare:** enable WebSockets in the Cloudflare dashboard under Network settings.

## Permission Denied (Docker)

```
Error: EACCES: permission denied, open '/home/node/.openclaw/openclaw.json'
```

The container runs as UID 1000. Fix:

```bash
# Named volume — recreate
docker compose down
docker volume rm openclaw_openclaw-data
docker compose up -d

# Bind mount — fix ownership
sudo chown -R 1000:1000 ./openclaw-data
```

## Port Already in Use

```
Error: listen EADDRINUSE :::18789
```

Another process occupies port 18789:

```bash
ss -tlnp | grep 18789
# Kill the conflicting process, or change the OpenClaw port
openclaw config set gateway.port 18790
openclaw gateway restart
```

## Gateway Starts Then Crashes

Check logs:

```bash
openclaw gateway logs
# or in Docker
docker compose logs openclaw --tail 50
```

Common causes:
- Invalid JSON in `openclaw.json` — reset with `openclaw config set gateway.bind loopback`
- Disk full — check `df -h`
- Out of memory — check `free -m`

## Quick Diagnostic Script

Run this to check everything at once:

```bash
echo "=== Gateway Status ==="
openclaw gateway status

echo "=== Bind Address ==="
openclaw config get gateway.bind

echo "=== Listening Ports ==="
ss -tlnp | grep 18789

echo "=== Token Test ==="
TOKEN=$(openclaw config get gateway.token)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $TOKEN" \
  http://localhost:18789/v1/models)
echo "HTTP $HTTP_CODE"

echo "=== Allowed Origins ==="
openclaw config get gateway.controlui.allowedOrigins
```

## Related Posts

- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for setup basics
- [OpenClaw Gateway Bind Modes](/blog/openclaw-gateway-bind-modes) to understand networking
- [OpenClaw + Tailscale Remote Access](/blog/openclaw-tailscale-remote-access) for secure remote access
- [Securing Your OpenClaw Agent](/blog/securing-openclaw-agent) for production hardening
