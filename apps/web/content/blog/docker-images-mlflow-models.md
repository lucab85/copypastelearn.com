---
title: "Building Docker Images from MLflow Models"
description: "Package your MLflow models as Docker containers for portable, reproducible deployments. Step-by-step guide with best practices."
date: "2026-02-22"
author: "Luca Berton"
category: "MLOps"
tags: ["Docker", "MLflow", "Containerization"]
---

## Why Containerize ML Models?

Docker containers ensure your model runs the same way everywhere — your laptop, staging, and production. No more "works on my machine" problems.

## MLflow's Built-In Docker Support

MLflow can generate Docker images directly from logged models:

```bash
mlflow models build-docker \
  -m "runs:/<run-id>/model" \
  -n "wine-quality-model" \
  --enable-mlserver
```

This creates a Docker image with:
- Your trained model
- All Python dependencies
- MLServer for serving
- A REST API endpoint

## Testing Locally

Run the container:

```bash
docker run -p 8080:8080 wine-quality-model
```

Send a test request:

```bash
curl http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"inputs": [[7.4, 0.7, 0.0, 1.9, 0.076, 11.0, 34.0, 0.9978, 3.51, 0.56, 9.4, 5.0, 6.0]]}'
```

## Custom Dockerfile

For more control, create your own Dockerfile:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY model/ ./model/

EXPOSE 8080

CMD ["mlflow", "models", "serve", \
     "-m", "./model", \
     "--port", "8080", \
     "--host", "0.0.0.0", \
     "--enable-mlserver"]
```

## Multi-Stage Builds for Smaller Images

```dockerfile
# Build stage
FROM python:3.11 AS builder
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
COPY model/ /app/model/
ENV PATH=/root/.local/bin:$PATH
WORKDIR /app
EXPOSE 8080
CMD ["mlflow", "models", "serve", "-m", "./model", "--port", "8080", "--host", "0.0.0.0"]
```

## Best Practices

1. **Pin dependency versions** — reproducibility matters
2. **Use slim base images** — smaller = faster deploys
3. **Don't include training data** — only the model artifacts
4. **Add health checks** — Kubernetes needs them
5. **Tag images with model version** — `wine-quality:v1.2.3`

## From Docker to Kubernetes

Once your model is containerized, deploying to Kubernetes with KServe is straightforward. Learn the complete workflow in our [MLflow for Kubernetes course](/courses).
