---
title: "Ansible vs Terraform When to Use"
date: "2026-04-16"
description: "Ansible and Terraform solve different infrastructure problems. Learn when to use each, when to use both together, and how they complement each other in real-world DevOps workflows."
category: "DevOps"
tags: ["Ansible", "Terraform", "infrastructure-as-code", "configuration-management", "DevOps", "Automation"]
author: "Luca Berton"
---

Ansible and Terraform are not competitors. They solve different problems at different layers. Using the wrong tool for the job creates unnecessary complexity.

## The Core Difference

**Terraform** manages infrastructure state: what resources exist and how they are configured at the cloud/provider level.

**Ansible** manages machine state: what software is installed, what configuration files exist, and what services are running on a machine.

```
Terraform: "Create an EC2 instance with this AMI in this VPC"
Ansible:   "Install nginx, deploy the config, start the service"
```

## When to Use Terraform

Terraform excels at managing cloud resources through provider APIs:

- VPCs, subnets, security groups
- Compute instances, managed databases
- Load balancers, DNS records
- IAM roles, policies, service accounts
- Kubernetes clusters (the cluster itself, not what runs on it)

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-server"
  }
}
```

Terraform tracks state. It knows what exists and can plan changes before applying them. This is critical for infrastructure where accidental deletion is expensive.

## When to Use Ansible

Ansible excels at configuring machines after they exist:

- Installing and configuring packages
- Managing users, SSH keys, sudoers
- Deploying application code
- Running one-off operational tasks
- Patching and updating systems

```yaml
- name: Configure web server
  hosts: web_servers
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Deploy configuration
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: restart nginx
```

Ansible is agentless — it connects via SSH, does its work, and disconnects. No daemon to maintain on target hosts.

## When to Use Both Together

The most common pattern: Terraform provisions infrastructure, Ansible configures it.

```
1. Terraform creates EC2 instances
2. Terraform outputs instance IPs to a file
3. Ansible reads the inventory from that file
4. Ansible configures the instances
```

```hcl
# Terraform outputs for Ansible inventory
output "web_server_ips" {
  value = aws_instance.web[*].private_ip
}
```

```yaml
# Dynamic inventory from Terraform state
plugin: cloud.terraform.terraform_provider
```

This separation is clean: Terraform owns the "what exists" question, Ansible owns the "how it is configured" question.

## When They Overlap

Both tools can do some of the other's job:

- Ansible can create cloud resources (via cloud modules)
- Terraform can run provisioners to configure machines

In both cases, you are using the tool outside its strength. Ansible's cloud modules do not track state well. Terraform's provisioners are a last resort, not a configuration management system.

## Decision Matrix

| Task | Tool | Why |
|------|------|-----|
| Create a VPC | Terraform | State tracking, plan/apply |
| Install packages | Ansible | Agentless, idempotent modules |
| Manage DNS records | Terraform | Provider API, state |
| Deploy app config | Ansible | Templates, handlers |
| Create K8s cluster | Terraform | Provider API, dependencies |
| Configure K8s workloads | Neither (use Helm/Kustomize) | Purpose-built tools |
| Rotate secrets | Ansible | Ad-hoc task execution |
| Manage IAM | Terraform | State, audit trail |

Use the right tool for each layer. Your infrastructure will be simpler and more maintainable.

---

Ready to go deeper? Learn both tools hands-on: [Ansible Quickstart](/courses/ansible-quickstart) and [Terraform for Beginners](/courses/terraform-beginners) at CopyPasteLearn.
