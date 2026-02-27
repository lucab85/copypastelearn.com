---
title: "MLflow Model Registry: Version Control for ML Models"
description: "Use MLflow Model Registry to manage model versions, stage transitions, and governance. Essential for production MLOps workflows."
date: "2026-02-21"
author: "Luca Berton"
category: "MLOps"
tags: ["MLflow", "Model Registry", "ML Governance"]
---

## Why Model Registry?

In production, you need to know:
- Which model version is currently serving?
- Who approved it for production?
- What was the previous version (for rollback)?
- How does the new version compare to the old one?

MLflow Model Registry answers all of these.

## Registering a Model

After training and logging a model:

```python
import mlflow

with mlflow.start_run():
    # Train your model...
    mlflow.sklearn.log_model(
        model,
        "model",
        registered_model_name="wine-quality-classifier"
    )
```

Or register an existing run:

```python
result = mlflow.register_model(
    "runs:/<run-id>/model",
    "wine-quality-classifier"
)
```

## Model Stages

MLflow supports lifecycle stages:

- **None** — just registered
- **Staging** — being tested
- **Production** — serving live traffic
- **Archived** — retired but preserved

### Transitioning Stages

```python
from mlflow import MlflowClient

client = MlflowClient()

# Move to staging
client.transition_model_version_stage(
    name="wine-quality-classifier",
    version=2,
    stage="Staging"
)

# Promote to production
client.transition_model_version_stage(
    name="wine-quality-classifier",
    version=2,
    stage="Production"
)
```

## Loading Models by Stage

```python
# Load the production model
model = mlflow.sklearn.load_model(
    "models:/wine-quality-classifier/Production"
)

# Load a specific version
model = mlflow.sklearn.load_model(
    "models:/wine-quality-classifier/2"
)
```

## Model Descriptions and Tags

Add context to model versions:

```python
client.update_model_version(
    name="wine-quality-classifier",
    version=2,
    description="Tuned with RandomizedSearchCV, accuracy: 0.94"
)

client.set_model_version_tag(
    name="wine-quality-classifier",
    version=2,
    key="approved_by",
    value="luca"
)
```

## Best Practices

1. **Always register production models** — no anonymous models in prod
2. **Add descriptions** — future you will thank present you
3. **Use staging** — test before promoting
4. **Keep archived versions** — rollback is critical
5. **Automate transitions** — CI/CD can handle stage changes

## Integrating with Kubernetes

The Model Registry becomes even more powerful when combined with Kubernetes deployments. Automate the pipeline: register → stage → test → promote → deploy. Learn how in our [MLflow for Kubernetes course](/courses).
