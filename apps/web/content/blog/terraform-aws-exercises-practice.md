---
title: "Terraform AWS Exercises for Practice"
slug: "terraform-aws-exercises-practice"
date: "2026-04-09"
category: "DevOps"
tags: ["Terraform", "AWS", "IaC", "Practice", "Exercises"]
excerpt: "Hands-on Terraform AWS exercises from beginner to advanced. Practice provisioning EC2, S3, VPC, RDS, and more with real infrastructure."
description: "Hands-on Terraform AWS exercises from beginner to advanced. Practice EC2, S3, VPC, RDS provisioning with real infrastructure."
author: "Luca Berton"
---

The best way to learn Terraform is by building real AWS infrastructure. These exercises progress from basic to advanced, each teaching a core Terraform concept.

## Prerequisites

- AWS free tier account
- Terraform installed (`brew install terraform` or [download](https://developer.hashicorp.com/terraform/downloads))
- AWS CLI configured (`aws configure`)

## Exercise 1: Your First EC2 Instance

**Concepts**: Provider, resource, `terraform init`, `plan`, `apply`

Create `main.tf`:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_instance" "web" {
  ami           = "ami-0c1c30571d2dae5c9" # Amazon Linux 2023
  instance_type = "t3.micro"

  tags = {
    Name = "terraform-exercise-1"
  }
}
```

Run:

```bash
terraform init
terraform plan
terraform apply
terraform destroy   # Clean up!
```

**What you learn**: The basic Terraform workflow.

## Exercise 2: Variables and Outputs

**Concepts**: Input variables, outputs, `terraform.tfvars`

Create `variables.tf`:

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

Create `outputs.tf`:

```hcl
output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "instance_id" {
  description = "Instance ID"
  value       = aws_instance.web.id
}
```

Create `terraform.tfvars`:

```hcl
environment   = "dev"
instance_type = "t3.micro"
```

**What you learn**: Parameterize infrastructure for reuse across environments.

## Exercise 3: S3 Bucket with Versioning

**Concepts**: Multiple resources, resource dependencies, data sources

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-terraform-exercise-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

**What you learn**: Resource chaining and security best practices.

## Exercise 4: VPC from Scratch

**Concepts**: Networking, CIDR blocks, subnets, route tables

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "exercise-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-west-1a"
  map_public_ip_on_launch = true
  tags = { Name = "public-subnet" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "exercise-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

**What you learn**: AWS networking fundamentals through code.

## Exercise 5: Security Groups and SSH Access

**Concepts**: Security groups, ingress/egress rules, key pairs

```hcl
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow HTTP and SSH"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**What you learn**: Network security as code.

## Exercise 6: Remote State with S3 Backend

**Concepts**: State management, locking, team collaboration

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "exercises/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

Create the DynamoDB lock table:

```hcl
resource "aws_dynamodb_table" "locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**What you learn**: Production state management patterns.

## Exercise 7: Modules — Reusable VPC

**Concepts**: Module structure, inputs, outputs, composition

```
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
```

Call your module:

```hcl
module "vpc" {
  source      = "./modules/vpc"
  environment = "staging"
  cidr_block  = "10.1.0.0/16"
}

module "vpc_prod" {
  source      = "./modules/vpc"
  environment = "production"
  cidr_block  = "10.2.0.0/16"
}
```

**What you learn**: DRY infrastructure with reusable modules.

## Practice Tips

- **Always destroy resources** after exercises to avoid charges
- **Use `terraform plan`** before every apply — review changes carefully
- **Enable state locking** early — it prevents corruption
- **Tag everything** — makes cleanup and cost tracking easy
- **Start small** — one resource at a time, then compose

## What's Next?

Our **Terraform for Beginners** course provides 15 structured lessons with guided exercises, real AWS environments, and hands-on labs. The first lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

