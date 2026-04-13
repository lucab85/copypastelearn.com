---
title: "Kubernetes Network Policies Guide"
slug: "kubernetes-network-policies-guide"
date: "2026-01-21"
category: "DevOps"
tags: ["Kubernetes", "Network Policies", "Security", "Calico", "DevOps"]
excerpt: "Secure Kubernetes with network policies. Default deny, namespace isolation, pod-to-pod rules, and egress controls with examples."
description: "Secure Kubernetes with network policies. Default deny, namespace isolation, pod rules, and egress controls."
---

By default, all pods in a Kubernetes cluster can talk to every other pod. Network policies restrict that — think of them as firewall rules for pods.

## Prerequisites

You need a CNI plugin that supports network policies:
- **Calico** (most popular)
- **Cilium**
- **Weave Net**
- **Antrea**

Default kubenet and AWS VPC CNI (without add-on) do NOT enforce network policies.

## Default Deny All

Start with deny-all, then whitelist:

```yaml
# Deny all ingress in a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}    # Applies to ALL pods in namespace
  policyTypes:
    - Ingress
```

```yaml
# Deny all egress in a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
```

```yaml
# Deny both
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

## Allow Specific Traffic

### Frontend → API

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api              # Apply to api pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend  # Allow from frontend pods
      ports:
        - protocol: TCP
          port: 8080
```

### API → Database

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - protocol: TCP
          port: 5432
```

## Cross-Namespace Policies

```yaml
# Allow monitoring namespace to scrape metrics
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-prometheus
  namespace: production
spec:
  podSelector: {}    # All pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 9090
```

Note: `namespaceSelector` and `podSelector` in the same `from` item means AND. Separate items mean OR:

```yaml
ingress:
  # AND — pods matching BOTH selectors
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
        podSelector:
          matchLabels:
            app: prometheus

  # OR — pods matching EITHER selector
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
      - podSelector:
          matchLabels:
            app: prometheus
```

## Egress Policies

### Allow DNS

Almost always needed when using egress deny:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

### Allow External API Access

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Egress
  egress:
    # DNS
    - ports:
        - protocol: UDP
          port: 53
    # HTTPS to external APIs
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8       # Block internal network
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
```

## Complete Three-Tier Example

```yaml
---
# 1. Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: app
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
# 2. Allow DNS for all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: app
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - ports:
        - protocol: UDP
          port: 53
---
# 3. Frontend: ingress from internet, egress to API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: app
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes: [Ingress, Egress]
  ingress:
    - ports:
        - port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: api
      ports:
        - port: 8080
---
# 4. API: ingress from frontend, egress to database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: app
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: frontend
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              tier: database
      ports:
        - port: 5432
---
# 5. Database: ingress from API only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: app
spec:
  podSelector:
    matchLabels:
      tier: database
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: api
      ports:
        - port: 5432
```

## Testing

```bash
# Test connectivity
kubectl exec frontend-pod -- curl -sf http://api:8080/health
kubectl exec frontend-pod -- curl -sf http://postgres:5432  # Should fail

# Debug with netshoot
kubectl run test --rm -it --image=nicolaka/netshoot -n app -- /bin/bash
# Inside: curl, nslookup, traceroute, tcpdump
```

## What's Next?

Our **SELinux for System Admins** course covers OS-level network security. **Docker Fundamentals** teaches container networking basics. First lessons are free.
