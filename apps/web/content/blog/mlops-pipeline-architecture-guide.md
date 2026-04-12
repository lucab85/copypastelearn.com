---
title: "MLOps Pipeline Architecture Guide"
slug: "mlops-pipeline-architecture-guide"
date: "2026-03-13"
category: "MLOps"
tags: ["MLOps", "MLflow", "Pipeline", "Machine Learning", "Kubernetes"]
excerpt: "Design an MLOps pipeline from data ingestion to model serving. MLflow tracking, model registry, CI/CD for ML, and Kubernetes deployment."
description: "Design an MLOps pipeline from data to model serving. MLflow, model registry, CI/CD for ML, and Kubernetes deployment."
---

MLOps applies DevOps principles to machine learning. A well-designed MLOps pipeline automates the journey from data to deployed model, with tracking, versioning, and monitoring at every step.

## MLOps Pipeline Architecture

```
Data Source → Data Validation → Feature Engineering → Model Training
                                                          ↓
                                              MLflow Tracking (metrics, params, artifacts)
                                                          ↓
                                              Model Registry (staging → production)
                                                          ↓
                                              Model Serving (Kubernetes)
                                                          ↓
                                              Monitoring (drift, performance)
                                                          ↓
                                              Retraining Trigger
```

## Stage 1: Data Pipeline

```python
# data_pipeline.py
import pandas as pd
from great_expectations import DataContext

def validate_data(df: pd.DataFrame) -> bool:
    """Validate incoming data before training."""
    context = DataContext()
    suite = context.get_expectation_suite("training_data")

    results = context.run_validation_operator(
        "action_list_operator",
        assets_to_validate=[{"batch": df, "expectation_suite_name": "training_data"}]
    )
    return results["success"]

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering pipeline."""
    df["log_revenue"] = np.log1p(df["revenue"])
    df["days_since_signup"] = (pd.Timestamp.now() - df["signup_date"]).dt.days
    df = pd.get_dummies(df, columns=["category"])
    return df
```

## Stage 2: Experiment Tracking with MLflow

```python
import mlflow
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

mlflow.set_tracking_uri("http://mlflow.internal:5000")
mlflow.set_experiment("churn-prediction")

with mlflow.start_run(run_name="rf-baseline"):
    # Log parameters
    params = {"n_estimators": 100, "max_depth": 10, "min_samples_split": 5}
    mlflow.log_params(params)

    # Train
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions)

    # Log metrics
    mlflow.log_metrics({"accuracy": accuracy, "f1_score": f1})

    # Log model
    mlflow.sklearn.log_model(model, "model",
        registered_model_name="churn-predictor")

    print(f"Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
```

## Stage 3: Model Registry

```python
from mlflow import MlflowClient

client = MlflowClient()

# Promote model to staging
client.transition_model_version_stage(
    name="churn-predictor",
    version=5,
    stage="Staging"
)

# After validation, promote to production
client.transition_model_version_stage(
    name="churn-predictor",
    version=5,
    stage="Production"
)
```

## Stage 4: Model Serving on Kubernetes

```yaml
# model-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: churn-predictor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: churn-predictor
  template:
    metadata:
      labels:
        app: churn-predictor
    spec:
      containers:
        - name: model
          image: my-registry/churn-predictor:v5
          ports:
            - containerPort: 8080
          env:
            - name: MLFLOW_TRACKING_URI
              value: "http://mlflow.internal:5000"
            - name: MODEL_NAME
              value: "churn-predictor"
            - name: MODEL_STAGE
              value: "Production"
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2
              memory: 4Gi
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: churn-predictor
spec:
  selector:
    app: churn-predictor
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: churn-predictor
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: churn-predictor
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Stage 5: CI/CD for ML

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    paths:
      - 'models/**'
      - 'data/**'

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: python train.py
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}

  validate:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - run: python validate_model.py
        env:
          MODEL_VERSION: ${{ needs.train.outputs.model_version }}

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: |
          python promote_model.py --stage Production
          kubectl rollout restart deployment/churn-predictor
```

## Stage 6: Monitoring

Track model performance in production:

```python
from prometheus_client import Counter, Histogram, Gauge

prediction_count = Counter('predictions_total', 'Total predictions', ['model_version'])
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')
model_accuracy = Gauge('model_accuracy', 'Current model accuracy')
drift_score = Gauge('data_drift_score', 'Feature drift score')

@app.post("/predict")
async def predict(request: PredictRequest):
    with prediction_latency.time():
        result = model.predict(request.features)
        prediction_count.labels(model_version=MODEL_VERSION).inc()
        return {"prediction": result}
```

Alert on model degradation:

```yaml
# Prometheus alert rule
groups:
  - name: ml-alerts
    rules:
      - alert: ModelAccuracyDrop
        expr: model_accuracy < 0.85
        for: 1h
        annotations:
          summary: "Model accuracy dropped below 85%"

      - alert: DataDrift
        expr: data_drift_score > 0.3
        for: 30m
        annotations:
          summary: "Significant data drift detected"
```

## MLOps Maturity Levels

| Level | Description | Tools |
|---|---|---|
| 0 | Manual everything | Notebooks, manual deploy |
| 1 | ML pipeline automation | MLflow tracking, scheduled training |
| 2 | CI/CD for ML | Automated testing, registry, staging |
| 3 | Full MLOps | Monitoring, drift detection, auto-retrain |

## What's Next?

Our **MLflow for Kubernetes MLOps** course takes you from Level 0 to Level 2 across 15 hands-on lessons — experiment tracking, model registry, and Kubernetes deployment. First lesson is free.
