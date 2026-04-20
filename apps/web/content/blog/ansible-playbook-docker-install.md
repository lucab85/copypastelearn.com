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

