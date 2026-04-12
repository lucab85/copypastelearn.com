---
title: "Kubernetes Services Explained"
slug: "kubernetes-services-explained"
date: "2026-03-26"
category: "DevOps"
tags: ["Kubernetes", "Services", "Networking", "DevOps", "Containers"]
excerpt: "Understand Kubernetes Services: ClusterIP, NodePort, LoadBalancer, and Ingress. Learn when to use each with practical examples."
description: "Kubernetes Services explained: ClusterIP, NodePort, LoadBalancer, and Ingress. When to use each with practical examples."
---

Kubernetes Services expose your pods to network traffic. Without a Service, your pods are isolated — accessible only from inside the cluster. Services give pods stable networking.

## Why Services?

Pods are ephemeral. They get new IP addresses when they restart. A Service provides:

- **Stable IP address** that doesn't change when pods restart
- **DNS name** for service discovery (`my-service.default.svc.cluster.local`)
- **Load balancing** across multiple pod replicas
- **Port mapping** between external and internal ports

## ClusterIP (Default)

Internal-only access. Other pods in the cluster can reach this service, but nothing outside can.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
```

**Use when**: Backend services that only other pods need to reach (databases, internal APIs, caches).

```bash
# From another pod in the cluster:
curl http://api-service.default.svc.cluster.local
curl http://api-service  # Short form within same namespace
```

## NodePort

Exposes the service on a static port on every node's IP.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080  # Optional: K8s assigns 30000-32767 if omitted
```

**Use when**: Development, testing, or when you don't have a cloud load balancer.

```bash
# Access from outside the cluster:
curl http://<any-node-ip>:30080
```

**Drawbacks**: Exposes a port on every node, limited port range, no SSL termination.

## LoadBalancer

Provisions a cloud load balancer (AWS ELB, GCP LB, Azure LB) that routes to your service.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: public-web
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 443
      targetPort: 8080
```

**Use when**: Production services that need external access with cloud-native load balancing.

```bash
# K8s provisions an external IP:
kubectl get svc public-web
# NAME         TYPE           EXTERNAL-IP      PORT(S)
# public-web   LoadBalancer   203.0.113.10     443:31234/TCP
```

**Drawbacks**: One load balancer per service (expensive at scale), no path-based routing.

## Ingress

Routes HTTP/HTTPS traffic to multiple services based on hostname or path. Uses a single load balancer for all services.

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
        - app.example.com
        - api.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
```

**Use when**: Multiple services behind one IP, path/host routing, SSL termination.

**Requires**: An Ingress Controller (nginx-ingress, Traefik, HAProxy, etc.).

## Comparison

| Type | External Access | Load Balancer | Routing | Cost |
|---|---|---|---|---|
| ClusterIP | No | Internal only | None | Free |
| NodePort | Yes (node IP:port) | Round-robin | None | Free |
| LoadBalancer | Yes (external IP) | Cloud LB | None | Per service |
| Ingress | Yes (external IP) | Cloud LB | Host/path | Shared |

## Service Discovery

Kubernetes automatically creates DNS entries for services:

```bash
# Full DNS name
my-service.my-namespace.svc.cluster.local

# Within same namespace (short form)
my-service

# Cross-namespace
my-service.other-namespace
```

Environment variables are also injected:

```bash
# Inside a pod
echo $API_SERVICE_SERVICE_HOST  # ClusterIP of api-service
echo $API_SERVICE_SERVICE_PORT  # Port of api-service
```

## Headless Services

For stateful applications that need direct pod access (databases, Kafka):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None  # Headless
  selector:
    app: postgres
  ports:
    - port: 5432
```

DNS returns individual pod IPs instead of a virtual IP:

```bash
# Returns all pod IPs
nslookup postgres.default.svc.cluster.local

# Individual pod DNS (with StatefulSet)
postgres-0.postgres.default.svc.cluster.local
postgres-1.postgres.default.svc.cluster.local
```

## Practical Pattern: Full Application

```yaml
# Internal: database (ClusterIP)
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
---
# Internal: API (ClusterIP)
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
---
# External: Ingress routes to both frontend and API
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
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

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers Kubernetes networking, services, and deployments for ML workloads. **Docker Fundamentals** builds the container foundation you need first. Both include free preview lessons.
