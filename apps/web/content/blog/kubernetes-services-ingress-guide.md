---
title: "Kubernetes Services and Ingress"
description: "Expose Kubernetes workloads with ClusterIP, NodePort, LoadBalancer services and Ingress controllers. Practical examples."
date: "2026-04-14"
author: "Luca Berton"
category: "DevOps"
tags: ["kubernetes", "Services", "Ingress", "Networking", "DevOps"]
excerpt: "Expose Kubernetes workloads with ClusterIP, NodePort, LoadBalancer services and Ingress controllers. Practical examples."
---

## Service Types

### ClusterIP (Default)

Internal-only. Other pods in the cluster can reach it by name.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
```

```bash
# Access from another pod
curl http://api.default.svc.cluster.local
# Or just
curl http://api
```

### NodePort

Exposes the service on every node's IP at a static port (30000-32767):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: NodePort
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30080
```

Access at `http://<any-node-ip>:30080`.

### LoadBalancer

Creates a cloud load balancer (AWS ALB/NLB, GCP LB, Azure LB):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
```

```bash
kubectl get svc api
# EXTERNAL-IP shows the load balancer address
```

## When to Use Which

| Type | Use Case |
|---|---|
| ClusterIP | Internal microservice communication |
| NodePort | Development, bare-metal clusters |
| LoadBalancer | Production cloud deployments (one LB per service) |
| Ingress | Production (one LB, multiple services via routing) |

## Ingress

Route external traffic to multiple services through a single load balancer:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## Install Ingress Controller

Ingress resources need a controller to work:

```bash
# Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Verify
kubectl get pods -n ingress-nginx
```

## TLS with Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

## Path-Based Routing

Route different paths to different services:

```yaml
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## Debugging Services

```bash
# Check endpoints (pods backing the service)
kubectl get endpoints api

# No endpoints? Labels don't match
kubectl get pods --show-labels
kubectl describe svc api

# Test from inside cluster
kubectl run curl --image=curlimages/curl --rm -it -- curl http://api

# Check Ingress
kubectl describe ingress app-ingress
kubectl get ingress
```

## Related Posts

- [Kubernetes Pod Troubleshooting](/blog/kubernetes-pod-troubleshooting) for pod issues
- [kubectl Cheat Sheet for DevOps](/blog/kubectl-cheat-sheet-devops) for essential commands
- [Local Kubernetes with Kind](/blog/local-kubernetes-kind-ml) for testing locally
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Kubernetes Services and Ingress as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to kubernetes, Services, Ingress, Networking. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Kubernetes Services and Ingress?

Use it when you need a practical, repeatable way to handle kubernetes, Services, Ingress, Networking work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

