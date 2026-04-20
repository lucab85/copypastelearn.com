---
title: "MLflow on Kubernetes: Full Guide"
slug: "mlflow-kubernetes-production-guide"
date: "2026-04-08"
category: "MLOps"
tags: ["MLflow", "Kubernetes", "MLOps", "Machine Learning", "Production"]
excerpt: "Deploy MLflow on Kubernetes for production MLOps. Complete guide covering Helm charts, experiment tracking, model registry, and serving."
description: "Deploy MLflow on Kubernetes for production MLOps. Helm charts, experiment tracking, model registry, and model serving guide."
---

Running MLflow on Kubernetes gives you scalable, production-grade MLOps. This guide covers everything from deployment to model serving.

## Why MLflow on Kubernetes?

MLflow handles the ML lifecycle — experiment tracking, model versioning, and deployment. Kubernetes handles the infrastructure — scaling, reliability, and resource management. Together they solve the full MLOps puzzle.

**Benefits:**
- **Scalable tracking server**: Handle hundreds of concurrent experiments
- **Reliable model registry**: Version models with Kubernetes-backed storage
- **Auto-scaling serving**: Scale model endpoints based on traffic
- **Team collaboration**: Shared tracking server for the entire ML team

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Kubernetes Cluster            │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ MLflow Server │  │ PostgreSQL DB  │  │
│  │  (Tracking)   │  │  (Metadata)    │  │
│  └──────────────┘  └────────────────┘  │
│                                         │
│  ┌──────────────┐  ┌────────────────┐  │
│  │ MinIO / S3    │  │ KServe         │  │
│  │ (Artifacts)   │  │ (Model Serve)  │  │
│  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────┘
```

## Step 1: Deploy MLflow with Helm

Create `mlflow-values.yaml`:

```yaml
tracking:
  service:
    type: ClusterIP
  persistence:
    enabled: true
    size: 10Gi

backendStore:
  postgres:
    enabled: true
    host: postgresql.mlflow.svc.cluster.local
    port: 5432
    database: mlflow
    user: mlflow

artifactRoot:
  s3:
    enabled: true
    bucket: mlflow-artifacts
    endpointUrl: http://minio.mlflow.svc.cluster.local:9000
```

Deploy:

```bash
helm repo add community-charts https://community-charts.github.io/helm-charts
helm install mlflow community-charts/mlflow \
  --namespace mlflow \
  --create-namespace \
  -f mlflow-values.yaml
```

## Step 2: Experiment Tracking

Configure your Python environment to use the Kubernetes MLflow server:

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# Point to your K8s MLflow server
mlflow.set_tracking_uri("http://mlflow.mlflow.svc.cluster.local:5000")
mlflow.set_experiment("iris-classification")

# Load data
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

with mlflow.start_run():
    # Log parameters
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 5)

    # Train model
    model = RandomForestClassifier(n_estimators=100, max_depth=5)
    model.fit(X_train, y_train)

    # Log metrics
    accuracy = model.score(X_test, y_test)
    mlflow.log_metric("accuracy", accuracy)

    # Log model
    mlflow.sklearn.log_model(model, "model")
    print(f"Accuracy: {accuracy:.4f}")
```

## Step 3: Model Registry

Register your best model:

```python
# Register model from a run
result = mlflow.register_model(
    model_uri=f"runs:/{run_id}/model",
    name="iris-classifier"
)

# Transition to production
from mlflow.tracking import MlflowClient

client = MlflowClient()
client.transition_model_version_stage(
    name="iris-classifier",
    version=result.version,
    stage="Production"
)
```

## Step 4: Model Serving with KServe

Deploy your MLflow model as a Kubernetes service:

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: iris-classifier
  namespace: serving
spec:
  predictor:
    model:
      modelFormat:
        name: mlflow
      storageUri: "s3://mlflow-artifacts/1/abc123/artifacts/model"
      resources:
        requests:
          cpu: "500m"
          memory: "512Mi"
        limits:
          cpu: "1"
          memory: "1Gi"
```

Test the endpoint:

```bash
curl -X POST http://iris-classifier.serving.svc.cluster.local/v1/models/iris-classifier:predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [[5.1, 3.5, 1.4, 0.2]]}'
```

## Step 5: Monitoring

Add Prometheus metrics for your model endpoints:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: mlflow-monitor
spec:
  selector:
    matchLabels:
      app: mlflow
  endpoints:
    - port: http
      interval: 30s
      path: /metrics
```

Key metrics to track:

| Metric | What It Tells You |
|---|---|
| Request latency | Model inference speed |
| Error rate | Failed predictions |
| Memory usage | Model resource needs |
| Request count | Traffic patterns |
| Data drift score | Input distribution changes |

## Common Pitfalls

- **Artifact storage**: Use S3/MinIO, not local filesystem — pods are ephemeral
- **Database backups**: PostgreSQL metadata is critical — set up automated backups
- **Resource limits**: ML models are memory-hungry — set proper requests and limits
- **Namespace isolation**: Separate tracking, serving, and monitoring namespaces

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers all 15 steps in depth with hands-on labs — from local development with Kind to production deployment with monitoring. The first lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

