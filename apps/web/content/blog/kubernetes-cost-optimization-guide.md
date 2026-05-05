---
title: "Kubernetes Cost Optimization Guide"
date: "2026-04-17"
description: "Kubernetes clusters are often 60-70% over-provisioned. Learn practical cost optimization strategies: right-sizing, spot instances, autoscaling, namespace quotas, and FinOps practices."
category: "DevOps"
tags: ["kubernetes", "cost-optimization", "finops", "autoscaling", "resource-management", "cloud"]
author: "Luca Berton"
---

The average Kubernetes cluster runs at 30-40% utilization. That means 60-70% of your compute spend is wasted. Here is how to fix it without sacrificing reliability.

## Find the Waste First

Before optimizing, measure:

```bash
# Check resource requests vs actual usage
kubectl top pods -A | sort -k3 -rn | head -20

# Find pods with no resource limits
kubectl get pods -A -o json | jq -r \
  '.items[] | select(.spec.containers[].resources.limits == null) |
   "\(.metadata.namespace)/\(.metadata.name)"'
```

The gap between what pods request and what they actually use is your optimization opportunity.

## Right-Size Resource Requests

Over-requesting is the biggest cost driver. A pod that requests 2 CPU cores but uses 0.1 is holding 1.9 cores hostage.

Use the Vertical Pod Autoscaler (VPA) in recommendation mode:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Off"  # Recommendation only
```

VPA watches actual usage and suggests right-sized requests. Review its recommendations weekly and adjust.

## Cluster Autoscaler + Spot Instances

Run your base workload on on-demand instances. Handle burst capacity with spot/preemptible instances at 60-90% discount:

```yaml
# Node pool for spot instances
apiVersion: v1
kind: Node
metadata:
  labels:
    node-type: spot
```

```yaml
# Schedule fault-tolerant workloads on spot
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          preference:
            matchExpressions:
              - key: node-type
                operator: In
                values: ["spot"]
  tolerations:
    - key: "spot"
      operator: "Equal"
      value: "true"
```

Batch jobs, dev environments, and stateless workers are ideal spot candidates.

## Namespace Resource Quotas

Prevent any single team from consuming the entire cluster:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-commerce
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    persistentvolumeclaims: "10"
```

Quotas create accountability. Teams that hit their quota must optimize before requesting more.

## Scale Down Non-Production

Development and staging environments do not need to run 24/7:

```bash
# Scale down dev namespace at night
kubectl scale deployment --all -n dev --replicas=0

# KEDA can automate this based on schedules
```

Running dev clusters only during business hours (10 hours/day, 5 days/week) saves ~70% on those workloads.

## Pod Disruption Budgets with Autoscaling

Combine HPA with PDB so the autoscaler can scale down safely:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

This ensures the cluster autoscaler can remove underutilized nodes while maintaining availability.

## Quick Wins Checklist

1. **Delete unused PVCs** — orphaned persistent volumes cost money silently
2. **Set resource requests on all pods** — unrequested resources cannot be optimized
3. **Use `requests` not just `limits`** — the scheduler uses requests for bin-packing
4. **Review load balancer count** — each cloud LB costs $15-20/month, consolidate with ingress
5. **Check for idle namespaces** — feature branch environments that were never cleaned up

Start with right-sizing. It is the highest-impact, lowest-risk optimization.

---

Ready to go deeper? Master Kubernetes resource management with hands-on courses at [CopyPasteLearn](/courses).
