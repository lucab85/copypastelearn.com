---
title: "Kyverno Kubernetes Policy Engine"
date: "2026-02-27"
description: "Kyverno validates, mutates, and generates Kubernetes resources using YAML policies instead of Rego. Learn how to enforce security standards, set defaults, and automate resource creation."
category: "DevOps"
tags: ["kyverno", "kubernetes", "policy", "Security", "admission-control", "Automation"]
author: "Luca Berton"
---

OPA Gatekeeper requires learning Rego. Kyverno writes policies in YAML — the same language you already use for Kubernetes resources. Lower barrier, same enforcement power.

## Installation

```bash
helm install kyverno kyverno/kyverno \
  --namespace kyverno --create-namespace
```

## Validation: Block Bad Resources

### Require Labels

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-team-label
      match:
        any:
          - resources:
              kinds: ["Deployment", "StatefulSet"]
      validate:
        message: "Label 'team' is required"
        pattern:
          metadata:
            labels:
              team: "?*"
```

Deploy without a `team` label → rejected.

### Block Latest Tag

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-image-tag
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "Images must use a specific tag, not ':latest'"
        pattern:
          spec:
            containers:
              - image: "!*:latest"
```

### Restrict Registries

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: allowed-registries
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-registry
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "Images must come from approved registries"
        pattern:
          spec:
            containers:
              - image: "registry.myorg.com/* | ghcr.io/myorg/*"
```

## Mutation: Set Defaults

### Add Default Resource Limits

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-limits
spec:
  rules:
    - name: set-memory-limit
      match:
        any:
          - resources:
              kinds: ["Pod"]
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - (name): "*"
                resources:
                  limits:
                    memory: "512Mi"
                  requests:
                    memory: "256Mi"
```

Pods without resource limits automatically get defaults. Developers do not need to remember — the policy handles it.

### Inject Sidecar

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: inject-logging-sidecar
spec:
  rules:
    - name: inject-fluentbit
      match:
        any:
          - resources:
              kinds: ["Deployment"]
              selector:
                matchLabels:
                  logging: enabled
      mutate:
        patchStrategicMerge:
          spec:
            template:
              spec:
                containers:
                  - name: fluentbit
                    image: fluent/fluent-bit:latest
                    volumeMounts:
                      - name: logs
                        mountPath: /var/log/app
```

## Generation: Create Resources Automatically

### Auto-Create NetworkPolicy

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: generate-networkpolicy
spec:
  rules:
    - name: default-deny
      match:
        any:
          - resources:
              kinds: ["Namespace"]
      generate:
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        name: default-deny
        namespace: "{{request.object.metadata.name}}"
        data:
          spec:
            podSelector: {}
            policyTypes:
              - Ingress
              - Egress
```

Every new namespace automatically gets a default-deny NetworkPolicy.

### Auto-Create ResourceQuota

```yaml
- name: generate-quota
  match:
    any:
      - resources:
          kinds: ["Namespace"]
  generate:
    apiVersion: v1
    kind: ResourceQuota
    name: default-quota
    namespace: "{{request.object.metadata.name}}"
    data:
      spec:
        hard:
          requests.cpu: "4"
          requests.memory: "8Gi"
          limits.cpu: "8"
          limits.memory: "16Gi"
```

## Audit Mode

Test policies without blocking:

```yaml
spec:
  validationFailureAction: Audit  # Log violations, don't block
```

```bash
# View policy violations
kubectl get policyreport -A
```

Switch to `Enforce` once violations are resolved.

## Kyverno vs OPA Gatekeeper

| Feature | Kyverno | OPA Gatekeeper |
|---------|---------|---------------|
| Policy language | YAML | Rego |
| Learning curve | Low | High |
| Validation | ✓ | ✓ |
| Mutation | ✓ | Limited |
| Generation | ✓ | ✗ |
| Image verification | ✓ | ✗ |
| Audit reports | PolicyReport CRD | Constraint status |

Kyverno is easier to adopt and covers more use cases (mutation + generation). Gatekeeper's Rego is more powerful for complex logic.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).
