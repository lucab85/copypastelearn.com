---
title: "Traefik Kubernetes Ingress Guide"
date: "2026-02-14"
description: "Traefik is a cloud-native reverse proxy and ingress controller for Kubernetes. Learn how to configure routing, TLS termination, middlewares, and canary deployments with Traefik on Kubernetes."
category: "DevOps"
tags: ["Traefik", "kubernetes", "Ingress", "reverse-proxy", "load-balancer", "Networking"]
author: "Luca Berton"
---

nginx-ingress is the default choice. Traefik offers the same ingress capabilities with auto-discovery, a built-in dashboard, and middleware chains — all configurable through Kubernetes CRDs.

## Installation

```bash
helm install traefik traefik/traefik \
  --namespace traefik --create-namespace \
  --set dashboard.enabled=true \
  --set providers.kubernetesIngress.enabled=true \
  --set providers.kubernetesCRD.enabled=true
```

## Basic Routing

### Standard Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: order-api
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  rules:
    - host: api.myorg.com
      http:
        paths:
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: order-api
                port:
                  number: 8080
          - path: /payments
            pathType: Prefix
            backend:
              service:
                name: payment-api
                port:
                  number: 8080
```

### IngressRoute (Traefik CRD)

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: order-api
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`api.myorg.com`) && PathPrefix(`/orders`)
      kind: Rule
      services:
        - name: order-api
          port: 8080
    - match: Host(`api.myorg.com`) && PathPrefix(`/payments`)
      kind: Rule
      services:
        - name: payment-api
          port: 8080
  tls:
    certResolver: letsencrypt
```

IngressRoutes provide more expressive matching: headers, query parameters, and boolean combinations.

## TLS with Let's Encrypt

```yaml
# Helm values
additionalArguments:
  - --certificatesresolvers.letsencrypt.acme.email=admin@myorg.com
  - --certificatesresolvers.letsencrypt.acme.storage=/data/acme.json
  - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
```

Traefik automatically obtains and renews TLS certificates. No cert-manager needed for basic setups.

## Middlewares

Chain processing steps before reaching the backend:

### Rate Limiting

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
spec:
  rateLimit:
    average: 100
    burst: 200
    period: 1m
```

### Basic Auth

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
spec:
  basicAuth:
    secret: auth-secret
```

### Strip Path Prefix

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-api
spec:
  stripPrefix:
    prefixes:
      - /api
```

### Headers

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
spec:
  headers:
    stsSeconds: 31536000
    stsIncludeSubdomains: true
    contentTypeNosniff: true
    frameDeny: true
    browserXssFilter: true
```

### Chain Middlewares

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: api
spec:
  routes:
    - match: Host(`api.myorg.com`)
      kind: Rule
      middlewares:
        - name: rate-limit
        - name: security-headers
        - name: strip-api
      services:
        - name: order-api
          port: 8080
```

Requests flow through rate limiting → security headers → path stripping → backend.

## Weighted Routing (Canary)

```yaml
apiVersion: traefik.io/v1alpha1
kind: TraefikService
metadata:
  name: order-api-canary
spec:
  weighted:
    services:
      - name: order-api-v1
        port: 8080
        weight: 90
      - name: order-api-v2
        port: 8080
        weight: 10
```

10% of traffic goes to v2. Increase weight as confidence grows.

## Dashboard

```bash
# Port-forward the dashboard
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/
```

The dashboard shows all routers, services, middlewares, and their health status in real time.

## Traefik vs nginx-ingress

| Feature | Traefik | nginx-ingress |
|---------|---------|--------------|
| Config reload | Hot reload (no downtime) | Reload nginx process |
| Auto-discovery | Built-in | Manual |
| Dashboard | Built-in | Separate |
| CRD support | IngressRoute | Custom annotations |
| Canary routing | WeightedService | Annotations |
| Built-in TLS | ACME/Let's Encrypt | Needs cert-manager |
| TCP/UDP | Yes | Yes |
| Performance | Good | Slightly better |

Both work well. Traefik is easier to configure. nginx-ingress has marginally better raw performance at very high scale.

---

Ready to go deeper? Master Kubernetes networking with hands-on courses at [CopyPasteLearn](/courses).
