---
title: "Packer Machine Image Automation"
date: "2026-02-25"
description: "Packer automates machine image creation for AWS AMIs, Azure images, Docker, and Vagrant. Learn how to build immutable infrastructure images with Packer and integrate them into your CI/CD pipeline."
category: "DevOps"
tags: ["packer", "machine-images", "ami", "immutable-infrastructure", "hashicorp", "Automation"]
author: "Luca Berton"
---

Configuring servers after launch is slow and fragile. Packer builds pre-configured machine images so every server starts ready to serve traffic. No Chef runs, no Ansible pulls, no 10-minute bootstrap scripts.

## How Packer Works

```
Source Image → Packer Builds VM → Runs Provisioners → Creates Machine Image
(Ubuntu 22.04)   (temporary)     (install software)    (AMI, Azure Image)
```

The resulting image is immutable. Every server launched from it is identical.

## HCL Configuration

```hcl
# web-server.pkr.hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.3.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "web" {
  ami_name      = "web-server-{{timestamp}}"
  instance_type = "t3.medium"
  region        = "eu-west-1"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]  # Canonical
  }
  
  ssh_username = "ubuntu"
}

build {
  sources = ["source.amazon-ebs.web"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nginx nodejs npm",
      "sudo systemctl enable nginx",
    ]
  }

  provisioner "file" {
    source      = "nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf",
      "sudo nginx -t",
    ]
  }
}
```

```bash
packer init .
packer build web-server.pkr.hcl
# ==> Builds finished: ami-0123456789abcdef0
```

## Multi-Platform Builds

Build for multiple platforms from one config:

```hcl
source "amazon-ebs" "web" {
  ami_name = "web-server-{{timestamp}}"
  # ... AWS config
}

source "azure-arm" "web" {
  managed_image_name = "web-server-{{timestamp}}"
  # ... Azure config
}

source "docker" "web" {
  image  = "ubuntu:22.04"
  commit = true
}

build {
  sources = [
    "source.amazon-ebs.web",
    "source.azure-arm.web",
    "source.docker.web",
  ]

  provisioner "shell" {
    inline = [
      "apt-get update && apt-get install -y nginx",
    ]
  }
}
```

One build produces an AMI, an Azure image, and a Docker image — all identical.

## Ansible Provisioner

For complex configuration, use Ansible instead of shell scripts:

```hcl
provisioner "ansible" {
  playbook_file = "ansible/web-server.yml"
  extra_arguments = [
    "--extra-vars", "env=production",
  ]
}
```

```yaml
# ansible/web-server.yml
- hosts: all
  become: true
  roles:
    - common
    - nginx
    - node-exporter
    - security-hardening
```

## CI/CD Integration

```yaml
# GitHub Actions
jobs:
  build-ami:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Packer
        uses: hashicorp/setup-packer@main
      
      - name: Init
        run: packer init .
      
      - name: Validate
        run: packer validate .
      
      - name: Build
        run: packer build -var "version=${{ github.sha }}" .
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

Merge to main → Packer builds a new AMI → Terraform references the latest AMI → Deploy.

## Variables and Data Sources

```hcl
variable "app_version" {
  type    = string
  default = "latest"
}

data "amazon-ami" "base" {
  filters = {
    name = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-*"
  }
  most_recent = true
  owners      = ["099720109477"]
}

source "amazon-ebs" "web" {
  source_ami = data.amazon-ami.base.id
  # ...
}
```

## Packer vs Alternatives

| Approach | Speed | Consistency | Drift |
|----------|-------|------------|-------|
| Packer (immutable) | Fast launch | Perfect | None |
| Ansible (mutable) | Slow (converge) | Good | Possible |
| Cloud-init | Medium | Good | Possible |
| Manual | Slow | Poor | Guaranteed |

**Use Packer** for production servers that need to launch fast and be identical. **Use Ansible** for configuration that changes frequently and cannot be baked into images. Many teams use both: Packer for the base image, Ansible for the provisioner.

---

Ready to go deeper? Master infrastructure automation with hands-on courses at [CopyPasteLearn](/courses/terraform-beginners).
