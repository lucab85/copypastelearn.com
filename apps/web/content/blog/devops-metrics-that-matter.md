---
title: "DevOps Metrics That Matter"
date: "2026-04-15"
description: "Most DevOps dashboards track the wrong things. Learn which metrics actually predict engineering performance: DORA metrics, SLOs, and the metrics that drive behavior change."
category: "DevOps"
tags: ["DevOps", "metrics", "dora", "slo", "engineering-performance", "observability"]
author: "Luca Berton"
---

If your DevOps dashboard shows CPU utilization and deployment count but not change failure rate or lead time, you are measuring activity instead of outcomes.

## The DORA Four

The DORA (DevOps Research and Assessment) metrics are the best-validated predictors of software delivery performance:

### 1. Deployment Frequency

How often your team deploys to production.

- **Elite**: Multiple times per day
- **High**: Weekly to monthly
- **Medium**: Monthly to every six months
- **Low**: Fewer than once every six months

This measures your ability to ship small, low-risk changes.

### 2. Lead Time for Changes

Time from commit to production.

- **Elite**: Less than one hour
- **High**: One day to one week
- **Low**: More than six months

Long lead times mean large batches, which mean higher risk per deployment.

### 3. Change Failure Rate

Percentage of deployments that cause a failure in production.

- **Elite**: 0-5%
- **High**: 5-10%
- **Low**: 46-60%

This measures the quality of your delivery pipeline. Low failure rates come from good testing, progressive delivery, and small changes.

### 4. Mean Time to Recovery (MTTR)

How quickly you restore service after an incident.

- **Elite**: Less than one hour
- **High**: Less than one day
- **Low**: More than six months

MTTR matters more than preventing all failures. Systems fail. Recovery speed determines impact.

## SLOs Over SLAs

SLAs are contracts with customers. SLOs are internal targets that give you a buffer before you breach an SLA.

```
SLA: 99.9% availability (8.76 hours downtime/year)
SLO: 99.95% availability (4.38 hours downtime/year)
Error budget: 4.38 hours of additional downtime before SLA breach
```

Error budgets make tradeoffs explicit. If you have consumed 80% of your error budget, slow down deployments and focus on reliability. If you have plenty of budget, ship faster.

## Metrics That Drive Bad Behavior

### Lines of Code

Measuring code output incentivizes verbose code. The best changes often delete lines.

### Number of Deployments

Without change failure rate, deployment count incentivizes pushing broken code frequently.

### Tickets Closed

Incentivizes splitting work into tiny tickets and closing trivial items.

### Uptime Percentage

Without context, 100% uptime means you are not deploying enough. Some downtime is the cost of progress.

## Metrics That Drive Good Behavior

| Metric | What It Drives |
|--------|---------------|
| Lead time for changes | Smaller PRs, faster reviews, better CI |
| Change failure rate | Better testing, progressive delivery |
| MTTR | Better monitoring, runbooks, automation |
| Error budget remaining | Balanced risk-taking |
| Developer satisfaction | Sustainable pace, good tooling |

## How to Start

1. **Instrument your CI/CD pipeline** — track commit timestamp, merge timestamp, deploy timestamp
2. **Tag deployments** — mark each production deployment with a unique identifier
3. **Track failures** — link incidents to the deployment that caused them
4. **Calculate weekly** — DORA metrics need consistency, not precision

Do not set targets initially. Measure for 3 months to establish a baseline. Then set improvement goals.

---

Ready to go deeper? Build observable infrastructure with hands-on courses at [CopyPasteLearn](/courses).
