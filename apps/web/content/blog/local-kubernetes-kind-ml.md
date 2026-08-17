---
title: "Local Kubernetes with Kind"
description: "Step-by-step guide to creating a local Kubernetes cluster using Kind for ML model development and testing before deploying to production."
date: "2026-02-26"
author: "Luca Berton"
category: "MLOps"
tags: ["kubernetes", "Kind", "ml infrastructure"]
---

## Why Kind for ML Development?

Before deploying ML models to a production Kubernetes cluster, you need a local environment to test your deployments. **Kind** (Kubernetes in Docker) gives you a fully functional Kubernetes cluster running inside Docker containers.

## Installing Kind

### Prerequisites

- Docker installed and running
- kubectl installed

### Install Kind

```bash
# Linux/macOS
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

### Create a Cluster

```bash
kind create cluster --name ml-cluster
```

Verify it's running:

```bash
kubectl cluster-info --context kind-ml-cluster
kubectl get nodes
```

## Configuring for ML Workloads

ML models need more resources than typical web services. Create a cluster config:

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
    extraMounts:
      - hostPath: /tmp/ml-models
        containerPath: /models
```

```bash
kind create cluster --name ml-cluster --config kind-config.yaml
```

## Installing the Kubernetes Dashboard

Visualize your cluster's state:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

Create a service account for dashboard access:

```bash
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=kubernetes-dashboard:dashboard-admin
```

## Next Steps

With your local cluster running, you're ready to:
- Install KServe for model serving
- Deploy your first MLflow model
- Test inference locally before going to production

Learn the complete workflow in our [MLflow for Kubernetes course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [MLflow for Kubernetes](/courses/mlflow-kubernetes-mlops) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Local Kubernetes with Kind as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to kubernetes, Kind, ml infrastructure. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Local Kubernetes with Kind?

Use it when you need a practical, repeatable way to handle kubernetes, Kind, ml infrastructure work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

