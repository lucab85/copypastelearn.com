---
title: "Ansible Roles: Reusable Automation"
description: "Structure Ansible automation with roles. Create, use, and share roles with Galaxy. Includes a complete Nginx role example."
date: "2026-04-11"
author: "Luca Berton"
category: "DevOps"
tags: ["Ansible", "Roles", "Automation", "DevOps", "Best Practices"]
excerpt: "Structure Ansible automation with roles. Create, use, and share roles with Galaxy. Includes a complete Nginx role example."
---

## Why Roles?

Playbooks get messy fast. Roles split your automation into reusable, testable units with a standard directory structure.

## Create a Role

```bash
ansible-galaxy role init nginx
```

This creates:

```
nginx/
├── defaults/main.yml    # Default variables (lowest priority)
├── handlers/main.yml    # Handlers (e.g., restart services)
├── meta/main.yml        # Role metadata and dependencies
├── tasks/main.yml       # Main task list
├── templates/            # Jinja2 templates
├── files/                # Static files
└── vars/main.yml        # Variables (higher priority)
```

## Complete Nginx Role

**tasks/main.yml:**

```yaml
---
- name: Install Nginx
  ansible.builtin.apt:
    name: nginx
    state: present
    update_cache: true

- name: Copy Nginx config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/sites-available/default
    mode: '0644'
  notify: Reload Nginx

- name: Enable site
  ansible.builtin.file:
    src: /etc/nginx/sites-available/default
    dest: /etc/nginx/sites-enabled/default
    state: link
  notify: Reload Nginx

- name: Start Nginx
  ansible.builtin.systemd:
    name: nginx
    state: started
    enabled: true
```

**handlers/main.yml:**

```yaml
---
- name: Reload Nginx
  ansible.builtin.systemd:
    name: nginx
    state: reloaded
```

**defaults/main.yml:**

```yaml
---
nginx_port: 80
nginx_server_name: "_"
nginx_root: /var/www/html
```

**templates/nginx.conf.j2:**

```nginx
server {
    listen {{ nginx_port }};
    server_name {{ nginx_server_name }};
    root {{ nginx_root }};

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## Use the Role

```yaml
---
- name: Configure web servers
  hosts: web
  become: true
  roles:
    - role: nginx
      vars:
        nginx_port: 8080
        nginx_server_name: "myapp.example.com"
        nginx_root: /var/www/myapp
```

## Role Dependencies

Declare in **meta/main.yml**:

```yaml
---
dependencies:
  - role: common
  - role: firewall
    vars:
      firewall_allowed_ports:
        - "{{ nginx_port }}"
```

## Install Roles from Galaxy

```bash
# Install a community role
ansible-galaxy role install geerlingguy.docker

# Install from requirements file
cat > requirements.yml <<EOF
roles:
  - name: geerlingguy.docker
  - name: geerlingguy.certbot
EOF

ansible-galaxy install -r requirements.yml
```

## Role vs Include vs Import

| Method | When to Use |
|---|---|
| `roles:` | Reusable, self-contained automation unit |
| `include_role:` | Conditionally include a role mid-playbook |
| `import_tasks:` | Split a large task file (static, parsed at load) |
| `include_tasks:` | Conditionally load tasks (dynamic, parsed at runtime) |

## Testing Roles

Use Molecule for role testing:

```bash
pip install molecule molecule-docker

cd nginx/
molecule init scenario
molecule test
```

This spins up a Docker container, runs your role, and verifies the result.

## Best Practices

- **Keep roles focused**: one role = one responsibility (Nginx, not Nginx + PHP + MySQL)
- **Use `defaults/`** for variables users should override
- **Use `vars/`** for internal variables that should not change
- **Tag your tasks** for selective runs: `ansible-playbook site.yml --tags nginx`
- **Document variables** in `defaults/main.yml` with comments

## Related Posts

- [Ansible Automation in Minutes](/blog/ansible-automation-beginners-guide) for getting started
- [Ansible Vault: Encrypt Secrets](/blog/ansible-vault-encrypt-secrets) for secrets in roles
- [Ansible Playbook for Docker Install](/blog/ansible-playbook-docker-install) for a practical example
