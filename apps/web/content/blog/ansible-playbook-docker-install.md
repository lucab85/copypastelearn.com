---
title: "Ansible Playbook for Docker Install"
description: "Automate Docker installation on Ubuntu and RHEL with an Ansible playbook. Includes Compose plugin and post-install steps."
date: "2026-04-10"
author: "Luca Berton"
category: "DevOps"
tags: ["Ansible", "Docker", "Automation", "Ubuntu", "RHEL"]
excerpt: "Automate Docker installation on Ubuntu and RHEL with an Ansible playbook. Includes Compose plugin and post-install steps."
---

## The Playbook

This playbook installs Docker CE on Ubuntu and RHEL/CentOS, adds the Docker Compose plugin, and configures a non-root user:

```yaml
---
- name: Install Docker
  hosts: all
  become: true
  vars:
    docker_user: "{{ ansible_user }}"

  tasks:
    - name: Install prerequisites (Ubuntu)
      ansible.builtin.apt:
        name:
          - ca-certificates
          - curl
          - gnupg
        state: present
        update_cache: true
      when: ansible_os_family == "Debian"

    - name: Add Docker GPG key (Ubuntu)
      ansible.builtin.apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present
      when: ansible_os_family == "Debian"

    - name: Add Docker repository (Ubuntu)
      ansible.builtin.apt_repository:
        repo: "deb https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
      when: ansible_os_family == "Debian"

    - name: Install Docker (Ubuntu)
      ansible.builtin.apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-compose-plugin
        state: present
        update_cache: true
      when: ansible_os_family == "Debian"

    - name: Install prerequisites (RHEL)
      ansible.builtin.dnf:
        name:
          - dnf-plugins-core
        state: present
      when: ansible_os_family == "RedHat"

    - name: Add Docker repository (RHEL)
      ansible.builtin.command:
        cmd: dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      when: ansible_os_family == "RedHat"
      changed_when: true

    - name: Install Docker (RHEL)
      ansible.builtin.dnf:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-compose-plugin
        state: present
      when: ansible_os_family == "RedHat"

    - name: Start and enable Docker
      ansible.builtin.systemd:
        name: docker
        state: started
        enabled: true

    - name: Add user to docker group
      ansible.builtin.user:
        name: "{{ docker_user }}"
        groups: docker
        append: true

    - name: Verify Docker installation
      ansible.builtin.command:
        cmd: docker --version
      register: docker_version
      changed_when: false

    - name: Show Docker version
      ansible.builtin.debug:
        msg: "{{ docker_version.stdout }}"
```

## Run It

```bash
# Single server
ansible-playbook docker-install.yml -i "server1," -u ubuntu

# Multiple servers from inventory
ansible-playbook docker-install.yml -i inventory.ini
```

## Inventory Example

```ini
[docker_hosts]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11
db1  ansible_host=192.168.1.20

[docker_hosts:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa
```

## Add Docker Compose Standalone (Optional)

If you need the standalone `docker-compose` binary:

```yaml
    - name: Install Docker Compose standalone
      ansible.builtin.get_url:
        url: "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-{{ ansible_architecture }}"
        dest: /usr/local/bin/docker-compose
        mode: '0755'
```

## Configure Docker Daemon

Add custom daemon settings:

```yaml
    - name: Configure Docker daemon
      ansible.builtin.copy:
        content: |
          {
            "log-driver": "json-file",
            "log-opts": {
              "max-size": "10m",
              "max-file": "3"
            },
            "default-address-pools": [
              {"base": "172.17.0.0/16", "size": 24}
            ]
          }
        dest: /etc/docker/daemon.json
        mode: '0644'
      notify: Restart Docker

  handlers:
    - name: Restart Docker
      ansible.builtin.systemd:
        name: docker
        state: restarted
```

## Idempotent and Safe

Run this playbook multiple times — Ansible only changes what is needed. If Docker is already installed and running, nothing happens.

## Related Posts

- [Ansible Automation in Minutes](/blog/ansible-automation-beginners-guide) for Ansible basics
- [Getting Started with Docker](/blog/getting-started-with-docker) for Docker fundamentals
- [Deploy OpenClaw with Docker Compose](/blog/openclaw-docker-deploy-guide) to deploy OpenClaw after installing Docker

---

**Ready to go deeper?** Check out our hands-on course: [Ansible Quickstart](/courses/ansible-quickstart) — practical exercises you can follow along on your own machine.

<!-- cpl-thin-content-expansion -->

## Practical Usage Notes

Use Ansible Playbook for Docker Install as part of a repeatable operations workflow, not as a one-off command list. Start in a non-production environment, capture the exact command or configuration that works, and then commit the final version to source control with a short note about the expected result. That habit makes the change reviewable and gives the next engineer a clear rollback path.

For day-to-day DevOps work, connect this topic to Ansible, Docker, Automation, Ubuntu. The useful pattern is to define the smallest safe change, run it locally or in a staging namespace, inspect the output, and only then promote it to production. Keep credentials, host names, and environment-specific values outside the shared example so the same workflow can be reused across teams.

Before you call the task complete, verify the outcome from the user or service point of view. Check logs, status commands, metrics, and any generated artifacts. If something fails, preserve the error output and compare it with the previous known-good state before making another change.

## FAQ

### When should I use Ansible Playbook for Docker Install?

Use it when you need a practical, repeatable way to handle Ansible, Docker, Automation, Ubuntu work. It is most useful when the commands or configuration will be reused by a team, automated in CI/CD, or documented as part of an operational runbook.

### What should I check before using it in production?

Confirm that the example matches your versions, permissions, network access, and rollback process. Test in a safe environment first, review the generated diff or command output, and make sure monitoring will show whether the change improved or degraded the system.

