---
title: "CI/CD for ML on Kubernetes"
description: "Build a CI/CD pipeline for ML models using GitHub Actions, MLflow, Docker, and Kubernetes. Automate the path from training to production."
date: "2026-02-20"
author: "Luca Berton"
category: "MLOps"
tags: ["CI/CD", "MLOps", "GitHub Actions"]
---

## Why CI/CD for ML?

Software engineers have had CI/CD for decades. ML models deserve the same treatment — automated testing, building, and deployment.

## The ML CI/CD Pipeline

```
Train → Track → Package → Test → Deploy → Monitor
  ↑                                          |
  └──────────── Retrain on drift ←──────────┘
```

## GitHub Actions Workflow

```yaml
name: ML Model Deploy
on:
  push:
    paths:
      - 'models/**'
      - 'training/**'

jobs:
  train-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install mlflow scikit-learn

      - name: Train model
        run: python training/train.py
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}

      - name: Build Docker image
        run: |
          mlflow models build-docker \
            -m "models:/wine-quality/Production" \
            -n "wine-quality:${{ github.sha }}"

      - name: Push to registry
        run: |
          docker tag wine-quality:${{ github.sha }} \
            ${{ secrets.REGISTRY }}/wine-quality:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/wine-quality:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/wine-quality \
            wine-quality=${{ secrets.REGISTRY }}/wine-quality:${{ github.sha }}
```

## Testing Before Deployment

Add a test stage:

```yaml
      - name: Test model
        run: |
          docker run -d -p 8080:8080 wine-quality:${{ github.sha }}
          sleep 10
          curl -f http://localhost:8080/health
          python tests/test_inference.py
```

## Canary Deployment Strategy

Don't deploy to 100% immediately:

1. **Deploy canary** — send 10% of traffic to new version
2. **Monitor metrics** — accuracy, latency, error rate
3. **Promote or rollback** — based on metrics
4. **Full rollout** — if canary succeeds

## Rollback Strategy

Always keep the previous model version:

```bash
# Quick rollback
kubectl rollout undo deployment/wine-quality

# Or rollback to specific version via MLflow
kubectl set image deployment/wine-quality \
  wine-quality=registry/wine-quality:previous-sha
```

## Best Practices

1. **Version everything** — code, data, model, config
2. **Test inference** — don't just test training
3. **Use staging environments** — mirror production
4. **Automate rollbacks** — metric-based triggers
5. **Monitor continuously** — deployment is not the end

## Learn the Complete Pipeline

Build a production CI/CD pipeline for ML models in our [MLflow for Kubernetes course](/courses) — hands-on with real tools and workflows.

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

