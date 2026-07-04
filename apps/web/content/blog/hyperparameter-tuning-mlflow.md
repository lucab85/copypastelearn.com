---
title: "Hyperparameter Tuning with MLflow"
description: "Combine scikit-learn's RandomizedSearchCV with MLflow tracking to find optimal model parameters and compare results visually."
date: "2026-02-24"
author: "Luca Berton"
category: "MLOps"
tags: ["MLflow", "Hyperparameter Tuning", "scikit-learn"]
---

## The Tuning Challenge

Finding the right hyperparameters can make or break your model. Manual tuning is tedious. Grid search is exhaustive but slow. **RandomizedSearchCV** samples parameter combinations efficiently, and **MLflow** tracks every result.

The usual failure mode isn't a lack of tuning effort, it's a lack of record-keeping. You tweak `max_depth`, rerun the script, glance at the printed accuracy, then tweak `n_estimators` and rerun again. A few hours later you have a vague sense that "one of the earlier runs was better," but no reliable way to say which one, what parameters produced it, or whether you could reproduce it if redeployed today — each run overwrites the last one in your head, not on disk. Pairing a search strategy with a tracking system fixes this: every configuration becomes a permanent, comparable record instead of a line in your terminal scrollback.

## Prerequisites

Before working through this guide, make sure you have MLflow installed (`pip install mlflow`) with a tracking server you can reach — a local `mlflow ui` instance is fine, or a shared `MLFLOW_TRACKING_URI`. You'll also need a working training script; the example below uses `RandomForestClassifier` on the wine dataset, but the pattern applies to any estimator with a `fit`/`score` interface. You should also be familiar with the model type you're tuning, since a sensible search space depends on knowing what each hyperparameter controls.

## How It Works

MLflow's tracking component records three things per run: the **parameters** that went in, the **metrics** that came out (cross-validation score, test accuracy), and any **artifacts** you attach (the serialized model, a plot). Each run gets its own ID, written automatically via `mlflow.autolog()` or explicit `mlflow.log_*` calls. This matters for tuning because a search isn't one run, it's dozens — without a queryable record of params-to-metrics, you're stuck eyeballing print statements instead of sorting and plotting across the whole search afterward.

## Setup

```python
import mlflow
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from scipy.stats import randint, uniform

wine = load_wine()
X_train, X_test, y_train, y_test = train_test_split(
    wine.data, wine.target, test_size=0.2, random_state=42
)
```

## Define the Search Space

Grid search evaluates every combination of every value you specify, so its cost grows multiplicatively with each parameter you add — five parameters with five values each is already 3,125 full training runs before you've started narrowing in. Most of that budget is wasted, since several hyperparameters barely move the metric, yet grid search re-tests values along those dimensions just as thoroughly as the ones that matter. Random search fixes the scaling problem by sampling from distributions instead: you set a fixed budget (`n_iter`), and adding another tunable parameter doesn't blow up the number of runs you need. Bayesian search goes further by using earlier results to bias later samples, but even plain random search covers a space better than a same-sized grid.

```python
param_distributions = {
    "n_estimators": randint(50, 500),
    "max_depth": randint(3, 20),
    "min_samples_split": randint(2, 20),
    "min_samples_leaf": randint(1, 10),
    "max_features": uniform(0.1, 0.9),
}
```

## Run with MLflow Tracking

`mlflow.autolog()` logs a child run for every candidate `RandomizedSearchCV` evaluates, not just the winner — resist the urge to only keep the "good" ones. A run that scored poorly is still evidence: it tells you that region of the search space underperforms, which is exactly what you need when deciding where to search next or explaining why you ruled out a configuration. Logging everything turns the search into a dataset you can analyze, rather than a single number you have to trust.

```python
mlflow.autolog()

with mlflow.start_run(run_name="hyperparameter-search"):
    search = RandomizedSearchCV(
        RandomForestClassifier(random_state=42),
        param_distributions=param_distributions,
        n_iter=50,
        cv=5,
        scoring="accuracy",
        random_state=42,
        n_jobs=-1,
    )
    search.fit(X_train, y_train)

    # Log best results
    mlflow.log_metric("best_cv_score", search.best_score_)
    mlflow.log_params(
        {f"best_{k}": v for k, v in search.best_params_.items()}
    )

    # Evaluate on test set
    test_accuracy = search.score(X_test, y_test)
    mlflow.log_metric("test_accuracy", test_accuracy)

    print(f"Best CV Score: {search.best_score_:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Best Params: {search.best_params_}")
```

## Analyzing Results in MLflow UI

After running the search, open the MLflow UI to:

1. **Sort runs by accuracy** — find the top performers instantly
2. **Parallel coordinates plot** — visualize how parameters interact
3. **Scatter plots** — plot any parameter vs any metric
4. **Compare top runs** — select multiple runs for side-by-side comparison

The parallel coordinates plot is the most useful view once you have more than a handful of runs, but it's easy to misread. Each vertical axis is a parameter or metric you select, and each line is one run threading through its value on every axis. You're not looking for a single best line — you're looking for whether lines with high accuracy cluster on particular axes. If top-scoring runs consistently pass through a narrow band of `max_depth` values, that's a signal about where to narrow your next search; if they're scattered evenly across an axis, that parameter probably isn't driving the outcome.

The comparison view, once you've narrowed to a shortlist, lets you check whether the combination of parameters makes sense together — two runs can post nearly identical accuracy from very different configurations, and the one with simpler, more conservative parameters is usually the safer pick for production.

## Tips for Better Tuning

- **Start wide, then narrow** — broad ranges first, then refine around promising values
- **Use cross-validation** — `cv=5` gives more reliable estimates
- **Log everything** — MLflow autolog captures all parameters automatically
- **Set random seeds** — for reproducibility across experiments
- **Increase n_iter gradually** — 20-50 iterations is usually enough to find good regions

## Common Pitfalls

**Overfitting to the validation set.** Cross-validation protects against overfitting to a single train/test split, but running enough search iterations against the same CV folds lets you overfit to the folds themselves — you end up selecting the configuration that fits your validation data best, not the one that generalizes best. Hold out a final test set you don't touch until the search is finished, and treat a large gap between CV score and test score as a warning sign, not something to tune away.

**Not fixing a random seed.** If `random_state` varies between runs, or isn't set at all, differences in your logged metrics could come from the split or the model's own randomness rather than the hyperparameters you changed — which makes every comparison in the MLflow UI unreliable. Fix the seed everywhere it can be set (split, model, search) so the only thing varying between runs is the thing you're actually testing.

**Tuning the wrong hyperparameters.** Not every parameter in your search space is worth the iterations spent on it — some have a narrow effective range and little impact past a point, while others meaningfully shift both accuracy and overfitting risk. Check the parallel coordinates plot rather than assuming: if top runs are spread evenly across a parameter's full range, that parameter isn't moving the outcome, and you'd get more value reallocating those iterations elsewhere.

## Next Steps

Once you've found optimal parameters, package the model and deploy it. Our [MLflow for Kubernetes course](/courses) covers the complete pipeline.

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

