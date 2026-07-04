---
title: "Monitoring ML Models in K8s"
description: "Monitor deployed ML models on Kubernetes — track prediction accuracy, latency, resource usage, and detect model drift in production."
date: "2026-02-19"
author: "Luca Berton"
category: "MLOps"
tags: ["Monitoring", "kubernetes", "Model Drift"]
---

A model that clears offline evaluation with strong accuracy and a clean confusion matrix can still fail quietly in production. Data drift, an upstream schema change nobody flagged, or a bug in the feature pipeline can degrade prediction quality without ever touching the signals Kubernetes cares about. A pod that's been running for two weeks with flat CPU and memory usage tells you the container is healthy — it tells you nothing about whether the predictions coming out of it are still worth trusting.

## Prerequisites

This guide assumes you already have a model deployed on Kubernetes — via KServe, Seldon, or a plain Deployment behind a Service — and serving real traffic. You'll also need Prometheus and Grafana running somewhere in the cluster, or at least the willingness to add them, since the alerting and dashboards below all depend on metrics being scraped and stored. Finally, you should be comfortable with basic ML evaluation vocabulary — accuracy, precision/recall, feature distributions, and what "drift" means in a statistical sense — because none of the tooling here explains those concepts; it just gives you a place to compute and act on them.

## How It Works

Everything in this post hinges on one distinction: infrastructure health and model health are different signals, measured differently, and one tells you almost nothing about the other. Infra health is what Kubernetes and Prometheus give you for free — is the pod running, is memory within limits, is latency acceptable, are requests erroring out. It's cheap to compute and it fails loudly: a crashed pod or a spike in 500s shows up within seconds. Model health is the opposite. A model can serve every request in a few milliseconds with zero errors and still be quietly wrong, because the input distribution shifted, because a feature that used to correlate with the target no longer does, or because an upstream service started sending a currency field in cents instead of dollars. Detecting that requires comparing production data against a reference distribution, tracking prediction statistics over time, and, where you can get it, measuring against ground truth once labels become available. Treat these as two parallel monitoring tracks that happen to share a cluster and an alerting pipeline — not one problem with one dashboard.

## Why Monitor ML Models?

Deploying a model is not the finish line — it's the starting line. Models degrade over time as data distributions shift. Without monitoring, you won't know until users complain.

Liveness and readiness probes only tell Kubernetes whether to keep routing traffic to a pod — they check that a process is up and responding, not that its responses are correct. A model that has drifted into uselessness will pass every probe Kubernetes runs against it, because the HTTP server is fine; it's the function computed inside that's wrong. That's why model monitoring has to exist as its own discipline alongside infrastructure monitoring, with its own metrics, baselines, and alert rules — bolting it onto pod health checks won't catch the failures that matter most.

## What to Monitor

No single category below is sufficient on its own. Statistical drift detection catches distributional shifts in input data early, often before they've had a chance to hurt outcomes, which makes it useful as an early warning that doesn't require waiting for labels. Business-metric monitoring — conversion rate, revenue per recommendation, click-through rate — catches the cases where drift detection stays quiet but the model's decisions are still costing money, because not every distribution shift changes the label distribution, and not every business-metric dip traces back to a statistical drift signal. Run both tracks; each covers blind spots the other misses.

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

KServe automatically provides health endpoints. These confirm the serving infrastructure is alive — the pod is scheduled, the process is responding, and KServe considers the endpoint ready to receive traffic. That's necessary, but treat it as a floor rather than a signal of model quality: none of the commands below can tell you whether the predictions coming back are any good.

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

These three are infrastructure-adjacent — they tell you the serving path is functioning, not that the model is right. To get real model-health signal into the same Prometheus instance, you'll typically need to emit custom metrics from inside your inference handler: prediction distribution stats, confidence scores, or a running feature-drift score computed on a rolling window. Scrape those on the same interval as the infra metrics so drift and latency end up on the same dashboards and get triaged through the same alerting pipeline instead of living in a separate tool nobody checks.

## Detecting Model Drift

The Kolmogorov-Smirnov test below is a reasonable default for continuous features: it compares the reference distribution you captured at training time against a window of production inputs and returns a p-value for how likely the two came from the same distribution. It's cheap to run per feature, doesn't need labels, and works as an early-warning system for exactly the kind of upstream schema or distribution change that liveness probes can't see.

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

Running this in isolation only tells you a feature has shifted, not whether that shift matters. Wire the `drift_detected` flags into the same metrics pipeline as your infra metrics — export drift status per feature, on the same scrape interval — so a drift alert and a latency alert show up in the same place and get triaged with the same urgency, instead of drift living in a notebook someone runs manually once a week.

## Alerting

Infra alert thresholds are relatively easy to pick — an error rate above 5% or p99 latency above a fixed number is bad in pretty much any context. ML metric thresholds are not that simple. Prediction and feature distributions are naturally noisy at low traffic volumes, many business metrics have day-of-week or seasonal patterns that look like drift if you're not accounting for them, and a threshold tuned during a quiet month will misfire the first time traffic shifts for a legitimate reason — a promotion, a new customer segment, a holiday. Expect to tune these thresholds against several weeks of production history before trusting them, and revisit them whenever the underlying traffic mix changes materially.

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

In practice, step 3 is where most of the time goes. A drift alert or an accuracy dip can come from a genuine shift in the real-world distribution, a broken upstream feature pipeline, a schema change from a producing service, or a bug in your own preprocessing — and each of those has a different fix. Only the first case actually warrants retraining; the other three are data-pipeline bugs that retraining will paper over instead of fix, and that will most likely recur on the next deploy. Before kicking off a retraining job, confirm the feature pipeline is producing what you think it's producing — retraining on corrupted input just teaches the new model to be wrong in the same way, and you'll be back here in a month.

## Common Pitfalls

**Alerting on every minor drift.** A KS test with a lenient p-value threshold will fire on noise, especially with high-cardinality features or small sample windows. If every drift alert gets a shrug because most of them turn out to be false positives, the team will eventually start ignoring the real ones too. Set thresholds deliberately, and prefer aggregating drift scores over a rolling window instead of paging on a single batch's spike.

**Not versioning the baseline distribution.** The reference data you compare production traffic against is itself a snapshot — usually the training set, or a slice of early production traffic. If you retrain the model but keep comparing against the old baseline, or update the baseline without recording which model version it belongs to, your drift scores stop meaning anything and nobody can reconstruct why a number changed. Store the baseline alongside the model artifact it was computed for, not as a separate, unversioned file that quietly goes stale.

**Monitoring the model but not the feature pipeline.** Most production model failures trace back to the code that builds the features, not the model itself — a join that silently drops rows, a default value substituted for nulls, a unit change in an upstream field. Dashboards focused purely on model output won't catch a pipeline bug that's producing plausible-looking but wrong features. Instrument the feature pipeline's own inputs and outputs, not just what the model does with them.

## Learn More

Master production monitoring for ML models in our [MLflow for Kubernetes course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

