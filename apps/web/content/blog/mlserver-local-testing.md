---
title: "MLServer: Test Your ML Models Locally Before Kubernetes"
description: "Use MLServer to serve and test MLflow models locally before deploying to Kubernetes. Quick setup guide with inference examples."
date: "2026-02-18"
author: "Luca Berton"
category: "MLOps"
tags: ["MLServer", "MLflow", "Local Testing"]
---

## What Is MLServer?

MLServer is an open-source inference server that implements the V2 Inference Protocol. It's the same serving layer KServe uses — meaning your local tests perfectly mirror production behavior.

## Installing MLServer

```bash
pip install mlserver mlserver-mlflow
```

## Serving an MLflow Model

After training and logging a model with MLflow:

```bash
mlflow models serve \
  -m "runs:/<run-id>/model" \
  --port 8080 \
  --enable-mlserver
```

Or serve from a local directory:

```bash
mlflow models serve \
  -m ./mlruns/0/<run-id>/artifacts/model \
  --port 8080 \
  --enable-mlserver
```

## Testing Inference

### V2 Protocol (same as KServe)

```bash
curl http://localhost:8080/v2/models/model/infer \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [{
      "name": "input",
      "shape": [1, 13],
      "datatype": "FP32",
      "data": [7.4, 0.7, 0.0, 1.9, 0.076, 11.0, 34.0, 0.9978, 3.51, 0.56, 9.4, 5.0, 6.0]
    }]
  }'
```

### Health Check

```bash
curl http://localhost:8080/v2/health/ready
```

### Model Metadata

```bash
curl http://localhost:8080/v2/models/model
```

## Python Client

```python
import requests
import json

url = "http://localhost:8080/v2/models/model/infer"

payload = {
    "inputs": [{
        "name": "input",
        "shape": [1, 13],
        "datatype": "FP32",
        "data": [7.4, 0.7, 0.0, 1.9, 0.076, 11.0, 34.0,
                 0.9978, 3.51, 0.56, 9.4, 5.0, 6.0]
    }]
}

response = requests.post(url, json=payload)
prediction = response.json()
print(f"Prediction: {prediction['outputs'][0]['data']}")
```

## Why Test Locally First?

1. **Fast iteration** — no waiting for Kubernetes deployments
2. **Same protocol** — V2 protocol matches KServe exactly
3. **Debug easily** — full access to logs and model internals
4. **Save resources** — no cloud costs during development
5. **Catch errors early** — before they hit production

## Local to Production Workflow

```
Train model → Log to MLflow → Serve with MLServer (local)
    → Test thoroughly → Build Docker image → Deploy to KServe
```

Learn this complete workflow hands-on in our [MLflow for Kubernetes course](/courses).
