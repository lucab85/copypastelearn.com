---
title: "Terraform AWS Provisioning Guide"
description: "Step-by-step guide to provisioning real AWS resources with Terraform — VPCs, EC2 instances, security groups, and S3 buckets."
date: "2026-02-22"
author: "Luca Berton"
category: "DevOps"
tags: ["Terraform", "AWS", "Provisioning"]
---

## Setting Up AWS Credentials

Before provisioning, configure AWS access:

```bash
# Option 1: Environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Option 2: AWS CLI profile
aws configure --profile terraform
```

```hcl
provider "aws" {
  region  = "eu-west-1"
  profile = "terraform"
}
```

## Creating a VPC

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "eu-west-1a"
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}
```

## Launching an EC2 Instance

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
    cidr_blocks = ["YOUR_IP/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]

  tags = {
    Name = "web-server"
  }
}
```

## Creating an S3 Bucket

```hcl
resource "aws_s3_bucket" "assets" {
  bucket = "myapp-assets-${random_id.bucket.hex}"
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "random_id" "bucket" {
  byte_length = 4
}
```

## Deploying

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Outputs

```hcl
output "web_public_ip" {
  value = aws_instance.web.public_ip
}

output "bucket_name" {
  value = aws_s3_bucket.assets.bucket
}
```

## Clean Up

```bash
terraform destroy
```

## Learn More

Deploy real AWS infrastructure hands-on in our [Terraform for Beginners course](/courses).

---

**Ready to go deeper?** Check out our hands-on course: [Terraform for Beginners](/courses/terraform-beginners) — practical exercises you can follow along on your own machine.

