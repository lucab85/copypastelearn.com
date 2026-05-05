---
title: "Steampipe Cloud Infrastructure Queries"
date: "2026-02-08"
description: "Steampipe lets you query AWS, Azure, GCP, Kubernetes, and GitHub using SQL. Learn how to audit cloud resources, check compliance, and build dashboards with familiar SQL syntax."
category: "DevOps"
tags: ["steampipe", "cloud-security", "sql", "compliance", "AWS", "audit"]
author: "Luca Berton"
---

How many S3 buckets are publicly accessible? Which EC2 instances are running without tags? What IAM users have not rotated their keys in 90 days? Steampipe answers these questions with SQL.

## Quick Start

```bash
# Install
brew install turbot/tap/steampipe

# Install AWS plugin
steampipe plugin install aws

# Query
steampipe query "select name, region, versioning_status from aws_s3_bucket"
```

```
+-------------------+-----------+--------------------+
| name              | region    | versioning_status  |
+-------------------+-----------+--------------------+
| prod-backups      | eu-west-1 | Enabled            |
| staging-assets    | eu-west-1 | Suspended          |
| public-website    | us-east-1 | <null>             |
+-------------------+-----------+--------------------+
```

## Security Queries

### Public S3 Buckets

```sql
select
  name,
  region,
  acl ->> 'grants' as grants
from aws_s3_bucket
where bucket_policy_is_public = true;
```

### Unencrypted RDS Instances

```sql
select
  db_instance_identifier,
  engine,
  storage_encrypted
from aws_rds_db_instance
where storage_encrypted = false;
```

### Old IAM Access Keys

```sql
select
  user_name,
  access_key_id,
  create_date,
  age(now(), create_date) as key_age
from aws_iam_access_key
where create_date < now() - interval '90 days'
  and status = 'Active';
```

### Unused Security Groups

```sql
select
  group_id,
  group_name,
  vpc_id
from aws_vpc_security_group
where group_id not in (
  select distinct security_group_id
  from aws_ec2_network_interface
  cross join unnest(groups) as g(security_group_id)
);
```

## Multi-Cloud Queries

Install plugins for each provider:

```bash
steampipe plugin install aws azure gcp kubernetes github
```

### Resources Across Clouds

```sql
-- AWS instances
select 'AWS' as cloud, instance_id as id, instance_type as size, region
from aws_ec2_instance
where instance_state = 'running'

union all

-- Azure VMs
select 'Azure', id, size, location
from azure_compute_virtual_machine
where power_state = 'running'

union all

-- GCP instances  
select 'GCP', id::text, machine_type, zone
from gcp_compute_instance
where status = 'RUNNING';
```

One query, three clouds.

## Kubernetes Queries

```sql
-- Pods without resource limits
select
  namespace,
  name,
  c ->> 'name' as container_name
from kubernetes_pod,
  jsonb_array_elements(containers) as c
where c -> 'resources' -> 'limits' is null;

-- Deployments with latest tag
select
  namespace,
  name,
  c ->> 'image' as image
from kubernetes_deployment,
  jsonb_array_elements(template -> 'spec' -> 'containers') as c
where c ->> 'image' like '%:latest';
```

## Compliance Mods

Pre-built compliance checks:

```bash
# Install CIS AWS Benchmark
steampipe mod install github.com/turbot/steampipe-mod-aws-compliance

# Run CIS benchmark
steampipe check benchmark.cis_v300

# Results:
# CIS 1.1  Maintain current contact details .............. ALARM
# CIS 1.4  Ensure no root account access key exists ...... OK
# CIS 1.5  Ensure MFA enabled for root account ........... OK
# CIS 2.1.1 Ensure S3 bucket encryption .................. ALARM (3)
# CIS 2.1.2 Ensure S3 bucket logging .................... ALARM (5)
```

## Dashboards

```bash
steampipe mod install github.com/turbot/steampipe-mod-aws-insights
steampipe dashboard
# Opens browser with visual dashboards
```

Interactive dashboards showing resource inventories, cost allocation, security posture, and compliance status.

## Scheduled Audits

```bash
# Run weekly compliance check and output to JSON
steampipe check benchmark.cis_v300 --output json > audit-$(date +%Y%m%d).json

# Or use in CI
steampipe check benchmark.cis_v300 --output brief --export audit.csv
```

## When to Use Steampipe

**Good fit:**
- Ad-hoc cloud resource queries ("how many X do we have?")
- Compliance audits (CIS, SOC2, PCI)
- Multi-cloud visibility
- Security posture checks in CI/CD

**Not a replacement for:**
- Real-time monitoring (use Prometheus/CloudWatch)
- Alerting (use PagerDuty/OpsGenie)
- Cost management (use Kubecost/Infracost)

Steampipe is for questions, not monitoring. "What is the state right now?" — not "alert me when state changes."

---

Ready to go deeper? Master cloud security and compliance with hands-on courses at [CopyPasteLearn](/courses).
