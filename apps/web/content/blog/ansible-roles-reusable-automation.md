---
title: "Ansible Roles Reusable Automation"
slug: "ansible-roles-reusable-automation"
date: "2026-02-14"
category: "DevOps"
tags: ["Ansible", "Roles", "Automation", "DevOps", "Configuration Management"]
excerpt: "Structure Ansible automation with roles. Directory layout, defaults, handlers, Ansible Galaxy, and role testing with Molecule."
description: "Structure Ansible automation with roles for reusability. Directory layout, defaults, handlers, Galaxy integration, and testing with Molecule for production-ready code."
---

Roles are how you organize Ansible code for reuse. Instead of one massive playbook, you build modular, testable units that compose into complete system configurations.

## Role Directory Structure

```
roles/
  nginx/
    defaults/        # Default variables (lowest priority)
      main.yml
    vars/            # Role variables (higher priority)
      main.yml
    tasks/           # Task files
      main.yml
      configure.yml
      install.yml
    handlers/        # Event handlers
      main.yml
    templates/       # Jinja2 templates
      nginx.conf.j2
      vhost.conf.j2
    files/           # Static files
      index.html
    meta/            # Role metadata and dependencies
      main.yml
    tests/           # Test playbooks
      test.yml
```

## Building a Role

### defaults/main.yml

```yaml
---
nginx_port: 80
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_server_name: localhost
nginx_document_root: /var/www/html
nginx_ssl_enabled: false
nginx_ssl_certificate: ""
nginx_ssl_key: ""
nginx_extra_locations: []
```

### tasks/main.yml

```yaml
---
- name: Include OS-specific variables
  include_vars: "{{ ansible_os_family }}.yml"

- import_tasks: install.yml
- import_tasks: configure.yml
- import_tasks: ssl.yml
  when: nginx_ssl_enabled
```

### tasks/install.yml

```yaml
---
- name: Install Nginx
  package:
    name: nginx
    state: present

- name: Ensure Nginx is running
  service:
    name: nginx
    state: started
    enabled: true
```

### tasks/configure.yml

```yaml
---
- name: Deploy Nginx configuration
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    owner: root
    group: root
    mode: '0644'
    validate: nginx -t -c %s
  notify: Reload Nginx

- name: Deploy virtual host
  template:
    src: vhost.conf.j2
    dest: /etc/nginx/sites-available/default
    owner: root
    group: root
    mode: '0644'
  notify: Reload Nginx

- name: Create document root
  file:
    path: "{{ nginx_document_root }}"
    state: directory
    owner: www-data
    group: www-data
    mode: '0755'
```

### handlers/main.yml

```yaml
---
- name: Reload Nginx
  service:
    name: nginx
    state: reloaded

- name: Restart Nginx
  service:
    name: nginx
    state: restarted
```

### meta/main.yml

```yaml
---
galaxy_info:
  author: Your Name
  description: Install and configure Nginx
  license: MIT
  min_ansible_version: "2.14"
  platforms:
    - name: Ubuntu
      versions: [jammy, noble]
    - name: Debian
      versions: [bookworm]

dependencies:
  - role: common
  - role: firewall
    vars:
      firewall_allowed_ports:
        - "{{ nginx_port }}"
```

## Using Roles

### In a Playbook

```yaml
---
- hosts: webservers
  become: true
  roles:
    - common
    - role: nginx
      vars:
        nginx_port: 443
        nginx_ssl_enabled: true
        nginx_ssl_certificate: /etc/ssl/certs/app.pem
        nginx_ssl_key: /etc/ssl/private/app.key
    - role: app
      tags: [app, deploy]
```

### With include_role (Dynamic)

```yaml
- name: Deploy web stack
  hosts: webservers
  tasks:
    - include_role:
        name: nginx
      when: "'webserver' in group_names"

    - include_role:
        name: "{{ item }}"
      loop:
        - monitoring
        - logging
```

## Ansible Galaxy

```bash
# Install from Galaxy
ansible-galaxy install geerlingguy.docker
ansible-galaxy install geerlingguy.postgresql

# Install from requirements file
ansible-galaxy install -r requirements.yml
```

```yaml
# requirements.yml
roles:
  - name: geerlingguy.docker
    version: "7.1.0"
  - name: geerlingguy.postgresql
    version: "3.5.0"
  - name: custom_role
    src: git+https://github.com/myorg/ansible-role-custom.git
    version: v1.0.0

collections:
  - name: community.general
    version: ">=8.0.0"
  - name: ansible.posix
```

## Testing with Molecule

```bash
# Initialize a new role with Molecule
molecule init role my_role --driver-name docker

# Run the full test sequence
molecule test

# Develop iteratively
molecule create     # Create test container
molecule converge   # Run the role
molecule verify     # Run tests
molecule destroy    # Clean up
```

### molecule/default/molecule.yml

```yaml
driver:
  name: docker
platforms:
  - name: ubuntu-test
    image: ubuntu:24.04
    pre_build_image: true
    command: /lib/systemd/systemd
    privileged: true
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
  - name: debian-test
    image: debian:bookworm
    pre_build_image: true
provisioner:
  name: ansible
verifier:
  name: ansible
```

### molecule/default/verify.yml

```yaml
---
- name: Verify Nginx
  hosts: all
  tasks:
    - name: Check Nginx is installed
      command: nginx -v
      changed_when: false

    - name: Check Nginx is running
      service_facts:
      
    - name: Assert Nginx service is running
      assert:
        that:
          - "'nginx' in ansible_facts.services"
          - "ansible_facts.services['nginx'].state == 'running'"

    - name: Check Nginx responds
      uri:
        url: http://localhost:80
        status_code: 200
```

## Best Practices

| Practice | Why |
|---|---|
| Use `defaults/` for all variables | Consumers can override everything |
| Keep `vars/` for internal constants | Platform-specific values, package names |
| One responsibility per role | `nginx` role shouldn't configure the app |
| Tag your tasks | `--tags deploy` for partial runs |
| Validate templates | `validate:` parameter catches syntax errors |
| Pin Galaxy dependencies | Version lock in `requirements.yml` |
| Test with Molecule | Catch breakage before production |
| Use `meta/` dependencies | Auto-install required roles |

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers roles, Galaxy, and testing in hands-on lessons. First lesson is free.
