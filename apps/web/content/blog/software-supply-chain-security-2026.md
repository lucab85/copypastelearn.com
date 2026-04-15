---
title: "Software Supply Chain Security"
slug: "software-supply-chain-security-2026"
date: "2025-12-11"
author: "Luca Berton"
description: "Secure your software supply chain with SBOM generation, dependency verification, artifact signing, and SLSA framework compliance for CI/CD pipelines."
category: "DevOps"
tags: ["supply chain security", "sbom", "slsa", "sigstore", "dependency management"]
---

Software supply chain attacks increased 742% between 2019 and 2025. From SolarWinds to xz-utils, attackers increasingly target the build and distribution pipeline rather than the application itself.

## The Attack Surface

```
Source Code → Build System → Artifacts → Registry → Deployment
     ↑             ↑            ↑           ↑           ↑
  Compromised   Poisoned    Tampered    Hijacked    Malicious
  dependency    build env   binary      package     config
```

Every stage is a potential attack vector.

## SLSA Framework

Supply-chain Levels for Software Artifacts (SLSA) defines four maturity levels:

| Level | Requirements | Protection |
|-------|-------------|------------|
| SLSA 1 | Build process documented | Basic provenance |
| SLSA 2 | Hosted build service, signed provenance | Tamper resistance |
| SLSA 3 | Hardened build platform, verified source | Compromise resistance |
| SLSA 4 | Hermetic, reproducible builds | Maximum assurance |

## Implementing SLSA in CI/CD

```yaml
# GitHub Actions with SLSA provenance
name: Build and Sign
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      attestations: write
    steps:
    - uses: actions/checkout@v4

    - name: Build container image
      run: docker build -t myapp:${{ github.sha }} .

    - name: Generate SBOM
      uses: anchore/sbom-action@v0
      with:
        image: myapp:${{ github.sha }}
        format: spdx-json
        output-file: sbom.spdx.json

    - name: Sign with Sigstore
      run: |
        cosign sign --yes \
          ghcr.io/org/myapp:${{ github.sha }}

    - name: Attest SBOM
      run: |
        cosign attest --yes \
          --predicate sbom.spdx.json \
          --type spdxjson \
          ghcr.io/org/myapp:${{ github.sha }}

    - name: Generate SLSA provenance
      uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0
```

## SBOM Generation

Software Bill of Materials lists every component:

```bash
# Generate SBOM for container image
syft myapp:latest -o spdx-json > sbom.json

# Generate SBOM for source code
cdxgen -o bom.json -t nodejs .

# Scan SBOM for vulnerabilities
grype sbom:sbom.json --fail-on critical
```

## Dependency Verification

Don't trust, verify:

```yaml
# Kubernetes admission policy: require signed images
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify-cosign-signature
    match:
      any:
      - resources:
          kinds: [Pod]
    verifyImages:
    - imageReferences:
      - "ghcr.io/org/*"
      attestors:
      - entries:
        - keyless:
            subject: "https://github.com/org/*"
            issuer: "https://token.actions.githubusercontent.com"
```

## Dependency Management Best Practices

1. **Pin dependencies** — Use exact versions, not ranges
2. **Lock files** — Commit lock files (`package-lock.json`, `pnpm-lock.yaml`, `Cargo.lock`)
3. **Private registry mirror** — Cache and scan packages before use
4. **Automated updates** — Dependabot/Renovate with automated testing
5. **Scorecard checks** — OpenSSF Scorecard for dependency health
6. **License compliance** — Automated license scanning (FOSSA, Snyk)

## Runtime Verification

Trust doesn't end at deploy:

- **Image allowlisting** — Only approved images run in production
- **Runtime integrity** — Detect modifications to running containers
- **Network policies** — Restrict unexpected outbound connections
- **Behavioral monitoring** — Flag processes that deviate from baselined behavior

## The Regulatory Push

- **US Executive Order 14028** — Requires SBOM for government software
- **EU Cyber Resilience Act** — SBOM mandatory for products sold in EU (2027)
- **PCI DSS 4.0** — Software inventory requirements for payment processing
- **DORA** — Supply chain risk management for EU financial sector

## FAQ

**Do I really need SBOMs?**
Yes. Regulatory requirements are expanding, and SBOMs are your first line of defense when the next Log4Shell hits.

**How do I handle transitive dependencies?**
SBOM tools (Syft, cdxgen) automatically discover transitive dependencies. Vulnerability scanners (Grype, Trivy) check the full tree.

**What's the overhead of signing and attestation?**
Minimal. Sigstore keyless signing adds < 10 seconds to CI/CD. The security benefit far outweighs the cost.
