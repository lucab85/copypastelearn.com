---
title: "Ansible Playbook Error Handling"
slug: "ansible-playbook-error-handling"
date: "2026-02-07"
category: "DevOps"
tags: ["Ansible", "Error Handling", "Automation", "DevOps", "Reliability"]
excerpt: "Handle errors gracefully in Ansible playbooks. Ignore errors, rescue blocks, retries, assertions, and idempotent error recovery patterns."
description: "Handle errors gracefully in Ansible playbooks. Learn ignore_errors, rescue blocks, retries, assertions, and proven recovery patterns for reliable automation."
---

Ansible stops on the first error by default. Production playbooks need graceful error handling — retries for flaky operations, rescue blocks for cleanup, and assertions for validation.

## Basic Error Handling

### ignore_errors

```yaml
- name: Check if service exists (may not be installed)
  command: systemctl status old-service
  register: service_check
  ignore_errors: true

- name: Stop old service if it exists
  service:
    name: old-service
    state: stopped
  when: service_check.rc == 0
```

### failed_when (Custom Failure Conditions)

```yaml
- name: Check disk space
  command: df -h /data
  register: disk_output
  failed_when: "'100%' in disk_output.stdout"

- name: Run migration
  command: python manage.py migrate
  register: migrate_result
  failed_when:
    - migrate_result.rc != 0
    - "'No migrations to apply' not in migrate_result.stdout"
```

### changed_when

```yaml
- name: Check if reboot is needed
  command: needs-restarting -r
  register: reboot_check
  changed_when: reboot_check.rc == 1
  failed_when: reboot_check.rc > 1
```

## Block / Rescue / Always

Like try/catch/finally:

```yaml
- name: Deploy application
  block:
    - name: Pull new image
      docker_image:
        name: "my-app:{{ version }}"
        source: pull

    - name: Stop current container
      docker_container:
        name: my-app
        state: stopped

    - name: Start new version
      docker_container:
        name: my-app
        image: "my-app:{{ version }}"
        state: started
        ports:
          - "3000:3000"

    - name: Health check
      uri:
        url: http://localhost:3000/health
        status_code: 200
      retries: 10
      delay: 5

  rescue:
    - name: Rollback to previous version
      docker_container:
        name: my-app
        image: "my-app:{{ previous_version }}"
        state: started
        ports:
          - "3000:3000"

    - name: Send failure alert
      uri:
        url: "{{ slack_webhook }}"
        method: POST
        body_format: json
        body:
          text: "Deploy of v{{ version }} failed. Rolled back to v{{ previous_version }}"

  always:
    - name: Clean up old images
      docker_prune:
        images: true
      ignore_errors: true
```

## Retries

```yaml
- name: Wait for application to start
  uri:
    url: http://localhost:3000/health
    status_code: 200
  register: health_result
  until: health_result.status == 200
  retries: 30
  delay: 5  # seconds between retries

- name: Wait for database to accept connections
  postgresql_ping:
    db: myapp
    login_host: "{{ db_host }}"
  register: db_result
  until: db_result is success
  retries: 12
  delay: 10
```

## Assertions

Validate before proceeding:

```yaml
- name: Gather facts
  setup:

- name: Validate minimum requirements
  assert:
    that:
      - ansible_memtotal_mb >= 2048
      - ansible_processor_vcpus >= 2
      - ansible_distribution == "Ubuntu"
      - ansible_distribution_major_version | int >= 22
    fail_msg: "Server does not meet minimum requirements"
    success_msg: "Server meets all requirements"

- name: Validate required variables
  assert:
    that:
      - db_host is defined
      - db_host | length > 0
      - db_password is defined
      - app_version is defined
    fail_msg: "Missing required variables. Check group_vars."
```

## Handlers with Error Awareness

```yaml
- name: Deploy configuration
  block:
    - name: Update Nginx config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Reload Nginx

    - name: Validate Nginx config
      command: nginx -t
      changed_when: false

  rescue:
    - name: Restore previous config
      copy:
        src: /etc/nginx/nginx.conf.bak
        dest: /etc/nginx/nginx.conf
        remote_src: true

    - name: Fail with message
      fail:
        msg: "Nginx configuration is invalid. Restored backup."

  handlers:
    - name: Reload Nginx
      service:
        name: nginx
        state: reloaded
```

## Serial and Max Fail Percentage

Rolling deploys with failure tolerance:

```yaml
- hosts: webservers
  serial: "25%"          # Deploy to 25% of hosts at a time
  max_fail_percentage: 10  # Stop if >10% of hosts fail

  tasks:
    - name: Deploy application
      include_role:
        name: deploy

    - name: Health check
      uri:
        url: "http://{{ inventory_hostname }}:3000/health"
        status_code: 200
      retries: 5
      delay: 5
```

## any_errors_fatal

Stop entire play if one host fails:

```yaml
- hosts: database_cluster
  any_errors_fatal: true  # One failure = stop everything

  tasks:
    - name: Backup database
      command: pg_dump mydb > /backups/pre-migration.sql

    - name: Run migration
      command: python manage.py migrate
```

## Error Notification Pattern

```yaml
- name: Full deployment
  block:
    - import_tasks: deploy.yml
    - import_tasks: verify.yml

  rescue:
    - name: Collect failure info
      set_fact:
        failure_info:
          host: "{{ inventory_hostname }}"
          task: "{{ ansible_failed_task.name }}"
          result: "{{ ansible_failed_result }}"

    - name: Send alert
      uri:
        url: "{{ alert_webhook }}"
        method: POST
        body_format: json
        body:
          text: |
            Deployment failed on {{ failure_info.host }}
            Task: {{ failure_info.task }}
      delegate_to: localhost
      run_once: true
```

## What's Next?

Our **Ansible Automation in 30 Minutes** course covers error handling, retries, and production playbook patterns. First lesson is free.
