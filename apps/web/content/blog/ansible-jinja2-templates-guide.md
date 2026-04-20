---
title: "Ansible Jinja2 Templates Guide"
slug: "ansible-jinja2-templates-guide"
date: "2026-02-26"
category: "DevOps"
tags: ["Ansible", "Jinja2", "Templates", "Automation", "DevOps"]
excerpt: "Master Jinja2 templates in Ansible. Variables, filters, loops, conditionals, and real-world config file generation examples."
description: "Master Jinja2 templates in Ansible for dynamic configuration. Variables, filters, loops, conditionals, and real-world config file generation examples for DevOps."
---

Jinja2 templates generate dynamic configuration files from variables and logic. In Ansible, they turn a single template into environment-specific configs across your fleet.

## Template Basics

Create `templates/nginx.conf.j2`:

```jinja2
# Managed by Ansible — do not edit manually
# Generated on {{ ansible_date_time.iso8601 }}

server {
    listen {{ http_port | default(80) }};
    server_name {{ server_name }};

    root {{ document_root }};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Use in a playbook:

```yaml
- name: Deploy Nginx config
  template:
    src: templates/nginx.conf.j2
    dest: /etc/nginx/sites-available/default
    owner: root
    group: root
    mode: '0644'
  notify: Restart Nginx
```

## Variables

```jinja2
{# Simple variable #}
{{ app_name }}

{# Dictionary access #}
{{ database.host }}
{{ database['port'] }}

{# List access #}
{{ servers[0] }}

{# Ansible facts #}
{{ ansible_hostname }}
{{ ansible_default_ipv4.address }}
{{ ansible_memtotal_mb }}
```

## Filters

Transform values inline:

```jinja2
{# String operations #}
{{ name | upper }}              → ALICE
{{ name | lower }}              → alice
{{ name | capitalize }}         → Alice
{{ name | replace('_', '-') }} → my-app

{# Default values #}
{{ port | default(3000) }}
{{ debug | default(false) | bool }}

{# Lists #}
{{ items | join(', ') }}       → a, b, c
{{ items | length }}           → 3
{{ items | first }}            → a
{{ items | last }}             → c
{{ items | sort }}             → [a, b, c]
{{ items | unique }}           → deduplicated

{# Math #}
{{ memory_mb | int * 1024 }}
{{ percentage | round(2) }}

{# JSON/YAML output #}
{{ config | to_json }}
{{ config | to_nice_yaml }}

{# Hashing #}
{{ password | password_hash('sha512') }}

{# Regex #}
{{ url | regex_replace('http://', 'https://') }}
```

## Conditionals

```jinja2
{% if environment == 'production' %}
DEBUG=false
LOG_LEVEL=warn
{% elif environment == 'staging' %}
DEBUG=false
LOG_LEVEL=info
{% else %}
DEBUG=true
LOG_LEVEL=debug
{% endif %}

{# Inline conditional #}
worker_processes {{ 'auto' if ansible_processor_vcpus > 2 else '1' }};

{# Check if variable is defined #}
{% if ssl_certificate is defined %}
ssl_certificate {{ ssl_certificate }};
ssl_certificate_key {{ ssl_key }};
{% endif %}
```

## Loops

```jinja2
{# Simple loop #}
{% for server in upstream_servers %}
server {{ server }}:{{ app_port }};
{% endfor %}

{# Loop with index #}
{% for user in users %}
# User {{ loop.index }}: {{ user.name }}
{{ user.name }}:x:{{ 1000 + loop.index0 }}:{{ user.group }}
{% endfor %}

{# Dict loop #}
{% for key, value in environment_vars.items() %}
{{ key }}={{ value }}
{% endfor %}

{# Filtered loop #}
{% for server in servers if server.role == 'web' %}
upstream web_{{ loop.index }} {
    server {{ server.ip }}:{{ server.port }};
}
{% endfor %}
```

## Real-World Templates

### Application Config

`templates/app.env.j2`:

```jinja2
# Application Configuration
# Environment: {{ environment }}
# Generated: {{ ansible_date_time.iso8601 }}

NODE_ENV={{ environment }}
PORT={{ app_port | default(3000) }}
HOST={{ app_host | default('0.0.0.0') }}

# Database
DATABASE_URL=postgresql://{{ db_user }}:{{ db_password }}@{{ db_host }}:{{ db_port | default(5432) }}/{{ db_name }}
DATABASE_POOL_SIZE={{ db_pool_size | default(10) }}

# Redis
{% if redis_host is defined %}
REDIS_URL=redis://{{ redis_host }}:{{ redis_port | default(6379) }}/{{ redis_db | default(0) }}
{% endif %}

# Logging
LOG_LEVEL={{ log_level | default('info') }}
{% if sentry_dsn is defined %}
SENTRY_DSN={{ sentry_dsn }}
{% endif %}

# Feature Flags
{% for flag, enabled in feature_flags.items() | default({}) %}
FEATURE_{{ flag | upper }}={{ enabled | lower }}
{% endfor %}
```

### HAProxy Config

`templates/haproxy.cfg.j2`:

```jinja2
global
    maxconn {{ haproxy_maxconn | default(4096) }}
    log /dev/log local0

defaults
    mode http
    timeout connect 5s
    timeout client  30s
    timeout server  30s

frontend http
    bind *:80
    default_backend app_servers

{% if ssl_enabled | default(false) %}
frontend https
    bind *:443 ssl crt {{ ssl_cert_path }}
    default_backend app_servers
{% endif %}

backend app_servers
    balance {{ lb_algorithm | default('roundrobin') }}
    option httpchk GET /health
{% for server in backend_servers %}
    server {{ server.name }} {{ server.ip }}:{{ server.port }} check{{ ' weight ' + server.weight | string if server.weight is defined else '' }}
{% endfor %}
```

### Systemd Service

`templates/app.service.j2`:

```jinja2
[Unit]
Description={{ app_name }} Service
After=network.target{% if db_host == 'localhost' %} postgresql.service{% endif %}

{% if db_host == 'localhost' %}
Wants=postgresql.service
{% endif %}

[Service]
Type=simple
User={{ app_user }}
Group={{ app_group }}
WorkingDirectory={{ app_dir }}
ExecStart={{ app_exec }}
Restart=always
RestartSec=5

{% for key, value in app_env.items() %}
Environment={{ key }}={{ value }}
{% endfor %}

{% if app_memory_limit is defined %}
MemoryMax={{ app_memory_limit }}
{% endif %}

[Install]
WantedBy=multi-user.target
```

## Template Validation

```yaml
- name: Validate config before deploy
  template:
    src: nginx.conf.j2
    dest: /tmp/nginx-test.conf
  changed_when: false

- name: Test Nginx config
  command: nginx -t -c /tmp/nginx-test.conf
  changed_when: false

- name: Deploy if valid
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Reload Nginx
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers Jinja2 templates with hands-on labs. First lesson is free.

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

