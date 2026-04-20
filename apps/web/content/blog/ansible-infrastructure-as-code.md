---
title: "Ansible Infrastructure as Code Guide"
slug: "ansible-infrastructure-as-code"
date: "2026-04-06"
category: "DevOps"
tags: ["Ansible", "IaC", "Infrastructure as Code", "Automation", "DevOps"]
excerpt: "Use Ansible as your Infrastructure as Code tool. Learn how Ansible playbooks define, version, and automate your entire infrastructure."
description: "Use Ansible as your Infrastructure as Code tool. Learn how playbooks define, version, and automate your entire infrastructure."
---

Infrastructure as Code (IaC) means managing servers, networks, and services through code instead of manual configuration. Ansible is one of the most accessible ways to start with IaC.

## Ansible vs Other IaC Tools

| Feature | Ansible | Terraform | CloudFormation |
|---|---|---|---|
| **Approach** | Procedural | Declarative | Declarative |
| **Agent** | Agentless (SSH) | Agentless (API) | Agentless (API) |
| **Language** | YAML | HCL | JSON/YAML |
| **Best for** | Configuration | Provisioning | AWS only |
| **Learning curve** | Low | Medium | Medium |
| **State file** | No | Yes | Managed |

**Key insight**: Ansible and Terraform are complementary. Use Terraform to **provision** infrastructure (create VMs, networks, databases) and Ansible to **configure** it (install software, deploy apps, manage services).

## IaC with Ansible Playbooks

A playbook is your infrastructure definition:

```yaml
---
- name: Configure web server fleet
  hosts: webservers
  become: true
  vars:
    app_port: 8080
    node_version: "22"

  tasks:
    - name: Update system packages
      apt:
        upgrade: dist
        update_cache: true
        cache_valid_time: 3600

    - name: Install required packages
      apt:
        name:
          - nginx
          - certbot
          - python3-certbot-nginx
        state: present

    - name: Deploy Nginx configuration
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/default
      notify: Reload Nginx

    - name: Enable and start Nginx
      service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Reload Nginx
      service:
        name: nginx
        state: reloaded
```

This playbook is:
- **Version controlled** in Git
- **Repeatable** across any number of servers
- **Idempotent** — safe to run multiple times
- **Self-documenting** — readable YAML

## Structuring IaC Projects

Organize your infrastructure code:

```
infrastructure/
  inventory/
    production.yml
    staging.yml
  group_vars/
    webservers.yml
    dbservers.yml
  roles/
    common/
    nginx/
    postgresql/
    monitoring/
  playbooks/
    site.yml
    deploy.yml
    backup.yml
  ansible.cfg
```

## Roles as Reusable Modules

Roles are the building blocks of Ansible IaC:

```bash
ansible-galaxy init roles/nginx
```

`roles/nginx/tasks/main.yml`:

```yaml
---
- name: Install Nginx
  apt:
    name: nginx
    state: present
  when: ansible_os_family == "Debian"

- name: Deploy configuration
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Restart Nginx

- name: Ensure Nginx is running
  service:
    name: nginx
    state: started
    enabled: true
```

Use roles in your main playbook:

```yaml
---
- name: Full infrastructure setup
  hosts: all
  become: true
  roles:
    - common
    - { role: nginx, when: "'webservers' in group_names" }
    - { role: postgresql, when: "'dbservers' in group_names" }
    - monitoring
```

## Environment Management

Use inventory files per environment:

`inventory/production.yml`:

```yaml
all:
  children:
    webservers:
      hosts:
        web1.prod.example.com:
        web2.prod.example.com:
    dbservers:
      hosts:
        db1.prod.example.com:
          postgresql_max_connections: 200
```

`inventory/staging.yml`:

```yaml
all:
  children:
    webservers:
      hosts:
        web1.staging.example.com:
    dbservers:
      hosts:
        db1.staging.example.com:
          postgresql_max_connections: 50
```

Deploy to staging:

```bash
ansible-playbook -i inventory/staging.yml playbooks/site.yml
```

Deploy to production:

```bash
ansible-playbook -i inventory/production.yml playbooks/site.yml
```

Same code, different environments.

## Secrets Management

Use Ansible Vault for sensitive data:

```bash
# Create encrypted variables
ansible-vault create group_vars/dbservers/vault.yml
```

```yaml
vault_db_password: "supersecret123"
vault_api_key: "ak_live_abc123"
```

Reference in playbooks:

```yaml
- name: Configure database
  postgresql_user:
    name: app
    password: "{{ vault_db_password }}"
```

Run with vault:

```bash
ansible-playbook site.yml --ask-vault-pass
```

## CI/CD Integration

Add Ansible to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Ansible
        run: pip install ansible

      - name: Run playbook
        run: |
          ansible-playbook \
            -i inventory/production.yml \
            playbooks/deploy.yml
        env:
          ANSIBLE_VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
```

## IaC Best Practices

1. **Version control everything** — playbooks, roles, inventory, variables
2. **Use roles** for reusability and organization
3. **Encrypt secrets** with Ansible Vault
4. **Test in staging first** — identical to production, smaller scale
5. **Use `--check` mode** for dry runs before applying changes
6. **Tag tasks** for selective execution
7. **Document with comments** in your YAML files

## What's Next?

Our **Ansible Automation in 30 Minutes** course walks through real IaC scenarios with hands-on labs. The first lesson is free — no setup required.

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

