---
title: "KServe on Kubernetes"
description: "Learn how to install and configure KServe on Kubernetes for production ML model serving — InferenceService, autoscaling, and canary deployments."
date: "2026-02-23"
author: "Luca Berton"
category: "MLOps"
tags: ["KServe", "Kubernetes", "Model Serving"]
---

## What Is KServe?

KServe (formerly KFServing) is a Kubernetes-native platform for serving ML models. It provides:

- **Serverless inference** — scale to zero when idle
- **Autoscaling** — handle traffic spikes automatically
- **Canary deployments** — roll out new model versions safely
- **Multi-framework support** — TensorFlow, PyTorch, scikit-learn, XGBoost

## Installing KServe

### Prerequisites

- A running Kubernetes cluster (Kind, Minikube, or cloud)
- kubectl configured

### Install with kubectl

```bash
kubectl apply -f https://github.com/kserve/kserve/releases/download/v0.12.0/kserve.yaml
```

Verify the installation:

```bash
kubectl get pods -n kserve
kubectl get pods -n kserve | grep kserve-controller
```

## Creating an InferenceService

Here's a minimal InferenceService for an MLflow model:

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: wine-quality-model
spec:
  predictor:
    model:
      modelFormat:
        name: mlflow
      storageUri: "gs://your-bucket/mlflow-model"
```

Deploy it:

```bash
kubectl apply -f inference-service.yaml
```

Check readiness:

```bash
kubectl get inferenceservice wine-quality-model
```

## Sending Inference Requests

```bash
MODEL_NAME=wine-quality-model
SERVICE_HOSTNAME=$(kubectl get inferenceservice $MODEL_NAME \
  -o jsonpath='{.status.url}' | cut -d"/" -f3)

curl -v -H "Host: ${SERVICE_HOSTNAME}" \
  http://localhost:8080/v2/models/$MODEL_NAME/infer \
  -d '{
    "inputs": [{
      "name": "input",
      "shape": [1, 13],
      "datatype": "FP32",
      "data": [7.4, 0.7, 0.0, 1.9, 0.076, 11.0, 34.0, 0.9978, 3.51, 0.56, 9.4, 5.0, 6.0]
    }]
  }'
```

## Autoscaling

KServe automatically scales based on traffic:

```yaml
spec:
  predictor:
    minReplicas: 1
    maxReplicas: 10
    model:
      modelFormat:
        name: mlflow
      storageUri: "gs://your-bucket/model"
```

## Canary Deployments

Roll out a new model version to 20% of traffic:

```yaml
spec:
  predictor:
    canaryTrafficPercent: 20
    model:
      modelFormat:
        name: mlflow
      storageUri: "gs://your-bucket/model-v2"
```

## Monitoring

Check pod health and logs:

```bash
kubectl get pods -l serving.kserve.io/inferenceservice=wine-quality-model
kubectl logs -l serving.kserve.io/inferenceservice=wine-quality-model
```

## Learn More

Get hands-on experience deploying models with KServe in our [MLflow for Kubernetes course](/courses) — from training to production inference.
