---
title: "DevSecOps Pipeline Essentials"
slug: "devsecops-pipeline-essentials"
date: "2026-02-25"
category: "DevOps"
tags: ["DevSecOps", "Security", "CI/CD", "SAST", "DevOps"]
excerpt: "Integrate security into your CI/CD pipeline. SAST, dependency scanning, container scanning, secrets detection, and compliance as code."
description: "Integrate security into CI/CD. SAST, dependency scanning, container scanning, secrets detection, and compliance as code."
---

DevSecOps shifts security left — catching vulnerabilities during development instead of after deployment. Here is how to build security into every stage of your pipeline.

## The DevSecOps Pipeline

```
Commit → SAST → Dependency Scan → Build → Container Scan → Deploy → DAST → Monitor
   │        │           │            │          │             │        │        │
   │     Semgrep     Snyk/npm    Docker    Trivy/Grype   Policy    ZAP    Falco
   │                  audit      build                    check
   └─ Secrets scan (gitleaks)
```

## 1. Secrets Detection

Catch accidentally committed secrets before they reach the repo:

```yaml
# .github/workflows/security.yml
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Pre-commit hook:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

## 2. Static Application Security Testing (SAST)

Analyze code for vulnerabilities without running it:

```yaml
- name: SAST with Semgrep
  uses: semgrep/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten
      p/nodejs
      p/typescript
```

Common findings:
- SQL injection
- Cross-site scripting (XSS)
- Path traversal
- Hardcoded credentials
- Insecure deserialization

## 3. Dependency Scanning

```yaml
# npm audit
- name: Check dependencies
  run: npm audit --audit-level=high

# Snyk (more comprehensive)
- name: Snyk vulnerability scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

Automated dependency updates:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    groups:
      production:
        patterns: ["*"]
        exclude-patterns: ["@types/*", "eslint*", "prettier*"]
```

## 4. Container Image Scanning

```yaml
- name: Build image
  run: docker build -t my-app:${{ github.sha }} .

- name: Scan with Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: my-app:${{ github.sha }}
    format: sarif
    output: trivy-results.sarif
    severity: CRITICAL,HIGH
    exit-code: 1

- name: Upload results to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: trivy-results.sarif
```

## 5. Infrastructure as Code Security

Scan Terraform and Kubernetes manifests:

```yaml
# Checkov for IaC
- name: Scan Terraform
  uses: bridgecrewio/checkov-action@master
  with:
    directory: terraform/
    framework: terraform
    soft_fail: false

# tfsec (Terraform-specific)
- name: tfsec
  uses: aquasecurity/tfsec-action@v1
  with:
    working_directory: terraform/

# Kubesec for Kubernetes
- name: Scan K8s manifests
  run: |
    for file in k8s/*.yaml; do
      kubesec scan "$file"
    done
```

Common IaC findings:
- S3 buckets without encryption
- Security groups allowing 0.0.0.0/0
- RDS without backup enabled
- Kubernetes pods running as root

## 6. Dynamic Application Security Testing (DAST)

Test the running application for vulnerabilities:

```yaml
- name: DAST with OWASP ZAP
  uses: zaproxy/action-full-scan@v0.10
  with:
    target: https://staging.example.com
    rules_file_name: zap-rules.tsv
    cmd_options: '-a'
```

## 7. Policy as Code

Enforce organizational security policies:

```rego
# policy/no-root-containers.rego (Open Policy Agent)
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  container.securityContext.runAsUser == 0
  msg := sprintf("Container %v must not run as root", [container.name])
}

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  not container.resources.limits
  msg := sprintf("Container %v must have resource limits", [container.name])
}
```

## Complete GitHub Actions Security Pipeline

```yaml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: semgrep/semgrep-action@v1
        with:
          config: p/owasp-top-ten

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high

  container-scan:
    runs-on: ubuntu-latest
    needs: [sast, dependency-scan]
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:scan .
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:scan
          severity: CRITICAL,HIGH
          exit-code: 1

  iac-scan:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'terraform/')
    steps:
      - uses: actions/checkout@v4
      - uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
```

## Security Dashboard

Track security posture over time:

| Metric | Target |
|---|---|
| Critical vulnerabilities in production | 0 |
| Mean time to patch critical CVE | < 48 hours |
| Secrets found in commits | 0 |
| Failed security gates in CI | Trending down |
| Dependency update lag | < 30 days |

## What's Next?

Our **Docker Fundamentals** course covers container security. **SELinux for System Admins** teaches OS-level security hardening. **Terraform for Beginners** covers IaC security practices. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

