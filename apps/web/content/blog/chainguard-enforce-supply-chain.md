---
title: "Chainguard Enforce Supply Chain"
date: "2026-02-07"
description: "Chainguard Enforce validates container supply chain integrity in Kubernetes using SLSA provenance, SBOMs, and image signatures. Learn how to enforce supply chain policies across your clusters."
category: "DevOps"
tags: ["chainguard", "supply-chain-security", "slsa", "sbom", "container-security", "kubernetes"]
author: "Luca Berton"
---

Your CI pipeline builds an image. Someone modifies it after build. Or injects a different image entirely. Supply chain security ensures the image running in production is exactly what your pipeline built — nothing added, nothing changed.

## Supply Chain Threats

```
1. Compromised dependency    → Malicious package in node_modules
2. Tampered build artifact   → Image modified after CI build
3. Registry substitution     → Different image pushed with same tag
4. Compromised base image    → Vulnerability in upstream image
5. Missing provenance        → No proof of how the image was built
```

## SLSA Framework

Supply-chain Levels for Software Artifacts (SLSA) defines four levels:

| Level | Requirements |
|-------|-------------|
| SLSA 1 | Build process exists and produces provenance |
| SLSA 2 | Hosted build service, authenticated provenance |
| SLSA 3 | Hardened build platform, unforgeable provenance |
| SLSA 4 | Two-party review, hermetic builds |

Most organizations start at SLSA 2 and progress to SLSA 3.

## Build Provenance with SLSA

```yaml
# GitHub Actions with SLSA provenance
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/myorg/order-api:${{ github.sha }}

      - name: Generate SLSA provenance
        uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9
        with:
          image: ghcr.io/myorg/order-api
          digest: ${{ steps.build.outputs.digest }}
```

The provenance attestation proves:
- **Who** triggered the build (git push by alice)
- **What** was built (commit abc123 on branch main)
- **Where** it was built (GitHub Actions runner)
- **How** it was built (Dockerfile, build args)

## Verify Provenance

```bash
# Verify SLSA provenance
cosign verify-attestation \
  --type slsaprovenance \
  --certificate-identity-regexp="https://github.com/myorg/.*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  ghcr.io/myorg/order-api:v1.0
```

## SBOM Generation and Attestation

```bash
# Generate SBOM
syft ghcr.io/myorg/order-api:v1.0 -o spdx-json > sbom.json

# Attest SBOM
cosign attest --predicate sbom.json \
  --type spdxjson \
  ghcr.io/myorg/order-api:v1.0

# Verify SBOM attestation
cosign verify-attestation \
  --type spdxjson \
  ghcr.io/myorg/order-api:v1.0
```

The SBOM lists every package and library in the image. If a new CVE is discovered, you can check which images are affected without scanning them again.

## Enforce Policies in Kubernetes

```yaml
# Sigstore Policy Controller
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: require-slsa-provenance
spec:
  images:
    - glob: "ghcr.io/myorg/**"
  authorities:
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "https://github.com/myorg/.*"
        ctlog:
          url: https://rekor.sigstore.dev
      attestations:
        - name: must-have-slsa
          predicateType: https://slsa.dev/provenance/v0.2
          policy:
            type: cue
            data: |
              predicateType: "https://slsa.dev/provenance/v0.2"
```

Images without valid SLSA provenance cannot be deployed.

## VEX (Vulnerability Exploitability)

Not every CVE is exploitable in your context:

```json
{
  "@context": "https://openvex.dev/ns/v0.2.0",
  "statements": [
    {
      "vulnerability": { "name": "CVE-2024-1234" },
      "products": [{ "@id": "ghcr.io/myorg/order-api" }],
      "status": "not_affected",
      "justification": "vulnerable_code_not_in_execute_path"
    }
  ]
}
```

VEX statements document that a CVE exists in the image but is not exploitable. This reduces false-positive noise in vulnerability reports.

## Implementation Roadmap

1. **Week 1**: Sign all images with Cosign in CI
2. **Week 2**: Generate SBOMs for all images
3. **Week 3**: Add SLSA provenance to build pipelines
4. **Week 4**: Deploy policy controller in audit mode
5. **Week 5**: Switch to enforce mode for staging
6. **Week 6**: Enforce in production

Start with signing. It is the foundation for everything else.

---

Ready to go deeper? Master container security with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
