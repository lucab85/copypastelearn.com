---
title: "Crossplane Infrastructure as Code"
date: "2026-04-14"
description: "Crossplane lets you manage cloud infrastructure using Kubernetes custom resources. Learn how it works, how it compares to Terraform, and when to choose Crossplane for your platform."
category: "DevOps"
tags: ["crossplane", "kubernetes", "infrastructure-as-code", "platform-engineering", "cloud", "gitops"]
---

Crossplane extends Kubernetes so you can manage cloud infrastructure using the same tools you use for workloads. Instead of writing Terraform, you write Kubernetes manifests. Instead of running `terraform apply`, you `kubectl apply`.

## How It Works

Crossplane installs as a set of controllers in your Kubernetes cluster. You install providers for your cloud (AWS, GCP, Azure), then create custom resources that represent cloud infrastructure:

```yaml
apiVersion: database.aws.crossplane.io/v1beta1
kind: RDSInstance
metadata:
  name: my-database
spec:
  forProvider:
    region: eu-west-1
    dbInstanceClass: db.t3.medium
    engine: postgres
    engineVersion: "15"
    masterUsername: admin
  writeConnectionSecretToRef:
    name: db-credentials
    namespace: default
```

Apply this manifest and Crossplane provisions an RDS instance. Delete it and Crossplane destroys the instance. The Kubernetes reconciliation loop handles drift detection automatically.

## Crossplane vs Terraform

| Aspect | Crossplane | Terraform |
|--------|-----------|-----------|
| Interface | Kubernetes API (kubectl) | CLI (terraform) |
| State | Kubernetes etcd | State file (S3, etc.) |
| Drift detection | Continuous (reconciliation loop) | On `terraform plan` only |
| Language | YAML (Kubernetes manifests) | HCL |
| GitOps native | Yes (ArgoCD/Flux) | Requires wrapper (Atlantis) |
| Learning curve | Kubernetes knowledge required | Standalone tool |

## Compositions: The Platform Layer

Crossplane's power comes from Compositions. Platform teams define high-level abstractions that map to underlying resources:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.platform.example.com
spec:
  group: platform.example.com
  names:
    kind: XDatabase
    plural: xdatabases
  versions:
    - name: v1alpha1
      schema:
        openAPIV3Schema:
          properties:
            spec:
              properties:
                size:
                  type: string
                  enum: ["small", "medium", "large"]
                engine:
                  type: string
                  enum: ["postgres", "mysql"]
```

Developers request a database by size and engine. The platform team's Composition handles instance class, backup policy, security groups, and monitoring — all hidden from the developer:

```yaml
# What developers see
apiVersion: platform.example.com/v1alpha1
kind: XDatabase
metadata:
  name: orders-db
spec:
  size: medium
  engine: postgres
```

This is platform engineering in practice: simple interfaces backed by opinionated infrastructure.

## When to Choose Crossplane

**Good fit:**
- Your platform is Kubernetes-native
- You want continuous drift detection, not periodic
- You use GitOps (ArgoCD or Flux) for everything
- Your platform team wants to define custom abstractions
- You need self-service infrastructure provisioning via Kubernetes API

**Not ideal:**
- Your team does not run Kubernetes
- You need one-off infrastructure scripts
- Terraform expertise is already deep in your organization
- Simple infrastructure needs (a few resources, rarely changed)

## Getting Started

```bash
# Install Crossplane
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace

# Install AWS provider
kubectl apply -f - <<EOF
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws-ec2:v1
EOF
```

Start with a single resource type (like S3 buckets or RDS instances). Validate the workflow. Then build Compositions for your platform's self-service layer.

---

Ready to go deeper? Learn Kubernetes and infrastructure as code with hands-on courses at [CopyPasteLearn](/courses).
