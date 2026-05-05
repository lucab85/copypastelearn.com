---
title: "FinOps for Engineers Practical Guide"
date: "2026-04-09"
description: "FinOps is not just for finance teams. Learn how engineers can reduce cloud costs with resource tagging, right-sizing, committed use discounts, and automated cost governance."
category: "DevOps"
tags: ["finops", "cloud-costs", "AWS", "cost-optimization", "DevOps", "engineering"]
author: "Luca Berton"
---

Your cloud bill is an engineering problem. Finance can negotiate contracts, but only engineers can fix the over-provisioned RDS instance that costs $400/month and uses 3% CPU.

## The Engineer's Role in FinOps

FinOps (Financial Operations) is the practice of managing cloud costs collaboratively. The framework has three phases: Inform, Optimize, Operate. Engineers are central to all three.

### Inform: See What You Spend

You cannot optimize what you cannot measure. Start with resource tagging:

```bash
# Tag every resource with team, environment, and service
aws ec2 create-tags --resources i-1234567890 \
  --tags Key=team,Value=commerce \
         Key=environment,Value=production \
         Key=service,Value=order-api
```

Enforce tagging with policy:

```hcl
# Terraform: require tags on all resources
variable "required_tags" {
  default = {
    team        = "must-be-set"
    environment = "must-be-set"
    service     = "must-be-set"
  }
}
```

Once everything is tagged, you can answer: "How much does the order service cost in production?" Without tags, you get: "How much does AWS cost?" — which is useless for optimization.

### Optimize: Fix the Waste

The top five cost wastes in most cloud accounts:

**1. Idle resources**

```bash
# Find EC2 instances with <5% CPU over 14 days
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --period 86400 \
  --statistics Average \
  --start-time $(date -d '14 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --dimensions Name=InstanceId,Value=i-1234567890
```

**2. Over-provisioned databases**

Most RDS instances are 2-4x larger than needed. Downsize based on actual CPU and connection count, not theoretical peak.

**3. Unattached storage**

```bash
# Find EBS volumes not attached to any instance
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[*].{ID:VolumeId,Size:Size,Created:CreateTime}'
```

**4. Non-production running 24/7**

Dev and staging environments running overnight and weekends cost 70% more than necessary.

**5. Missing committed use discounts**

If a workload has been running for 6+ months and will continue for another 12, Reserved Instances or Savings Plans save 30-60%.

### Operate: Sustain the Savings

Set up automated governance:

```yaml
# Monthly cost alert
Resources:
  CostAlert:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetName: team-commerce-monthly
        BudgetLimit:
          Amount: 5000
          Unit: USD
        TimeUnit: MONTHLY
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
          Subscribers:
            - SubscriptionType: EMAIL
              Address: commerce-team@company.com
```

## The Cost-Aware Engineering Checklist

Before deploying any new service:

1. **Right-size from day one** — start small, scale up based on data
2. **Set resource limits** — Kubernetes requests and limits prevent unbounded growth
3. **Use spot/preemptible for fault-tolerant workloads** — 60-90% savings
4. **Schedule non-production downtime** — stop dev environments nights and weekends
5. **Review monthly** — 15 minutes per month per service prevents cost drift

## Making It Stick

Add cost to your engineering reviews:

- Include monthly cost in PR descriptions for infrastructure changes
- Add cost dashboards to team standups
- Celebrate cost reductions like you celebrate feature launches

Cost awareness is not about spending less — it is about spending intentionally.

---

Ready to go deeper? Learn cloud infrastructure management with hands-on courses at [CopyPasteLearn](/courses).
