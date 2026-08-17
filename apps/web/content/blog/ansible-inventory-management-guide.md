---
title: "Ansible Inventory Management Guide"
slug: "ansible-inventory-management-guide"
date: "2026-02-23"
category: "DevOps"
tags: ["Ansible", "Inventory", "Automation", "DevOps", "Configuration"]
excerpt: "Master Ansible inventory management. Static and dynamic inventories, groups, variables, patterns, and cloud provider integration."
description: "Master Ansible inventory management with static and dynamic inventories, host groups, variables, patterns, and seamless cloud provider integration."
author: "Luca Berton"
---

Ansible inventory defines which hosts you manage and how to connect to them. It is the foundation of every Ansible deployment.

## Static Inventory

### INI Format

```ini
# inventory/hosts.ini

[webservers]
web1.example.com
web2.example.com
web3.example.com ansible_port=2222

[dbservers]
db1.example.com
db2.example.com

[loadbalancers]
lb1.example.com

[production:children]
webservers
dbservers
loadbalancers

[production:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/deploy_key
```

### YAML Format (Preferred)

```yaml
# inventory/hosts.yml
all:
  children:
    production:
      children:
        webservers:
          hosts:
            web1.example.com:
            web2.example.com:
            web3.example.com:
              ansible_port: 2222
          vars:
            http_port: 80
            app_env: production

        dbservers:
          hosts:
            db1.example.com:
              postgresql_max_connections: 200
            db2.example.com:
              postgresql_max_connections: 100
          vars:
            db_port: 5432

        loadbalancers:
          hosts:
            lb1.example.com:

      vars:
        ansible_user: deploy
        ansible_ssh_private_key_file: ~/.ssh/deploy_key
```

## Host and Group Variables

### Directory Structure

```
inventory/
  hosts.yml
  group_vars/
    all.yml           # Variables for all hosts
    webservers.yml    # Variables for webservers group
    dbservers.yml     # Variables for dbservers group
    production.yml    # Variables for production group
  host_vars/
    web1.example.com.yml   # Variables for specific host
    db1.example.com.yml
```

### group_vars/all.yml

```yaml
---
ntp_servers:
  - 0.pool.ntp.org
  - 1.pool.ntp.org
timezone: Europe/Rome
admin_email: ops@example.com
```

### group_vars/webservers.yml

```yaml
---
http_port: 80
https_port: 443
document_root: /var/www/html
nginx_worker_processes: auto
```

### host_vars/web1.example.com.yml

```yaml
---
# This host has extra memory, can handle more connections
nginx_worker_connections: 4096
ssl_certificate: /etc/ssl/certs/web1.pem
```

## Variable Precedence

From lowest to highest:

1. `group_vars/all`
2. `group_vars/<group>`
3. `host_vars/<host>`
4. Playbook `vars:`
5. Playbook `vars_files:`
6. Task `vars:`
7. Extra vars (`-e`) — **highest priority**

```bash
# Override any variable at runtime
ansible-playbook site.yml -e "http_port=8080"
```

## Dynamic Inventory

### AWS EC2

```yaml
# inventory/aws_ec2.yml
plugin: aws_ec2
regions:
  - eu-west-1
filters:
  tag:Environment:
    - production
  instance-state-name: running
keyed_groups:
  - key: tags.Role
    prefix: role
  - key: placement.availability_zone
    prefix: az
compose:
  ansible_host: private_ip_address
```

```bash
# List discovered hosts
ansible-inventory -i inventory/aws_ec2.yml --list

# Use in playbook
ansible-playbook -i inventory/aws_ec2.yml site.yml
```

### Custom Script

```python
#!/usr/bin/env python3
# inventory/custom_inventory.py
import json
import requests

def get_inventory():
    # Fetch from your CMDB, API, or database
    hosts = requests.get("https://cmdb.internal/api/hosts").json()

    inventory = {
        "webservers": {
            "hosts": [h["fqdn"] for h in hosts if h["role"] == "web"],
            "vars": {"http_port": 80}
        },
        "dbservers": {
            "hosts": [h["fqdn"] for h in hosts if h["role"] == "db"],
        },
        "_meta": {
            "hostvars": {
                h["fqdn"]: {"ansible_host": h["ip"]}
                for h in hosts
            }
        }
    }
    return inventory

if __name__ == "__main__":
    print(json.dumps(get_inventory(), indent=2))
```

```bash
chmod +x inventory/custom_inventory.py
ansible-playbook -i inventory/custom_inventory.py site.yml
```

## Inventory Patterns

Target specific hosts in commands:

```bash
# All hosts
ansible all -m ping

# Specific group
ansible webservers -m ping

# Multiple groups
ansible 'webservers:dbservers' -m ping

# Intersection (hosts in BOTH groups)
ansible 'webservers:&production' -m ping

# Exclusion
ansible 'all:!loadbalancers' -m ping

# Pattern matching
ansible 'web*.example.com' -m ping

# Regex
ansible '~web[0-9]+\.example\.com' -m ping

# First host in group
ansible 'webservers[0]' -m ping

# Range
ansible 'webservers[0:2]' -m ping
```

## Multi-Environment Setup

```
inventory/
  production/
    hosts.yml
    group_vars/
      all.yml       # production-specific defaults
  staging/
    hosts.yml
    group_vars/
      all.yml       # staging-specific defaults
  development/
    hosts.yml
    group_vars/
      all.yml       # dev-specific defaults
```

```bash
ansible-playbook -i inventory/staging site.yml
ansible-playbook -i inventory/production site.yml
```

## Debugging Inventory

```bash
# List all hosts
ansible-inventory -i inventory/ --list

# Show specific host variables
ansible-inventory -i inventory/ --host web1.example.com

# Graph view
ansible-inventory -i inventory/ --graph

# Test connectivity
ansible all -i inventory/ -m ping
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers inventory management with hands-on labs. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Ansible Inventory Management Guide as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Ansible, Inventory, Automation, DevOps. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Ansible Inventory Management Guide?

Use it when you need a practical, repeatable way to handle Ansible, Inventory, Automation, DevOps work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

