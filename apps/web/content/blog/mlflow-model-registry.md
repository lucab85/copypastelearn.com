---
title: "MLflow Model Registry Guide"
description: "Use MLflow Model Registry to manage model versions, stage transitions, and governance. Essential for production MLOps workflows."
date: "2026-02-21"
author: "Luca Berton"
category: "MLOps"
tags: ["MLflow", "model registry", "ML Governance"]
---

## Why Model Registry?

Without a registry, "which model version is actually in production" turns into tribal knowledge — it lives in someone's memory, a Slack thread, or a deploy script nobody has looked at in months. When that person is out sick and the model starts misbehaving, rollback becomes guesswork: you're grepping through experiment logs trying to reconstruct which run produced the artifact that got shipped, and by the time you find it, you're still not sure it's the same file that's actually running in production right now.

MLflow Model Registry exists to make that question answerable in one lookup instead of an investigation. It gives every model a name, a version history, and an explicit stage, so "what's live" and "what's the fallback" are facts you can query rather than facts you have to remember.

In production, you need to know:
- Which model version is currently serving?
- Who approved it for production?
- What was the previous version (for rollback)?
- How does the new version compare to the old one?

MLflow Model Registry answers all of these.

## Prerequisites

This guide assumes you're already using MLflow Tracking to log experiments — runs, parameters, and metrics should already be showing up in the MLflow UI. You also need at least one trained model logged as an artifact via `mlflow.<flavor>.log_model()` (as shown below for scikit-learn). The registry sits on top of tracking; it doesn't replace it, and it has nothing to register until a run has produced a model artifact.

## How It Works

Experiment tracking answers "what did I try and how did it perform." The registry answers a different question: "what is deployed right now, and how did it get there." On top of tracking, the registry adds two things that tracking alone doesn't give you. First, versioning: every time you register a model under a name, it gets a new, immutable version number, so you have a durable history of every model that has ever been a candidate for production, not just the run that produced it. Second, stage transitions: a model version moves through **None → Staging → Production → Archived**, and that movement is itself a lifecycle, not a one-time label. Treating it as a lifecycle — with a record of when and why a version moved between stages — is what turns a pile of logged models into an actual deployment process.

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

Resist the urge to automate this transition end to end, especially the move into `Production`. A stage transition is a claim that a specific version is safe to serve live traffic, and that claim should survive a human looking at the evidence — staging metrics, a diff against the current production version, maybe a manual sign-off from whoever owns the model. If a script promotes versions automatically whenever staging tests pass, you've just moved the point of failure from "someone forgot to review this" to "the tests didn't catch what a reviewer would have," and you've lost the audit trail of who actually approved what. CI/CD can absolutely run the tests and prepare the transition; the transition itself is worth gating on approval.

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

Notice the difference between the two calls below: one loads `Production`, the other loads version `2`. That's not a stylistic choice — it's the difference between deployment code that stays put while models change underneath it, and deployment code that has to be edited and redeployed every time you ship a new model. If your serving code hardcodes a version number, promoting a new model means touching and redeploying that code. If it asks the registry for whatever is currently in the `Production` stage, promoting a new model is a registry operation — the serving code doesn't change, and it doesn't know or care that anything happened. That decoupling is the whole point of loading by stage rather than by exact version.

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

These look like nice-to-haves when you have one model and two versions. They stop being optional once you have dozens of registered models across a few teams. At that scale, descriptions and tags are what make the registry searchable instead of just a list — you can find "the fraud model trained on the post-migration dataset" without opening every version and reading its metrics by hand. Tags also carry ownership and lineage: `approved_by`, `team`, the dataset version, the upstream run ID. When a model misbehaves in production at 2am, that metadata is what tells you who to page and which run to go inspect, without anyone having to remember it.

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
5. **Automate the mechanics, gate the decision** — let CI/CD execute stage changes, but require a human approval before promotion to Production

## Integrating with Kubernetes

The Model Registry becomes even more powerful when combined with Kubernetes deployments. Automate the pipeline: register → stage → test → promote → deploy.

The key design decision is where the pod resolves the model version: at build time, baked into the image, or at startup, by asking the registry for whatever is currently `Production`. Baking a specific version into the image ties every model update to a full image rebuild and redeploy, and it means your deployment manifests now encode model state, which drifts out of sync the moment someone promotes a new version without also updating the manifest. Resolving the `Production` alias at startup instead means the image is generic — it just knows to ask "what's production right now" — so promoting a model becomes a registry transition, and rolling pods to pick up the new version is a normal restart, not a new deployment. It also means rollback is symmetric: transition the alias back, restart the pods, and you're done, without re-pushing an older image.

Learn how in our [MLflow for Kubernetes course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.
