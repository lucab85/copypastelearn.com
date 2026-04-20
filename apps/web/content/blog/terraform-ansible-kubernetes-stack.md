---
title: "Terraform Ansible Kubernetes Stack"
slug: "terraform-ansible-kubernetes-stack"
date: "2026-04-04"
category: "DevOps"
tags: ["Terraform", "Ansible", "Kubernetes", "DevOps", "IaC"]
excerpt: "Combine Terraform, Ansible, and Kubernetes for a complete DevOps stack. Provision with Terraform, configure with Ansible, deploy with K8s."
description: "Combine Terraform, Ansible, and Kubernetes for a complete DevOps infrastructure stack. Provision, configure, and deploy applications end to end with practical examples."
---

Terraform, Ansible, and Kubernetes are the three pillars of modern infrastructure automation. Each handles a different layer — together they cover the full stack.

## The Three-Layer Model

```
┌─────────────────────────────────────┐
│  Layer 3: Application Deployment    │
│  Tool: Kubernetes + Helm            │
│  What: Containers, services, scale  │
├─────────────────────────────────────┤
│  Layer 2: Server Configuration      │
│  Tool: Ansible                      │
│  What: OS setup, packages, users    │
├─────────────────────────────────────┤
│  Layer 1: Infrastructure Provision  │
│  Tool: Terraform                    │
│  What: VMs, networks, DNS, storage  │
└─────────────────────────────────────┘
```

**Terraform** creates the infrastructure: VPCs, subnets, VMs, load balancers, managed databases.

**Ansible** configures the machines: installs software, sets up users, hardens security, prepares for Kubernetes.

**Kubernetes** runs the workloads: containers, scaling, service discovery, rolling deployments.

## Layer 1: Terraform — Provision Infrastructure

Create a Kubernetes-ready infrastructure on AWS:

```hcl
# network.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0"

  name = "k8s-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    "kubernetes.io/cluster/my-cluster" = "shared"
  }
}
```

```hcl
# eks.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    workers = {
      desired_size = 3
      min_size     = 2
      max_size     = 5
      instance_types = ["t3.medium"]
    }
  }
}
```

Output connection details for Ansible:

```hcl
output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  value = module.eks.cluster_name
}
```

Apply:

```bash
terraform init
terraform apply
```

## Layer 2: Ansible — Configure the Cluster

After Terraform creates the infrastructure, Ansible configures it:

```yaml
# playbooks/setup-cluster.yml
---
- name: Configure Kubernetes cluster access
  hosts: localhost
  connection: local
  tasks:
    - name: Update kubeconfig
      command: >
        aws eks update-kubeconfig
        --name my-cluster
        --region eu-west-1

    - name: Install Helm
      command: >
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
      args:
        creates: /usr/local/bin/helm

    - name: Add Helm repositories
      command: "helm repo add {{ item.name }} {{ item.url }}"
      loop:
        - { name: ingress-nginx, url: "https://kubernetes.github.io/ingress-nginx" }
        - { name: cert-manager, url: "https://charts.jetstack.io" }
        - { name: prometheus, url: "https://prometheus-community.github.io/helm-charts" }

    - name: Install ingress controller
      command: >
        helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx
        --namespace ingress-nginx --create-namespace
        --set controller.replicaCount=2

    - name: Install cert-manager
      command: >
        helm upgrade --install cert-manager cert-manager/cert-manager
        --namespace cert-manager --create-namespace
        --set installCRDs=true

    - name: Install monitoring stack
      command: >
        helm upgrade --install monitoring prometheus/kube-prometheus-stack
        --namespace monitoring --create-namespace
```

## Layer 3: Kubernetes — Deploy Applications

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: app
          image: my-registry/web-app:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app
                port:
                  number: 80
```

## CI/CD Pipeline Tying It All Together

```yaml
# .github/workflows/deploy.yml
name: Full Stack Deploy

on:
  push:
    branches: [main]

jobs:
  infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init && terraform apply -auto-approve
        working-directory: terraform/

  configure:
    needs: infrastructure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install ansible
      - run: ansible-playbook playbooks/setup-cluster.yml

  deploy:
    needs: configure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          aws eks update-kubeconfig --name my-cluster
          kubectl apply -f k8s/
```

## When to Use Which Tool

| Task | Tool | Why |
|---|---|---|
| Create VPC, subnets | Terraform | Declarative, state-tracked |
| Create VMs, RDS | Terraform | API-driven provisioning |
| Install OS packages | Ansible | Agentless SSH configuration |
| Set up users, SSH keys | Ansible | Idempotent, repeatable |
| Deploy containers | Kubernetes | Orchestration, scaling |
| SSL certificates | Kubernetes (cert-manager) | Automatic renewal |
| Monitoring | Kubernetes (Prometheus) | Native K8s integration |

## What's Next?

CopyPasteLearn offers courses on all three tools:
- **Terraform for Beginners** — 15 lessons on IaC fundamentals
- **Ansible Automation in 30 Minutes** — Quick-start automation
- **MLflow for Kubernetes MLOps** — ML workloads on K8s

Each course includes free preview lessons and hands-on labs.
