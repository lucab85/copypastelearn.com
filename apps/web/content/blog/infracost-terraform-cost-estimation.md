---
title: "Infracost Terraform Cost Estimation"
date: "2026-02-05"
description: "Infracost shows cloud cost estimates for Terraform changes before you apply. Learn how to add cost visibility to pull requests and catch expensive infrastructure changes early."
category: "DevOps"
tags: ["infracost", "terraform", "cost-estimation", "finops", "cloud-costs", "cicd"]
---

`terraform plan` shows what changes. It does not show what those changes cost. Infracost fills that gap by estimating monthly costs from your Terraform code before you apply.

## Quick Start

```bash
# Install
brew install infracost

# Register for free API key
infracost auth login

# Run cost estimate
cd terraform/
infracost breakdown --path .
```

```
Name                                     Monthly Qty  Unit         Monthly Cost
aws_instance.web
├─ Instance usage (t3.large)                     730  hours              $60.74
├─ root_block_device
│  └─ Storage (gp3)                               50  GB                 $4.00
└─ ebs_block_device[0]
   └─ Storage (gp3)                              200  GB                $16.00

aws_rds_db_instance.main
├─ Database instance (db.r6g.large)              730  hours             $131.40
├─ Storage (gp3)                                 100  GB                 $11.50
└─ Additional backup storage                      50  GB                 $0.95

aws_lb.main
├─ Application load balancer                     730  hours              $16.43
└─ Load balancer capacity units                    5  LCU               $36.50

OVERALL TOTAL                                                          $277.52
```

## Diff on Pull Requests

```bash
# Compare current branch vs main
infracost diff --path . --compare-to main
```

```
Monthly cost will increase by $180.00 (65%)

+ aws_instance.web
  + Instance changed from t3.medium to t3.xlarge     +$60.00
  + Storage increased from 50GB to 200GB              +$12.00

+ aws_rds_db_instance.main (new)
  + Database instance (db.r6g.large)                 +$131.40

~ aws_lb.main
  No cost change

Previous monthly cost: $277.52
New monthly cost:      $457.52
```

## GitHub Actions Integration

```yaml
jobs:
  infracost:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Infracost
        uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}

      - name: Generate cost estimate
        run: |
          infracost breakdown --path terraform/ \
            --format json --out-file /tmp/infracost.json

      - name: Post PR comment
        uses: infracost/actions/comment@v3
        with:
          path: /tmp/infracost.json
          behavior: update
```

The PR comment shows:

```markdown
## 💰 Infracost Cost Estimate

| Project | Previous | New | Diff |
|---------|----------|-----|------|
| terraform/production | $277/mo | $457/mo | +$180 (+65%) |

### Changed Resources
| Resource | Previous | New | Diff |
|----------|----------|-----|------|
| aws_instance.web | $65/mo | $125/mo | +$60 |
| aws_rds_db_instance.main | $0 | $132/mo | +$132 |
```

## Cost Policies

Set guardrails in CI:

```yaml
# infracost.yml
version: 0.1
projects:
  - path: terraform/
    usage_file: infracost-usage.yml

policies:
  - name: monthly-cost-limit
    description: "Total monthly cost must stay under $5,000"
    resource_type: "*"
    condition:
      totalMonthlyCost: { lt: 5000 }
```

```bash
# Fail CI if cost exceeds threshold
infracost breakdown --path . --format json | \
  jq -e '.totalMonthlyCost | tonumber < 5000' || exit 1
```

## Usage Estimates

Some costs depend on usage (data transfer, API calls):

```yaml
# infracost-usage.yml
version: 0.1
resource_usage:
  aws_lambda_function.api:
    monthly_requests: 1000000
    request_duration_ms: 200

  aws_s3_bucket.data:
    monthly_storage_gb: 500
    monthly_get_requests: 100000
    monthly_put_requests: 10000

  aws_nat_gateway.main:
    monthly_data_processed_gb: 100
```

Without usage estimates, Infracost shows $0 for usage-based resources. Add estimates for realistic projections.

## Multi-Project

```bash
# Estimate across all Terraform roots
infracost breakdown \
  --path terraform/vpc \
  --path terraform/eks \
  --path terraform/rds \
  --format table
```

## Supported Providers

| Provider | Resources |
|----------|-----------|
| AWS | 250+ resource types |
| Azure | 150+ resource types |
| GCP | 100+ resource types |

Covers EC2, RDS, EKS, Lambda, S3, CloudFront, ALB, NAT Gateway, and most commonly used services.

## Infracost vs Manual Estimation

Manual cost estimation is error-prone:
- Forgot data transfer costs
- Wrong instance pricing tier
- Missed storage costs
- Did not account for multi-AZ

Infracost reads your Terraform directly. If the code says `multi_az = true`, Infracost doubles the RDS cost. No human estimation errors.

---

Ready to go deeper? Master Terraform cost management with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
