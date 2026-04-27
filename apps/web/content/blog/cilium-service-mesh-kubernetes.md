---
title: "Cilium Service Mesh Kubernetes"
date: "2026-04-13"
description: "Cilium replaces kube-proxy and sidecar service meshes with eBPF. Learn how Cilium handles networking, observability, and security in Kubernetes without sidecar containers."
category: "DevOps"
tags: ["cilium", "ebpf", "kubernetes", "service-mesh", "networking", "observability"]
---

Traditional service meshes inject a sidecar proxy into every pod. Cilium does the same job at the kernel level using eBPF — no sidecars, less overhead, fewer moving parts.

## Why eBPF Changes Everything

eBPF (extended Berkeley Packet Filter) lets you run sandboxed programs inside the Linux kernel. Cilium uses this to intercept network traffic at the kernel level instead of routing it through userspace proxies.

The result: networking decisions happen before packets reach your application, with significantly less latency and resource consumption than sidecar-based meshes like Istio or Linkerd.

```
Traditional:  Pod → Sidecar Proxy → Network → Sidecar Proxy → Pod
Cilium:       Pod → Kernel (eBPF) → Network → Kernel (eBPF) → Pod
```

## What Cilium Replaces

### kube-proxy

Cilium can fully replace kube-proxy for service load balancing. Instead of iptables rules (which scale poorly past 10,000 services), Cilium uses eBPF maps for O(1) lookups:

```bash
# Install Cilium without kube-proxy
helm install cilium cilium/cilium \
  --namespace kube-system \
  --set kubeProxyReplacement=true
```

### Sidecar Service Mesh

Cilium's service mesh provides mTLS, traffic management, and observability without sidecar containers:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-frontend-to-api
spec:
  endpointSelector:
    matchLabels:
      app: api
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
```

### Network Policies

Standard Kubernetes NetworkPolicy is limited — no L7 rules, no DNS-based policies, no identity-aware filtering. Cilium extends this:

```yaml
# L7 HTTP-aware policy
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-policy
spec:
  endpointSelector:
    matchLabels:
      app: api
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend
      toPorts:
        - ports:
            - port: "8080"
          rules:
            http:
              - method: GET
                path: "/api/v1/.*"
```

This policy allows GET requests to `/api/v1/*` but blocks everything else — at the kernel level.

## Hubble: Built-in Observability

Cilium includes Hubble, a network observability tool that gives you:

- Service dependency maps (which service talks to which)
- Per-request metrics (latency, error rates, throughput)
- DNS query logging
- Network flow logs

```bash
# Watch traffic in real time
hubble observe --namespace production

# Service map
hubble observe --verdict FORWARDED -o json | \
  jq '{src: .source.labels, dst: .destination.labels}'
```

No additional instrumentation needed. Hubble sees everything because eBPF sees everything.

## Performance Impact

Benchmarks consistently show Cilium adding less than 1% latency overhead compared to 2-5% for sidecar-based meshes. Memory usage is also lower — no sidecar container per pod means significant savings at scale.

For a cluster with 1,000 pods, sidecar meshes add 1,000 proxy containers. Cilium adds zero.

## Getting Started

```bash
# Install Cilium CLI
curl -L --remote-name-all \
  https://github.com/cilium/cilium-cli/releases/latest/download/cilium-linux-amd64.tar.gz
tar xzvf cilium-linux-amd64.tar.gz
sudo mv cilium /usr/local/bin

# Install in your cluster
cilium install

# Verify
cilium status
```

Start by replacing kube-proxy. Then enable Hubble for observability. Add network policies gradually. The service mesh features can come last once you are comfortable with the eBPF networking model.

---

Ready to go deeper? Master Kubernetes networking with hands-on courses at [CopyPasteLearn](/courses).
