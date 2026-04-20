---
title: "Data Sovereignty Infrastructure"
slug: "data-sovereignty-cloud-infrastructure"
date: "2025-12-27"
author: "Luca Berton"
description: "Implement data sovereignty with multi-region cloud infrastructure, GDPR compliance patterns, and geopatriation strategies for regulated workloads."
category: "DevOps"
tags: ["data sovereignty", "gdpr", "compliance", "multi-region", "cloud infrastructure"]
---

Data sovereignty requires that data is subject to the laws of the country where it's stored. With GDPR, DORA, and emerging AI regulations, this is no longer optional for many organizations.

## Why Data Sovereignty Matters in 2026

- **GDPR enforcement** is increasing — fines exceeded €4.5B cumulatively
- **DORA** (Digital Operational Resilience Act) requires EU financial data stay in EU
- **AI Act** classifies high-risk AI systems with strict data residency requirements
- **Schrems III** ruling expectations are tightening US-EU data transfers further
- **National security** concerns drive sovereign cloud adoption

## Architecture Patterns

### Pattern 1: Regional Isolation

Deploy separate infrastructure per jurisdiction:

```
EU Region (Frankfurt)          US Region (Virginia)
├── K8s Cluster (EU)           ├── K8s Cluster (US)
├── Database (EU)              ├── Database (US)
├── Object Storage (EU)        ├── Object Storage (US)
└── Secrets Manager (EU)       └── Secrets Manager (US)
```

### Pattern 2: Data Residency with Global Compute

Keep data local but allow compute to be global:

```yaml
# Kubernetes policy: pods accessing EU data must run in EU
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: eu-data-access
  namespace: production
spec:
  podSelector:
    matchLabels:
      data-region: eu
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          region: eu
```

### Pattern 3: Encryption-Based Sovereignty

Data can transit globally if encrypted with keys held in the sovereign jurisdiction:

- **Customer-managed keys** (BYOK) in the target country
- **External Key Manager** (EKM) outside the cloud provider
- **Key Access Justifications** — log and approve every key usage

## Terraform Multi-Region Compliance

```hcl
# Enforce data residency with Terraform
resource "aws_s3_bucket" "eu_data" {
  bucket = "company-eu-data"

  # Restrict to EU region
  provider = aws.eu-west-1
}

resource "aws_s3_bucket_policy" "eu_only" {
  bucket = aws_s3_bucket.eu_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyNonEUAccess"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = "${aws_s3_bucket.eu_data.arn}/*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = ["eu-west-1", "eu-central-1"]
        }
      }
    }]
  })
}
```

## Sovereign Cloud Options

| Provider | Offering | Key Feature |
|----------|----------|-------------|
| AWS | EU Sovereign Cloud | Separate EU control plane |
| Google | Sovereign Controls | T-Systems partnership (DE) |
| Azure | EU Data Boundary | EU-only operations staff |
| OVHcloud | SecNumCloud | French certification |
| IONOS | Sovereign Cloud | German data protection |

## Monitoring Compliance

Automate compliance checking:

- **AWS Config rules** for S3 bucket region checks
- **OPA/Gatekeeper** policies in Kubernetes for pod placement
- **Data flow mapping** tools to track cross-border transfers
- **Audit logs** proving data never left the jurisdiction

## FAQ

**Does data sovereignty mean I can't use US cloud providers?**
Not necessarily. AWS, Azure, and GCP all offer EU sovereign options with data residency guarantees and EU-based operations.

**How does data sovereignty affect performance?**
Regional data restrictions can increase latency for global users. Use CDN for static content and regional caches for dynamic data.

**What about backups and disaster recovery?**
DR regions must also comply with data residency requirements. Multi-region within the same jurisdiction is typical (e.g., eu-west-1 + eu-central-1).

---

## Ready to go deeper?

This article is part of a hands-on learning path. Continue building your skills with [our course catalog](/courses) on CopyPasteLearn.
