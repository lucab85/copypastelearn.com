---
title: "Ansible Handlers and Notifications"
slug: "ansible-handlers-notifications"
date: "2026-01-10"
category: "DevOps"
tags: ["Ansible", "Handlers", "Notifications", "Automation", "DevOps"]
excerpt: "Use Ansible handlers to trigger actions on change. Restart services, flush handlers, handler chains, and best practices for idempotent automation."
description: "Ansible handlers for triggered actions. Restart services, flush handlers, chains, and idempotent patterns."
---

Handlers run only when notified by a changed task. They prevent unnecessary service restarts and keep your automation idempotent.

## Basic Handler

```yaml
---
- hosts: webservers
  tasks:
    - name: Update nginx config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Restart nginx

    - name: Update SSL certificate
      ansible.builtin.copy:
        src: ssl/cert.pem
        dest: /etc/ssl/certs/app.pem
      notify: Restart nginx

  handlers:
    - name: Restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted
```

Key behavior:
- Handler runs **once** at the end, even if notified multiple times
- Handler runs **only if** at least one notifying task changed something
- If config and cert both change, nginx restarts once (not twice)

## Handler Execution Order

Handlers run **after all tasks complete**, in the order they are defined (not notification order):

```yaml
tasks:
  - name: Task 1
    # ...
    notify: Handler B

  - name: Task 2
    # ...
    notify: Handler A

handlers:
  - name: Handler A    # Runs first (defined first)
    # ...

  - name: Handler B    # Runs second
    # ...
```

## Flush Handlers

Force handlers to run mid-play:

```yaml
tasks:
  - name: Update config
    ansible.builtin.template:
      src: app.conf.j2
      dest: /etc/app/config.yml
    notify: Restart app

  # Run handlers NOW (before continuing)
  - name: Flush handlers
    ansible.builtin.meta: flush_handlers

  - name: Run smoke test
    ansible.builtin.uri:
      url: "http://localhost:3000/health"
      status_code: 200
    retries: 5
    delay: 3
```

Without `flush_handlers`, the smoke test runs before the restart.

## Multiple Handlers

```yaml
tasks:
  - name: Update main config
    ansible.builtin.template:
      src: app.conf.j2
      dest: /etc/app/config.yml
    notify:
      - Validate config
      - Restart app

  - name: Update logging config
    ansible.builtin.template:
      src: logging.conf.j2
      dest: /etc/app/logging.yml
    notify: Reload app

handlers:
  - name: Validate config
    ansible.builtin.command: app --validate-config

  - name: Restart app
    ansible.builtin.service:
      name: app
      state: restarted

  - name: Reload app
    ansible.builtin.service:
      name: app
      state: reloaded
```

## Handler Chains (Listen)

Multiple handlers respond to one notification topic:

```yaml
tasks:
  - name: Deploy application
    ansible.builtin.copy:
      src: app.jar
      dest: /opt/app/app.jar
    notify: App deployed

handlers:
  - name: Stop app
    ansible.builtin.service:
      name: app
      state: stopped
    listen: App deployed

  - name: Clear cache
    ansible.builtin.file:
      path: /opt/app/cache
      state: absent
    listen: App deployed

  - name: Start app
    ansible.builtin.service:
      name: app
      state: started
    listen: App deployed
```

All three handlers run (in order) when "App deployed" is triggered.

## Handlers in Roles

```
roles/
  nginx/
    handlers/
      main.yml
    tasks/
      main.yml
    templates/
      nginx.conf.j2
```

```yaml
# roles/nginx/handlers/main.yml
---
- name: Restart nginx
  ansible.builtin.service:
    name: nginx
    state: restarted

- name: Reload nginx
  ansible.builtin.service:
    name: nginx
    state: reloaded

- name: Validate nginx config
  ansible.builtin.command: nginx -t
```

```yaml
# roles/nginx/tasks/main.yml
---
- name: Install nginx
  ansible.builtin.package:
    name: nginx
    state: present

- name: Configure nginx
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify:
    - Validate nginx config
    - Reload nginx
```

## Conditional Handlers

```yaml
handlers:
  - name: Restart app
    ansible.builtin.service:
      name: "{{ app_service_name }}"
      state: restarted
    when: app_restart_enabled | default(true)
```

## Handler with Retries

```yaml
handlers:
  - name: Restart and verify app
    block:
      - name: Restart service
        ansible.builtin.service:
          name: app
          state: restarted

      - name: Wait for app to be ready
        ansible.builtin.uri:
          url: "http://localhost:{{ app_port }}/health"
          status_code: 200
        register: health
        until: health.status == 200
        retries: 10
        delay: 5
    rescue:
      - name: Rollback on failure
        ansible.builtin.debug:
          msg: "App failed to start after restart!"
```

## Common Patterns

### Reload vs Restart

```yaml
handlers:
  # Reload: graceful, no downtime
  - name: Reload nginx
    ansible.builtin.service:
      name: nginx
      state: reloaded

  # Restart: full stop/start, brief downtime
  - name: Restart nginx
    ansible.builtin.service:
      name: nginx
      state: restarted
```

Use reload when the service supports it (nginx, apache, systemd services with `ExecReload`). Use restart for changes that require it (binary upgrades, major config changes).

### Validate Before Restart

```yaml
tasks:
  - name: Update nginx config
    ansible.builtin.template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    notify:
      - Validate nginx
      - Reload nginx

handlers:
  - name: Validate nginx
    ansible.builtin.command: nginx -t

  - name: Reload nginx
    ansible.builtin.service:
      name: nginx
      state: reloaded
```

If validation fails, the reload handler will not run.

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers handlers, roles, and production automation patterns. First lesson is free.
