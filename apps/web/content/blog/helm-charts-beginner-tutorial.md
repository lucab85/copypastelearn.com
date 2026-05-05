---
title: "Helm Charts Beginner Tutorial"
slug: "helm-charts-beginner-tutorial"
date: "2026-03-11"
category: "DevOps"
tags: ["helm", "kubernetes", "Charts", "DevOps", "deployment"]
excerpt: "Get started with Helm charts for Kubernetes. Install apps, create custom charts, use values files, and manage releases like a pro."
description: "Get started with Helm charts for Kubernetes. Install community charts, create custom charts, manage values files, and handle releases."
author: "Luca Berton"
---

Helm is the package manager for Kubernetes. Instead of writing dozens of YAML files, you install a Helm chart and configure it with a values file.

## Install Helm

```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

## Using Existing Charts

### Add a Repository

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### Search for Charts

```bash
helm search repo nginx
helm search repo postgresql
helm search hub grafana  # Search Artifact Hub
```

### Install a Chart

```bash
# Install Nginx
helm install my-nginx bitnami/nginx

# Install with custom values
helm install my-db bitnami/postgresql \
  --set auth.postgresPassword=secretpass \
  --set primary.persistence.size=20Gi \
  --namespace databases \
  --create-namespace
```

### Manage Releases

```bash
helm list                          # List installed releases
helm status my-nginx               # Check release status
helm upgrade my-nginx bitnami/nginx --set replicaCount=3
helm rollback my-nginx 1           # Rollback to revision 1
helm uninstall my-nginx            # Remove release
helm history my-nginx              # View revision history
```

## Values Files

Instead of `--set` flags, use a YAML file:

```yaml
# values-production.yaml
replicaCount: 3

image:
  repository: my-registry/web-app
  tag: "v2.1.0"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  hostname: app.example.com
  tls: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPU: 70

postgresql:
  enabled: true
  auth:
    database: myapp
    username: app
```

```bash
helm install my-app bitnami/nginx -f values-production.yaml
```

## Create Your Own Chart

```bash
helm create my-app
```

This generates:

```
my-app/
  Chart.yaml          # Chart metadata
  values.yaml         # Default configuration
  templates/
    deployment.yaml   # Deployment template
    service.yaml      # Service template
    ingress.yaml      # Ingress template
    hpa.yaml          # HorizontalPodAutoscaler
    _helpers.tpl      # Template helpers
    NOTES.txt         # Post-install notes
  charts/             # Dependencies
```

### Chart.yaml

```yaml
apiVersion: v2
name: my-app
description: My web application
type: application
version: 0.1.0       # Chart version
appVersion: "1.0.0"  # App version

dependencies:
  - name: postgresql
    version: "15.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```

### Template Example

`templates/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.port }}
          {{- if .Values.env }}
          env:
            {{- range $key, $value := .Values.env }}
            - name: {{ $key }}
              value: {{ $value | quote }}
            {{- end }}
          {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

### Test Your Chart

```bash
# Render templates locally (no cluster needed)
helm template my-release ./my-app -f values-production.yaml

# Dry run against cluster
helm install my-release ./my-app --dry-run --debug

# Lint for errors
helm lint ./my-app

# Install
helm install my-release ./my-app -f values-production.yaml
```

## Multi-Environment with Helm

```
helm/
  my-app/
    Chart.yaml
    values.yaml              # Defaults
    values-dev.yaml          # Dev overrides
    values-staging.yaml      # Staging overrides
    values-production.yaml   # Production overrides
    templates/
```

```bash
# Dev
helm upgrade --install my-app ./my-app -f values-dev.yaml -n dev

# Staging
helm upgrade --install my-app ./my-app -f values-staging.yaml -n staging

# Production
helm upgrade --install my-app ./my-app -f values-production.yaml -n production
```

## Helm in CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Deploy with Helm
  run: |
    helm upgrade --install my-app ./helm/my-app \
      -f helm/my-app/values-production.yaml \
      --set image.tag=${{ github.sha }} \
      --namespace production \
      --wait \
      --timeout 5m
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course uses Helm for deploying ML infrastructure on Kubernetes. **Docker Fundamentals** covers the container basics you need before Helm. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

