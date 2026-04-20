---
title: "MLflow Experiment Tracking"
description: "Learn how to track ML experiments with MLflow — log parameters, metrics, and artifacts. Compare model runs and find the best configuration."
date: "2026-02-25"
author: "Luca Berton"
category: "MLOps"
tags: ["MLflow", "Experiment Tracking", "Machine Learning"]
---

## Why Track Experiments?

Every data scientist has been there: you run 50 model variations, forget which parameters produced the best result, and end up re-running everything. MLflow solves this.

## Setting Up MLflow

```bash
pip install mlflow
```

Start the MLflow UI:

```bash
mlflow ui --port 5000
```

Open `http://localhost:5000` to see your experiment dashboard.

## Logging Your First Experiment

```python
import mlflow
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split

# Load data
wine = load_wine()
X_train, X_test, y_train, y_test = train_test_split(
    wine.data, wine.target, test_size=0.2
)

# Start an MLflow run
with mlflow.start_run():
    # Log parameters
    n_estimators = 100
    max_depth = 10
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)

    # Train model
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth
    )
    model.fit(X_train, y_train)

    # Log metrics
    accuracy = model.score(X_test, y_test)
    mlflow.log_metric("accuracy", accuracy)

    # Log model
    mlflow.sklearn.log_model(model, "model")

    print(f"Accuracy: {accuracy:.4f}")
```

## Using Autologging

MLflow can automatically log everything:

```python
mlflow.autolog()

with mlflow.start_run():
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)
    # Parameters, metrics, and model are logged automatically!
```

## Comparing Runs in the UI

The MLflow UI lets you:
- **Compare metrics** across runs side by side
- **Visualize parameters** vs metrics in scatter plots
- **Sort and filter** runs by any metric
- **Download artifacts** from any run

## Best Practices

1. **Name your experiments** — don't use the default experiment
2. **Log everything** — parameters, metrics, artifacts, tags
3. **Use autologging** — it captures what you'd forget
4. **Tag your runs** — add context like "baseline" or "production candidate"
5. **Set a tracking URI** — use a shared server for team collaboration

## From Tracking to Deployment

Once you've found your best model, the next step is deploying it. Learn the complete pipeline — from experiment tracking to Kubernetes deployment — in our [MLflow for Kubernetes course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

