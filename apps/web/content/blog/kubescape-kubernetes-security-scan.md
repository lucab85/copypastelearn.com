---
title: "Kubescape Kubernetes Security Scan"
date: "2026-02-24"
description: "Kubescape scans Kubernetes clusters against NSA, MITRE, and CIS benchmarks. Learn how to audit cluster security, fix misconfigurations, and integrate."
category: "DevOps"
tags: ["kubescape", "kubernetes", "Security", "compliance", "nsa", "cis-benchmark"]
author: "Luca Berton"
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

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Kubescape Kubernetes Security Scan as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to kubescape, kubernetes, Security, compliance. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Kubescape Kubernetes Security Scan?

Use it when you need a practical, repeatable way to handle kubescape, kubernetes, Security, compliance work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

