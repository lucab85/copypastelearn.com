---
title: "Tilt Kubernetes Dev Environment"
date: "2026-01-28"
description: "Tilt automates the build-push-deploy loop for Kubernetes development. Learn how Tilt watches code changes, rebuilds containers, and updates deployments in seconds with live reload."
category: "DevOps"
tags: ["tilt", "kubernetes", "development", "hot-reload", "developer-experience", "microservices"]
---

You change one line of code. Then you wait: build image, push to registry, update deployment, wait for rollout, check logs. Tilt automates this loop and gets changes into your cluster in seconds.

## How Tilt Works

```
Code Change → Tilt Detects → Smart Rebuild → Deploy to K8s → 2-5 seconds
```

Tilt watches your source files, rebuilds only what changed, syncs files directly into running containers when possible, and falls back to full image rebuilds when needed.

## Setup

```bash
# Install
brew install tilt-dev/tap/tilt

# Start Tilt in your project
cd order-api/
tilt up
```

Tilt opens a browser dashboard showing all your services, build status, logs, and errors.

## Tiltfile

```python
# Tiltfile (Starlark — Python-like)

# Build the Docker image
docker_build('myorg/order-api', '.',
  live_update=[
    sync('./src', '/app/src'),
    run('npm install', trigger=['package.json']),
  ]
)

# Apply Kubernetes manifests
k8s_yaml('k8s/deployment.yaml')

# Port forward for local access
k8s_resource('order-api', port_forwards='3000:8080')
```

## Live Update (No Rebuild)

The fastest path: sync files directly into the running container:

```python
docker_build('myorg/order-api', '.',
  live_update=[
    # Sync source files (no rebuild)
    sync('./src', '/app/src'),
    sync('./templates', '/app/templates'),
    
    # Run npm install only when package.json changes
    run('npm install', trigger=['package.json', 'package-lock.json']),
    
    # Restart the process when server files change
    run('kill -HUP 1', trigger=['./src/server.ts']),
  ]
)
```

Change a template file → Tilt syncs it into the pod → application picks it up. No image build, no push, no rollout.

## Multi-Service Development

```python
# Tiltfile for a microservices project

# Frontend
docker_build('myorg/frontend', './frontend',
  live_update=[sync('./frontend/src', '/app/src')]
)

# Order API
docker_build('myorg/order-api', './order-api',
  live_update=[sync('./order-api/src', '/app/src')]
)

# Payment Service
docker_build('myorg/payment-svc', './payment-svc',
  live_update=[sync('./payment-svc/src', '/app/src')]
)

# Infrastructure
k8s_yaml(helm('./charts/infrastructure'))

# Applications
k8s_yaml(['k8s/frontend.yaml', 'k8s/order-api.yaml', 'k8s/payment-svc.yaml'])

# Port forwards
k8s_resource('frontend', port_forwards='3000:80')
k8s_resource('order-api', port_forwards='8080:8080')

# Dependencies
k8s_resource('order-api', resource_deps=['postgres', 'redis'])
```

## Helm Integration

```python
# Deploy Helm charts
k8s_yaml(helm('./charts/order-api',
  values=['./charts/order-api/values-dev.yaml'],
  set=['image.tag=dev', 'replicas=1']
))
```

## Resource Groups

```python
# Group related resources
k8s_resource('order-api', labels=['backend'])
k8s_resource('payment-svc', labels=['backend'])
k8s_resource('frontend', labels=['frontend'])
k8s_resource('postgres', labels=['infrastructure'])
k8s_resource('redis', labels=['infrastructure'])
```

The Tilt UI groups services by label. Focus on what you are working on.

## Local Resources

Run local processes alongside Kubernetes services:

```python
# Run frontend locally (not in K8s)
local_resource('frontend-dev',
  cmd='npm run dev',
  serve_cmd='npm run dev',
  dir='./frontend',
  deps=['./frontend/src'],
  links=['http://localhost:3000']
)
```

## Tilt vs Alternatives

| Feature | Tilt | Skaffold | Telepresence | DevSpace |
|---------|------|---------|-------------|---------|
| Live update | Yes (file sync) | Yes (file sync) | Traffic intercept | Yes |
| Dashboard | Web UI | CLI | CLI | Web UI |
| Multi-service | Yes | Yes | Single service | Yes |
| Helm support | Yes | Yes | No | Yes |
| Config language | Starlark | YAML | N/A | YAML |
| Rebuild speed | Very fast | Fast | N/A (no rebuild) | Fast |

**Use Tilt** for multi-service development with a visual dashboard. **Use Telepresence** to debug a single service against a shared cluster. **Use Skaffold** if you prefer YAML configuration.

---

Ready to go deeper? Master Kubernetes development with hands-on courses at [CopyPasteLearn](/courses).
