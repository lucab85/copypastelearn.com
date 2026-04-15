---
title: "Confidential Computing Explained"
slug: "confidential-computing-devops"
date: "2025-12-28"
author: "Luca Berton"
description: "Understand confidential computing with TEEs, secure enclaves, and practical deployment patterns for protecting sensitive workloads in cloud environments."
category: "DevOps"
tags: ["confidential computing", "tee", "secure enclaves", "cloud security", "data protection"]
---

Confidential computing protects data while it's being processed — the last gap in data security. Data at rest and in transit are well-solved; data in use has been the weak link.

## How It Works

Confidential computing uses hardware-based Trusted Execution Environments (TEEs):

- **Intel SGX/TDX** — Hardware enclaves with encrypted memory
- **AMD SEV-SNP** — Full VM encryption with integrity protection
- **ARM CCA** — Confidential Compute Architecture for Arm processors
- **NVIDIA H100 TEE** — GPU confidential computing for AI workloads

The CPU encrypts memory so that even the hypervisor, host OS, and cloud provider cannot read it.

## Use Cases

- **Multi-party computation** — Multiple organizations process shared data without revealing their inputs
- **Regulated workloads** — Healthcare, finance, and government data with strict compliance requirements
- **AI model protection** — Protect proprietary model weights during inference
- **Key management** — HSM-grade key protection without dedicated hardware
- **Secure analytics** — Process sensitive datasets without exposing raw data

## Deploying Confidential VMs

All major cloud providers offer confidential computing:

```bash
# Azure confidential VM
az vm create \
  --name secure-workload \
  --image UbuntuServer2404 \
  --security-type ConfidentialVM \
  --os-disk-security-encryption-type VMGuestStateOnly \
  --size Standard_DC4as_v5

# GCP confidential VM
gcloud compute instances create secure-workload \
  --machine-type=n2d-standard-4 \
  --confidential-compute \
  --maintenance-policy=TERMINATE

# AWS Nitro Enclaves
aws ec2 run-instances \
  --instance-type m5.xlarge \
  --enclave-options Enabled=true
```

## Kubernetes + Confidential Computing

Run confidential containers in Kubernetes with projects like Confidential Containers (CoCo):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: confidential-workload
spec:
  runtimeClassName: kata-cc
  containers:
  - name: secure-app
    image: registry.example.com/secure-app:latest
    resources:
      limits:
        memory: "4Gi"
```

Key components:

- **Kata Containers** with TEE support for pod isolation
- **Remote attestation** to verify the enclave before sending secrets
- **Encrypted container images** that decrypt only inside the TEE
- **Sealed secrets** bound to specific enclave measurements

## Attestation Flow

Remote attestation proves the workload runs in a genuine TEE:

1. Workload generates an attestation report (hardware-signed)
2. Report includes measurement of loaded code
3. Verifier checks report against expected measurements
4. If valid, secrets are released to the enclave
5. All processing happens inside the TEE

## Performance Impact

Confidential computing adds overhead:

- **CPU**: 2-15% overhead depending on workload
- **Memory**: TEE memory limits (SGX: 256MB-1TB, SEV: full VM)
- **I/O**: Encryption/decryption adds latency to memory access
- **GPU**: NVIDIA H100 CC mode adds ~5% overhead for AI inference

## FAQ

**Does my cloud provider have access to my data with confidential computing?**
No. The hardware encrypts memory with keys the provider cannot access. This is verified through remote attestation.

**Is confidential computing production-ready?**
Yes. Azure, GCP, and AWS all offer GA confidential VM options. Kubernetes support is maturing rapidly.

**When should I use confidential computing vs. standard encryption?**
When you need to protect data during processing, not just at rest and in transit. Required for multi-party computation and strict compliance scenarios.
