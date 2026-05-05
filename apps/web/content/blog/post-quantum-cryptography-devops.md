---
title: "Post-Quantum Cryptography Guide"
slug: "post-quantum-cryptography-devops"
date: "2025-12-30"
author: "Luca Berton"
description: "Prepare your infrastructure for quantum computing threats with post-quantum cryptography migration strategies and practical implementation steps."
category: "DevOps"
tags: ["post-quantum", "cryptography", "Security", "pqc", "tls"]
---

Quantum computers will eventually break RSA and ECC encryption. Post-quantum cryptography (PQC) provides quantum-resistant alternatives. The migration has already begun.

## Why Act Now?

The threat model is "harvest now, decrypt later" — adversaries collect encrypted data today, planning to decrypt it once quantum computers are powerful enough. If your data has a long shelf life, you need PQC now.

NIST finalized its first PQC standards in 2024:

- **ML-KEM** (Kyber) — key encapsulation
- **ML-DSA** (Dilithium) — digital signatures
- **SLH-DSA** (SPHINCS+) — stateless hash-based signatures

## Hybrid PQC/TLS Deployment

The safest migration path uses hybrid mode — combining classical and post-quantum algorithms:

```nginx
# Nginx configuration for hybrid TLS
ssl_protocols TLSv1.3;
ssl_ecdh_curve X25519Kyber768Draft00:X25519:P-256;
ssl_prefer_server_ciphers on;
```

This ensures security even if one algorithm is compromised.

## Infrastructure Migration Checklist

1. **Inventory all cryptographic usage** — TLS certificates, SSH keys, API tokens, database encryption, secrets management
2. **Classify data by sensitivity and lifespan** — Healthcare records, financial data, and government secrets need PQC first
3. **Update TLS libraries** — OpenSSL 3.x and BoringSSL support PQC algorithms
4. **Test performance impact** — PQC key sizes are larger, affecting handshake times
5. **Migrate certificates** — Start with internal services, then external-facing
6. **Update key management** — KMS and HSM systems need PQC support
7. **Audit CI/CD pipelines** — Ensure build and deploy processes use PQC-safe crypto

## Performance Considerations

PQC algorithms have different performance characteristics:

| Algorithm | Key Size | Signature Size | Speed |
|-----------|----------|----------------|-------|
| RSA-2048 | 256 B | 256 B | Baseline |
| ML-KEM-768 | 1,184 B | 1,088 B | ~2x faster keygen |
| ML-DSA-65 | 1,952 B | 3,293 B | ~5x faster signing |
| SLH-DSA-128s | 32 B | 7,856 B | Slower, conservative |

Larger key and signature sizes increase bandwidth and storage requirements. Plan for 2-5x larger TLS handshakes.

## Kubernetes and PQC

For Kubernetes clusters, focus on:

- **etcd encryption**: Rotate encryption keys to PQC-safe algorithms
- **Service mesh TLS**: Update Istio/Linkerd CA certificates
- **Secrets management**: Ensure Vault or KMS supports PQC
- **Container image signing**: Update Sigstore/cosign to PQC signatures

## Cloud Provider PQC Support (2026)

- **AWS**: KMS supports ML-KEM, S3 hybrid encryption available
- **GCP**: Cloud KMS PQC preview, Certificate Authority Service with hybrid certs
- **Azure**: Key Vault PQC preview, hybrid TLS on Application Gateway

## FAQ

**When will quantum computers break current encryption?**
Estimates range from 2030 to 2040+. The exact timeline is uncertain, which is why migration should start now.

**Can I just switch to PQC overnight?**
No. PQC migration is a multi-year process. Start with inventory and hybrid deployments.

**Does PQC affect application performance?**
Slightly. Larger keys increase TLS handshake time by 10-30ms. For most applications, this is negligible.

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
