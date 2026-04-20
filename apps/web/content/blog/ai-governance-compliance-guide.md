---
title: "AI Governance and Compliance"
slug: "ai-governance-compliance-guide"
date: "2025-12-10"
author: "Luca Berton"
description: "Implement AI governance frameworks with model registries, bias monitoring, explainability tools, and regulatory compliance for the EU AI Act and beyond."
category: "AI Tools"
tags: ["ai governance", "eu ai act", "model registry", "bias monitoring", "explainability"]
---

AI governance is no longer optional. The EU AI Act, emerging US regulations, and industry standards require organizations to document, monitor, and control their AI systems. DevOps teams play a central role in operationalizing governance.

## The EU AI Act Framework

The EU AI Act classifies AI systems by risk level:

| Risk Level | Examples | Requirements |
|-----------|---------|--------------|
| Unacceptable | Social scoring, manipulative AI | Banned |
| High-risk | Hiring, credit scoring, medical | Full compliance required |
| Limited risk | Chatbots, deepfakes | Transparency obligations |
| Minimal risk | Spam filters, games | No specific requirements |

High-risk systems need:

- Risk management system
- Data governance and documentation
- Technical documentation and logging
- Human oversight mechanisms
- Accuracy, robustness, and cybersecurity measures

## AI Governance Architecture

```
┌─────────────────────────────────────────┐
│           Governance Dashboard            │
│  (risk registry, compliance status,      │
│   audit trails, model inventory)         │
├─────────────────────────────────────────┤
│           MLOps Platform                  │
│  (model registry, experiment tracking,   │
│   deployment pipelines, monitoring)      │
├─────────────────────────────────────────┤
│           Technical Controls              │
│  (bias detection, explainability,        │
│   data lineage, access controls)         │
└─────────────────────────────────────────┘
```

## Model Registry as Governance Hub

MLflow serves as the central model registry:

```python
import mlflow

# Register model with governance metadata
with mlflow.start_run():
    mlflow.log_param("training_data_version", "v2.3")
    mlflow.log_param("data_lineage", "s3://data/training/v2.3")
    mlflow.log_param("bias_assessment", "passed")
    mlflow.log_param("risk_classification", "high-risk")
    mlflow.log_param("human_oversight", "required")

    mlflow.log_metric("demographic_parity", 0.95)
    mlflow.log_metric("equalized_odds", 0.92)

    mlflow.log_artifact("model_card.md")
    mlflow.log_artifact("data_sheet.pdf")
    mlflow.log_artifact("impact_assessment.pdf")

    mlflow.sklearn.log_model(model, "model",
        registered_model_name="credit-scoring-v3")
```

## Bias Monitoring Pipeline

Continuous bias monitoring in production:

```python
from fairlearn.metrics import MetricFrame, selection_rate

def monitor_model_fairness(predictions, sensitive_features):
    """Run fairness checks on model predictions."""
    metric_frame = MetricFrame(
        metrics={
            "selection_rate": selection_rate,
            "accuracy": accuracy_score,
        },
        y_true=actual_outcomes,
        y_pred=predictions,
        sensitive_features=sensitive_features
    )

    # Check demographic parity
    disparity = metric_frame.difference()

    if disparity["selection_rate"] > 0.1:  # 10% threshold
        alert_governance_team(
            model="credit-scoring-v3",
            metric="demographic_parity",
            disparity=disparity["selection_rate"]
        )
```

## Explainability Requirements

High-risk AI systems must be explainable:

- **Global explanations** — What features matter most overall?
- **Local explanations** — Why this specific decision for this person?
- **Counterfactual explanations** — What would need to change for a different outcome?

Tools: SHAP, LIME, Alibi, InterpretML

## Audit Trail Requirements

Log everything for regulatory compliance:

```yaml
# Kubernetes: AI audit logging
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-audit-logger
spec:
  template:
    spec:
      containers:
      - name: logger
        image: governance/audit-logger:latest
        env:
        - name: LOG_LEVEL
          value: "ALL"  # Every prediction logged
        - name: RETENTION_DAYS
          value: "2555"  # 7 years for financial services
        - name: STORAGE
          value: "s3://ai-audit-logs/"
```

Required log fields:

- Timestamp, model version, input data hash
- Prediction output, confidence score
- Explanation/reasoning, human override (if any)
- Data lineage, feature versions

## Compliance Checklist

1. **Inventory all AI systems** — What models are deployed, where, for what purpose?
2. **Classify risk levels** — Map each system to EU AI Act risk categories
3. **Implement model cards** — Document each model's capabilities, limitations, and biases
4. **Set up monitoring** — Continuous bias, drift, and performance monitoring
5. **Create audit trails** — Immutable logs of all model decisions
6. **Establish human oversight** — Define when and how humans can override AI decisions
7. **Plan incident response** — What happens when a model makes a harmful decision?

## FAQ

**When does the EU AI Act take effect?**
Phased: banned practices from Feb 2025, high-risk requirements from Aug 2026, full enforcement by Aug 2027.

**Do open-source models need compliance?**
If deployed in a high-risk application, yes. The deployer (not the model creator) bears compliance responsibility.

**How much does AI governance cost?**
Typically 10-20% of AI project budget. Non-compliance penalties under the EU AI Act can reach €35M or 7% of global revenue.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
