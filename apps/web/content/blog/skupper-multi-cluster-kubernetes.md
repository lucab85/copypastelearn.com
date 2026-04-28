---
title: "Skupper Multi-Cluster Kubernetes"
date: "2026-03-06"
description: "Skupper connects Kubernetes services across clusters without VPNs or special networking. Learn how to set up multi-cluster communication with Skupper for hybrid cloud and edge deployments."
category: "DevOps"
tags: ["skupper", "kubernetes", "multi-cluster", "hybrid-cloud", "networking", "service-mesh"]
---

Your frontend runs on EKS. Your database runs on-premises. Traditional solutions involve VPNs, firewall rules, and network engineering. Skupper creates a virtual application network that connects services across clusters with one command per cluster.

## The Problem

Multi-cluster Kubernetes networking is complex:

- **VPNs**: Flat networks across clusters create security risks
- **Ingress/LoadBalancer**: Exposes internal services to the internet
- **Service mesh federation**: Complex configuration, single vendor
- **Manual port forwarding**: Not production-ready

Skupper creates a layer 7 network between clusters. Services communicate by name, as if they were in the same cluster.

## Installation

```bash
# Install CLI
curl https://skupper.io/install.sh | sh

# In cluster A (cloud)
kubectl config use-context cloud-cluster
skupper init --site-name cloud

# In cluster B (on-premises)
kubectl config use-context onprem-cluster
skupper init --site-name onprem
```

## Link Clusters

```bash
# On cluster A: generate a token
skupper token create ~/link-token.yaml

# On cluster B: use the token to link
skupper link create ~/link-token.yaml

# Verify
skupper link status
# Link to cloud is active
```

That is it. The clusters are connected. No VPN, no firewall rules, no network engineering.

## Expose Services

```bash
# On cluster B (where the database runs)
skupper expose deployment/postgres --port 5432

# On cluster A (where the frontend runs)
# postgres is now available as a local service
kubectl get services
# NAME       TYPE        CLUSTER-IP    PORT(S)
# postgres   ClusterIP   10.96.0.42    5432/TCP
```

The frontend on cluster A connects to `postgres:5432` as if it were a local service. Skupper routes the traffic to cluster B.

## Architecture

```
Cluster A (EKS)              Cluster B (On-prem)
┌──────────────┐             ┌──────────────┐
│ frontend pod │             │ postgres pod │
│      ↓       │             │      ↑       │
│ skupper-router│ ←── AMQP ──→│ skupper-router│
└──────────────┘   (encrypted) └──────────────┘
```

Skupper routers communicate over AMQP 1.0 with mutual TLS. Traffic is encrypted end-to-end. Only outbound connections are needed — no inbound firewall rules.

## Multi-Cluster Microservices

```bash
# Cluster A: frontend + API gateway
skupper expose deployment/api-gateway --port 8080

# Cluster B: order service + payment service
skupper expose deployment/order-service --port 8080
skupper expose deployment/payment-service --port 8080

# Cluster C: analytics + ML pipeline
skupper expose deployment/analytics-api --port 8080
```

Each service is accessible from any linked cluster by name:

```yaml
# Frontend config on Cluster A
env:
  - name: ORDER_SERVICE_URL
    value: "http://order-service:8080"  # Routed to Cluster B
  - name: ANALYTICS_URL
    value: "http://analytics-api:8080"  # Routed to Cluster C
```

## Edge Computing

Skupper works well for edge deployments where clusters are behind NAT or firewalls:

```bash
# Edge cluster (behind NAT, no public IP)
skupper init --site-name edge-store-42
skupper link create token.yaml  # Outbound connection to hub

# Hub cluster (cloud)
skupper init --site-name hub
skupper token create token.yaml
```

Edge clusters initiate outbound connections. No inbound ports needed. IoT data flows from edge to cloud through the Skupper network.

## Observability

```bash
# View network topology
skupper network status

# Site: cloud (namespace: production)
#   Linked to: onprem, edge-store-42, edge-store-43
#   Services exposed: api-gateway, frontend
#   Services available: postgres, order-service, analytics-api

# Monitor traffic
skupper debug events
```

## When to Use Skupper

**Good fit:**
- Hybrid cloud (cloud + on-premises services)
- Multi-cloud (AWS + GCP + Azure clusters)
- Edge computing (many small clusters connecting to a hub)
- Migration (gradually move services between clusters)
- Teams without network engineering expertise

**Not needed:**
- Single cluster deployments
- Clusters in the same VPC (use standard K8s networking)
- When a full service mesh is already deployed

Skupper solves one problem well: connecting services across clusters without infrastructure complexity. It is not a service mesh — it does not do traffic management, observability, or policy enforcement within a cluster.

---

Ready to go deeper? Master Kubernetes networking with hands-on courses at [CopyPasteLearn](/courses).
