---
title: "Kubernetes Service Types Explained"
slug: "kubernetes-service-types-explained"
date: "2026-01-14"
category: "DevOps"
tags: ["Kubernetes", "Services", "Networking", "ClusterIP", "LoadBalancer"]
excerpt: "Understand Kubernetes service types. ClusterIP, NodePort, LoadBalancer, ExternalName, and headless services with real-world use cases."
description: "Kubernetes service types explained for networking. ClusterIP, NodePort, LoadBalancer, ExternalName, and headless services with practical use cases and YAML examples."
---

Services give pods stable network identities. Pods come and go, but the service DNS name stays constant. Choosing the right service type determines how your application is exposed.

## ClusterIP (Default)

Internal-only. Only accessible within the cluster:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP    # default, can be omitted
  selector:
    app: api
  ports:
    - port: 80           # Service port
      targetPort: 3000   # Container port
      protocol: TCP
```

```
Other pods → api:80 → Pod 10.0.1.5:3000
                     → Pod 10.0.1.6:3000
                     → Pod 10.0.1.7:3000
```

**Use for**: Backend services, databases, internal APIs.

```bash
# From any pod in the cluster
curl http://api                    # Same namespace
curl http://api.default.svc        # Full DNS
curl http://api.production.svc     # Different namespace
```

## NodePort

Exposes on every node's IP at a static port:

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
      nodePort: 30080    # Optional: 30000-32767 range
```

```
External → NodeIP:30080 → Service → Pod:3000
```

Accessible at `<any-node-ip>:30080`.

**Use for**: Development, on-prem without load balancer, testing.

**Avoid for**: Production (no SSL termination, limited port range, exposes node IPs).

## LoadBalancer

Provisions a cloud load balancer:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  annotations:
    # AWS-specific
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000
    - port: 443
      targetPort: 3000
```

```
Internet → Cloud LB (public IP) → Node → Pod:3000
```

```bash
kubectl get svc api
# NAME  TYPE           CLUSTER-IP    EXTERNAL-IP      PORT(S)
# api   LoadBalancer   10.96.0.1     203.0.113.50     80:31234/TCP
```

**Use for**: Simple external access to a single service.

**Limitations**: One LB per service (expensive), no path-based routing.

## ExternalName

DNS alias to an external service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: database
spec:
  type: ExternalName
  externalName: db.rds.amazonaws.com
```

```bash
# From pods
curl http://database  # Resolves to db.rds.amazonaws.com
```

**Use for**: Pointing to external databases, SaaS APIs, migration from external to internal services.

No proxying — just a CNAME DNS record.

## Headless Service

No cluster IP. DNS returns individual pod IPs:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None    # This makes it headless
  selector:
    app: postgres
  ports:
    - port: 5432
```

```bash
# DNS returns ALL pod IPs (not load-balanced)
nslookup postgres
# postgres.default.svc.cluster.local → 10.0.1.5
# postgres.default.svc.cluster.local → 10.0.1.6
```

With StatefulSets, each pod gets its own DNS:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres   # Must match headless service name
  replicas: 3
```

```bash
# Individual pod DNS
postgres-0.postgres.default.svc    # Primary
postgres-1.postgres.default.svc    # Replica
postgres-2.postgres.default.svc    # Replica
```

**Use for**: StatefulSets (databases, message queues), client-side load balancing, service discovery.

## Multi-Port Services

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: 3000
    - name: grpc
      port: 9090
      targetPort: 9090
    - name: metrics
      port: 9091
      targetPort: 9091
```

Port names are required when defining multiple ports.

## Service Discovery

```bash
# DNS (preferred)
curl http://service-name                         # Same namespace
curl http://service-name.namespace               # Cross-namespace
curl http://service-name.namespace.svc.cluster.local  # Full FQDN

# Environment variables (set at pod start)
echo $API_SERVICE_HOST    # 10.96.0.1
echo $API_SERVICE_PORT    # 80
```

## Comparison

| Type | Access | Cloud LB | Use Case |
|---|---|---|---|
| ClusterIP | Internal only | No | Backend services |
| NodePort | Node IP + port | No | Dev/testing |
| LoadBalancer | External IP | Yes | Simple external access |
| ExternalName | DNS alias | No | External service reference |
| Headless | Pod IPs directly | No | StatefulSets, discovery |

**In production**, most teams use ClusterIP + Ingress Controller instead of LoadBalancer per service.

## What's Next?

Our **Docker Fundamentals** course covers container networking and Kubernetes services. **MLflow for Kubernetes MLOps** teaches service architecture for ML platforms. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — from Docker and Terraform to MLflow on Kubernetes.

