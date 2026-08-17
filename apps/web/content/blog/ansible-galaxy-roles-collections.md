---
title: "Ansible Galaxy Roles Collections"
slug: "ansible-galaxy-roles-collections"
date: "2026-01-20"
category: "DevOps"
tags: ["Ansible", "Galaxy", "Roles", "Collections", "Automation"]
excerpt: "Use Ansible Galaxy for reusable automation. Install roles and collections, create requirements files, and publish your own content."
description: "Use Ansible Galaxy to find, install, and manage reusable roles and collections. Learn requirements files, version pinning, and publishing your own content."
author: "Luca Berton"
---

Ansible Galaxy is the package manager for Ansible content. Instead of writing everything from scratch, install community roles and collections.

## Roles vs Collections

| Concept | Contains | Example |
|---|---|---|
| **Role** | Tasks, handlers, templates, vars for one purpose | `geerlingguy.docker` |
| **Collection** | Multiple roles, modules, plugins, playbooks | `community.general` |

Collections are the modern standard. Roles still work but collections offer more.

## Installing Roles

```bash
# Install from Galaxy
ansible-galaxy role install geerlingguy.docker
ansible-galaxy role install geerlingguy.nginx

# Install specific version
ansible-galaxy role install geerlingguy.docker,6.1.0

# Install to custom path
ansible-galaxy role install geerlingguy.docker -p ./roles/

# List installed roles
ansible-galaxy role list
```

### Use in Playbook

```yaml
---
- hosts: webservers
  roles:
    - geerlingguy.docker
    - role: geerlingguy.nginx
      vars:
        nginx_vhosts:
          - listen: "80"
            server_name: "app.example.com"
            extra_parameters: |
              location / {
                  proxy_pass http://localhost:3000;
              }
```

## Installing Collections

```bash
# Install collection
ansible-galaxy collection install community.general
ansible-galaxy collection install community.docker
ansible-galaxy collection install amazon.aws

# Specific version
ansible-galaxy collection install community.general:>=8.0.0

# List installed
ansible-galaxy collection list
```

### Use Collection Modules

```yaml
---
- hosts: all
  tasks:
    - name: Manage Docker container
      community.docker.docker_container:
        name: my-app
        image: my-app:latest
        state: started
        ports:
          - "3000:3000"

    - name: Create S3 bucket
      amazon.aws.s3_bucket:
        name: my-backup-bucket
        state: present
        region: eu-west-1
```

## Requirements Files

### roles/requirements.yml

```yaml
---
roles:
  - name: geerlingguy.docker
    version: "6.1.0"
  - name: geerlingguy.nginx
    version: "3.2.0"
  - name: geerlingguy.certbot
  # From Git
  - name: my-custom-role
    src: https://github.com/myorg/ansible-role-custom.git
    version: v1.2.0
    scm: git
```

### collections/requirements.yml

```yaml
---
collections:
  - name: community.general
    version: ">=8.0.0"
  - name: community.docker
    version: ">=3.0.0"
  - name: amazon.aws
    version: ">=7.0.0"
  - name: ansible.posix
  # From Galaxy
  - name: my_namespace.my_collection
    source: https://galaxy.ansible.com
```

### Install All

```bash
ansible-galaxy role install -r roles/requirements.yml
ansible-galaxy collection install -r collections/requirements.yml

# Force reinstall
ansible-galaxy collection install -r collections/requirements.yml --force
```

## Popular Collections

| Collection | Purpose |
|---|---|
| `community.general` | 1000+ modules for everything |
| `community.docker` | Docker container management |
| `community.kubernetes` | K8s resource management |
| `amazon.aws` | AWS services |
| `azure.azcollection` | Azure services |
| `google.cloud` | GCP services |
| `ansible.posix` | POSIX system tasks |
| `ansible.builtin` | Core modules (included by default) |
| `community.postgresql` | PostgreSQL management |
| `community.mysql` | MySQL management |

## Creating a Role

```bash
ansible-galaxy role init my_role
```

```
my_role/
  defaults/
    main.yml         # Default variables (lowest priority)
  files/              # Static files to copy
  handlers/
    main.yml         # Handlers (restart services, etc.)
  meta/
    main.yml         # Role metadata, dependencies
  tasks/
    main.yml         # Main task list
  templates/          # Jinja2 templates
  tests/
  vars/
    main.yml         # Variables (higher priority)
```

### tasks/main.yml

```yaml
---
- name: Install packages
  ansible.builtin.package:
    name: "{{ my_role_packages }}"
    state: present

- name: Deploy configuration
  ansible.builtin.template:
    src: config.conf.j2
    dest: /etc/myapp/config.conf
    owner: root
    group: root
    mode: "0644"
  notify: Restart myapp

- name: Ensure service is running
  ansible.builtin.service:
    name: myapp
    state: started
    enabled: true
```

### defaults/main.yml

```yaml
---
my_role_packages:
  - myapp
  - myapp-utils
my_role_port: 8080
my_role_log_level: info
```

### meta/main.yml

```yaml
---
galaxy_info:
  author: Your Name
  description: Install and configure MyApp
  license: MIT
  min_ansible_version: "2.14"
  platforms:
    - name: Ubuntu
      versions:
        - jammy
    - name: EL
      versions:
        - "9"
dependencies:
  - role: geerlingguy.docker
```

## Project Structure

```
ansible-project/
  ansible.cfg
  inventory/
    production/
      hosts.yml
      group_vars/
    staging/
      hosts.yml
      group_vars/
  playbooks/
    site.yml
    webservers.yml
  roles/
    requirements.yml
    my_custom_role/
  collections/
    requirements.yml
```

### ansible.cfg

```ini
[defaults]
roles_path = ./roles
collections_path = ./collections
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers Galaxy roles, collections, and building reusable automation. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Ansible Galaxy Roles Collections as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Ansible, Galaxy, Roles, Collections. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Ansible Galaxy Roles Collections?

Use it when you need a practical, repeatable way to handle Ansible, Galaxy, Roles, Collections work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

