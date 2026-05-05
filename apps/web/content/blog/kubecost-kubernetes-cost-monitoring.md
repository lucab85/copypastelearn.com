---
title: "Kubecost Kubernetes Cost Monitoring"
date: "2026-02-23"
description: "Kubecost shows real-time cost allocation per namespace, deployment, and label in Kubernetes. Learn how to install Kubecost, identify waste, and set budgets for teams and projects."
category: "DevOps"
tags: ["kubecost", "kubernetes", "cost-optimization", "finops", "Monitoring", "cloud-costs"]
author: "Luca Berton"
---

Your Kubernetes cluster costs $15,000/month. How much goes to each team? Which deployments are overprovisioned? Kubecost answers these questions by combining Kubernetes resource data with cloud billing.

## Installation

```bash
helm install kubecost cost-analyzer/cost-analyzer \
  --namespace kubecost --create-namespace \
  --set kubecostToken="your-token"
```

The free tier monitors a single cluster with 15 days of data. That is enough to find the biggest savings.

## What Kubecost Shows

### Cost by Namespace

```
Namespace          Monthly Cost    CPU     Memory    Storage
production         $8,200          45%     52%       $320
staging            $3,100          22%     18%       $180
data-pipeline      $2,800          28%     25%       $440
monitoring         $900            5%      5%        $60
```

### Cost by Deployment

```
Deployment              Monthly    CPU Req    CPU Used    Efficiency
order-api (10 pods)     $1,200     4 cores    1.2 cores   30%
payment-svc (8 pods)    $960       3.2 cores  2.8 cores   87%
analytics (6 pods)      $840       2.4 cores  0.4 cores   17%
```

Analytics requests 2.4 cores but uses 0.4. That is $700/month wasted.

## Finding Waste

### Overprovisioned Workloads

```bash
# Kubecost API: workloads with <30% efficiency
curl http://kubecost:9090/model/savings/requestSizing \
  | jq '.[] | select(.currentEfficiency < 0.3)'
```

Kubecost recommends right-sized requests:

```
analytics deployment:
  Current:     cpu: 400m, memory: 512Mi
  Recommended: cpu: 100m, memory: 128Mi
  Savings:     $580/month
```

### Idle Resources

```
Idle costs by cluster:
  CPU idle:     $2,100/month (32% of CPU cost)
  Memory idle:  $1,800/month (28% of memory cost)
  Total idle:   $3,900/month
```

Idle cost means you are paying for capacity that no workload uses. Solutions: smaller node types, cluster autoscaler tuning, or bin-packing improvements.

### Abandoned Workloads

Deployments with zero traffic for 7+ days:

```
Deployment              Last Traffic    Monthly Cost
feature-test-api        22 days ago     $180
debug-service           45 days ago     $120
old-migration-job       90 days ago     $60
```

## Cost Allocation by Label

Tag workloads with team and project labels:

```yaml
metadata:
  labels:
    team: commerce
    project: checkout-v2
    environment: production
```

Kubecost aggregates costs by any label combination:

```
Team Commerce:
  checkout-v2:    $2,400/month
  order-system:   $1,800/month
  inventory:      $1,200/month
  Total:          $5,400/month

Team Platform:
  monitoring:     $900/month
  ingress:        $600/month
  Total:          $1,500/month
```

## Budgets and Alerts

```yaml
# Set a budget for the staging namespace
apiVersion: kubecost.com/v1alpha1
kind: Budget
metadata:
  name: staging-budget
spec:
  namespace: staging
  monthly: 2000  # $2,000/month
  alerts:
    - type: email
      threshold: 80  # Alert at 80% of budget
      recipients: ["platform-team@myorg.com"]
```

## Savings Recommendations

Kubecost generates actionable recommendations:

```
Recommendation                          Monthly Savings
Right-size order-api requests           $840
Right-size analytics requests           $580
Delete abandoned workloads              $360
Switch staging to spot instances        $1,200
Enable cluster autoscaler               $1,500
Total potential savings:                $4,480/month (30%)
```

## Kubecost vs Cloud Provider Tools

| Feature | Kubecost | AWS Cost Explorer | GCP Billing |
|---------|----------|------------------|-------------|
| Kubernetes-native | Yes | No | No |
| Per-pod costs | Yes | No | No |
| Right-sizing | Yes | Compute Optimizer | Recommender |
| Multi-cloud | Yes | AWS only | GCP only |
| Namespace-level | Yes | Tag-based | Label-based |
| Real-time | Yes | 24h delay | Hours delay |

Cloud billing tools show EC2 instance costs. Kubecost shows which deployment on which instance is responsible.

---

Ready to go deeper? Master Kubernetes cost optimization with hands-on courses at [CopyPasteLearn](/courses).
