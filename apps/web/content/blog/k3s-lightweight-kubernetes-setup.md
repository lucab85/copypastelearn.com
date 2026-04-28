---
title: "K3s Lightweight Kubernetes Setup"
date: "2026-02-03"
description: "K3s is a lightweight Kubernetes distribution that runs on edge devices, Raspberry Pis, and VMs with a single binary. Learn how to install K3s, add agents, and deploy workloads in minutes."
category: "DevOps"
tags: ["k3s", "kubernetes", "lightweight", "edge-computing", "raspberry-pi", "homelab"]
---

Full Kubernetes needs etcd, a control plane with multiple components, and significant resources. K3s packages everything into a single 70MB binary that runs on a Raspberry Pi.

## Single-Node Install

```bash
curl -sfL https://get.k3s.io | sh -
```

That is the entire install. K3s is running. Check it:

```bash
sudo k3s kubectl get nodes
# NAME        STATUS   ROLES                  AGE   VERSION
# my-server   Ready    control-plane,master   30s   v1.29.3+k3s1
```

## Multi-Node Cluster

### Server (Control Plane)

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san my-server.myorg.com

# Get the token for joining agents
cat /var/lib/rancher/k3s/server/node-token
```

### Agent (Worker Nodes)

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://my-server:6443 \
  K3S_TOKEN=<node-token> sh -
```

```bash
sudo k3s kubectl get nodes
# NAME          STATUS   ROLES                  AGE
# my-server     Ready    control-plane,master   5m
# worker-1      Ready    <none>                 2m
# worker-2      Ready    <none>                 1m
```

## What K3s Includes

| Component | K3s Default | Full K8s |
|-----------|------------|----------|
| Container runtime | containerd | containerd/CRI-O |
| CNI | Flannel | Calico/Cilium/etc |
| Ingress | Traefik | None (install yourself) |
| Load balancer | ServiceLB | MetalLB/cloud LB |
| Storage | Local-path | None (install yourself) |
| DNS | CoreDNS | CoreDNS |
| Datastore | SQLite (single) / etcd (HA) | etcd |

K3s comes batteries-included. Deploy workloads immediately without installing add-ons.

## High Availability

```bash
# Server 1
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san k3s-lb.myorg.com

# Server 2
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server \
  --server https://server-1:6443 \
  --tls-san k3s-lb.myorg.com

# Server 3
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server \
  --server https://server-1:6443 \
  --tls-san k3s-lb.myorg.com
```

Three server nodes with embedded etcd. Put a load balancer in front for the API endpoint.

## Raspberry Pi Cluster

```bash
# On each Raspberry Pi (ARM64)
curl -sfL https://get.k3s.io | sh -

# K3s auto-detects ARM architecture
# Works on Pi 4, Pi 5, and other ARM64 devices
```

A 3-node Pi cluster runs real Kubernetes workloads:

```
Pi 1 (server): 4GB RAM → control plane + workloads
Pi 2 (agent):  4GB RAM → workloads
Pi 3 (agent):  4GB RAM → workloads
```

## Deploy Workloads

K3s is standard Kubernetes. All kubectl commands and manifests work:

```bash
# Deploy an app
kubectl create deployment nginx --image=nginx:1.25
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Traefik ingress (included by default)
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx
spec:
  rules:
    - host: nginx.myorg.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx
                port:
                  number: 80
EOF
```

## Auto-Deploy Manifests

Place YAML files in `/var/lib/rancher/k3s/server/manifests/` and K3s applies them automatically:

```bash
# Auto-deploy on startup
sudo cp my-app.yaml /var/lib/rancher/k3s/server/manifests/
```

Useful for GitOps: sync manifests to this directory and K3s keeps them applied.

## Helm Charts

K3s includes a HelmChart CRD:

```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: prometheus
  namespace: kube-system
spec:
  repo: https://prometheus-community.github.io/helm-charts
  chart: prometheus
  targetNamespace: monitoring
  createNamespace: true
  valuesContent: |-
    alertmanager:
      enabled: false
```

Deploy Helm charts declaratively without installing Helm CLI.

## K3s vs Alternatives

| Feature | K3s | K0s | MicroK8s | minikube |
|---------|-----|-----|----------|----------|
| Binary size | 70MB | 170MB | Snap | VM-based |
| Production-ready | Yes | Yes | Yes | No |
| HA support | Yes | Yes | Yes | No |
| ARM support | Yes | Yes | Yes | Limited |
| Edge/IoT | Yes | Yes | Partial | No |
| Batteries included | Yes | Minimal | Yes | Addons |
| CNCF | Sandbox | Sandbox | Canonical | Kubernetes SIG |

**Use K3s** for edge, IoT, Raspberry Pi, homelabs, and lightweight production. **Use full K8s** (kubeadm, EKS, GKE) for large-scale production with custom networking and storage requirements.

---

Ready to go deeper? Master Kubernetes fundamentals with hands-on courses at [CopyPasteLearn](/courses).
