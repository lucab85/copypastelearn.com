---
title: "Setting Up a Local Kubernetes Cluster with Kind for ML"
description: "Step-by-step guide to creating a local Kubernetes cluster using Kind for ML model development and testing before deploying to production."
date: "2026-02-26"
author: "Luca Berton"
category: "MLOps"
tags: ["Kubernetes", "Kind", "ML Infrastructure"]
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
