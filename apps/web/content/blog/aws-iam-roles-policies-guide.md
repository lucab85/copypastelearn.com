---
title: "AWS IAM Roles and Policies Guide"
slug: "aws-iam-roles-policies-guide"
date: "2026-03-06"
category: "DevOps"
tags: ["AWS", "IAM", "Security", "cloud", "DevOps"]
excerpt: "Understand AWS IAM roles, policies, and best practices. Least privilege, role assumption, service roles, and Terraform IAM automation."
description: "Understand AWS IAM roles, policies, and best practices for secure cloud access. Least privilege principles, role assumption, and Terraform IAM automation patterns."
author: "Luca Berton"
---

IAM (Identity and Access Management) controls who can do what in AWS. Getting it wrong means either security breaches or blocked deployments. This guide covers what DevOps engineers need.

## Core Concepts

| Concept | What It Is | Example |
|---|---|---|
| **User** | A person or application | `alice`, `ci-bot` |
| **Group** | Collection of users | `developers`, `admins` |
| **Role** | Temporary credentials for services/users | `ec2-s3-access`, `lambda-execution` |
| **Policy** | JSON document defining permissions | Allow S3 read on specific bucket |

**Rule of thumb**: Use roles, not users. Users are for humans; roles are for everything else.

## Policy Structure

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Read",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    }
  ]
}
```

| Field | Purpose |
|---|---|
| `Effect` | `Allow` or `Deny` |
| `Action` | AWS API actions (e.g., `s3:GetObject`) |
| `Resource` | ARNs of resources this applies to |
| `Condition` | Optional: IP, time, MFA, tags |

## Least Privilege Principle

Start with zero permissions, add only what is needed:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ],
      "Resource": "arn:aws:ecr:eu-west-1:123456789:repository/my-app"
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    }
  ]
}
```

This CI role can only pull images from one specific ECR repository.

## Common Role Patterns

### EC2 Instance Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::app-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:eu-west-1:123456789:secret:app/*"
    }
  ]
}
```

### CI/CD Role (GitHub Actions OIDC)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "arn:aws:eks:eu-west-1:123456789:cluster/production"
    }
  ]
}
```

Trust policy (allow GitHub Actions to assume the role):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

## Terraform IAM

```hcl
# Role
resource "aws_iam_role" "app" {
  name = "app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

# Policy
resource "aws_iam_role_policy" "app_s3" {
  name = "app-s3-access"
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject"]
      Resource = "${aws_s3_bucket.assets.arn}/*"
    }]
  })
}

# Instance profile
resource "aws_iam_instance_profile" "app" {
  name = "app-profile"
  role = aws_iam_role.app.name
}
```

## IAM Best Practices

| Practice | Why |
|---|---|
| Use roles, not access keys | Keys can leak; roles are temporary |
| Enable MFA for humans | Prevents credential theft |
| Use OIDC for CI/CD | No long-lived credentials |
| Tag everything | Track who created what |
| Review with IAM Access Analyzer | Find overly permissive policies |
| Use permission boundaries | Limit what roles can grant |
| Separate accounts per environment | Blast radius reduction |

## Debugging IAM

```bash
# Who am I?
aws sts get-caller-identity

# Simulate a policy
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789:role/app-role \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::my-bucket/file.txt

# Check recent access
aws iam generate-service-last-accessed-details \
  --arn arn:aws:iam::123456789:role/app-role
```

## What's Next?

Our **Terraform for Beginners** course covers AWS IAM automation with Terraform across 15 hands-on lessons. First lesson is free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

