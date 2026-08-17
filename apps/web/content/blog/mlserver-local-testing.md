---
title: "MLServer: Test ML Models Locally"
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

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use MLServer: Test ML Models Locally as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to MLServer, MLflow, Local Testing. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use MLServer: Test ML Models Locally?

Use it when you need a practical, repeatable way to handle MLServer, MLflow, Local Testing work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

