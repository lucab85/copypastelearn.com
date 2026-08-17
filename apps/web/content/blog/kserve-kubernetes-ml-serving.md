---
title: "KServe on Kubernetes Guide"
description: "Learn how to install and configure KServe on Kubernetes for production ML model serving — InferenceService, autoscaling, and canary deployments."
date: "2026-02-23"
author: "Luca Berton"
category: "MLOps"
tags: ["KServe", "kubernetes", "model serving"]
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

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use KServe on Kubernetes as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to KServe, kubernetes, model serving. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use KServe on Kubernetes?

Use it when you need a practical, repeatable way to handle KServe, kubernetes, model serving work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.
