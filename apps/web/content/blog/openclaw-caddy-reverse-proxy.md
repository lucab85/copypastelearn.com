---
title: "OpenClaw Reverse Proxy with Caddy"
description: "Set up HTTPS for OpenClaw using Caddy as a reverse proxy. Automatic TLS certificate management, WebSocket support, and production-ready configuration in under 10 minutes."
date: "2026-04-06"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Caddy", "Reverse Proxy", "HTTPS", "DevOps"]
excerpt: "Set up HTTPS for OpenClaw using Caddy reverse proxy. Automatic TLS, WebSocket support, and production-ready config."
---

## Why a Reverse Proxy?

Running OpenClaw directly on port 18789 works for local use. For remote access you want HTTPS, a clean domain, and proper WebSocket handling. Caddy does all of this with minimal config.

## Prerequisites

- A domain pointing to your server (e.g., `openclaw.yourdomain.com`)
- Caddy installed (`sudo apt install caddy` on Debian/Ubuntu)
- OpenClaw running and bound to `127.0.0.1:18789`

## Minimal Caddyfile

```
openclaw.yourdomain.com {
    reverse_proxy localhost:18789
}
```

That is the entire config. Caddy automatically:
- Obtains a TLS certificate from Let's Encrypt
- Redirects HTTP to HTTPS
- Proxies WebSocket connections

Reload Caddy:

```bash
sudo systemctl reload caddy
```

## Configure OpenClaw allowedOrigins

Tell OpenClaw to accept requests from your domain:

```bash
openclaw config set gateway.controlui.allowedOrigins '["https://openclaw.yourdomain.com"]'
openclaw gateway restart
```

## Docker Setup

If both Caddy and OpenClaw run in Docker, use a shared network:

```yaml
version: "3.8"
services:
  openclaw:
    image: openclaw/openclaw:latest
    environment:
      - OPENCLAW_GATEWAY_BIND=0.0.0.0
      - OPENCLAW_GATEWAY_CONTROLUI_ALLOWEDORIGINS=["https://openclaw.yourdomain.com"]
    networks:
      - web

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    networks:
      - web

networks:
  web:

volumes:
  caddy_data:
```

Caddyfile for Docker:

```
openclaw.yourdomain.com {
    reverse_proxy openclaw:18789
}
```

Note: use the service name `openclaw` instead of `localhost`.

## Verify

```bash
# Check TLS certificate
curl -I https://openclaw.yourdomain.com

# Test API
curl -H "x-api-key: YOUR_TOKEN" https://openclaw.yourdomain.com/v1/models
```

## Nginx Alternative

If you prefer Nginx:

```nginx
server {
    listen 443 ssl;
    server_name openclaw.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/openclaw.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/openclaw.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

The `Upgrade` and `Connection` headers are required for WebSocket connections.

## Troubleshooting

- **502 Bad Gateway**: OpenClaw is not running or bound to the wrong interface. Check `ss -tlnp | grep 18789`.
- **WebSocket errors**: Missing `proxy_set_header Upgrade` in Nginx config. Caddy handles this automatically.
- **Certificate errors**: DNS not pointing to your server yet. Check with `dig openclaw.yourdomain.com`.

## Related Posts

- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) for the base Docker setup
- [OpenClaw Gateway Bind Modes](/blog/openclaw-gateway-bind-modes) to understand network binding
- [Securing Your OpenClaw Agent](/blog/securing-openclaw-agent) for additional hardening

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

