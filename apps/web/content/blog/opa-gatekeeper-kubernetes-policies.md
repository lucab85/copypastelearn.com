---
title: "OPA Gatekeeper Kubernetes Policies"
date: "2026-03-21"
description: "OPA Gatekeeper enforces custom policies in Kubernetes at admission time. Learn how to write ConstraintTemplates, enforce security standards, and prevent misconfigurations before deployment."
category: "DevOps"
tags: ["opa", "gatekeeper", "kubernetes", "policy", "Security", "admission-control"]
author: "Luca Berton"
---

Kubernetes lets you deploy anything. OPA Gatekeeper lets you define what "anything" should not include — no privileged containers, no `latest` tags, no missing resource limits, no public load balancers in production.

## How Gatekeeper Works

Gatekeeper is a Kubernetes admission controller. Every resource creation or update passes through it before reaching etcd:

```
kubectl apply → API Server → Gatekeeper (allow/deny) → etcd
```

If a resource violates a policy, the request is rejected with a clear error message. The resource never exists in the cluster.

## Installation

```bash
helm install gatekeeper gatekeeper/gatekeeper \
  --namespace gatekeeper-system --create-namespace
```

## ConstraintTemplates and Constraints

Gatekeeper uses two objects:

1. **ConstraintTemplate** — defines the policy logic (written in Rego)
2. **Constraint** — applies the template with specific parameters

### Example: Block Privileged Containers

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sblockprivileged
spec:
  crd:
    spec:
      names:
        kind: K8sBlockPrivileged
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sblockprivileged

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.privileged == true
          msg := sprintf("Privileged container not allowed: %v", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          container.securityContext.privileged == true
          msg := sprintf("Privileged init container not allowed: %v", [container.name])
        }
```

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sBlockPrivileged
metadata:
  name: block-privileged-containers
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["production", "staging"]
```

Now try deploying a privileged container:

```bash
$ kubectl apply -f privileged-pod.yaml
Error: admission webhook denied the request:
  Privileged container not allowed: my-container
```

### Example: Require Resource Limits

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequirelimits
spec:
  crd:
    spec:
      names:
        kind: K8sRequireLimits
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequirelimits

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.cpu
          msg := sprintf("Container %v must set CPU limits", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("Container %v must set memory limits", [container.name])
        }
```

### Example: Block Latest Tag

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sblocklatesttag
spec:
  crd:
    spec:
      names:
        kind: K8sBlockLatestTag
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sblocklatesttag

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          endswith(container.image, ":latest")
          msg := sprintf("Image %v uses :latest tag", [container.image])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not contains(container.image, ":")
          msg := sprintf("Image %v has no tag (defaults to :latest)", [container.image])
        }
```

## Audit Mode

Test policies without blocking deployments:

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sBlockLatestTag
metadata:
  name: block-latest-tag
spec:
  enforcementAction: dryrun  # Log violations, don't block
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
```

Check violations:

```bash
kubectl get k8sblocklatesttag block-latest-tag -o yaml
# status.violations shows all current violations
```

Switch to `deny` once you have fixed existing violations.

## Gatekeeper Library

The Gatekeeper community maintains a library of pre-built templates:

```bash
# Clone the library
git clone https://github.com/open-policy-agent/gatekeeper-library

# Apply common templates
kubectl apply -f gatekeeper-library/library/
```

Pre-built policies for: container limits, image registries, host networking, privilege escalation, read-only root filesystem, and more.

## Gatekeeper vs Kyverno

| Feature | Gatekeeper | Kyverno |
|---------|-----------|---------|
| Policy language | Rego | YAML (native K8s) |
| Learning curve | Steep (Rego) | Low (YAML) |
| Mutation | Limited | Full support |
| Generation | No | Yes (create resources) |
| Community | Large (OPA ecosystem) | Growing fast |

Choose Gatekeeper if your team already uses OPA or needs complex policy logic. Choose Kyverno if you want YAML-native policies that are easier to write and maintain.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).
