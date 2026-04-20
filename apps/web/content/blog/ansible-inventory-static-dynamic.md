---
title: "Ansible Inventory: Static and Dynamic"
description: "Master Ansible inventory in INI and YAML formats. Learn host groups, variables, dynamic inventory plugins for AWS and Azure, and patterns for scaling automation."
date: "2026-04-13"
author: "Luca Berton"
category: "DevOps"
tags: ["Ansible", "Inventory", "Automation", "AWS", "DevOps"]
excerpt: "Master Ansible inventory: INI and YAML formats, groups, variables, and dynamic inventory with AWS and Azure plugins."
---

## Static Inventory (INI)

The simplest format:

```ini
[web]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[db]
db1 ansible_host=192.168.1.20

[web:vars]
ansible_user=ubuntu
http_port=80

[db:vars]
ansible_user=postgres
```

## YAML Format

More structured, better for complex setups:

```yaml
all:
  children:
    web:
      hosts:
        web1:
          ansible_host: 192.168.1.10
        web2:
          ansible_host: 192.168.1.11
      vars:
        ansible_user: ubuntu
        http_port: 80
    db:
      hosts:
        db1:
          ansible_host: 192.168.1.20
      vars:
        ansible_user: postgres
```

## Group Hierarchies

Nest groups for environment-based targeting:

```ini
[web_prod]
web-prod-1 ansible_host=10.0.1.10
web-prod-2 ansible_host=10.0.1.11

[web_staging]
web-stg-1 ansible_host=10.0.2.10

[db_prod]
db-prod-1 ansible_host=10.0.1.20

[prod:children]
web_prod
db_prod

[staging:children]
web_staging

[web:children]
web_prod
web_staging
```

Now you can target:
- `ansible-playbook site.yml -l prod` — all production
- `ansible-playbook site.yml -l web` — all web servers
- `ansible-playbook site.yml -l web_prod` — production web only

## Host and Group Variables

Store variables in files alongside your inventory:

```
inventory/
├── hosts.yml
├── group_vars/
│   ├── all.yml          # Applies to everything
│   ├── web.yml          # Web server vars
│   └── prod.yml         # Production vars
└── host_vars/
    └── web-prod-1.yml   # Specific host vars
```

**group_vars/all.yml:**

```yaml
ntp_server: time.google.com
dns_servers:
  - 8.8.8.8
  - 8.8.4.4
```

**group_vars/prod.yml:**

```yaml
monitoring_enabled: true
log_level: warn
```

## Dynamic Inventory — AWS

Auto-discover EC2 instances:

**aws_ec2.yml:**

```yaml
plugin: amazon.aws.aws_ec2
regions:
  - eu-west-1
filters:
  tag:Environment:
    - production
keyed_groups:
  - key: tags.Role
    prefix: role
  - key: placement.availability_zone
    prefix: az
compose:
  ansible_host: private_ip_address
```

```bash
# Test it
ansible-inventory -i aws_ec2.yml --list

# Use it
ansible-playbook -i aws_ec2.yml site.yml
```

## Dynamic Inventory — Azure

```yaml
plugin: azure.azcollection.azure_rm
auth_source: auto
include_vm_resource_groups:
  - my-resource-group
keyed_groups:
  - key: tags.environment | default('unknown')
    prefix: env
```

## Verify Your Inventory

```bash
# List all hosts
ansible-inventory -i inventory/ --list

# Graph view
ansible-inventory -i inventory/ --graph

# Test connectivity
ansible all -i inventory/ -m ping
```

## Best Practices

- **Use YAML** for complex inventories — more readable than INI
- **Use `group_vars/`** instead of inline variables
- **Use dynamic inventory** for cloud — manual host lists drift
- **Keep sensitive vars** in Ansible Vault encrypted files
- **Name groups meaningfully**: `web_prod` not `group1`

## Related Posts

- [Ansible Automation in Minutes](/blog/ansible-automation-beginners-guide) for getting started
- [Ansible Roles: Reusable Automation](/blog/ansible-roles-reusable-automation) for structuring playbooks
- [Ansible Vault: Encrypt Secrets](/blog/ansible-vault-encrypt-secrets) for securing variables

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

