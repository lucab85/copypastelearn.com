---
title: "Cosign Container Image Signing"
date: "2026-02-20"
description: "Cosign signs and verifies container images using keyless signing with Sigstore. Learn how to sign images in CI/CD, verify signatures before deployment, and enforce signed images in Kubernetes."
category: "DevOps"
tags: ["cosign", "sigstore", "container-security", "supply-chain", "image-signing", "kubernetes"]
---

Someone pushes a malicious image to your registry. Without image signing, Kubernetes pulls and runs it. Cosign adds cryptographic signatures to container images so you can verify who built them and that they have not been tampered with.

## Keyless Signing

Cosign's keyless mode uses your identity provider (GitHub, Google, Microsoft) instead of managing private keys:

```bash
# Install
brew install cosign

# Sign (opens browser for OIDC auth)
cosign sign myorg/order-api:v1.0

# Verify
cosign verify myorg/order-api:v1.0 \
  --certificate-identity=build@myorg.com \
  --certificate-oidc-issuer=https://accounts.google.com
```

No private keys to manage, rotate, or protect. The signature is tied to your identity.

## CI/CD Signing

### GitHub Actions

```yaml
jobs:
  build-and-sign:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for keyless signing
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Build and push
        run: |
          docker build -t ghcr.io/myorg/order-api:${{ github.sha }} .
          docker push ghcr.io/myorg/order-api:${{ github.sha }}

      - name: Install Cosign
        uses: sigstore/cosign-installer@main

      - name: Sign image
        run: |
          cosign sign --yes \
            ghcr.io/myorg/order-api:${{ github.sha }}
        env:
          COSIGN_EXPERIMENTAL: 1
```

GitHub's OIDC token proves the image was built by this specific workflow in this specific repository.

## Verify Signatures

```bash
# Verify with identity constraints
cosign verify ghcr.io/myorg/order-api:v1.0 \
  --certificate-identity-regexp=".*@myorg.com" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Output
Verification for ghcr.io/myorg/order-api:v1.0 --
The following checks were performed:
  - The cosign claims were validated
  - The claims were present in the transparency log
  - The signatures were integrated with Rekor
  - The certificate identity matched
```

## Attach Metadata

### Software Bill of Materials (SBOM)

```bash
# Generate SBOM
syft ghcr.io/myorg/order-api:v1.0 -o spdx-json > sbom.json

# Attach to image
cosign attach sbom --sbom sbom.json ghcr.io/myorg/order-api:v1.0

# Sign the SBOM attestation
cosign attest --predicate sbom.json \
  --type spdxjson ghcr.io/myorg/order-api:v1.0
```

### Vulnerability Scan Results

```bash
# Scan and attest
trivy image --format cosign-vuln ghcr.io/myorg/order-api:v1.0 > vuln.json

cosign attest --predicate vuln.json \
  --type vuln ghcr.io/myorg/order-api:v1.0
```

The image now carries its SBOM and vulnerability scan as signed attestations.

## Enforce in Kubernetes

### Kyverno Policy

```yaml
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
              kinds: ["Pod"]
      verifyImages:
        - imageReferences: ["ghcr.io/myorg/*"]
          attestors:
            - entries:
                - keyless:
                    subject: "*@myorg.com"
                    issuer: "https://token.actions.githubusercontent.com"
```

Unsigned images are rejected. Only images signed by your GitHub Actions workflows can run.

### Sigstore Policy Controller

```bash
helm install policy-controller sigstore/policy-controller \
  --namespace cosign-system --create-namespace
```

```yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: require-signatures
spec:
  images:
    - glob: "ghcr.io/myorg/**"
  authorities:
    - keyless:
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "https://github.com/myorg/.*"
```

## Key-Based Signing

For air-gapped environments without OIDC:

```bash
# Generate key pair
cosign generate-key-pair

# Sign with private key
cosign sign --key cosign.key ghcr.io/myorg/order-api:v1.0

# Verify with public key
cosign verify --key cosign.pub ghcr.io/myorg/order-api:v1.0
```

Store `cosign.key` in your CI/CD secrets. Distribute `cosign.pub` to clusters.

## The Full Supply Chain

```
Developer → GitHub → Build → Sign → Push → Verify → Deploy
                       ↓       ↓             ↓
                     SBOM   Signature    Admission
                     Scan   Attestation   Control
```

Every image in production has a verified identity, a signed SBOM, and a vulnerability scan attestation. This is software supply chain security.

---

Ready to go deeper? Master container security with hands-on courses at [CopyPasteLearn](/courses/docker-fundamentals).
