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

## Tips for Better Tuning

- **Start wide, then narrow** — broad ranges first, then refine around promising values
- **Use cross-validation** — `cv=5` gives more reliable estimates
- **Log everything** — MLflow autolog captures all parameters automatically
- **Set random seeds** — for reproducibility across experiments
- **Increase n_iter gradually** — 20-50 iterations is usually enough to find good regions

## Next Steps

Once you've found optimal parameters, package the model and deploy it. Our [MLflow for Kubernetes course](/courses) covers the complete pipeline.
