---
title: "Nginx Reverse Proxy Configuration"
slug: "nginx-reverse-proxy-configuration"
date: "2026-01-22"
category: "DevOps"
tags: ["Nginx", "Reverse Proxy", "Load Balancing", "DevOps", "Infrastructure"]
excerpt: "Configure Nginx as a reverse proxy. Upstream pools, load balancing, SSL termination, caching, rate limiting, and WebSocket proxying."
description: "Configure Nginx as a production reverse proxy. Upstream server pools, load balancing algorithms, SSL termination, response caching, rate limiting, and WebSocket proxying."
---

Nginx sits in front of your application servers handling SSL, load balancing, caching, and rate limiting. One of the most common DevOps setups.

## Basic Reverse Proxy

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The `proxy_set_header` lines pass the original client info to your app. Without them, your app sees all requests coming from `127.0.0.1`.

## Load Balancing

```nginx
upstream backend {
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Load Balancing Methods

```nginx
# Round robin (default)
upstream backend {
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}

# Least connections
upstream backend {
    least_conn;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}

# IP hash (sticky sessions)
upstream backend {
    ip_hash;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}

# Weighted
upstream backend {
    server 10.0.1.10:3000 weight=3;  # Gets 3x traffic
    server 10.0.1.11:3000 weight=1;
}

# With health checks
upstream backend {
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 backup;  # Only used when others fail
}
```

## SSL Termination

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    # Modern TLS config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## Caching

```nginx
proxy_cache_path /var/cache/nginx levels=1:2
    keys_zone=app_cache:10m
    max_size=1g
    inactive=60m
    use_temp_path=off;

server {
    listen 443 ssl http2;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_cache app_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # Don't cache authenticated content
    location /api/ {
        proxy_pass http://backend;
        proxy_cache off;
    }

    # Long cache for static assets
    location /static/ {
        proxy_pass http://backend;
        proxy_cache app_cache;
        proxy_cache_valid 200 30d;
    }
}
```

## Rate Limiting

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

server {
    listen 443 ssl http2;
    server_name app.example.com;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://backend;
    }

    location /auth/login {
        limit_req zone=login burst=5;
        limit_req_status 429;
        proxy_pass http://backend;
    }
}
```

## WebSocket Proxying

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;  # Keep connections alive
    }
}
```

## Security Headers

```nginx
server {
    # Prevent clickjacking
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Prevent MIME sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # XSS protection
    add_header X-XSS-Protection "1; mode=block" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;

    # Referrer policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hide Nginx version
    server_tokens off;

    # Limit request body size
    client_max_body_size 10m;
}
```

## Testing and Reloading

```bash
# Test configuration
sudo nginx -t

# Reload (zero downtime)
sudo nginx -s reload
# or
sudo systemctl reload nginx

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

## What's Next?

Our **Docker Fundamentals** course covers containerized Nginx deployment. **Node.js REST APIs** teaches building the backend services behind the proxy. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

