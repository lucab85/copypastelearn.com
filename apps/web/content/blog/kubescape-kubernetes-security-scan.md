---
title: "Kubescape Kubernetes Security Scan"
date: "2026-02-24"
description: "Kubescape scans Kubernetes clusters against NSA, MITRE, and CIS benchmarks. Learn how to audit cluster security, fix misconfigurations, and integrate Kubescape into your CI/CD pipeline."
category: "DevOps"
tags: ["kubescape", "kubernetes", "security", "compliance", "nsa", "cis-benchmark"]
---

Your Kubernetes cluster is running. Is it secure? Kubescape answers that question by scanning against established security frameworks: NSA hardening guide, MITRE ATT&CK, CIS Benchmarks, and more.

## Quick Scan

```bash
# Install
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | bash

# Scan the cluster
kubescape scan

# Results
Controls: 85 (Passed: 62, Failed: 18, Skipped: 5)
Risk score: 32%

Failed controls:
  CRITICAL: C-0086 - Ensure that pods run as non-root
  HIGH:     C-0034 - Ensure network policies are configured
  HIGH:     C-0057 - Privileged containers detected
  MEDIUM:   C-0018 - Ensure CPU limits are set
```

## Framework Scans

```bash
# NSA Kubernetes Hardening Guide
kubescape scan framework nsa

# MITRE ATT&CK
kubescape scan framework mitre

# CIS Kubernetes Benchmark
kubescape scan framework cis-v1.23-t1.0.1

# All frameworks
kubescape scan framework all
```

## Scan Specific Resources

```bash
# Scan a namespace
kubescape scan --include-namespaces production

# Scan a specific workload
kubescape scan workload deployment/order-api -n production

# Scan YAML before deploying
kubescape scan *.yaml
```

## Common Failures and Fixes

### Pods Running as Root

```
FAILED: C-0086 - Ensure that pods run as non-root
Affected: deployment/order-api (production)
```

Fix:

```yaml
spec:
  containers:
    - name: order-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
```

### Missing Network Policies

```
FAILED: C-0034 - Ensure network policies are configured
Affected: namespace/production (no NetworkPolicy found)
```

Fix:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### No Resource Limits

```
FAILED: C-0018 - Ensure CPU/memory limits are set
Affected: deployment/order-api (production)
```

Fix:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Kubescape scan
        uses: kubescape/github-action@main
        with:
          files: "k8s/*.yaml"
          frameworks: "nsa,mitre"
          severityThreshold: high
          failedThreshold: 0
```

Fail the build if any HIGH or CRITICAL issues are found in Kubernetes manifests.

### Scan in Cluster

```bash
helm install kubescape kubescape/kubescape-operator \
  --namespace kubescape --create-namespace
```

The operator runs continuous scans and reports results as Kubernetes resources:

```bash
kubectl get workloadconfigurationscans -A
kubectl get vulnerabilitymanifests -A
```

## Output Formats

```bash
# JSON for CI parsing
kubescape scan --format json -o results.json

# SARIF for GitHub Security tab
kubescape scan --format sarif -o results.sarif

# HTML report
kubescape scan --format html -o report.html

# Prometheus metrics
kubescape scan --submit --account=<account-id>
```

## Exceptions

Not every control applies to every workload:

```yaml
# kubescape-exceptions.yaml
apiVersion: kubescape.io/v1
kind: ExceptionPolicy
metadata:
  name: allow-kube-system-privileged
spec:
  exceptions:
    - name: "kube-system privileged"
      policyType: posturePolicy
      actions: ["alertOnly"]
      resources:
        - designators:
            - attributes:
                namespace: kube-system
      posturePolicies:
        - controlID: C-0057  # Privileged containers
```

kube-system components legitimately need elevated privileges. Document exceptions, do not silence them.

## Kubescape vs Alternatives

| Tool | Cluster scan | YAML scan | Vulnerability scan | Compliance frameworks |
|------|-------------|-----------|-------------------|---------------------|
| Kubescape | ✓ | ✓ | ✓ | NSA, MITRE, CIS |
| kube-bench | ✓ | ✗ | ✗ | CIS only |
| Trivy | ✓ | ✓ | ✓ | NSA, PSS |
| Polaris | ✓ | ✓ | ✗ | Custom |

Kubescape covers the broadest range of frameworks with the simplest CLI.

---

Ready to go deeper? Master Kubernetes security with hands-on courses at [CopyPasteLearn](/courses).
