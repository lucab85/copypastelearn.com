---
title: "Monitoring ML Models in K8s"
description: "Monitor deployed ML models on Kubernetes — track prediction accuracy, latency, resource usage, and detect model drift in production."
date: "2026-02-19"
author: "Luca Berton"
category: "MLOps"
tags: ["Monitoring", "kubernetes", "Model Drift"]
---

## Why Monitor ML Models?

Deploying a model is not the finish line — it's the starting line. Models degrade over time as data distributions shift. Without monitoring, you won't know until users complain.

## What to Monitor

### Model Performance
- **Prediction accuracy** — are predictions still correct?
- **Latency** — how long does inference take?
- **Throughput** — how many requests per second?
- **Error rate** — are requests failing?

### Infrastructure
- **CPU/Memory usage** — is the pod healthy?
- **Pod restarts** — stability indicator
- **Network I/O** — data transfer patterns

### Data Quality
- **Input distribution** — has the data changed?
- **Feature drift** — are feature statistics shifting?
- **Concept drift** — has the relationship between features and targets changed?

## Kubernetes Health Checks

KServe automatically provides health endpoints:

```bash
# Check service readiness
kubectl get inferenceservice wine-quality-model

# Check pod status
kubectl get pods -l serving.kserve.io/inferenceservice=wine-quality-model

# View logs
kubectl logs -l serving.kserve.io/inferenceservice=wine-quality-model --tail=100
```

## Prometheus Metrics

KServe exposes Prometheus metrics out of the box:

```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ml-model-monitor
spec:
  selector:
    matchLabels:
      serving.kserve.io/inferenceservice: wine-quality-model
  endpoints:
    - port: metrics
      interval: 30s
```

Key metrics to track:
- `request_count` — total inference requests
- `request_latency_seconds` — response time distribution
- `request_error_count` — failed requests

## Detecting Model Drift

Set up alerts for drift detection:

```python
import numpy as np
from scipy.stats import ks_2samp

def check_drift(reference_data, production_data, threshold=0.05):
    """Kolmogorov-Smirnov test for distribution drift."""
    results = {}
    for feature_idx in range(reference_data.shape[1]):
        stat, p_value = ks_2samp(
            reference_data[:, feature_idx],
            production_data[:, feature_idx]
        )
        results[f"feature_{feature_idx}"] = {
            "statistic": stat,
            "p_value": p_value,
            "drift_detected": p_value < threshold
        }
    return results
```

## Alerting

Set Kubernetes alerts for critical issues:

```yaml
# PrometheusRule
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ml-alerts
spec:
  groups:
    - name: ml-model
      rules:
        - alert: HighErrorRate
          expr: rate(request_error_count[5m]) > 0.05
          for: 5m
          labels:
            severity: critical
```

## The Monitoring Feedback Loop

1. **Detect** — monitoring catches performance degradation
2. **Alert** — team is notified
3. **Diagnose** — is it data drift, code bug, or infrastructure?
4. **Retrain** — update the model with new data
5. **Deploy** — CI/CD pipeline pushes the new version

## Learn More

Master production monitoring for ML models in our [MLflow for Kubernetes course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

