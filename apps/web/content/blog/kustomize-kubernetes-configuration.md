---
title: "Kustomize Kubernetes Configuration"
date: "2026-01-24"
description: "Kustomize customizes Kubernetes manifests without templates using overlays and patches. Learn how to manage multiple environments, merge configurations."
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

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Kustomize Kubernetes Configuration as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to kustomize, kubernetes, Configuration, yaml. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Kustomize Kubernetes Configuration?

Use it when you need a practical, repeatable way to handle kustomize, kubernetes, Configuration, yaml work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

