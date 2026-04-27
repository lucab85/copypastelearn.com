---
title: "Sigstore Container Image Signing"
date: "2026-03-30"
description: "Sigstore provides keyless signing for container images and software artifacts. Learn how to sign images with Cosign, verify signatures in Kubernetes, and build a software supply chain you can trust."
category: "DevOps"
tags: ["sigstore", "cosign", "container-security", "supply-chain", "kubernetes", "signing"]
---

Software supply chain attacks target the gap between "code was reviewed" and "this binary is what was reviewed." Sigstore closes that gap by making it easy to sign and verify container images.

## The Problem

You pull `nginx:latest` from Docker Hub. How do you know:
- It was built from the official Nginx source code?
- Nobody tampered with it after build?
- The build environment was not compromised?

Without signatures, you are trusting the registry and every network hop between the build and your cluster.

## Cosign: Sign and Verify

Cosign is Sigstore's tool for signing container images:

```bash
# Install cosign
brew install cosign

# Sign an image (keyless — uses OIDC identity)
cosign sign ghcr.io/myorg/my-app:v1.2.3

# Verify a signature
cosign verify ghcr.io/myorg/my-app:v1.2.3 \
  --certificate-identity=build@myorg.com \
  --certificate-oidc-issuer=https://accounts.google.com
```

Keyless signing means no private keys to manage. You authenticate with your identity provider (GitHub, Google, Microsoft), and Sigstore issues a short-lived certificate. The signature is recorded in a public transparency log (Rekor).

## CI/CD Integration

Sign images automatically in your pipeline:

```yaml
# GitHub Actions
jobs:
  build-and-sign:
    permissions:
      id-token: write  # Required for keyless signing
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Build and push
        run: |
          docker build -t ghcr.io/myorg/my-app:${{ github.sha }} .
          docker push ghcr.io/myorg/my-app:${{ github.sha }}

      - name: Sign image
        uses: sigstore/cosign-installer@v3
      - run: cosign sign ghcr.io/myorg/my-app:${{ github.sha }}
        env:
          COSIGN_EXPERIMENTAL: 1
```

Every image pushed from CI is automatically signed with the GitHub Actions identity.

## Kubernetes Admission Control

Enforce that only signed images run in your cluster:

```yaml
# Kyverno policy
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
                    subject: "build@myorg.com"
                    issuer: "https://accounts.google.com"
```

Unsigned or incorrectly signed images are rejected at admission. No unsigned code runs in production.

## Software Bill of Materials (SBOM)

Attach an SBOM to your signed image:

```bash
# Generate SBOM
syft ghcr.io/myorg/my-app:v1.2.3 -o spdx-json > sbom.json

# Attach SBOM as an attestation
cosign attest --predicate sbom.json \
  --type spdxjson \
  ghcr.io/myorg/my-app:v1.2.3

# Verify the attestation
cosign verify-attestation \
  --type spdxjson \
  ghcr.io/myorg/my-app:v1.2.3
```

Now your image carries a cryptographically signed inventory of every dependency it contains.

## Rekor: Transparency Log

Every Sigstore signature is recorded in Rekor, a public, append-only transparency log. You can search it:

```bash
# Search for signatures by image
rekor-cli search --sha $(cosign triangulate ghcr.io/myorg/my-app:v1.2.3)

# Get entry details
rekor-cli get --uuid <entry-uuid>
```

If someone signs a malicious image, the signature is publicly recorded and auditable. This is the same concept as Certificate Transparency for TLS certificates.

## Supply Chain Trust Model

```
Source Code → CI Build → Sign with Cosign → Push to Registry
                                    ↓
                              Rekor (public log)
                                    ↓
Kubernetes → Admission Controller → Verify Signature → Allow/Deny
```

Every step is verifiable. Every artifact is signed. Every signature is logged.

---

Ready to go deeper? Master container security with hands-on courses at [CopyPasteLearn](/courses).
