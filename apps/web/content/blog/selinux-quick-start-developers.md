---
title: "SELinux Quick Start for Developers"
slug: "selinux-quick-start-developers"
date: "2026-03-24"
category: "DevOps"
tags: ["SELinux", "Security", "Linux", "RHEL", "DevOps"]
excerpt: "Stop disabling SELinux. Learn the basics developers need: modes, contexts, booleans, and troubleshooting in 10 minutes."
description: "Stop disabling SELinux. Learn modes, contexts, booleans, and troubleshooting — the basics developers actually need."
---

Most developers' first encounter with SELinux is an app that stops working, followed by `setenforce 0`. That disables the most powerful security layer in Linux. Here is what you actually need to know.

## What is SELinux?

SELinux (Security-Enhanced Linux) is a mandatory access control system in the Linux kernel. It adds a second layer of permissions on top of standard Unix permissions (rwx).

**Standard permissions**: "Can user X read file Y?"
**SELinux**: "Can process X (running as type httpd_t) read file Y (labeled httpd_sys_content_t)?"

Even if Unix permissions say "yes", SELinux can say "no" if the security policy doesn't allow that specific interaction.

## Why Not Just Disable It?

- **Compliance**: PCI-DSS, HIPAA, and FedRAMP require MAC (Mandatory Access Control)
- **Container isolation**: SELinux prevents container escapes
- **Defense in depth**: If an attacker exploits your app, SELinux limits lateral movement
- **RHEL requirement**: Red Hat officially supports SELinux in enforcing mode only

## Three Modes

```bash
# Check current mode
getenforce
# Enforcing, Permissive, or Disabled
```

| Mode | Behavior | Use |
|---|---|---|
| **Enforcing** | Blocks and logs violations | Production |
| **Permissive** | Logs but doesn't block | Debugging |
| **Disabled** | Off completely | Never in production |

Switch temporarily:

```bash
sudo setenforce 0  # Permissive (temporary, resets on reboot)
sudo setenforce 1  # Enforcing
```

Switch permanently in `/etc/selinux/config`:

```
SELINUX=enforcing
```

## Security Contexts

Every file, process, and port has a security context (label):

```bash
# File contexts
ls -Z /var/www/html/
# -rw-r--r--. root root unconfined_u:object_r:httpd_sys_content_t:s0 index.html

# Process contexts
ps -eZ | grep httpd
# system_u:system_r:httpd_t:s0   1234 ? 00:00:01 httpd

# Port contexts
semanage port -l | grep http
# http_port_t    tcp    80, 81, 443, 488, 8008, 8009, 8443, 9000
```

The format: `user:role:type:level`

For most DevOps work, **type** is what matters:
- `httpd_t` — web server process
- `httpd_sys_content_t` — web content files
- `container_t` — container processes

## Common Scenarios and Fixes

### App Can't Read Its Own Files

```bash
# Check for AVC denials
sudo ausearch -m AVC -ts recent

# Fix: Set correct file context
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/myapp(/.*)?"
sudo restorecon -Rv /opt/myapp
```

### Nginx Can't Bind to Custom Port

```bash
# Error: Permission denied binding to port 8080

# Check allowed ports
sudo semanage port -l | grep http_port_t

# Add your port
sudo semanage port -a -t http_port_t -p tcp 8080
```

### App Can't Connect to Network

```bash
# SELinux blocks outgoing connections by default for some types

# Check the boolean
getsebool httpd_can_network_connect
# httpd_can_network_connect --> off

# Enable it
sudo setsebool -P httpd_can_network_connect on
```

### Container Can't Access Host Volume

```bash
# Add the container_file_t label to the host directory
sudo semanage fcontext -a -t container_file_t "/data/app(/.*)?"
sudo restorecon -Rv /data/app

# Or use :Z/:z with Docker/Podman
docker run -v /data/app:/app:Z myimage
```

## Booleans: Quick Feature Toggles

Booleans are pre-defined on/off switches for common policies:

```bash
# List all booleans
getsebool -a

# Common useful booleans
sudo setsebool -P httpd_can_network_connect on    # HTTP outbound
sudo setsebool -P httpd_can_network_connect_db on  # HTTP → database
sudo setsebool -P httpd_enable_homedirs on          # Serve home dirs
sudo setsebool -P container_manage_cgroup on         # Containers manage cgroups
```

The `-P` flag makes it persistent across reboots.

## Troubleshooting Workflow

```
App doesn't work
  │
  ├─ 1. Check if SELinux is the cause
  │     sudo setenforce 0
  │     Does it work now? → SELinux issue
  │     sudo setenforce 1
  │
  ├─ 2. Find the denial
  │     sudo ausearch -m AVC -ts recent
  │     OR: sudo journalctl -t setroubleshoot
  │
  ├─ 3. Use audit2why
  │     sudo ausearch -m AVC -ts recent | audit2why
  │     Tells you exactly what boolean or context to change
  │
  └─ 4. Apply the fix
        Boolean? → setsebool -P
        File context? → semanage fcontext + restorecon
        Port? → semanage port -a
        Custom policy? → audit2allow (last resort)
```

## The audit2why Shortcut

This tool tells you exactly what to do:

```bash
sudo ausearch -m AVC -ts recent | audit2why

# Output example:
# Was caused by:
# The boolean httpd_can_network_connect was set incorrectly.
# Allow httpd to can network connect
# setsebool -P httpd_can_network_connect 1
```

Copy-paste the suggested command. Done.

## What's Next?

Our **SELinux for System Admins** course goes deep into SELinux policy, custom modules, multi-level security, and real-world RHEL hardening across 12 hands-on lessons. The first lesson is free.
