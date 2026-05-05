---
title: "Kustomize Kubernetes Configuration"
date: "2026-01-24"
description: "Kustomize customizes Kubernetes manifests without templates using overlays and patches. Learn how to manage multiple environments, merge configurations, and reduce YAML duplication."
category: "DevOps"
tags: ["kustomize", "kubernetes", "Configuration", "yaml", "gitops", "deployment"]
author: "Luca Berton"
---

Helm uses templates with Go syntax. Kustomize uses overlays — start with base manifests and patch them per environment. No template language. No curly braces. Just YAML.

## How Kustomize Works

```
base/                  overlays/staging/        overlays/production/
├── deployment.yaml    ├── kustomization.yaml   ├── kustomization.yaml
├── service.yaml       └── patch-replicas.yaml  ├── patch-replicas.yaml
└── kustomization.yaml                          └── patch-resources.yaml
```

Base manifests define the application. Overlays modify specific fields per environment.

## Base

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: order-api
  template:
    metadata:
      labels:
        app: order-api
    spec:
      containers:
        - name: order-api
          image: myorg/order-api:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
```

```yaml
# base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: order-api
spec:
  selector:
    app: order-api
  ports:
    - port: 8080
```

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
```

## Staging Overlay

```yaml
# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: staging-
namespace: staging
patches:
  - path: patch-replicas.yaml
images:
  - name: myorg/order-api
    newTag: v1.2.0-rc1
```

```yaml
# overlays/staging/patch-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  replicas: 2
```

## Production Overlay

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: prod-
namespace: production
patches:
  - path: patch-replicas.yaml
  - path: patch-resources.yaml
images:
  - name: myorg/order-api
    newTag: v1.1.0
```

```yaml
# overlays/production/patch-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  replicas: 5

# overlays/production/patch-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  template:
    spec:
      containers:
        - name: order-api
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
```

## Apply

```bash
# Preview staging output
kubectl kustomize overlays/staging/

# Apply staging
kubectl apply -k overlays/staging/

# Apply production
kubectl apply -k overlays/production/
```

## ConfigMap and Secret Generators

```yaml
# kustomization.yaml
configMapGenerator:
  - name: app-config
    literals:
      - LOG_LEVEL=info
      - PORT=8080
    files:
      - config.json

secretGenerator:
  - name: db-credentials
    literals:
      - DB_HOST=postgres.production
      - DB_PASSWORD=s3cur3
```

Kustomize appends a hash suffix to ConfigMap/Secret names. When content changes, the name changes, triggering a pod rollout automatically.

## Strategic Merge Patches

```yaml
# Add a sidecar
patches:
  - patch: |
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: order-api
      spec:
        template:
          spec:
            containers:
              - name: log-shipper
                image: fluent/fluent-bit:latest
                volumeMounts:
                  - name: logs
                    mountPath: /var/log/app
```

## JSON Patches

For more precise changes:

```yaml
patches:
  - target:
      kind: Deployment
      name: order-api
    patch: |
      - op: replace
        path: /spec/replicas
        value: 10
      - op: add
        path: /spec/template/metadata/annotations/prometheus.io~1scrape
        value: "true"
```

## Common Labels and Annotations

```yaml
# kustomization.yaml
commonLabels:
  app.kubernetes.io/part-of: ecommerce
  app.kubernetes.io/managed-by: kustomize
  environment: production

commonAnnotations:
  team: commerce
```

Applied to all resources in the kustomization.

## Kustomize vs Helm

| Feature | Kustomize | Helm |
|---------|----------|------|
| Config approach | Overlay/patch | Template |
| Language | YAML | Go templates |
| Learning curve | Low | Medium |
| Package registry | No | Helm repos |
| Dependency management | No | Chart dependencies |
| Built into kubectl | Yes (`-k`) | Separate CLI |
| Conditionals | No | Yes |
| Loops | No | Yes |

**Use Kustomize** for environment-specific overlays on your own manifests. **Use Helm** for distributing reusable packages and when you need conditionals/loops. Many teams use both: Helm for third-party charts, Kustomize for their own applications.

---

Ready to go deeper? Master Kubernetes configuration with hands-on courses at [CopyPasteLearn](/courses).
